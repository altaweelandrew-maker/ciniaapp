import { NextRequest, NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { showtimes, showtimeSeats, seats, auditoriums, movies } from "@/db/schema";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const stList = await db
      .select({
        showtime: showtimes,
        movie: movies,
        auditorium: auditoriums,
      })
      .from(showtimes)
      .innerJoin(movies, eq(showtimes.movieId, movies.id))
      .innerJoin(auditoriums, eq(showtimes.auditoriumId, auditoriums.id))
      .orderBy(desc(showtimes.startTime));

    return NextResponse.json({ success: true, showtimes: stList });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { movieId, auditoriumId, startTime, format = "2D", basePriceCents } = body;

    if (!movieId || !auditoriumId || !startTime || !basePriceCents) {
      return NextResponse.json(
        { error: "movieId, auditoriumId, startTime, and basePriceCents are required" },
        { status: 400 }
      );
    }

    const start = new Date(startTime);
    const end = new Date(start.getTime() + 150 * 60 * 1000); // 2.5 hours default duration

    const [newShowtime] = await db
      .insert(showtimes)
      .values({
        movieId,
        auditoriumId,
        startTime: start,
        endTime: end,
        format,
        basePriceCents: parseInt(basePriceCents, 10),
        status: "SCHEDULED",
      })
      .returning();

    // Generate showtime_seats for all seats in this auditorium
    const audSeats = await db
      .select()
      .from(seats)
      .where(eq(seats.auditoriumId, auditoriumId));

    for (const s of audSeats) {
      const multiplier = s.priceMultiplier || 100;
      const priceCents = Math.round((newShowtime.basePriceCents * multiplier) / 100);

      await db.insert(showtimeSeats).values({
        showtimeId: newShowtime.id,
        seatId: s.id,
        status: "AVAILABLE",
        priceCents,
      });
    }

    return NextResponse.json({
      success: true,
      showtime: newShowtime,
      seatsGenerated: audSeats.length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
