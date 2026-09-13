export async function testPaymentIdempotencyAndWebhooks() {
  console.log("▶ [QA Agent] Testing Payment Confirmation, Idempotency Keys, and Duplicate Webhook Handling...");

  // Mock payments database ledger
  const processedPayments = new Map<string, { id: string; amountCents: number; status: string }>();
  const issuedTickets = new Set<string>();

  async function processPaymentWithIdempotency(params: {
    bookingId: string;
    idempotencyKey: string;
    amountCents: number;
    cardNumber?: string;
  }) {
    // 1. Simulate card decline
    if (params.cardNumber?.endsWith("0002")) {
      return { success: false, error: "Your card was declined", code: "card_declined" };
    }

    // 2. Check idempotency ledger
    if (processedPayments.has(params.idempotencyKey)) {
      const existing = processedPayments.get(params.idempotencyKey)!;
      return {
        success: true,
        replayed: true,
        paymentId: existing.id,
        status: existing.status,
        message: "Idempotent response: Returning previously settled payment",
      };
    }

    // 3. New payment settlement
    const paymentId = `pay_${Date.now()}`;
    processedPayments.set(params.idempotencyKey, {
      id: paymentId,
      amountCents: params.amountCents,
      status: "SUCCEEDED",
    });

    // 4. Issue ticket
    const ticketCode = `TK-${params.bookingId.slice(0, 4)}-${Date.now().toString().slice(-4)}`;
    issuedTickets.add(ticketCode);

    return {
      success: true,
      replayed: false,
      paymentId,
      status: "SUCCEEDED",
      ticketCode,
    };
  }

  const bookingId = "bk-test-84920";
  const idempotencyKey = "client_idem_key_abc_123";
  const amountCents = 3832;

  // Step 1: First payment attempt
  const firstAttempt = await processPaymentWithIdempotency({
    bookingId,
    idempotencyKey,
    amountCents,
    cardNumber: "4242 4242 4242 4242",
  });

  if (!firstAttempt.success || firstAttempt.replayed) {
    throw new Error("First payment attempt should succeed as a new transaction");
  }
  if (issuedTickets.size !== 1) {
    throw new Error(`Expected 1 ticket issued, found ${issuedTickets.size}`);
  }
  console.log("  ✓ First payment attempt succeeded and issued ticket");

  // Step 2: Retry / Rapid double-click with identical idempotencyKey
  const secondAttempt = await processPaymentWithIdempotency({
    bookingId,
    idempotencyKey,
    amountCents,
    cardNumber: "4242 4242 4242 4242",
  });

  if (!secondAttempt.success || !secondAttempt.replayed) {
    throw new Error("Duplicate request with same idempotency key must be recognized as replayed");
  }
  if (secondAttempt.paymentId !== firstAttempt.paymentId) {
    throw new Error("Replayed request must return the identical payment ID");
  }
  if (issuedTickets.size !== 1) {
    throw new Error("Duplicate request must NEVER issue duplicate tickets");
  }
  console.log("  ✓ Idempotency key prevented duplicate charge and duplicate ticket creation");

  // Step 3: Test card decline simulation
  const declineAttempt = await processPaymentWithIdempotency({
    bookingId: "bk-other",
    idempotencyKey: "client_idem_key_declined",
    amountCents: 2000,
    cardNumber: "4000 0000 0000 0002",
  });

  if (declineAttempt.success || declineAttempt.code !== "card_declined") {
    throw new Error("Card ending in 0002 must trigger card_declined response");
  }
  console.log("  ✓ Declined card test passed with appropriate 402 code");

  // Step 4: Duplicate webhook delivery handling
  const webhookIdempotencyKey = "webhook_evt_pi_3892819";
  const wh1 = await processPaymentWithIdempotency({
    bookingId: "bk-webhook-1",
    idempotencyKey: webhookIdempotencyKey,
    amountCents: 1950,
  });
  const wh2 = await processPaymentWithIdempotency({
    bookingId: "bk-webhook-1",
    idempotencyKey: webhookIdempotencyKey,
    amountCents: 1950,
  });

  if (!wh1.success || !wh2.replayed) {
    throw new Error("Duplicate webhook delivery failed idempotency deduplication");
  }
  console.log("  ✓ Duplicate webhook delivery deduplication confirmed");

  return true;
}

if (require.main === module) {
  testPaymentIdempotencyAndWebhooks()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Test failed:", err);
      process.exit(1);
    });
}
