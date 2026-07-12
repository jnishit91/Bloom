import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { CommunityFeed } from "@/components/community/community-feed";

export const metadata: Metadata = {
  title: "Community — Bloom",
  description: "Connect with fellow Bloom members through shared reflections.",
};

export default async function CommunityPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get public reflections
  const { data: reflections } = await supabase
    .from("reflections")
    .select("id, user_id, lesson_id, prompt, response_text, created_at")
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(50);

  let feed: {
    id: string;
    text: string;
    isOwn: boolean;
    authorName: string;
    authorAvatar: string | null;
    lessonTitle: string;
    createdAt: string;
  }[] = [];

  if (reflections && reflections.length > 0) {
    const userIds = [...new Set(reflections.map((r) => r.user_id))];
    const lessonIds = [...new Set(reflections.map((r) => r.lesson_id))];

    const [{ data: profiles }, { data: lessons }] = await Promise.all([
      supabase.from("profiles").select("id, full_name, avatar_url").in("id", userIds),
      supabase.from("lessons").select("id, title").in("id", lessonIds),
    ]);

    const profileMap = new Map((profiles || []).map((p) => [p.id, p]));
    const lessonMap = new Map((lessons || []).map((l) => [l.id, l.title]));

    feed = reflections.map((r) => {
      const profile = profileMap.get(r.user_id);
      return {
        id: r.id,
        text: r.response_text,
        isOwn: r.user_id === user?.id,
        authorName: profile?.full_name || "Bloom Member",
        authorAvatar: profile?.avatar_url || null,
        lessonTitle: lessonMap.get(r.lesson_id) || "Lesson",
        createdAt: r.created_at,
      };
    });
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="space-y-2 mb-8">
        <h1 className="font-display text-3xl text-botanical tracking-tight">
          Community
        </h1>
        <p className="text-muted-foreground text-lg">
          Reflections and insights shared by fellow learners.
        </p>
      </div>

      <CommunityFeed reflections={feed} />
    </div>
  );
}
