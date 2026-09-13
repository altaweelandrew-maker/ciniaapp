import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { bookings, users, showtimes, movies, auditoriums, cinemas } from "@/db/schema";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const allBookings = await db
      .select({
        booking: bookings,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
        movie: {
          title: movies.title,
        },
        auditorium: {
          name: auditoriums.name,
        },
        cinema: {
          name: cinemas.name,
        },
      })
      .from(bookings)
      .innerJoin(users, eq(bookings.userId, users.id))
      .innerJoin(showtimes, eq(bookings.showtimeId, showtimes.id))
      .innerJoin(movies, eq(showtimes.movieId, movies.id))
      .innerJoin(auditoriums, eq(showtimes.auditoriumId, auditoriums.id))
      .innerJoin(cinemas, eq(auditoriums.cinemaId, cinemas.id))
      .orderBy(desc(bookings.createdAt))
      .limit(50);

    return NextResponse.json({ success: true, bookings: allBookings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
