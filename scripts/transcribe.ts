/**
 * Transcribe lesson videos using Groq Whisper.
 *
 * Usage: npx tsx scripts/transcribe.ts [lessonId]
 *   - No args: transcribes all lessons that have a video_url but a short/placeholder transcript
 *   - With lessonId: transcribes that specific lesson
 *
 * Requires: ffmpeg, GROQ API key in .env (AI_API_KEY + AI_BASE_URL)
 */

import { createClient } from "@supabase/supabase-js";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import "dotenv/config";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const GROQ_KEY = process.env.AI_API_KEY!;

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
const TMP_DIR = path.join(__dirname, "..", ".transcribe-tmp");

const CHUNK_DURATION_SECS = 600; // 10 min chunks — keeps under Groq's 25MB limit
const WHISPER_MODEL = "whisper-large-v3-turbo";

async function main() {
  const targetId = process.argv[2];

  let query = supabase
    .from("lessons")
    .select("id, title, video_url, transcript")
    .not("video_url", "is", null)
    .neq("video_url", "");

  if (targetId) {
    query = query.eq("id", targetId);
  }

  const { data: lessons, error } = await query;
  if (error) {
    console.error("Failed to fetch lessons:", error.message);
    process.exit(1);
  }

  const toTranscribe = (lessons || []).filter((l) => {
    if (targetId) return true;
    // Skip if already has a substantial transcript (>2000 chars likely real)
    return !l.transcript || l.transcript.length < 2000;
  });

  if (toTranscribe.length === 0) {
    console.log("No lessons need transcription.");
    return;
  }

  console.log(`\nFound ${toTranscribe.length} lesson(s) to transcribe.\n`);

  if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

  for (const lesson of toTranscribe) {
    console.log(`\n━━━ ${lesson.title} ━━━`);

    const videoPath = resolveVideoPath(lesson.video_url);
    if (!videoPath) {
      console.log(`  ⚠ Could not resolve video path: ${lesson.video_url}`);
      continue;
    }

    if (!fs.existsSync(videoPath)) {
      console.log(`  ⚠ Video file not found: ${videoPath}`);
      continue;
    }

    try {
      const transcript = await transcribeVideo(videoPath, lesson.title, lesson.id);
      console.log(
        `  ✓ Final transcript: ${transcript.length} chars for lesson ${lesson.id}`
      );
    } catch (err) {
      console.error(
        `  ✗ Transcription failed:`,
        err instanceof Error ? err.message : err
      );
    }
  }

  // Cleanup
  fs.rmSync(TMP_DIR, { recursive: true, force: true });
  console.log("\nDone.");
}

function resolveVideoPath(url: string): string | null {
  if (url.startsWith("/")) {
    return path.join(__dirname, "..", "public", url);
  }
  if (url.startsWith("http")) {
    // Remote URL — not supported in this script
    return null;
  }
  return path.join(__dirname, "..", url);
}

async function transcribeVideo(
  videoPath: string,
  title: string,
  lessonId: string
): Promise<string> {
  // Get video duration
  const durationStr = execSync(
    `ffprobe -v error -show_entries format=duration -of csv=p=0 "${videoPath}"`,
    { encoding: "utf-8" }
  ).trim();
  const duration = parseFloat(durationStr);
  console.log(`  Duration: ${Math.round(duration / 60)} minutes`);

  const numChunks = Math.ceil(duration / CHUNK_DURATION_SECS);
  console.log(
    `  Splitting into ${numChunks} chunk(s) of ${CHUNK_DURATION_SECS / 60} min`
  );

  const transcriptParts: string[] = [];

  for (let i = 0; i < numChunks; i++) {
    const startSecs = i * CHUNK_DURATION_SECS;
    const chunkFile = path.join(TMP_DIR, `chunk-${i}.mp3`);

    // Extract audio chunk as mp3
    console.log(
      `  Extracting chunk ${i + 1}/${numChunks} (${formatTime(startSecs)})...`
    );
    execSync(
      `ffmpeg -y -i "${videoPath}" -ss ${startSecs} -t ${CHUNK_DURATION_SECS} -vn -acodec libmp3lame -ab 64k -ar 16000 -ac 1 "${chunkFile}" 2>/dev/null`
    );

    const fileSizeMB = fs.statSync(chunkFile).size / (1024 * 1024);
    console.log(`  Chunk ${i + 1}: ${fileSizeMB.toFixed(1)} MB`);

    if (fileSizeMB > 25) {
      console.log(`  ⚠ Chunk too large (${fileSizeMB.toFixed(1)} MB), skipping`);
      continue;
    }

    // Send to Groq Whisper
    console.log(`  Transcribing chunk ${i + 1}/${numChunks}...`);
    const text = await whisperTranscribe(chunkFile, title);
    transcriptParts.push(text);

    // Save progress after each chunk
    const partialTranscript = transcriptParts.join("\n\n");
    await supabase
      .from("lessons")
      .update({ transcript: partialTranscript })
      .eq("id", lessonId);
    console.log(`  ✓ Saved progress (${partialTranscript.length} chars so far)`);

    // Cleanup chunk
    fs.unlinkSync(chunkFile);
  }

  return transcriptParts.join("\n\n");
}

async function whisperTranscribe(
  audioPath: string,
  prompt: string
): Promise<string> {
  const MAX_RETRIES = 5;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const formData = new FormData();
    const audioBuffer = fs.readFileSync(audioPath);
    const blob = new Blob([audioBuffer], { type: "audio/mpeg" });
    formData.append("file", blob, path.basename(audioPath));
    formData.append("model", WHISPER_MODEL);
    formData.append("language", "en");
    formData.append("response_format", "text");
    formData.append("prompt", prompt);

    const res = await fetch(
      "https://api.groq.com/openai/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GROQ_KEY}`,
        },
        body: formData,
      }
    );

    if (res.ok) {
      return (await res.text()).trim();
    }

    const errText = await res.text();

    if (res.status === 429) {
      // Parse wait time from error message
      const waitMatch = errText.match(/try again in (\d+)m([\d.]+)s/i);
      let waitSecs = 240; // default 4 min
      if (waitMatch) {
        waitSecs = parseInt(waitMatch[1]!) * 60 + parseFloat(waitMatch[2]!) + 5;
      }
      console.log(`  ⏳ Rate limited — waiting ${Math.round(waitSecs)}s before retry...`);
      await sleep(waitSecs * 1000);
      continue;
    }

    throw new Error(`Whisper API error (${res.status}): ${errText}`);
  }

  throw new Error("Max retries exceeded for Whisper API");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

main().catch(console.error);
