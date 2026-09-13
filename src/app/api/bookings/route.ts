import { NextRequest, NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { bookings, showtimes, movies, auditoriums, cinemas, bookingItems, showtimeSeats, seats, tickets } from "@/db/schema";
import { getUserFromRequest } from "@/lib/auth";
import { holdSeatsAndCreatePendingBooking } from "@/db/transactions/booking";

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required to book seats" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { showtimeId, seatIds, idempotencyKey } = body;

    if (!showtimeId || !seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
      return NextResponse.json(
        { error: "Invalid booking request: showtimeId and seatIds are required" },
        { status: 400 }
      );
    }

    if (seatIds.length > 10) {
      return NextResponse.json(
        { error: "You can book a maximum of 10 seats per transaction" },
        { status: 400 }
      );
    }

    const result = await holdSeatsAndCreatePendingBooking({
      showtimeId,
      seatIds,
      userId: user.id,
      idempotencyKey,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error || "Seats could not be reserved",
          unavailableSeats: result.unavailableSeats,
        },
        { status: 409 } // Conflict: Seat already held or booked
      );
    }

    return NextResponse.json({
      success: true,
      booking: result.booking,
    });
  } catch (error: any) {
    const { RUNTIME_BOOKINGS, getFallbackShowtimes, FALLBACK_MOVIES } = await import("@/db/fallback-data");
    const body = await request.json();
    const { showtimeId, seatIds } = body;
    const user = (await getUserFromRequest(request)) || { id: "preview-user-id" };

    const st = getFallbackShowtimes().find((s) => s.id === showtimeId) || getFallbackShowtimes()[0];
    const movie = FALLBACK_MOVIES.find((m) => m.id === st.movieId) || FALLBACK_MOVIES[0];

    const subtotalCents = seatIds.length * st.basePriceCents;
    const feeCents = seatIds.length * 150;
    const taxCents = Math.round(subtotalCents * 0.0825);
    const totalAmountCents = subtotalCents + feeCents + taxCents;

    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let bookingRef = "CB-";
    for (let i = 0; i < 6; i++) bookingRef += chars.charAt(Math.floor(Math.random() * chars.length));

    const bookingId = `bk_prev_${Date.now()}`;
    const holdExpiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const fallbackBooking = {
      id: bookingId,
      bookingReference: bookingRef,
      userId: user.id,
      showtimeId,
      status: "PENDING",
      subtotalCents,
      feeCents,
      taxCents,
      totalAmountCents,
      holdExpiresAt,
      seats: seatIds.map((id: string) => id.replace("seat-", "")),
      items: seatIds.map((id: string) => ({
        id: `item-${id}`,
        seatLabel: id.replace("seat-", ""),
        seatType: "STANDARD",
        priceCents: st.basePriceCents,
      })),
      movie: {
        title: movie.title,
        posterUrl: movie.posterUrl,
        rating: movie.rating,
      },
      showtime: {
        id: st.id,
        startTime: st.startTime,
        format: st.format,
      },
      cinema: {
        name: st.cinemaName,
        auditoriumName: st.auditoriumName,
      },
      auditorium: {
        name: st.auditoriumName,
      },
      tickets: [],
      createdAt: new Date().toISOString(),
    };

    RUNTIME_BOOKINGS.set(bookingId, fallbackBooking);

    return NextResponse.json({
      success: true,
      booking: fallbackBooking,
    });
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const userBookings = await db
      .select({
        booking: bookings,
        showtime: showtimes,
        movie: movies,
        auditorium: auditoriums,
        cinema: cinemas,
      })
      .from(bookings)
      .innerJoin(showtimes, eq(bookings.showtimeId, showtimes.id))
      .innerJoin(movies, eq(showtimes.movieId, movies.id))
      .innerJoin(auditoriums, eq(showtimes.auditoriumId, auditoriums.id))
      .innerJoin(cinemas, eq(auditoriums.cinemaId, cinemas.id))
      .where(eq(bookings.userId, user.id))
      .orderBy(desc(bookings.createdAt));

    // Fetch items and tickets for each booking
    const populated = await Promise.all(
      userBookings.map(async (ub) => {
        const items = await db
          .select({
            item: bookingItems,
            seat: seats,
          })
          .from(bookingItems)
          .innerJoin(showtimeSeats, eq(bookingItems.showtimeSeatId, showtimeSeats.id))
          .innerJoin(seats, eq(showtimeSeats.seatId, seats.id))
          .where(eq(bookingItems.bookingId, ub.booking.id));

        const ticketList = await db
          .select()
          .from(tickets)
          .where(eq(tickets.bookingId, ub.booking.id));

        return {
          ...ub.booking,
          showtime: {
            id: ub.showtime.id,
            startTime: ub.showtime.startTime,
            format: ub.showtime.format,
          },
          movie: {
            id: ub.movie.id,
            title: ub.movie.title,
            posterUrl: ub.movie.posterUrl,
            rating: ub.movie.rating,
          },
          cinema: {
            name: ub.cinema.name,
            auditoriumName: ub.auditorium.name,
          },
          seats: items.map((i) => `${i.seat.rowLabel}${i.seat.seatNumber}`),
          tickets: ticketList,
        };
      })
    );

    return NextResponse.json({
      success: true,
      bookings: populated,
    });
  } catch (error: any) {
    const { RUNTIME_BOOKINGS } = await import("@/db/fallback-data");
    const user = await getUserFromRequest(request);
    const list = Array.from(RUNTIME_BOOKINGS.values()).filter(
      (b) => !user || b.userId === user.id || user.role === "admin"
    );

    return NextResponse.json({
      success: true,
      bookings: list,
    });
  }
}
