import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { bookings } from "@/db/schema";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { bookingId } = await request.json();
    if (!bookingId) {
      return NextResponse.json({ error: "bookingId is required" }, { status: 400 });
    }

    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .limit(1);

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.userId !== user.id && user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    if (booking.status !== "PENDING") {
      return NextResponse.json(
        { error: `Cannot process payment for booking with status ${booking.status}` },
        { status: 400 }
      );
    }

    const now = new Date();
    if (booking.holdExpiresAt && new Date(booking.holdExpiresAt) < now) {
      return NextResponse.json(
        { error: "Seat hold has expired. Please reserve your seats again." },
        { status: 410 } // Gone
      );
    }

    // In test mode, create a client secret and payment intent reference
    const clientSecret = `pi_test_${booking.id.slice(0, 8)}_secret_${Date.now()}`;

    return NextResponse.json({
      success: true,
      clientSecret,
      amountCents: booking.totalAmountCents,
      currency: "usd",
      bookingReference: booking.bookingReference,
    });
  } catch (error: any) {
    console.error("Payment intent creation error:", error);
    return NextResponse.json(
      { error: "Failed to initialize payment", details: error.message },
      { status: 500 }
    );
  }
}
