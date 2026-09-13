import { NextRequest, NextResponse } from "next/server";
import { releaseExpiredSeatHolds } from "@/db/transactions/booking";

export async function GET(request: NextRequest) {
  return handleRelease(request);
}

export async function POST(request: NextRequest) {
  return handleRelease(request);
}

async function handleRelease(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  const cronSecret = process.env.CRON_SECRET || "cinebook_cron_secret_auth_token_987654";

  // Check Bearer token or URL search param for flexible testing/Vercel Cron
  const providedSecret =
    authHeader?.replace("Bearer ", "") ||
    request.nextUrl.searchParams.get("key");

  if (providedSecret !== cronSecret && process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Unauthorized: Invalid or missing CRON_SECRET" },
      { status: 401 }
    );
  }

  try {
    const result = await releaseExpiredSeatHolds();
    return NextResponse.json({
      success: true,
      message: "Expired seat holds processed successfully",
      releasedSeatsCount: result.releasedSeatsCount,
      expiredBookingsCount: result.expiredBookingsCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error executing seat hold cleanup cron:", error);
    return NextResponse.json(
      { error: "Failed to release expired seat holds", details: error.message },
      { status: 500 }
    );
  }
}
