import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const enrollmentId = req.nextUrl.searchParams.get("enrollmentId");
  if (!enrollmentId) {
    return NextResponse.json({ error: "enrollmentId required" }, { status: 400 });
  }

  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id, status, course_id, amount_paid, base_amount, gst_amount, gst_rate, razorpay_order_id, razorpay_payment_id, created_at, enrolled_at")
    .eq("id", enrollmentId)
    .eq("user_id", user.id)
    .single();

  if (!enrollment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Get course details for the confirmation
  const { data: course } = await supabase
    .from("courses")
    .select("id, slug, title")
    .eq("id", enrollment.course_id)
    .single();

  // Get first lesson ID for redirect
  let firstLessonId: string | null = null;
  if (enrollment.status === "active" && course) {
    const { data: modules } = await supabase
      .from("modules")
      .select("id")
      .eq("course_id", course.id)
      .order("sort_order")
      .limit(1);

    if (modules && modules[0]) {
      const { data: lessons } = await supabase
        .from("lessons")
        .select("id")
        .eq("module_id", modules[0].id)
        .order("sort_order")
        .limit(1);

      if (lessons && lessons[0]) {
        firstLessonId = lessons[0].id;
      }
    }
  }

  return NextResponse.json({
    status: enrollment.status,
    courseSlug: course?.slug,
    courseTitle: course?.title,
    firstLessonId,
    receipt: {
      orderId: enrollment.razorpay_order_id,
      paymentId: enrollment.razorpay_payment_id,
      amount: enrollment.amount_paid,
      baseAmount: enrollment.base_amount,
      gstAmount: enrollment.gst_amount,
      gstRate: enrollment.gst_rate,
      date: enrollment.enrolled_at || enrollment.created_at,
    },
  });
}
