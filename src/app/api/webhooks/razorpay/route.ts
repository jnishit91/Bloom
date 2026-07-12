import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyWebhookSignature } from "@/lib/razorpay";

// Use service role client — webhook has no user session
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature") || "";

  // Verify signature
  if (!verifyWebhookSignature(rawBody, signature)) {
    console.error("Webhook signature verification failed");
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 },
    );
  }

  let payload: {
    event: string;
    payload: {
      payment: {
        entity: {
          id: string;
          order_id: string;
          status: string;
          amount: number;
        };
      };
    };
  };

  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const event = payload.event;
  const payment = payload.payload.payment.entity;
  const orderId = payment.order_id;
  const paymentId = payment.id;

  const supabase = getServiceClient();

  if (event === "payment.captured") {
    // Find pending enrollment by order ID
    const { data: enrollment, error: findError } = await supabase
      .from("enrollments")
      .select("id, status")
      .eq("razorpay_order_id", orderId)
      .eq("status", "pending")
      .single();

    if (findError || !enrollment) {
      console.error("No pending enrollment found for order:", orderId);
      // Return 200 to prevent Razorpay from retrying
      return NextResponse.json({ status: "no_pending_enrollment" });
    }

    const { error: updateError } = await supabase
      .from("enrollments")
      .update({
        status: "active",
        razorpay_payment_id: paymentId,
        enrolled_at: new Date().toISOString(),
      })
      .eq("id", enrollment.id);

    if (updateError) {
      console.error("Failed to activate enrollment:", updateError);
      return NextResponse.json(
        { error: "Database update failed" },
        { status: 500 },
      );
    }

    console.log(`✅ Enrollment ${enrollment.id} activated for order ${orderId}`);
    return NextResponse.json({ status: "activated" });
  }

  if (event === "payment.failed") {
    const { data: enrollment } = await supabase
      .from("enrollments")
      .select("id")
      .eq("razorpay_order_id", orderId)
      .eq("status", "pending")
      .single();

    if (enrollment) {
      await supabase
        .from("enrollments")
        .update({
          status: "failed",
          razorpay_payment_id: paymentId,
        })
        .eq("id", enrollment.id);

      console.log(`❌ Enrollment ${enrollment.id} failed for order ${orderId}`);
    }

    return NextResponse.json({ status: "marked_failed" });
  }

  // Unhandled event — acknowledge to prevent retries
  return NextResponse.json({ status: "ignored", event });
}
