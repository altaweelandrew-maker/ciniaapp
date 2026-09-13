import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  bookings,
  showtimes,
  movies,
  auditoriums,
  cinemas,
  bookingItems,
  showtimeSeats,
  seats,
  tickets,
  payments,
} from "@/db/schema";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [bResult] = await db
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
      .where(eq(bookings.id, id))
      .limit(1);

    if (!bResult) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Security check: Must belong to user or user must be admin
    if (bResult.booking.userId !== user.id && user.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to access this booking" },
        { status: 403 }
      );
    }

    // Fetch booking items
    const items = await db
      .select({
        item: bookingItems,
        stSeat: showtimeSeats,
        seat: seats,
      })
      .from(bookingItems)
      .innerJoin(showtimeSeats, eq(bookingItems.showtimeSeatId, showtimeSeats.id))
      .innerJoin(seats, eq(showtimeSeats.seatId, seats.id))
      .where(eq(bookingItems.bookingId, bResult.booking.id));

    // Fetch tickets
    const ticketList = await db
      .select()
      .from(tickets)
      .where(eq(tickets.bookingId, bResult.booking.id));

    // Fetch payments
    const paymentList = await db
      .select()
      .from(payments)
      .where(eq(payments.bookingId, bResult.booking.id));

    return NextResponse.json({
      success: true,
      booking: {
        ...bResult.booking,
        showtime: bResult.showtime,
        movie: bResult.movie,
        cinema: bResult.cinema,
        auditorium: bResult.auditorium,
        items: items.map((i) => ({
          id: i.item.id,
          priceCents: i.item.priceCents,
          seatId: i.seat.id,
          seatLabel: `${i.seat.rowLabel}${i.seat.seatNumber}`,
          seatType: i.seat.seatType,
        })),
        tickets: ticketList,
        payments: paymentList,
      },
    });
  } catch (error: any) {
    const { RUNTIME_BOOKINGS } = await import("@/db/fallback-data");
    const { id } = await params;
    const fallbackBooking = RUNTIME_BOOKINGS.get(id);

    if (fallbackBooking) {
      return NextResponse.json({
        success: true,
        booking: fallbackBooking,
      });
    }

    return NextResponse.json(
      { error: "Booking not found", details: error.message },
      { status: 404 }
    );
  }
}
