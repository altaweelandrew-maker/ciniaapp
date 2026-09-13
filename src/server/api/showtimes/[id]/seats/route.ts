import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  showtimes,
  auditoriums,
  seats,
  showtimeSeats,
  movies,
  cinemas,
} from "@/db/schema";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: showtimeId } = await params;
    const currentUser = await getUserFromRequest(request);
    const now = new Date();

    // 1. Fetch showtime with auditorium, cinema, and movie
    const [stResult] = await db
      .select({
        showtime: showtimes,
        auditorium: auditoriums,
        cinema: cinemas,
        movie: movies,
      })
      .from(showtimes)
      .innerJoin(auditoriums, eq(showtimes.auditoriumId, auditoriums.id))
      .innerJoin(cinemas, eq(auditoriums.cinemaId, cinemas.id))
      .innerJoin(movies, eq(showtimes.movieId, movies.id))
      .where(eq(showtimes.id, showtimeId))
      .limit(1);

    if (!stResult) {
      return NextResponse.json(
        { error: "Showtime not found" },
        { status: 404 }
      );
    }

    // 2. Fetch all seats for this auditorium joined with showtime_seats
    const seatRecords = await db
      .select({
        seat: seats,
        stSeat: showtimeSeats,
      })
      .from(seats)
      .leftJoin(
        showtimeSeats,
        eq(seats.id, showtimeSeats.seatId)
      )
      .where(
        eq(seats.auditoriumId, stResult.auditorium.id)
      );

    // Filter to only match the current showtimeId for showtime_seats
    const mappedSeats = seatRecords
      .filter((r) => !r.stSeat || r.stSeat.showtimeId === showtimeId)
      .map(({ seat, stSeat }) => {
        let status = stSeat?.status || "AVAILABLE";
        const holdExpiresAt = stSeat?.holdExpiresAt;

        // If held but expired, it's effectively available
        if (status === "HELD" && holdExpiresAt && new Date(holdExpiresAt) < now) {
          status = "AVAILABLE";
        }

        const heldByMe =
          Boolean(currentUser && stSeat?.heldByUserId === currentUser.id) &&
          status === "HELD";

        // Calculate price in minor units
        const multiplier = seat.priceMultiplier || 100;
        const priceCents = Math.round(
          (stResult.showtime.basePriceCents * multiplier) / 100
        );

        return {
          id: seat.id,
          showtimeSeatId: stSeat?.id,
          rowLabel: seat.rowLabel,
          seatNumber: seat.seatNumber,
          seatType: seat.seatType,
          priceMultiplier: seat.priceMultiplier,
          status,
          priceCents,
          holdExpiresAt: holdExpiresAt?.toISOString() || null,
          heldByMe,
        };
      });

    // Group rows in order
    const rowLabels = Array.from(new Set(mappedSeats.map((s) => s.rowLabel))).sort();

    return NextResponse.json({
      success: true,
      showtime: {
        id: stResult.showtime.id,
        startTime: stResult.showtime.startTime,
        endTime: stResult.showtime.endTime,
        format: stResult.showtime.format,
        basePriceCents: stResult.showtime.basePriceCents,
      },
      movie: {
        id: stResult.movie.id,
        title: stResult.movie.title,
        posterUrl: stResult.movie.posterUrl,
        rating: stResult.movie.rating,
        durationMinutes: stResult.movie.durationMinutes,
      },
      cinema: {
        id: stResult.cinema.id,
        name: stResult.cinema.name,
      },
      auditorium: {
        id: stResult.auditorium.id,
        name: stResult.auditorium.name,
        screenType: stResult.auditorium.screenType,
        rowCount: stResult.auditorium.rowCount,
        columnCount: stResult.auditorium.columnCount,
        rowLabels,
      },
      seats: mappedSeats,
    });
  } catch (error: any) {
    const { FALLBACK_MOVIES, getFallbackShowtimes, generateSeatsForShowtime } = await import("@/db/fallback-data");
    const { id: showtimeId } = await params;
    const st = getFallbackShowtimes().find((s) => s.id === showtimeId) || getFallbackShowtimes()[0];
    const movie = FALLBACK_MOVIES.find((m) => m.id === st.movieId) || FALLBACK_MOVIES[0];
    const { rows, seats } = generateSeatsForShowtime(st.basePriceCents);

    return NextResponse.json({
      success: true,
      showtime: {
        id: st.id,
        startTime: st.startTime,
        endTime: st.endTime,
        format: st.format,
        basePriceCents: st.basePriceCents,
      },
      movie: {
        id: movie.id,
        title: movie.title,
        posterUrl: movie.posterUrl,
        rating: movie.rating,
        durationMinutes: movie.durationMinutes,
      },
      cinema: {
        id: st.cinemaId,
        name: st.cinemaName,
      },
      auditorium: {
        id: st.auditoriumId,
        name: st.auditoriumName,
        screenType: st.screenType,
        rowCount: rows.length,
        columnCount: 12,
        rowLabels: rows,
      },
      seats,
    });
  }
}
