import { NextRequest, NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { movies } from "@/db/schema";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const allMovies = await db
      .select()
      .from(movies)
      .orderBy(desc(movies.createdAt));

    return NextResponse.json({ success: true, movies: allMovies });
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
    const {
      title,
      synopsis,
      posterUrl,
      backdropUrl,
      trailerUrl,
      durationMinutes,
      rating,
      language = "English",
      releaseDate,
      isFeatured = false,
    } = body;

    if (!title || !synopsis || !posterUrl || !durationMinutes || !rating || !releaseDate) {
      return NextResponse.json(
        { error: "Missing required fields: title, synopsis, posterUrl, durationMinutes, rating, releaseDate" },
        { status: 400 }
      );
    }

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    const [newMovie] = await db
      .insert(movies)
      .values({
        title,
        slug,
        synopsis,
        posterUrl,
        backdropUrl: backdropUrl || posterUrl,
        trailerUrl,
        durationMinutes: parseInt(durationMinutes, 10),
        rating,
        language,
        releaseDate,
        isFeatured: Boolean(isFeatured),
      })
      .returning();

    return NextResponse.json({ success: true, movie: newMovie });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
