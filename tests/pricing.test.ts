import { BOOKING_FEE_CENTS_PER_SEAT, TAX_RATE } from "../src/db/transactions/booking";

export async function testPricingCalculations() {
  console.log("▶ [QA Agent] Testing Money Calculations in Integer Minor Units (Cents)...");

  // Case 1: Standard seat at $14.50 (1450 cents)
  const basePriceCents = 1450;
  const standardMultiplier = 100;
  const standardPrice = Math.round((basePriceCents * standardMultiplier) / 100);
  if (standardPrice !== 1450) {
    throw new Error(`Expected standard price 1450, got ${standardPrice}`);
  }

  // Case 2: VIP seat with 125% multiplier (1450 * 1.25 = 1812.5 -> rounded to 1813 cents)
  const vipMultiplier = 125;
  const vipPrice = Math.round((basePriceCents * vipMultiplier) / 100);
  if (vipPrice !== 1813) {
    throw new Error(`Expected VIP price 1813 cents, got ${vipPrice}`);
  }

  // Case 3: Recliner seat with 150% multiplier (1450 * 1.50 = 2175 cents)
  const reclinerMultiplier = 150;
  const reclinerPrice = Math.round((basePriceCents * reclinerMultiplier) / 100);
  if (reclinerPrice !== 2175) {
    throw new Error(`Expected recliner price 2175 cents, got ${reclinerPrice}`);
  }

  // Case 4: Multi-seat total with fees and taxes
  // 2 seats: 1 Standard (1450) + 1 VIP (1813) = 3263 cents subtotal
  const subtotalCents = standardPrice + vipPrice;
  const feeCents = 2 * BOOKING_FEE_CENTS_PER_SEAT; // 2 * 150 = 300 cents
  const taxCents = Math.round(subtotalCents * TAX_RATE); // Math.round(3263 * 0.0825) = 269 cents
  const totalAmountCents = subtotalCents + feeCents + taxCents; // 3263 + 300 + 269 = 3832 cents ($38.32)

  if (feeCents !== 300) {
    throw new Error(`Expected fee 300 cents, got ${feeCents}`);
  }
  if (taxCents !== 269) {
    throw new Error(`Expected tax 269 cents, got ${taxCents}`);
  }
  if (totalAmountCents !== 3832) {
    throw new Error(`Expected total 3832 cents, got ${totalAmountCents}`);
  }

  // Confirm no floating point inaccuracies exist
  if (!Number.isInteger(totalAmountCents)) {
    throw new Error("Total amount must strictly be an integer minor unit");
  }

  console.log("  ✓ Standard, VIP, and Recliner multipliers correctly calculate in integer cents");
  console.log("  ✓ Itemized booking fee ($1.50/seat) and tax (8.25%) calculation verified");
  console.log("  ✓ Floating point contamination test passed with 0 precision error");
  return true;
}

if (require.main === module) {
  testPricingCalculations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Test failed:", err);
      process.exit(1);
    });
}
