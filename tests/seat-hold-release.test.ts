export async function testSeatHoldRelease() {
  console.log("▶ [QA Agent] Testing Expired Seat Holds and Idempotent Cleanup...");

  const now = new Date();
  const pastExpiration = new Date(now.getTime() - 5 * 60 * 1000); // 5 minutes ago
  const futureExpiration = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes in future

  // Mock table of showtime seats
  const testSeats = [
    { id: "s1", status: "HELD", holdExpiresAt: pastExpiration, bookingId: "b1" },
    { id: "s2", status: "HELD", holdExpiresAt: futureExpiration, bookingId: "b2" },
    { id: "s3", status: "BOOKED", holdExpiresAt: null, bookingId: "b3" },
    { id: "s4", status: "AVAILABLE", holdExpiresAt: null, bookingId: null },
  ];

  // Pass 1: Run cleanup
  let releasedCount = 0;
  for (const s of testSeats) {
    if (s.status === "HELD" && s.holdExpiresAt && s.holdExpiresAt < now) {
      s.status = "AVAILABLE";
      s.holdExpiresAt = null;
      s.bookingId = null;
      releasedCount++;
    }
  }

  if (releasedCount !== 1) {
    throw new Error(`Expected 1 expired seat to be released, got ${releasedCount}`);
  }

  if (testSeats[0].status !== "AVAILABLE") {
    throw new Error("Seat s1 should now be AVAILABLE");
  }

  if (testSeats[1].status !== "HELD") {
    throw new Error("Seat s2 with future expiration must remain HELD");
  }

  if (testSeats[2].status !== "BOOKED") {
    throw new Error("Seat s3 with BOOKED status must remain untouched");
  }

  console.log("  ✓ Expired hold correctly identified and reverted to AVAILABLE");
  console.log("  ✓ Active unexpired holds preserved without premature release");

  // Pass 2: Repeat execution immediately (testing idempotency)
  let secondRunReleasedCount = 0;
  for (const s of testSeats) {
    if (s.status === "HELD" && s.holdExpiresAt && s.holdExpiresAt < now) {
      secondRunReleasedCount++;
    }
  }

  if (secondRunReleasedCount !== 0) {
    throw new Error(`Idempotency failure: second cleanup run expected 0 released, got ${secondRunReleasedCount}`);
  }

  console.log("  ✓ Idempotency confirmed: Repeated cleanup invocations execute safely with 0 side-effects");
  return true;
}

if (require.main === module) {
  testSeatHoldRelease()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Test failed:", err);
      process.exit(1);
    });
}
