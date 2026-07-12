/**
 * Bloom — Simulate Razorpay Webhook (dev only)
 *
 * Usage:
 *   npm run simulate:webhook -- <order_id> [captured|failed]
 *
 * Examples:
 *   npm run simulate:webhook -- order_PqR1234567890 captured
 *   npm run simulate:webhook -- order_PqR1234567890 failed
 *
 * The script posts a correctly signed webhook payload to the local
 * /api/webhooks/razorpay route, simulating what Razorpay would send.
 */

import { createHmac } from "crypto";
import "dotenv/config";

const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || "";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

if (!WEBHOOK_SECRET) {
  console.error("❌ RAZORPAY_WEBHOOK_SECRET not set in .env");
  process.exit(1);
}

const args = process.argv.slice(2);
const orderId = args[0];
const eventType = args[1] || "captured";

if (!orderId) {
  console.error("Usage: npm run simulate:webhook -- <order_id> [captured|failed]");
  console.error("  <order_id>  The razorpay_order_id from the enrollments table");
  console.error("  [event]     'captured' (default) or 'failed'");
  process.exit(1);
}

if (!["captured", "failed"].includes(eventType)) {
  console.error("❌ Event type must be 'captured' or 'failed'");
  process.exit(1);
}

const paymentId = `pay_sim_${Date.now()}`;

const payload = {
  event: `payment.${eventType}`,
  payload: {
    payment: {
      entity: {
        id: paymentId,
        order_id: orderId,
        status: eventType === "captured" ? "captured" : "failed",
        amount: 500000, // ₹5,000 in paise
        currency: "INR",
        method: "upi",
      },
    },
  },
};

const rawBody = JSON.stringify(payload);
const signature = createHmac("sha256", WEBHOOK_SECRET)
  .update(rawBody)
  .digest("hex");

async function main() {
  console.log(`\n🔔 Simulating webhook: payment.${eventType}`);
  console.log(`   Order ID: ${orderId}`);
  console.log(`   Payment ID: ${paymentId}`);
  console.log(`   Target: ${APP_URL}/api/webhooks/razorpay`);
  console.log();

  const res = await fetch(`${APP_URL}/api/webhooks/razorpay`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-razorpay-signature": signature,
    },
    body: rawBody,
  });

  const data = await res.json();

  if (res.ok) {
    console.log(`✅ Webhook accepted (${res.status}):`, data);
  } else {
    console.error(`❌ Webhook rejected (${res.status}):`, data);
  }

  // Also test with a tampered signature
  console.log("\n🔒 Testing tampered signature (should be rejected)...");
  const tamperedRes = await fetch(`${APP_URL}/api/webhooks/razorpay`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-razorpay-signature": "tampered_invalid_signature_12345",
    },
    body: rawBody,
  });

  const tamperedData = await tamperedRes.json();
  if (tamperedRes.status === 400) {
    console.log(`✅ Tampered payload correctly rejected (${tamperedRes.status}):`, tamperedData);
  } else {
    console.error(`❌ Tampered payload was NOT rejected (${tamperedRes.status}):`, tamperedData);
  }
}

main().catch(console.error);
