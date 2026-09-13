import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import QRCode from "qrcode";
import { db } from "@/db";
import {
  tickets,
  bookingItems,
  bookings,
  showtimes,
  movies,
  auditoriums,
  cinemas,
  showtimeSeats,
  seats,
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

    // Find ticket by ID or ticketCode
    const [tResult] = await db
      .select({
        ticket: tickets,
        booking: bookings,
        bookingItem: bookingItems,
        showtime: showtimes,
        movie: movies,
        auditorium: auditoriums,
        cinema: cinemas,
        stSeat: showtimeSeats,
        seat: seats,
      })
      .from(tickets)
      .innerJoin(bookings, eq(tickets.bookingId, bookings.id))
      .innerJoin(bookingItems, eq(tickets.bookingItemId, bookingItems.id))
      .innerJoin(showtimes, eq(bookings.showtimeId, showtimes.id))
      .innerJoin(movies, eq(showtimes.movieId, movies.id))
      .innerJoin(auditoriums, eq(showtimes.auditoriumId, auditoriums.id))
      .innerJoin(cinemas, eq(auditoriums.cinemaId, cinemas.id))
      .innerJoin(showtimeSeats, eq(bookingItems.showtimeSeatId, showtimeSeats.id))
      .innerJoin(seats, eq(showtimeSeats.seatId, seats.id))
      .where(eq(tickets.id, id))
      .limit(1);

    if (!tResult) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Access control: User must own booking or be admin
    if (tResult.booking.userId !== user.id && user.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: You cannot access another user's tickets" },
        { status: 403 }
      );
    }

    // Generate DataURL QR Code for high-res rendering
    const qrDataUrl = await QRCode.toDataURL(tResult.ticket.qrCodeData, {
      width: 320,
      margin: 2,
      color: {
        dark: "#0F111A",
        light: "#FFFFFF",
      },
    });

    return NextResponse.json({
      success: true,
      ticket: {
        id: tResult.ticket.id,
        ticketCode: tResult.ticket.ticketCode,
        status: tResult.ticket.status,
        qrCodeDataUrl: qrDataUrl,
        bookingReference: tResult.booking.bookingReference,
        movie: {
          title: tResult.movie.title,
          posterUrl: tResult.movie.posterUrl,
          rating: tResult.movie.rating,
          durationMinutes: tResult.movie.durationMinutes,
        },
        cinema: {
          name: tResult.cinema.name,
          address: tResult.cinema.address,
        },
        auditorium: {
          name: tResult.auditorium.name,
          screenType: tResult.auditorium.screenType,
        },
        seat: {
          label: `${tResult.seat.rowLabel}${tResult.seat.seatNumber}`,
          type: tResult.seat.seatType,
        },
        showtime: {
          startTime: tResult.showtime.startTime,
          format: tResult.showtime.format,
        },
        priceCents: tResult.bookingItem.priceCents,
        issuedAt: tResult.ticket.createdAt,
      },
    });
  } catch (error: any) {
    const { RUNTIME_TICKETS } = await import("@/db/fallback-data");
    const { id } = await params;
    const ticket = RUNTIME_TICKETS.get(id);

    if (ticket) {
      const qrDataUrl = await QRCode.toDataURL(
        JSON.stringify({
          ticketCode: ticket.ticketCode,
          ref: ticket.bookingReference,
          seat: ticket.seat.label,
        }),
        { width: 320, margin: 2, color: { dark: "#0F111A", light: "#FFFFFF" } }
      );

      return NextResponse.json({
        success: true,
        ticket: {
          ...ticket,
          qrCodeDataUrl: qrDataUrl,
        },
      });
    }

    return NextResponse.json(
      { error: "Failed to fetch ticket", details: error.message },
      { status: 500 }
    );
  }
}
