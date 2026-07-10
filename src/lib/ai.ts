// ── AI client for OpenAI-compatible endpoints (Ollama, vLLM, etc.) ──

const BASE_URL = process.env.AI_BASE_URL || "http://localhost:11434/v1";
const API_KEY = process.env.AI_API_KEY || "";
const MODEL = process.env.AI_MODEL || "qwen2.5:14b-instruct";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface StreamOptions {
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
  signal?: AbortSignal;
}

/**
 * Streams a chat completion from an OpenAI-compatible endpoint.
 * Returns a ReadableStream of SSE data chunks.
 */
export async function streamChat({
  messages,
  maxTokens = 1500,
  temperature = 0.7,
  signal,
}: StreamOptions): Promise<ReadableStream<Uint8Array>> {
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {}),
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      max_tokens: maxTokens,
      temperature,
      stream: true,
    }),
    signal,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    throw new Error(`AI request failed (${res.status}): ${text}`);
  }

  if (!res.body) {
    throw new Error("No response body from AI endpoint");
  }

  return res.body;
}

/**
 * Non-streaming chat completion — used for quiz JSON generation.
 */
export async function chatCompletion({
  messages,
  maxTokens = 1500,
  temperature = 0.7,
}: Omit<StreamOptions, "signal">): Promise<string> {
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {}),
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      max_tokens: maxTokens,
      temperature,
      stream: false,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    throw new Error(`AI request failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

// ── Transcript truncation ──

const MAX_TRANSCRIPT_TOKENS = 6000;
const AVG_CHARS_PER_TOKEN = 4;

/**
 * Truncates transcript to ~6K tokens using middle-cut strategy:
 * keeps the first third and last third, replaces middle with "[...]".
 */
export function truncateTranscript(transcript: string | null): string {
  if (!transcript) return "";

  const maxChars = MAX_TRANSCRIPT_TOKENS * AVG_CHARS_PER_TOKEN;
  if (transcript.length <= maxChars) return transcript;

  const keepChars = Math.floor(maxChars / 2);
  const start = transcript.slice(0, keepChars);
  const end = transcript.slice(-keepChars);
  return `${start}\n\n[... middle portion truncated for brevity ...]\n\n${end}`;
}

// ── JSON repair for quiz generation ──

/**
 * Attempts to extract and parse a JSON array from model output.
 * Handles markdown fences, trailing commas, and truncated output.
 */
export function repairQuizJson(raw: string): unknown[] | null {
  // Strip markdown code fences
  let cleaned = raw.replace(/```(?:json)?\s*/gi, "").replace(/```/g, "").trim();

  // Try to find a JSON array
  const arrayStart = cleaned.indexOf("[");
  if (arrayStart === -1) return null;

  let arrayEnd = cleaned.lastIndexOf("]");

  // If no closing bracket, try to close it
  if (arrayEnd === -1 || arrayEnd <= arrayStart) {
    cleaned = cleaned.slice(arrayStart);
    // Remove any trailing incomplete object
    const lastComplete = cleaned.lastIndexOf("}");
    if (lastComplete === -1) return null;
    cleaned = cleaned.slice(0, lastComplete + 1) + "]";
  } else {
    cleaned = cleaned.slice(arrayStart, arrayEnd + 1);
  }

  // Remove trailing commas before ] or }
  cleaned = cleaned.replace(/,\s*([}\]])/g, "$1");

  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed;
    return null;
  } catch {
    return null;
  }
}

// ── System prompts ──

export function buildLessonSystemPrompt(
  lessonTitle: string,
  moduleTitle: string,
  courseTitle: string,
  transcript: string | null,
  description: string | null,
): string {
  const context = truncateTranscript(transcript) || description || "No content available.";

  return `You are Bloom AI, a warm and knowledgeable learning assistant for the "${courseTitle}" course on Bloom, a relationship-transformation platform.

Current lesson: "${lessonTitle}" (Module: "${moduleTitle}")

Lesson content:
${context}

Guidelines:
- Be warm, encouraging, and concise
- Ground all answers in the lesson content above
- Use simple, clear language accessible to Indian English speakers
- If asked something outside the lesson scope, acknowledge it and gently redirect to the lesson material
- Never make up facts not present in the lesson content`;
}

export function buildSummarizePrompt(): string {
  return `Summarize this lesson in a structured format. Respond with EXACTLY this structure (use the headings as shown):

## Key Ideas
- (3-5 bullet points capturing the main concepts)

## Action Step
(One concrete thing the learner can do today to apply this lesson)

## Reflection Question
(One thought-provoking question for journaling or discussion)

Keep the total response under 300 words. Be specific to the lesson content.`;
}

export function buildQuizPrompt(): string {
  return `Generate exactly 5 multiple-choice questions based on this lesson's content.

Respond with ONLY a JSON array, no other text. Each object must have exactly these fields:
[
  {
    "question": "The question text",
    "options": ["A) First option", "B) Second option", "C) Third option", "D) Fourth option"],
    "correct": 0,
    "explanation": "Brief explanation of why this answer is correct"
  }
]

Rules:
- "correct" is the 0-based index of the correct option (0-3)
- Questions should test understanding, not just recall
- All 4 options should be plausible
- Keep questions and explanations concise`;
}

export function buildGlobalSystemPrompt(enrolledCourses: string[]): string {
  const courseList = enrolledCourses.length > 0
    ? `The user is enrolled in: ${enrolledCourses.join(", ")}.`
    : "The user hasn't enrolled in any courses yet.";

  return `You are Bloom AI, a warm and supportive learning companion on Bloom, a relationship-transformation platform based in India.

${courseList}

You help users with:
- Questions about their courses and learning journey
- Relationship growth insights and encouragement
- Navigating the Bloom platform

Guidelines:
- Be warm, encouraging, and concise
- Use simple, clear language
- You don't have access to specific lesson content in this mode — suggest the user ask from within a lesson for content-specific questions
- Never give medical, legal, or crisis advice — gently suggest professional help when appropriate`;
}
