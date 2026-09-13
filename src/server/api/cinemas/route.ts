import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { cinemas, auditoriums } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const allCinemas = await db.select().from(cinemas);

    const cinemasWithScreens = await Promise.all(
      allCinemas.map(async (cinema) => {
        const screens = await db
          .select()
          .from(auditoriums)
          .where(eq(auditoriums.cinemaId, cinema.id));

        return {
          ...cinema,
          screens,
        };
      })
    );

    return NextResponse.json({
      success: true,
      cinemas: cinemasWithScreens,
    });
  } catch (error: any) {
    const { FALLBACK_CINEMAS } = await import("@/db/fallback-data");
    return NextResponse.json({
      success: true,
      cinemas: FALLBACK_CINEMAS,
    });
  }
}
