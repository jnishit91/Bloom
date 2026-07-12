import { NextResponse, type NextRequest } from "next/server";
import { withAdmin } from "@/lib/admin-api";

export async function POST(request: NextRequest) {
  return withAdmin(async (supabase) => {
    const body = await request.json();
    const slug = (body.title || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const { data, error } = await supabase
      .from("courses")
      .insert({
        title: body.title || "Untitled Course",
        slug: slug || `course-${Date.now()}`,
        subtitle: body.subtitle || null,
        description: body.description || null,
        instructor_name: body.instructor_name || "Bloom Facilitator",
        instructor_bio: body.instructor_bio || null,
        instructor_photo_url: body.instructor_photo_url || null,
        cover_image_url: body.cover_image_url || null,
        trailer_video_url: body.trailer_video_url || null,
        price_inr: body.price_inr ?? 5000,
        outcomes: body.outcomes || [],
        total_lessons: 0,
        total_weeks: body.total_weeks ?? 0,
        status: "draft",
        category: body.category || null,
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ id: data.id });
  });
}
