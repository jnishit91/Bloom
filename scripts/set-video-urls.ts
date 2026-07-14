/**
 * Update the first two lessons with local video URLs.
 *
 * Usage: npx tsx scripts/set-video-urls.ts
 */

import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function main() {
  console.log("🎥 Setting video URLs on first two lessons...\n");

  const { data: course } = await supabase
    .from("courses")
    .select("id")
    .eq("slug", "the-art-of-conscious-love")
    .single();

  if (!course) {
    console.error("❌ Course not found. Run `npm run setup` first.");
    process.exit(1);
  }

  const { data: modules } = await supabase
    .from("modules")
    .select("id")
    .eq("course_id", course.id)
    .order("sort_order")
    .limit(1);

  if (!modules?.length) {
    console.error("❌ No modules found.");
    process.exit(1);
  }

  const { data: lessons } = await supabase
    .from("lessons")
    .select("id, title")
    .eq("module_id", modules[0]!.id)
    .order("sort_order")
    .limit(2);

  if (!lessons?.length) {
    console.error("❌ No lessons found.");
    process.exit(1);
  }

  const urls = ["/videos/lesson-1.mp4", "/videos/lesson-2.mp4"];

  for (let i = 0; i < Math.min(lessons.length, urls.length); i++) {
    const { error } = await supabase
      .from("lessons")
      .update({ video_url: urls[i] })
      .eq("id", lessons[i]!.id);

    if (error) {
      console.error(`❌ "${lessons[i]!.title}": ${error.message}`);
    } else {
      console.log(`✅ "${lessons[i]!.title}" → ${urls[i]}`);
    }
  }

  console.log("\nDone!");
}

main().catch(console.error);
