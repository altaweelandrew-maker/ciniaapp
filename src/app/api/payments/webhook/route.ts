import { NextRequest, NextResponse } from "next/server";
import { confirmBookingAndPayment } from "@/db/transactions/booking";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const sig = request.headers.get("stripe-signature");
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event: any;

    try {
      event = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    // If STRIPE_WEBHOOK_SECRET is set and in production, verify header is present
    if (process.env.NODE_ENV === "production" && webhookSecret && !sig) {
      return NextResponse.json({ error: "Missing webhook signature" }, { status: 400 });
    }

    // Handle payment_intent.succeeded
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data?.object;
      const bookingId = paymentIntent?.metadata?.bookingId;
      const idempotencyKey = `webhook_${event.id || paymentIntent?.id}`;

      if (bookingId) {
        await confirmBookingAndPayment({
          bookingId,
          paymentIntentId: paymentIntent.id,
          idempotencyKey,
          provider: "STRIPE",
          metadata: {
            stripeEventId: event.id,
            receivedAt: new Date().toISOString(),
          },
        });
      }
    }

    return NextResponse.json({ received: true, eventType: event.type });
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed", details: error.message },
      { status: 500 }
    );
  }
}
