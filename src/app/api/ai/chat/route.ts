import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  streamChat,
  chatCompletion,
  repairQuizJson,
  buildLessonSystemPrompt,
  buildSummarizePrompt,
  buildQuizPrompt,
  buildGlobalSystemPrompt,
  isAiAvailable,
  type ChatMessage,
} from "@/lib/ai";

interface RequestBody {
  mode: "chat" | "summarize" | "quiz";
  message?: string;
  lessonId?: string;
  conversationId?: string;
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body: RequestBody = await req.json();
  const { mode, message, lessonId, conversationId } = body;

  if (!mode || !["chat", "summarize", "quiz"].includes(mode)) {
    return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
  }

  if (!isAiAvailable()) {
    return NextResponse.json(
      { error: "AI is not configured yet. Please set up an AI endpoint (e.g. Ollama) and set AI_BASE_URL." },
      { status: 503 }
    );
  }

  try {
    // Build context based on whether we have a lesson
    let systemPrompt: string;

    if (lessonId) {
      // Lesson-scoped AI
      const { data: lesson } = await supabase
        .from("lessons")
        .select("id, title, description, transcript, module_id")
        .eq("id", lessonId)
        .single();

      if (!lesson) {
        return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
      }

      const { data: module } = await supabase
        .from("modules")
        .select("id, title, course_id")
        .eq("id", lesson.module_id)
        .single();

      const { data: course } = module
        ? await supabase
            .from("courses")
            .select("id, title")
            .eq("id", module.course_id)
            .single()
        : { data: null };

      systemPrompt = buildLessonSystemPrompt(
        lesson.title,
        module?.title || "Unknown Module",
        course?.title || "Unknown Course",
        lesson.transcript,
        lesson.description,
      );
    } else {
      // Global Bloom AI — load full course content for enrolled courses
      const { data: enrollments } = await supabase
        .from("enrollments")
        .select("course_id")
        .eq("user_id", user.id)
        .in("status", ["active", "manual"]);

      const enrolledCourseIds = (enrollments || []).map((e) => e.course_id);

      interface CourseContent {
        title: string;
        lessons: { title: string; moduleTitle: string; transcript: string | null; description: string | null }[];
      }

      const courseContents: CourseContent[] = [];

      if (enrolledCourseIds.length > 0) {
        const { data: courses } = await supabase
          .from("courses")
          .select("id, title")
          .in("id", enrolledCourseIds);

        for (const course of courses || []) {
          const { data: modules } = await supabase
            .from("modules")
            .select("id, title, sort_order")
            .eq("course_id", course.id)
            .order("sort_order");

          const moduleIds = (modules || []).map((m) => m.id);
          if (moduleIds.length === 0) {
            courseContents.push({ title: course.title, lessons: [] });
            continue;
          }

          const { data: lessons } = await supabase
            .from("lessons")
            .select("title, description, transcript, module_id, sort_order")
            .in("module_id", moduleIds)
            .order("sort_order");

          const moduleMap = new Map((modules || []).map((m) => [m.id, m.title]));

          courseContents.push({
            title: course.title,
            lessons: (lessons || []).map((l) => ({
              title: l.title,
              moduleTitle: moduleMap.get(l.module_id) || "",
              transcript: l.transcript,
              description: l.description,
            })),
          });
        }
      }

      systemPrompt = buildGlobalSystemPrompt(courseContents);
    }

    // ── Quiz mode: non-streaming JSON ──
    if (mode === "quiz") {
      return await handleQuiz(supabase, user.id, lessonId, systemPrompt);
    }

    // ── Summarize mode ──
    if (mode === "summarize") {
      return await handleStream(
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: buildSummarizePrompt() },
        ],
        1000,
        0.3,
        req.signal,
      );
    }

    // ── Chat mode ──
    if (!message?.trim()) {
      return NextResponse.json({ error: "Message required" }, { status: 400 });
    }

    // Load conversation history if continuing
    let history: ChatMessage[] = [];
    if (conversationId) {
      const { data: conv } = await supabase
        .from("ai_conversations")
        .select("messages")
        .eq("id", conversationId)
        .eq("user_id", user.id)
        .single();

      if (conv?.messages && Array.isArray(conv.messages)) {
        history = conv.messages as ChatMessage[];
      }
    }

    // Build messages array
    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...history,
      { role: "user", content: message },
    ];

    // Stream response and save conversation
    return await handleChatStream(
      supabase,
      user.id,
      lessonId || null,
      conversationId || null,
      messages,
      history,
      message,
      req.signal,
    );
  } catch (err) {
    console.error("AI chat error:", err);
    const errorMessage =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

async function handleQuiz(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  lessonId: string | undefined,
  systemPrompt: string,
) {
  // Load previously asked questions so we don't repeat
  let previousQuestions: string[] = [];
  if (lessonId) {
    const { data: pastAttempts } = await supabase
      .from("quiz_attempts")
      .select("questions")
      .eq("user_id", userId)
      .eq("lesson_id", lessonId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (pastAttempts) {
      for (const attempt of pastAttempts) {
        const qs = attempt.questions as { question: string }[];
        if (Array.isArray(qs)) {
          previousQuestions.push(...qs.map((q) => q.question));
        }
      }
    }
  }

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: buildQuizPrompt(previousQuestions) },
  ];

  // Try up to 2 times
  for (let attempt = 0; attempt < 2; attempt++) {
    const raw = await chatCompletion({
      messages,
      maxTokens: 2000,
      temperature: 0.6,
    });

    const questions = repairQuizJson(raw);
    if (questions && questions.length >= 3) {
      // Validate structure
      const valid = questions.every(
        (q: unknown) =>
          typeof q === "object" &&
          q !== null &&
          "question" in q &&
          "options" in q &&
          "correct" in q &&
          "explanation" in q &&
          Array.isArray((q as { options: unknown }).options) &&
          (q as { options: unknown[] }).options.length === 4,
      );

      if (valid) {
        // Save quiz attempt shell (score filled in client-side)
        if (lessonId) {
          await supabase.from("quiz_attempts").insert({
            user_id: userId,
            lesson_id: lessonId,
            questions,
            answers: [],
          });
        }

        return NextResponse.json({ questions: questions.slice(0, 5) });
      }
    }

    // Retry with a nudge
    if (attempt === 0) {
      messages.push({
        role: "assistant",
        content: raw,
      });
      messages.push({
        role: "user",
        content:
          "That wasn't valid JSON. Please respond with ONLY a JSON array of 5 question objects, nothing else.",
      });
    }
  }

  return NextResponse.json(
    { error: "Failed to generate valid quiz. Please try again." },
    { status: 422 },
  );
}

async function handleStream(
  messages: ChatMessage[],
  maxTokens: number,
  temperature: number,
  signal: AbortSignal,
) {
  const upstream = await streamChat({
    messages,
    maxTokens,
    temperature,
    signal,
  });

  // Transform SSE stream to extract content deltas
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const transform = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      const text = decoder.decode(chunk, { stream: true });
      const lines = text.split("\n");

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6).trim();
        if (data === "[DONE]") {
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          continue;
        }

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ content })}\n\n`,
              ),
            );
          }
        } catch {
          // Skip malformed chunks
        }
      }
    },
  });

  const readable = upstream.pipeThrough(transform);

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

async function handleChatStream(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  lessonId: string | null,
  conversationId: string | null,
  messages: ChatMessage[],
  history: ChatMessage[],
  userMessage: string,
  signal: AbortSignal,
) {
  const upstream = await streamChat({
    messages,
    maxTokens: 3000,
    temperature: 0.7,
    signal,
  });

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  let fullResponse = "";

  const transform = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      const text = decoder.decode(chunk, { stream: true });
      const lines = text.split("\n");

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6).trim();
        if (data === "[DONE]") {
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          continue;
        }

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            fullResponse += content;
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ content })}\n\n`,
              ),
            );
          }
        } catch {
          // Skip malformed chunks
        }
      }
    },
    async flush(controller) {
      // Save conversation after stream completes
      if (fullResponse) {
        const updatedMessages: ChatMessage[] = [
          ...history,
          { role: "user", content: userMessage },
          { role: "assistant", content: fullResponse },
        ];

        if (conversationId) {
          await supabase
            .from("ai_conversations")
            .update({
              messages: updatedMessages,
              updated_at: new Date().toISOString(),
            })
            .eq("id", conversationId)
            .eq("user_id", userId);

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ conversationId })}\n\n`,
            ),
          );
        } else {
          // Create new conversation
          const title =
            userMessage.length > 60
              ? userMessage.slice(0, 57) + "..."
              : userMessage;

          const { data: newConv } = await supabase
            .from("ai_conversations")
            .insert({
              user_id: userId,
              lesson_id: lessonId,
              title,
              messages: updatedMessages,
            })
            .select("id")
            .single();

          if (newConv) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ conversationId: newConv.id })}\n\n`,
              ),
            );
          }
        }
      }
    },
  });

  const readable = upstream.pipeThrough(transform);

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
