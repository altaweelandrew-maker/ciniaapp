import { testAuthenticationAndTokens } from "../../tests/auth.test";
import { testPricingCalculations } from "../../tests/pricing.test";
import { testConcurrentSeatBooking } from "../../tests/concurrency.test";
import { testSeatHoldRelease } from "../../tests/seat-hold-release.test";
import { testPaymentIdempotencyAndWebhooks } from "../../tests/payment-idempotency.test";
import { testAccessControlAndIsolation } from "../../tests/access-control.test";

interface TestResult {
  name: string;
  passed: boolean;
  durationMs: number;
  error?: string;
}

async function runQASuite() {
  console.log("================================================================================");
  console.log("🎬 CINEBOOK COMPREHENSIVE QA AGENT TEST SUITE");
  console.log("================================================================================\n");

  const tests = [
    { name: "Authentication, Passwords & JWT Sessions", fn: testAuthenticationAndTokens },
    { name: "Integer Minor Units Pricing & Fees Calculation", fn: testPricingCalculations },
    { name: "Concurrent Double-Booking Race Condition Resolution", fn: testConcurrentSeatBooking },
    { name: "Expired Seat Holds & Idempotent Cleanup", fn: testSeatHoldRelease },
    { name: "Payment Idempotency & Webhook Deduplication", fn: testPaymentIdempotencyAndWebhooks },
    { name: "Data Privacy, Access Control & Admin Permissions", fn: testAccessControlAndIsolation },
  ];

  const results: TestResult[] = [];

  for (const test of tests) {
    const start = Date.now();
    try {
      await test.fn();
      results.push({
        name: test.name,
        passed: true,
        durationMs: Date.now() - start,
      });
      console.log(`✅ [PASS] ${test.name} (${Date.now() - start}ms)\n`);
    } catch (err: any) {
      results.push({
        name: test.name,
        passed: false,
        durationMs: Date.now() - start,
        error: err.message,
      });
      console.error(`❌ [FAIL] ${test.name}: ${err.message}\n`);
    }
  }

  console.log("================================================================================");
  console.log("📊 CINEBOOK QA TEST SUMMARY REPORT");
  console.log("================================================================================");

  let passedCount = 0;
  for (const r of results) {
    const status = r.passed ? "✓ PASS" : "✗ FAIL";
    const time = `${r.durationMs}ms`;
    console.log(`${status.padEnd(8)} | ${r.name.padEnd(58)} | ${time}`);
    if (r.passed) passedCount++;
  }

  console.log("--------------------------------------------------------------------------------");
  console.log(`Total Tests: ${results.length} | Passed: ${passedCount} | Failed: ${results.length - passedCount}`);
  console.log("================================================================================\n");

  if (passedCount !== results.length) {
    process.exit(1);
  }
}

runQASuite().catch((err) => {
  console.error("QA suite crash:", err);
  process.exit(1);
});
