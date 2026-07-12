import { createHmac } from "crypto";

// ── GST Config ──
// ₹5,000 is GST-inclusive at 18%
const GST_RATE = 18;

/**
 * Compute GST breakup from an inclusive price.
 * base_amount + gst_amount = total (all in whole rupees)
 */
export function computeGst(totalInr: number) {
  const baseAmount = Math.round((totalInr * 100) / (100 + GST_RATE));
  const gstAmount = totalInr - baseAmount;
  return { baseAmount, gstAmount, gstRate: GST_RATE };
}

// ── Razorpay Order Creation ──

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "";
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "";

interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  status: string;
  receipt: string;
}

export async function createRazorpayOrder(
  amountInr: number,
  receipt: string,
  notes: Record<string, string> = {},
): Promise<RazorpayOrder> {
  const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString("base64");

  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${auth}`,
    },
    body: JSON.stringify({
      amount: amountInr * 100, // Razorpay expects paise
      currency: "INR",
      receipt,
      notes,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    throw new Error(`Razorpay order creation failed (${res.status}): ${text}`);
  }

  return res.json();
}

// ── Webhook Signature Verification ──

/**
 * Verify Razorpay webhook signature.
 * For payment events, the body is the raw JSON string
 * and the signature is in the X-Razorpay-Signature header.
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string = process.env.RAZORPAY_WEBHOOK_SECRET || "",
): boolean {
  if (!secret || !signature) return false;

  const expected = createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  // Timing-safe comparison
  if (expected.length !== signature.length) return false;

  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return mismatch === 0;
}

/**
 * Verify payment signature from Razorpay Checkout callback.
 * signature = HMAC_SHA256(order_id + "|" + payment_id, key_secret)
 */
export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string,
): boolean {
  if (!RAZORPAY_KEY_SECRET || !signature) return false;

  const expected = createHmac("sha256", RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  if (expected.length !== signature.length) return false;

  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return mismatch === 0;
}

export { RAZORPAY_KEY_ID };
