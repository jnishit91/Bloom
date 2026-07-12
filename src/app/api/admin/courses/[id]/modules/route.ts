import { NextResponse, type NextRequest } from "next/server";
import { withAdmin } from "@/lib/admin-api";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return withAdmin(async (supabase) => {
    const body = await request.json();

    // Get next sort_order
    const { data: existing } = await supabase
      .from("modules")
      .select("sort_order")
      .eq("course_id", id)
      .order("sort_order", { ascending: false })
      .limit(1);

    const nextOrder = existing && existing.length > 0 ? (existing[0]?.sort_order ?? 0) + 1 : 0;

    const { data, error } = await supabase
      .from("modules")
      .insert({
        course_id: id,
        title: body.title || "New Module",
        sort_order: nextOrder,
      })
      .select("id, title, sort_order")
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

    if (body.reorder && Array.isArray(body.reorder)) {
      for (let i = 0; i < body.reorder.length; i++) {
        await supabase
          .from("modules")
          .update({ sort_order: i })
          .eq("id", body.reorder[i]);
      }
      return NextResponse.json({ ok: true });
    }

    if (body.id && body.title) {
      const { error } = await supabase
        .from("modules")
        .update({ title: body.title })
        .eq("id", body.id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json({ ok: true });
  });
}

export async function DELETE(request: NextRequest) {
  return withAdmin(async (supabase) => {
    const { moduleId } = await request.json();

    const { error } = await supabase
      .from("modules")
      .delete()
      .eq("id", moduleId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  });
}
