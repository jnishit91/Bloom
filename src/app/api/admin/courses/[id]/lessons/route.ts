import { NextResponse, type NextRequest } from "next/server";
import { withAdmin } from "@/lib/admin-api";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: _courseId } = await params;
  return withAdmin(async (supabase) => {
    const body = await request.json();

    // Get next sort_order within the module
    const { data: existing } = await supabase
      .from("lessons")
      .select("sort_order")
      .eq("module_id", body.module_id)
      .order("sort_order", { ascending: false })
      .limit(1);

    const nextOrder = existing && existing.length > 0 ? (existing[0]?.sort_order ?? 0) + 1 : 0;

    const { data, error } = await supabase
      .from("lessons")
      .insert({
        module_id: body.module_id,
        title: body.title || "New Lesson",
        description: body.description || null,
        video_url: body.video_url || null,
        duration_minutes: body.duration_minutes ?? 0,
        transcript: body.transcript || null,
        sort_order: nextOrder,
        is_free_preview: body.is_free_preview ?? false,
      })
      .select("id, title, sort_order, module_id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: _courseId } = await params;
  return withAdmin(async (supabase) => {
    const body = await request.json();

    if (!body.lessonId) {
      return NextResponse.json(
        { error: "lessonId required" },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    const fields = [
      "title",
      "description",
      "video_url",
      "duration_minutes",
      "transcript",
      "is_free_preview",
      "sort_order",
      "module_id",
    ];

    for (const f of fields) {
      if (f in body) updateData[f] = body[f];
    }

    const { error } = await supabase
      .from("lessons")
      .update(updateData)
      .eq("id", body.lessonId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Handle tasks update
    if (body.tasks && Array.isArray(body.tasks)) {
      // Delete existing tasks and re-insert
      await supabase
        .from("lesson_tasks")
        .delete()
        .eq("lesson_id", body.lessonId);

      if (body.tasks.length > 0) {
        await supabase.from("lesson_tasks").insert(
          body.tasks.map((t: string, i: number) => ({
            lesson_id: body.lessonId,
            task_text: t,
            sort_order: i,
          }))
        );
      }
    }

    // Handle resources update
    if (body.resources && Array.isArray(body.resources)) {
      await supabase
        .from("lesson_resources")
        .delete()
        .eq("lesson_id", body.lessonId);

      if (body.resources.length > 0) {
        await supabase.from("lesson_resources").insert(
          body.resources.map(
            (r: { title: string; type: string; file_url: string }) => ({
              lesson_id: body.lessonId,
              title: r.title,
              type: r.type || "workbook",
              file_url: r.file_url || null,
            })
          )
        );
      }
    }

    return NextResponse.json({ ok: true });
  });
}

export async function DELETE(request: NextRequest) {
  return withAdmin(async (supabase) => {
    const { lessonId } = await request.json();

    const { error } = await supabase
      .from("lessons")
      .delete()
      .eq("id", lessonId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  });
}
