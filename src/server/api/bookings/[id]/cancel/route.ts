import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { cancelEligibleBooking } from "@/db/transactions/booking";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await params;
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await cancelEligibleBooking(bookingId, user.id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to cancel booking" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Booking has been successfully cancelled and seats released",
    });
  } catch (error: any) {
    console.error("Error cancelling booking:", error);
    return NextResponse.json(
      { error: "Failed to cancel booking", details: error.message },
      { status: 500 }
    );
  }
}
