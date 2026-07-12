import { NextResponse, type NextRequest } from "next/server";
import { withAdmin } from "@/lib/admin-api";

export async function POST(request: NextRequest) {
  return withAdmin(async (supabase) => {
    const body = await request.json();
    const { courseTitle, markdown } = body;

    if (!courseTitle || !markdown) {
      return NextResponse.json(
        { error: "courseTitle and markdown required" },
        { status: 400 }
      );
    }

    // Parse markdown into modules and lessons
    // Format:
    //   # Module Title
    //   ## Lesson Title
    //   Lesson description/transcript text (everything until next heading)
    const lines = (markdown as string).split("\n");
    const modules: {
      title: string;
      lessons: { title: string; description: string; transcript: string }[];
    }[] = [];

    let currentModule: (typeof modules)[0] | null = null;
    let currentLesson: (typeof modules)[0]["lessons"][0] | null = null;
    let buffer: string[] = [];

    function flushLesson() {
      if (currentLesson && currentModule) {
        const text = buffer.join("\n").trim();
        currentLesson.description = text.slice(0, 500);
        currentLesson.transcript = text;
        currentModule.lessons.push(currentLesson);
      }
      currentLesson = null;
      buffer = [];
    }

    for (const line of lines) {
      if (line.startsWith("# ") && !line.startsWith("## ")) {
        flushLesson();
        if (currentModule) modules.push(currentModule);
        currentModule = { title: line.replace(/^# /, "").trim(), lessons: [] };
      } else if (line.startsWith("## ")) {
        flushLesson();
        if (!currentModule) {
          currentModule = { title: "Module 1", lessons: [] };
        }
        currentLesson = {
          title: line.replace(/^## /, "").trim(),
          description: "",
          transcript: "",
        };
      } else {
        buffer.push(line);
      }
    }

    flushLesson();
    if (currentModule) modules.push(currentModule);

    if (modules.length === 0) {
      return NextResponse.json(
        { error: "No modules found. Use # for modules and ## for lessons." },
        { status: 400 }
      );
    }

    // Create the course as draft
    const slug = courseTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    let totalLessons = 0;
    for (const m of modules) totalLessons += m.lessons.length;

    const { data: course, error: courseError } = await supabase
      .from("courses")
      .insert({
        title: courseTitle,
        slug: slug || `course-${Date.now()}`,
        status: "draft",
        total_lessons: totalLessons,
        total_weeks: modules.length,
      })
      .select("id")
      .single();

    if (courseError) {
      return NextResponse.json({ error: courseError.message }, { status: 400 });
    }

    // Create modules and lessons
    for (let mi = 0; mi < modules.length; mi++) {
      const mod = modules[mi]!;
      const { data: dbModule, error: modError } = await supabase
        .from("modules")
        .insert({
          course_id: course.id,
          title: mod.title,
          sort_order: mi,
        })
        .select("id")
        .single();

      if (modError || !dbModule) continue;

      for (let li = 0; li < mod.lessons.length; li++) {
        const lesson = mod.lessons[li]!;
        await supabase.from("lessons").insert({
          module_id: dbModule.id,
          title: lesson.title,
          description: lesson.description || null,
          transcript: lesson.transcript || null,
          sort_order: li,
          duration_minutes: 0,
        });
      }
    }

    return NextResponse.json({
      id: course.id,
      modulesCreated: modules.length,
      lessonsCreated: totalLessons,
    });
  });
}
