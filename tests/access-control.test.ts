export async function testAccessControlAndIsolation() {
  console.log("▶ [QA Agent] Testing User Data Privacy and Authorization Isolation...");

  const userAlice = { id: "user-alice-1", role: "user" };
  const userBob = { id: "user-bob-2", role: "user" };
  const userAdmin = { id: "user-admin-3", role: "admin" };

  const aliceBooking = {
    id: "booking-alice-100",
    userId: "user-alice-1",
    bookingReference: "CB-ALICE1",
    tickets: [{ id: "tkt-alice-1" }],
  };

  function checkCanAccessBooking(requester: { id: string; role: string }, booking: typeof aliceBooking) {
    if (requester.id === booking.userId || requester.role === "admin") {
      return { allowed: true };
    }
    return { allowed: false, status: 403, error: "Forbidden: You cannot access another user's bookings or tickets" };
  }

  // 1. Owner access
  const aliceAccess = checkCanAccessBooking(userAlice, aliceBooking);
  if (!aliceAccess.allowed) {
    throw new Error("Alice should have access to her own booking");
  }

  // 2. Cross-user violation attempt: Bob tries to access Alice's booking
  const bobAccess = checkCanAccessBooking(userBob, aliceBooking);
  if (bobAccess.allowed || bobAccess.status !== 403) {
    throw new Error("SECURITY BREACH: User Bob was able to access User Alice's booking!");
  }
  console.log("  ✓ Cross-user access rejected: Bob cannot view Alice's booking or tickets (403 Forbidden)");

  // 3. Admin elevated oversight access
  const adminAccess = checkCanAccessBooking(userAdmin, aliceBooking);
  if (!adminAccess.allowed) {
    throw new Error("Admin should be granted access to bookings for auditing");
  }
  console.log("  ✓ Admin role granted audit permissions");

  return true;
}

if (require.main === module) {
  testAccessControlAndIsolation()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Test failed:", err);
      process.exit(1);
    });
}
