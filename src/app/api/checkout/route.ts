import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createRazorpayOrder, computeGst, RAZORPAY_KEY_ID } from "@/lib/razorpay";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { courseId } = await req.json();
  if (!courseId) {
    return NextResponse.json({ error: "courseId required" }, { status: 400 });
  }

  // Get course
  const { data: course } = await supabase
    .from("courses")
    .select("id, title, slug, price_inr, status")
    .eq("id", courseId)
    .single();

  if (!course || course.status !== "published") {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  // Check if already enrolled
  const { count } = await supabase
    .from("enrollments")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("course_id", courseId)
    .in("status", ["active", "manual"]);

  if ((count || 0) > 0) {
    return NextResponse.json({ error: "Already enrolled" }, { status: 409 });
  }

  try {
    // Create Razorpay order
    const order = await createRazorpayOrder(course.price_inr, `bloom_${courseId}_${Date.now()}`, {
      course_id: courseId,
      course_title: course.title,
      user_id: user.id,
    });

    // Compute GST breakup
    const { baseAmount, gstAmount, gstRate } = computeGst(course.price_inr);

    // Create pending enrollment
    const { data: enrollment, error } = await supabase
      .from("enrollments")
      .insert({
        user_id: user.id,
        course_id: courseId,
        razorpay_order_id: order.id,
        amount_paid: course.price_inr,
        base_amount: baseAmount,
        gst_rate: gstRate,
        gst_amount: gstAmount,
        status: "pending",
      })
      .select("id")
      .single();

    if (error) {
      console.error("Enrollment creation error:", error);
      return NextResponse.json(
        { error: "Failed to create enrollment" },
        { status: 500 },
      );
    }

    // Get user profile for prefill
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", user.id)
      .single();

    return NextResponse.json({
      orderId: order.id,
      enrollmentId: enrollment.id,
      amount: course.price_inr * 100, // paise for Razorpay
      currency: "INR",
      keyId: RAZORPAY_KEY_ID,
      courseTitle: course.title,
      courseSlug: course.slug,
      prefill: {
        name: profile?.full_name || "",
        email: user.email || "",
        contact: profile?.phone || "",
      },
    });
  } catch (err) {
    console.error("Checkout error:", err);
    const message = err instanceof Error ? err.message : "Checkout failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
