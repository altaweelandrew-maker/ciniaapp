import bcrypt from "bcryptjs";
import { createSessionToken, verifySessionToken } from "../src/lib/auth";

export async function testAuthenticationAndTokens() {
  console.log("▶ [QA Agent] Testing User Authentication, Password Hashing, and JWT Sessions...");

  // 1. Password hashing test
  const rawPassword = "SecureUserPass!987";
  const hashedPassword = await bcrypt.hash(rawPassword, 10);

  const isMatch = await bcrypt.compare(rawPassword, hashedPassword);
  const isBadMatch = await bcrypt.compare("WrongPassword", hashedPassword);

  if (!isMatch) {
    throw new Error("Password verification failed for correct password");
  }
  if (isBadMatch) {
    throw new Error("Password verification improperly succeeded for wrong password");
  }
  console.log("  ✓ Bcrypt password hashing & comparison verified");

  // 2. JWT Session generation and verification
  const sessionUser = {
    id: "user-uuid-1234-5678",
    email: "testuser@cinebook.com",
    name: "Test User",
    role: "user" as const,
  };

  const token = await createSessionToken(sessionUser);
  const decoded = await verifySessionToken(token);

  if (!decoded) {
    throw new Error("Failed to decode session token");
  }
  if (decoded.id !== sessionUser.id || decoded.email !== sessionUser.email || decoded.role !== sessionUser.role) {
    throw new Error("Decoded session payload does not match source user");
  }
  console.log("  ✓ Secure JWT session token signing & verification verified");

  // 3. Admin session token validation
  const adminUser = {
    id: "admin-uuid-9999",
    email: "admin@cinebook.com",
    name: "Admin",
    role: "admin" as const,
  };
  const adminToken = await createSessionToken(adminUser);
  const adminDecoded = await verifySessionToken(adminToken);

  if (adminDecoded?.role !== "admin") {
    throw new Error("Admin token role validation failed");
  }
  console.log("  ✓ Administrator role authorization verified");

  return true;
}

if (require.main === module) {
  testAuthenticationAndTokens()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Test failed:", err);
      process.exit(1);
    });
}
