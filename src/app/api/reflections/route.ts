import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const lessonId = request.nextUrl.searchParams.get("lessonId");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (lessonId) {
    // Get public reflections for a specific lesson
    const { data: reflections } = await supabase
      .from("reflections")
      .select("id, user_id, prompt, response_text, is_public, created_at")
      .eq("lesson_id", lessonId)
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(50);

    if (!reflections || reflections.length === 0) {
      return NextResponse.json({ reflections: [] });
    }

    // Get profile info for authors
    const userIds = [...new Set(reflections.map((r) => r.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", userIds);

    const profileMap = new Map(
      (profiles || []).map((p) => [p.id, p])
    );

    return NextResponse.json({
      reflections: reflections.map((r) => {
        const profile = profileMap.get(r.user_id);
        return {
          id: r.id,
          text: r.response_text,
          isOwn: r.user_id === user.id,
          authorName: profile?.full_name || "Bloom Member",
          authorAvatar: profile?.avatar_url || null,
          createdAt: r.created_at,
        };
      }),
    });
  }

  // Get all public reflections across lessons (for Community page)
  const { data: reflections } = await supabase
    .from("reflections")
    .select("id, user_id, lesson_id, prompt, response_text, created_at")
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(50);

  if (!reflections || reflections.length === 0) {
    return NextResponse.json({ reflections: [] });
  }

  const userIds = [...new Set(reflections.map((r) => r.user_id))];
  const lessonIds = [...new Set(reflections.map((r) => r.lesson_id))];

  const [{ data: profiles }, { data: lessons }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, avatar_url").in("id", userIds),
    supabase.from("lessons").select("id, title").in("id", lessonIds),
  ]);

  const profileMap = new Map((profiles || []).map((p) => [p.id, p]));
  const lessonMap = new Map((lessons || []).map((l) => [l.id, l.title]));

  return NextResponse.json({
    reflections: reflections.map((r) => {
      const profile = profileMap.get(r.user_id);
      return {
        id: r.id,
        text: r.response_text,
        isOwn: r.user_id === user.id,
        authorName: profile?.full_name || "Bloom Member",
        authorAvatar: profile?.avatar_url || null,
        lessonTitle: lessonMap.get(r.lesson_id) || "Lesson",
        createdAt: r.created_at,
      };
    }),
  });
}
