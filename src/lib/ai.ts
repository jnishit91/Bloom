// ── AI client for OpenAI-compatible endpoints (Ollama, vLLM, etc.) ──

const BASE_URL = process.env.AI_BASE_URL || "http://localhost:11434/v1";
const API_KEY = process.env.AI_API_KEY || "";
const MODEL = process.env.AI_MODEL || "qwen2.5:7b-instruct";
const AI_ENABLED = process.env.AI_ENABLED !== "false";

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
export function isAiAvailable(): boolean {
  return AI_ENABLED && BASE_URL.length > 0;
}

export async function streamChat({
  messages,
  maxTokens = 1500,
  temperature = 0.7,
  signal,
}: StreamOptions): Promise<ReadableStream<Uint8Array>> {
  if (!isAiAvailable()) {
    throw new Error("AI is not configured. Set AI_BASE_URL in your environment.");
  }

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

const MAX_TRANSCRIPT_TOKENS = 1500;
const MAX_GLOBAL_PROMPT_CHARS = 24_000;
const MAX_HISTORY_MESSAGES = 10;
const AVG_CHARS_PER_TOKEN = 4;

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

export function trimHistory(messages: ChatMessage[]): ChatMessage[] {
  if (messages.length <= MAX_HISTORY_MESSAGES) return messages;
  return messages.slice(-MAX_HISTORY_MESSAGES);
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

  return `You are Bloom AI, a learning assistant. You answer questions ONLY based on the recording transcript provided below. Nothing else.

RECORDING TRANSCRIPT:
${context}

STRICT RULES:
- You ONLY know what is written in the transcript above. That is your ENTIRE knowledge base.
- Do NOT use the course name, lesson title, or module title to guess or infer anything. Ignore them completely when forming answers.
- Do NOT draw on any general knowledge about relationships, psychology, counselling, or any other topic. You are NOT a relationship expert — you are a transcript assistant.
- If the answer to a question is NOT in the transcript, say: "I couldn't find information about that in this recording. Could you point me to which part you're referring to?"
- Quote or closely paraphrase the exact words from the transcript when answering
- If the user asks "what are they talking about", summarize what the speakers actually said in the transcript — do not generalize
- Be warm and helpful, but NEVER fabricate, assume, or fill in gaps with outside knowledge
- Use simple, clear language accessible to Indian English speakers`;
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

export function buildQuizPrompt(previousQuestions: string[] = []): string {
  const avoidSection = previousQuestions.length > 0
    ? `\n\nIMPORTANT — The user has already been asked these questions in previous quizzes. Do NOT repeat or rephrase any of them. Generate completely NEW questions on DIFFERENT aspects of the lesson:\n${previousQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")}`
    : "";

  return `Generate exactly 5 multiple-choice questions based ONLY on what is said in the recording transcript above. Do NOT use any outside knowledge.

Respond with ONLY a JSON array, no other text. Each object must have exactly these fields:
[
  {
    "question": "The question text",
    "options": ["A) First option", "B) Second option", "C) Third option", "D) Fourth option"],
    "correct": 0,
    "explanation": "Brief explanation quoting or paraphrasing the specific part of the transcript where this was covered"
  }
]

Rules:
- "correct" is the 0-based index of the correct option (0-3)
- Every question MUST come directly from what the speakers said in the transcript — use their exact words, examples, and points
- Do NOT ask generic questions that someone could answer without listening to the recording
- Questions should test whether the user actually paid attention to the recording: what was said, what examples were given, what advice or insights the speakers shared
- All 4 options should be plausible — wrong options should be realistic misunderstandings of what was said, not obviously wrong
- Explanations must quote or paraphrase the exact part of the transcript that contains the answer
- Vary the difficulty: some detail-oriented, some about the bigger points made${avoidSection}`;
}

interface CourseContent {
  title: string;
  lessons: { title: string; moduleTitle: string; transcript: string | null; description: string | null }[];
}

export function buildGlobalSystemPrompt(courseContents: CourseContent[]): string {
  let courseSection: string;

  if (courseContents.length === 0) {
    courseSection = "The user hasn't enrolled in any courses yet.";
  } else {
    const parts = courseContents.map((course) => {
      const lessonParts = course.lessons.map((lesson) => {
        const content = truncateTranscript(lesson.transcript) || lesson.description || "";
        return `### ${lesson.moduleTitle} → ${lesson.title}\n${content}`;
      });
      return `## Course: ${course.title}\n\n${lessonParts.join("\n\n")}`;
    });
    courseSection = parts.join("\n\n---\n\n");
  }

  if (courseSection.length > MAX_GLOBAL_PROMPT_CHARS) {
    courseSection = courseSection.slice(0, MAX_GLOBAL_PROMPT_CHARS) +
      "\n\n[... remaining content truncated to fit context limit ...]";
  }

  return `You are Bloom AI, a learning assistant. You answer questions ONLY based on the recording transcripts provided below. Nothing else.

ALL RECORDING TRANSCRIPTS:
${courseSection}

STRICT RULES:
- You ONLY know what is written in the transcripts above. That is your ENTIRE knowledge base.
- Do NOT use course names, lesson titles, or module titles to guess or infer anything. Ignore them completely when forming answers.
- Do NOT draw on any general knowledge about relationships, psychology, counselling, or any other topic. You are NOT an expert on anything — you are a transcript assistant.
- If the answer to a question is NOT in any transcript, say: "I couldn't find information about that in the recordings. Could you ask about something specific from one of the lessons?"
- Quote or closely paraphrase the exact words from the transcripts when answering
- When the user asks about a topic, search across ALL transcripts and pull out exactly what was said
- Be warm and helpful, but NEVER fabricate, assume, or fill in gaps with outside knowledge
- Use simple, clear language accessible to Indian English speakers`;
}
