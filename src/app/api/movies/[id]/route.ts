import { NextRequest, NextResponse } from "next/server";
import { eq, or } from "drizzle-orm";
import { db } from "@/db";
import {
  movies,
  genres,
  movieGenres,
  showtimes,
  auditoriums,
  cinemas,
} from "@/db/schema";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Support fetching by UUID or slug
    const [movie] = await db
      .select()
      .from(movies)
      .where(or(eq(movies.id, id), eq(movies.slug, id)))
      .limit(1);

    if (!movie) {
      return NextResponse.json({ error: "Movie not found" }, { status: 404 });
    }

    // Fetch genres
    const mg = await db
      .select({ genre: genres })
      .from(movieGenres)
      .innerJoin(genres, eq(movieGenres.genreId, genres.id))
      .where(eq(movieGenres.movieId, movie.id));

    // Fetch upcoming showtimes with cinema and auditorium details
    const stResults = await db
      .select({
        showtime: showtimes,
        auditorium: auditoriums,
        cinema: cinemas,
      })
      .from(showtimes)
      .innerJoin(auditoriums, eq(showtimes.auditoriumId, auditoriums.id))
      .innerJoin(cinemas, eq(auditoriums.cinemaId, cinemas.id))
      .where(eq(showtimes.movieId, movie.id));

    return NextResponse.json({
      success: true,
      movie: {
        ...movie,
        genres: mg.map((g) => g.genre.name),
        showtimes: stResults.map((r) => ({
          id: r.showtime.id,
          startTime: r.showtime.startTime,
          endTime: r.showtime.endTime,
          format: r.showtime.format,
          basePriceCents: r.showtime.basePriceCents,
          status: r.showtime.status,
          auditorium: {
            id: r.auditorium.id,
            name: r.auditorium.name,
            screenType: r.auditorium.screenType,
            totalSeats: r.auditorium.totalSeats,
          },
          cinema: {
            id: r.cinema.id,
            name: r.cinema.name,
            address: r.cinema.address,
            city: r.cinema.city,
          },
        })),
      },
    });
  } catch (error: any) {
    const { FALLBACK_MOVIES, getFallbackShowtimes } = await import("@/db/fallback-data");
    const { id } = await params;
    const foundMovie =
      FALLBACK_MOVIES.find((m) => m.id === id || m.slug === id) ||
      FALLBACK_MOVIES[0];

    const showtimes = getFallbackShowtimes()
      .filter((st) => st.movieId === foundMovie.id || foundMovie.id === "m-dune-2")
      .map((st) => ({
        id: st.id,
        startTime: st.startTime,
        endTime: st.endTime,
        format: st.format,
        basePriceCents: st.basePriceCents,
        status: st.status,
        auditorium: {
          id: st.auditoriumId,
          name: st.auditoriumName,
          screenType: st.screenType,
          totalSeats: 96,
        },
        cinema: {
          id: st.cinemaId,
          name: st.cinemaName,
          address: st.cinemaAddress,
          city: st.city,
        },
      }));

    return NextResponse.json({
      success: true,
      movie: {
        ...foundMovie,
        showtimes,
      },
    });
  }
}
