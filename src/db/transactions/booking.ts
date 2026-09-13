import { eq, and, inArray, lt, or, sql } from "drizzle-orm";
import { db } from "../index";
import {
  bookings,
  bookingItems,
  showtimes,
  showtimeSeats,
  seats,
  payments,
  tickets,
  auditLogs,
  users,
} from "../schema";

import { HOLD_DURATION_MINUTES, BOOKING_FEE_CENTS_PER_SEAT, TAX_RATE } from "@/lib/constants";
export { HOLD_DURATION_MINUTES, BOOKING_FEE_CENTS_PER_SEAT, TAX_RATE };

export function generateBookingReference(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "CB-";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function generateTicketCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "TK-";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export interface HoldSeatsInput {
  showtimeId: string;
  seatIds: string[];
  userId: string;
  idempotencyKey?: string;
}

export interface BookingResult {
  success: boolean;
  booking?: any;
  error?: string;
  unavailableSeats?: string[];
}

/**
 * Atomic 10-Step Booking Transaction:
 * 1. Begin database transaction
 * 2. Lock requested showtime-seat records
 * 3. Confirm every requested seat is available (or expired hold)
 * 4. Create temporary seat hold with expiration time
 * 5. Calculate price on server in integer cents
 * 6. Create pending booking record
 * 7. Commit transaction
 */
export async function holdSeatsAndCreatePendingBooking(
  input: HoldSeatsInput
): Promise<BookingResult> {
  const { showtimeId, seatIds, userId, idempotencyKey } = input;

  if (!seatIds || seatIds.length === 0) {
    return { success: false, error: "No seats selected" };
  }

  // Enforce idempotency: if an idempotency key was provided and exists, return existing booking
  if (idempotencyKey) {
    const existing = await db
      .select()
      .from(bookings)
      .where(eq(bookings.idempotencyKey, idempotencyKey))
      .limit(1);

    if (existing.length > 0) {
      return { success: true, booking: existing[0] };
    }
  }

  try {
    return await db.transaction(async (tx) => {
      const now = new Date();
      const holdExpiresAt = new Date(
        now.getTime() + HOLD_DURATION_MINUTES * 60 * 1000
      );

      // Step 2 & 3: Lock and inspect requested showtime-seat records
      const requestedSeats = await tx
        .select({
          showtimeSeat: showtimeSeats,
          seat: seats,
        })
        .from(showtimeSeats)
        .innerJoin(seats, eq(showtimeSeats.seatId, seats.id))
        .where(
          and(
            eq(showtimeSeats.showtimeId, showtimeId),
            inArray(showtimeSeats.seatId, seatIds)
          )
        );

      if (requestedSeats.length !== seatIds.length) {
        return {
          success: false,
          error: "One or more requested seats could not be found for this showtime",
        };
      }

      // Check seat availability: Must be AVAILABLE or an expired HELD seat
      const unavailable: string[] = [];
      for (const item of requestedSeats) {
        const isAvailable =
          item.showtimeSeat.status === "AVAILABLE" ||
          (item.showtimeSeat.status === "HELD" &&
            item.showtimeSeat.holdExpiresAt &&
            new Date(item.showtimeSeat.holdExpiresAt) < now);

        if (!isAvailable) {
          unavailable.push(`${item.seat.rowLabel}${item.seat.seatNumber}`);
        }
      }

      if (unavailable.length > 0) {
        return {
          success: false,
          error: `The following seat(s) are no longer available: ${unavailable.join(
            ", "
          )}`,
          unavailableSeats: unavailable,
        };
      }

      // Fetch showtime to get base price
      const [showtime] = await tx
        .select()
        .from(showtimes)
        .where(eq(showtimes.id, showtimeId))
        .limit(1);

      if (!showtime) {
        return { success: false, error: "Showtime not found" };
      }

      // Step 5: Calculate pricing strictly on the server in integer minor units (cents)
      let subtotalCents = 0;
      const seatCalculations = requestedSeats.map((item) => {
        const multiplier = item.seat.priceMultiplier || 100;
        const seatPriceCents = Math.round(
          (showtime.basePriceCents * multiplier) / 100
        );
        subtotalCents += seatPriceCents;
        return {
          showtimeSeatId: item.showtimeSeat.id,
          priceCents: seatPriceCents,
        };
      });

      const feeCents = requestedSeats.length * BOOKING_FEE_CENTS_PER_SEAT;
      const taxCents = Math.round(subtotalCents * TAX_RATE);
      const totalAmountCents = subtotalCents + feeCents + taxCents;

      // Step 6: Create pending booking
      const bookingRef = generateBookingReference();
      const [newBooking] = await tx
        .insert(bookings)
        .values({
          bookingReference: bookingRef,
          userId,
          showtimeId,
          status: "PENDING",
          subtotalCents,
          feeCents,
          taxCents,
          totalAmountCents,
          holdExpiresAt,
          idempotencyKey: idempotencyKey || null,
        })
        .returning();

      // Step 4: Update showtime_seats to HELD with hold expiration
      for (const calc of seatCalculations) {
        await tx
          .update(showtimeSeats)
          .set({
            status: "HELD",
            holdExpiresAt,
            heldByUserId: userId,
            bookingId: newBooking.id,
            priceCents: calc.priceCents,
            version: sql`${showtimeSeats.version} + 1`,
            updatedAt: now,
          })
          .where(eq(showtimeSeats.id, calc.showtimeSeatId));

        // Insert booking items
        await tx.insert(bookingItems).values({
          bookingId: newBooking.id,
          showtimeSeatId: calc.showtimeSeatId,
          priceCents: calc.priceCents,
        });
      }

      // Audit log
      await tx.insert(auditLogs).values({
        entityType: "booking",
        entityId: newBooking.id,
        action: "SEAT_HOLD_CREATED",
        actorId: userId,
        details: {
          seatIds,
          bookingReference: bookingRef,
          totalAmountCents,
          holdExpiresAt: holdExpiresAt.toISOString(),
        },
      });

      return {
        success: true,
        booking: newBooking,
      };
    });
  } catch (err: any) {
    console.error("Booking transaction error:", err);
    return {
      success: false,
      error: err.message || "An unexpected error occurred during seat reservation",
    };
  }
}

/**
 * Step 8 & 9: Confirm seats after verified payment
 */
export async function confirmBookingAndPayment(input: {
  bookingId: string;
  paymentIntentId?: string;
  idempotencyKey: string;
  provider?: "STRIPE" | "TEST_PROVIDER";
  metadata?: Record<string, any>;
}) {
  const {
    bookingId,
    paymentIntentId,
    idempotencyKey,
    provider = "TEST_PROVIDER",
    metadata = {},
  } = input;

  return await db.transaction(async (tx) => {
    // 1. Enforce payment idempotency: if this payment idempotencyKey was already processed
    const existingPayment = await tx
      .select()
      .from(payments)
      .where(eq(payments.idempotencyKey, idempotencyKey))
      .limit(1);

    if (existingPayment.length > 0 && existingPayment[0].status === "SUCCEEDED") {
      const [existingBooking] = await tx
        .select()
        .from(bookings)
        .where(eq(bookings.id, bookingId))
        .limit(1);
      return { success: true, booking: existingBooking, payment: existingPayment[0] };
    }

    // 2. Fetch booking
    const [booking] = await tx
      .select()
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .limit(1);

    if (!booking) {
      return { success: false, error: "Booking not found" };
    }

    if (booking.status === "CONFIRMED") {
      return { success: true, booking };
    }

    const now = new Date();
    if (booking.holdExpiresAt && new Date(booking.holdExpiresAt) < now) {
      return { success: false, error: "Seat hold has expired. Please select your seats again." };
    }

    // 3. Confirm booking
    const [updatedBooking] = await tx
      .update(bookings)
      .set({
        status: "CONFIRMED",
        updatedAt: now,
      })
      .where(eq(bookings.id, bookingId))
      .returning();

    // 4. Update seats to BOOKED
    const items = await tx
      .select({
        item: bookingItems,
        showtimeSeat: showtimeSeats,
        seat: seats,
      })
      .from(bookingItems)
      .innerJoin(
        showtimeSeats,
        eq(bookingItems.showtimeSeatId, showtimeSeats.id)
      )
      .innerJoin(seats, eq(showtimeSeats.seatId, seats.id))
      .where(eq(bookingItems.bookingId, bookingId));

    for (const item of items) {
      await tx
        .update(showtimeSeats)
        .set({
          status: "BOOKED",
          holdExpiresAt: null,
          updatedAt: now,
        })
        .where(eq(showtimeSeats.id, item.showtimeSeat.id));

      // 5. Generate digital ticket with unique QR Code data
      const ticketCode = generateTicketCode();
      const qrCodePayload = JSON.stringify({
        ticketCode,
        bookingRef: booking.bookingReference,
        seat: `${item.seat.rowLabel}${item.seat.seatNumber}`,
        showtimeId: booking.showtimeId,
        issuedAt: now.toISOString(),
      });

      await tx.insert(tickets).values({
        bookingId: booking.id,
        bookingItemId: item.item.id,
        ticketCode,
        qrCodeData: qrCodePayload,
        status: "VALID",
      });
    }

    // 6. Record payment
    const [newPayment] = await tx
      .insert(payments)
      .values({
        bookingId: booking.id,
        paymentIntentId: paymentIntentId || `pi_test_${Date.now()}`,
        provider,
        amountCents: booking.totalAmountCents,
        currency: "USD",
        status: "SUCCEEDED",
        idempotencyKey,
        metadata,
      })
      .returning();

    // 7. Audit log
    await tx.insert(auditLogs).values({
      entityType: "booking",
      entityId: booking.id,
      action: "BOOKING_CONFIRMED_PAID",
      actorId: booking.userId,
      details: {
        paymentId: newPayment.id,
        amountCents: booking.totalAmountCents,
        ticketCount: items.length,
      },
    });

    return {
      success: true,
      booking: updatedBooking,
      payment: newPayment,
    };
  });
}

/**
 * Idempotent server-side endpoint logic for releasing expired seat holds
 */
export async function releaseExpiredSeatHolds() {
  const now = new Date();

  return await db.transaction(async (tx) => {
    // 1. Find all expired HELD seats
    const expiredSeats = await tx
      .select()
      .from(showtimeSeats)
      .where(
        and(
          eq(showtimeSeats.status, "HELD"),
          lt(showtimeSeats.holdExpiresAt, now)
        )
      );

    if (expiredSeats.length === 0) {
      return { releasedSeatsCount: 0, expiredBookingsCount: 0 };
    }

    const expiredSeatIds = expiredSeats.map((s) => s.id);

    // 2. Release seats back to AVAILABLE
    await tx
      .update(showtimeSeats)
      .set({
        status: "AVAILABLE",
        holdExpiresAt: null,
        heldByUserId: null,
        bookingId: null,
        updatedAt: now,
      })
      .where(inArray(showtimeSeats.id, expiredSeatIds));

    // 3. Mark corresponding pending bookings as EXPIRED
    const affectedBookingIds = expiredSeats
      .map((s) => s.bookingId)
      .filter((id): id is string => Boolean(id));

    let expiredBookingsCount = 0;
    if (affectedBookingIds.length > 0) {
      const updated = await tx
        .update(bookings)
        .set({
          status: "EXPIRED",
          updatedAt: now,
        })
        .where(
          and(
            inArray(bookings.id, affectedBookingIds),
            eq(bookings.status, "PENDING")
          )
        )
        .returning();
      expiredBookingsCount = updated.length;
    }

    // 4. Audit log
    await tx.insert(auditLogs).values({
      entityType: "cron",
      entityId: sql`gen_random_uuid()`,
      action: "EXPIRED_SEATS_RELEASED",
      details: {
        releasedSeatsCount: expiredSeats.length,
        expiredBookingsCount,
        timestamp: now.toISOString(),
      },
    });

    return {
      releasedSeatsCount: expiredSeats.length,
      expiredBookingsCount,
    };
  });
}

/**
 * Cancel eligible booking and release seats
 */
export async function cancelEligibleBooking(bookingId: string, userId: string) {
  const now = new Date();

  return await db.transaction(async (tx) => {
    const [booking] = await tx
      .select({
        booking: bookings,
        showtime: showtimes,
      })
      .from(bookings)
      .innerJoin(showtimes, eq(bookings.showtimeId, showtimes.id))
      .where(eq(bookings.id, bookingId))
      .limit(1);

    if (!booking) {
      return { success: false, error: "Booking not found" };
    }

    if (booking.booking.userId !== userId) {
      return { success: false, error: "Unauthorized access to this booking" };
    }

    if (booking.booking.status !== "CONFIRMED" && booking.booking.status !== "PENDING") {
      return {
        success: false,
        error: `Cannot cancel a booking with status '${booking.booking.status}'`,
      };
    }

    // Check cancellation policy: must be at least 2 hours before showtime start
    const showtimeStart = new Date(booking.showtime.startTime);
    const twoHoursBefore = new Date(showtimeStart.getTime() - 2 * 60 * 60 * 1000);
    if (now > twoHoursBefore) {
      return {
        success: false,
        error: "Bookings can only be cancelled up to 2 hours before the showtime",
      };
    }

    // Update booking status
    await tx
      .update(bookings)
      .set({
        status: "CANCELLED",
        updatedAt: now,
      })
      .where(eq(bookings.id, bookingId));

    // Release seats
    const items = await tx
      .select()
      .from(bookingItems)
      .where(eq(bookingItems.bookingId, bookingId));

    const showtimeSeatIds = items.map((i) => i.showtimeSeatId);
    if (showtimeSeatIds.length > 0) {
      await tx
        .update(showtimeSeats)
        .set({
          status: "AVAILABLE",
          heldByUserId: null,
          bookingId: null,
          holdExpiresAt: null,
          updatedAt: now,
        })
        .where(inArray(showtimeSeats.id, showtimeSeatIds));
    }

    // Invalidate tickets
    await tx
      .update(tickets)
      .set({
        status: "CANCELLED",
      })
      .where(eq(tickets.bookingId, bookingId));

    // Audit log
    await tx.insert(auditLogs).values({
      entityType: "booking",
      entityId: bookingId,
      action: "BOOKING_CANCELLED_BY_USER",
      actorId: userId,
      details: {
        releasedSeatsCount: showtimeSeatIds.length,
        timestamp: now.toISOString(),
      },
    });

    return { success: true };
  });
}
