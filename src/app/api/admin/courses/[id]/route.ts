import { NextResponse, type NextRequest } from "next/server";
import { withAdmin } from "@/lib/admin-api";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return withAdmin(async (supabase) => {
    const body = await request.json();

    const updateData: Record<string, unknown> = {};
    const allowedFields = [
      "title",
      "subtitle",
      "description",
      "instructor_name",
      "instructor_bio",
      "instructor_photo_url",
      "cover_image_url",
      "trailer_video_url",
      "price_inr",
      "outcomes",
      "total_weeks",
      "category",
    ];

    for (const field of allowedFields) {
      if (field in body) updateData[field] = body[field];
    }

    if (body.slug) {
      updateData.slug = body.slug;
    }

    const { error } = await supabase
      .from("courses")
      .update(updateData)
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return withAdmin(async (supabase) => {
    const { error } = await supabase.from("courses").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  });
}
