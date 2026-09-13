import { NextRequest, NextResponse } from "next/server";
import { eq, ilike, and, sql } from "drizzle-orm";
import { db } from "@/db";
import { movies, genres, movieGenres, showtimes, auditoriums, cinemas } from "@/db/schema";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search");
    const genreSlug = searchParams.get("genre");
    const language = searchParams.get("language");
    const cinemaId = searchParams.get("cinemaId");
    const date = searchParams.get("date"); // YYYY-MM-DD
    const featured = searchParams.get("featured");

    // Fetch all active movies
    let query = db.select().from(movies).where(eq(movies.isActive, true)).$dynamic();

    const conditions = [eq(movies.isActive, true)];

    if (search) {
      conditions.push(ilike(movies.title, `%${search}%`));
    }

    if (language) {
      conditions.push(eq(movies.language, language));
    }

    if (featured === "true") {
      conditions.push(eq(movies.isFeatured, true));
    }

    const movieList = await db
      .select()
      .from(movies)
      .where(and(...conditions));

    // For each movie, fetch linked genres
    const moviesWithGenres = await Promise.all(
      movieList.map(async (movie) => {
        const mg = await db
          .select({
            genre: genres,
          })
          .from(movieGenres)
          .innerJoin(genres, eq(movieGenres.genreId, genres.id))
          .where(eq(movieGenres.movieId, movie.id));

        return {
          ...movie,
          genres: mg.map((g) => g.genre.name),
          genreSlugs: mg.map((g) => g.genre.slug),
        };
      })
    );

    let filtered = moviesWithGenres;

    // Filter by genre slug if specified
    if (genreSlug && genreSlug !== "all") {
      filtered = filtered.filter((m) =>
        m.genreSlugs.includes(genreSlug.toLowerCase())
      );
    }

    // Filter by cinemaId or date if specified
    if (cinemaId || date) {
      const matchingMovieIds = new Set<string>();
      const stQuery = db
        .select({
          movieId: showtimes.movieId,
          startTime: showtimes.startTime,
          cinemaId: auditoriums.cinemaId,
        })
        .from(showtimes)
        .innerJoin(auditoriums, eq(showtimes.auditoriumId, auditoriums.id));

      const stResults = await stQuery;

      for (const st of stResults) {
        let match = true;
        if (cinemaId && st.cinemaId !== cinemaId) match = false;
        if (date) {
          const stDate = new Date(st.startTime).toISOString().split("T")[0];
          if (stDate !== date) match = false;
        }
        if (match) {
          matchingMovieIds.add(st.movieId);
        }
      }

      filtered = filtered.filter((m) => matchingMovieIds.has(m.id));
    }

    return NextResponse.json({
      success: true,
      count: filtered.length,
      movies: filtered,
    });
  } catch (error: any) {
    // Graceful fallback for local development preview before remote Neon is configured
    const { FALLBACK_MOVIES } = await import("@/db/fallback-data");
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search")?.toLowerCase();
    const genreSlug = searchParams.get("genre")?.toLowerCase();

    let filtered = FALLBACK_MOVIES;
    if (search) {
      filtered = filtered.filter((m) => m.title.toLowerCase().includes(search));
    }
    if (genreSlug && genreSlug !== "all") {
      filtered = filtered.filter((m) =>
        m.genres.some((g) => g.toLowerCase() === genreSlug)
      );
    }

    return NextResponse.json({
      success: true,
      count: filtered.length,
      movies: filtered,
    });
  }
}
