import { NextResponse, type NextRequest } from "next/server";
import { withAdmin } from "@/lib/admin-api";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return withAdmin(async (supabase) => {
    const { data: course } = await supabase
      .from("courses")
      .select("status")
      .eq("id", id)
      .single();

    if (!course) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const newStatus = course.status === "published" ? "draft" : "published";

    // Recount lessons before publishing
    const { data: modules } = await supabase
      .from("modules")
      .select("id")
      .eq("course_id", id);
    const moduleIds = (modules || []).map((m) => m.id);

    let lessonCount = 0;
    if (moduleIds.length > 0) {
      const { count } = await supabase
        .from("lessons")
        .select("id", { count: "exact", head: true })
        .in("module_id", moduleIds);
      lessonCount = count || 0;
    }

    const { error } = await supabase
      .from("courses")
      .update({ status: newStatus, total_lessons: lessonCount })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ status: newStatus });
  });
}
