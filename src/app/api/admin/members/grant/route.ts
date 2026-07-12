import { NextResponse, type NextRequest } from "next/server";
import { withAdmin } from "@/lib/admin-api";

export async function POST(request: NextRequest) {
  return withAdmin(async (supabase) => {
    const { userId, courseId, note } = await request.json();

    if (!userId || !courseId) {
      return NextResponse.json(
        { error: "userId and courseId required" },
        { status: 400 }
      );
    }

    // Check if active/manual enrollment already exists
    const { data: existing } = await supabase
      .from("enrollments")
      .select("id, status")
      .eq("user_id", userId)
      .eq("course_id", courseId)
      .in("status", ["active", "manual"])
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "User already enrolled" },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("enrollments").insert({
      user_id: userId,
      course_id: courseId,
      status: "manual",
      note: note || "Manual grant via admin",
      amount_paid: 0,
      base_amount: 0,
      gst_amount: 0,
      enrolled_at: new Date().toISOString(),
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  });
}
