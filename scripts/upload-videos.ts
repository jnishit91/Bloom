/**
 * Upload test videos to Supabase Storage using TUS resumable uploads,
 * then update lesson video URLs.
 *
 * Usage: npx tsx scripts/upload-videos.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import * as tus from "tus-js-client";
import "dotenv/config";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("❌ Missing SUPABASE_URL or SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const BUCKET = "videos";
const PROJECT_REF = SUPABASE_URL.replace("https://", "").replace(".supabase.co", "");

const VIDEOS = [
  {
    localPath: "/Users/apple/Desktop/Nishit Personal/123aa184-0e4b-4ae6-9147-acdfcd45444a.MP4",
    storagePath: "lessons/lesson-1.mp4",
  },
  {
    localPath: "/Users/apple/Desktop/Nishit Personal/GMT20251209-153949_Recording_640x360.mp4",
    storagePath: "lessons/lesson-2.mp4",
  },
];

async function ensureBucket() {
  console.log("📦 Ensuring storage bucket exists...");

  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some((b) => b.name === BUCKET);

  if (!exists) {
    const { error } = await supabase.storage.createBucket(BUCKET, {
      public: true,
      allowedMimeTypes: ["video/mp4", "video/quicktime", "video/webm"],
    });
    if (error) {
      console.error(`   ❌ Failed to create bucket: ${error.message}`);
      process.exit(1);
    }
    console.log(`   ✅ Created public bucket "${BUCKET}"`);
  } else {
    console.log(`   ℹ Bucket "${BUCKET}" already exists`);
  }
}

function uploadWithTus(localPath: string, storagePath: string): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const fileName = path.basename(localPath);
    const fileSize = fs.statSync(localPath).size;
    const sizeMB = (fileSize / (1024 * 1024)).toFixed(1);
    console.log(`\n📤 Uploading ${fileName} (${sizeMB} MB) via resumable upload...`);

    const file = fs.createReadStream(localPath);

    const upload = new tus.Upload(file, {
      endpoint: `https://${PROJECT_REF}.supabase.co/storage/v1/upload/resumable`,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      headers: {
        authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        "x-upsert": "true",
      },
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      metadata: {
        bucketName: BUCKET,
        objectName: storagePath,
        contentType: "video/mp4",
      },
      chunkSize: 6 * 1024 * 1024, // 6MB chunks
      uploadSize: fileSize,
      onError(error) {
        console.error(`   ❌ Upload failed: ${error.message}`);
        resolve(null);
      },
      onProgress(bytesUploaded, bytesTotal) {
        const pct = ((bytesUploaded / bytesTotal) * 100).toFixed(1);
        process.stdout.write(`\r   ⏳ ${pct}% (${(bytesUploaded / (1024 * 1024)).toFixed(0)}/${(bytesTotal / (1024 * 1024)).toFixed(0)} MB)`);
      },
      onSuccess() {
        const { data: urlData } = supabase.storage
          .from(BUCKET)
          .getPublicUrl(storagePath);

        console.log(`\n   ✅ Uploaded → ${urlData.publicUrl}`);
        resolve(urlData.publicUrl);
      },
    });

    upload.findPreviousUploads().then((previousUploads) => {
      if (previousUploads.length > 0) {
        upload.resumeFromPreviousUpload(previousUploads[0]!);
      }
      upload.start();
    });
  });
}

async function updateLessonVideos(videoUrls: string[]) {
  console.log("\n🎥 Updating lesson video URLs...");

  const { data: course } = await supabase
    .from("courses")
    .select("id")
    .eq("slug", "the-art-of-conscious-love")
    .single();

  if (!course) {
    console.error("   ❌ Demo course not found. Run `npm run setup` first.");
    return;
  }

  const { data: modules } = await supabase
    .from("modules")
    .select("id")
    .eq("course_id", course.id)
    .order("sort_order")
    .limit(1);

  if (!modules || modules.length === 0) {
    console.error("   ❌ No modules found");
    return;
  }

  const { data: lessons } = await supabase
    .from("lessons")
    .select("id, title")
    .eq("module_id", modules[0]!.id)
    .order("sort_order")
    .limit(2);

  if (!lessons || lessons.length === 0) {
    console.error("   ❌ No lessons found");
    return;
  }

  for (let i = 0; i < Math.min(lessons.length, videoUrls.length); i++) {
    const lesson = lessons[i]!;
    const url = videoUrls[i]!;

    const { error } = await supabase
      .from("lessons")
      .update({ video_url: url })
      .eq("id", lesson.id);

    if (error) {
      console.error(`   ❌ Failed to update "${lesson.title}": ${error.message}`);
    } else {
      console.log(`   ✅ "${lesson.title}" → video attached`);
    }
  }
}

async function main() {
  console.log("🌸 Bloom — Video Upload (Resumable)");
  console.log("═══════════════════════════════════════\n");

  await ensureBucket();

  const urls: string[] = [];
  for (const video of VIDEOS) {
    if (!fs.existsSync(video.localPath)) {
      console.error(`   ❌ File not found: ${video.localPath}`);
      continue;
    }
    const url = await uploadWithTus(video.localPath, video.storagePath);
    if (url) urls.push(url);
  }

  if (urls.length > 0) {
    await updateLessonVideos(urls);
  }

  console.log("\n═══════════════════════════════════════");
  console.log("✅ Video upload complete!\n");
}

main().catch((err) => {
  console.error("❌ Failed:", err);
  process.exit(1);
});
