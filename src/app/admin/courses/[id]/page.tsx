import { requireAdmin } from "@/lib/admin";
import { notFound } from "next/navigation";
import { CourseEditor } from "@/components/admin/course-editor";

export default async function EditCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await requireAdmin();

  const { data: course } = await supabase
    .from("courses")
    .select("*")
    .eq("id", id)
    .single();

  if (!course) notFound();

  const { data: modules } = await supabase
    .from("modules")
    .select("id, title, sort_order")
    .eq("course_id", id)
    .order("sort_order");

  const moduleIds = (modules || []).map((m) => m.id);
  let lessons: {
    id: string;
    module_id: string;
    title: string;
    description: string | null;
    video_url: string | null;
    duration_minutes: number;
    transcript: string | null;
    sort_order: number;
    is_free_preview: boolean;
  }[] = [];

  if (moduleIds.length > 0) {
    const { data } = await supabase
      .from("lessons")
      .select(
        "id, module_id, title, description, video_url, duration_minutes, transcript, sort_order, is_free_preview"
      )
      .in("module_id", moduleIds)
      .order("sort_order");
    lessons = data || [];
  }

  // Get tasks and resources for all lessons
  const lessonIds = lessons.map((l) => l.id);
  let tasks: { id: string; lesson_id: string; task_text: string; sort_order: number }[] = [];
  let resources: { id: string; lesson_id: string; title: string; type: string; file_url: string | null }[] = [];

  if (lessonIds.length > 0) {
    const [{ data: tasksData }, { data: resourcesData }] = await Promise.all([
      supabase
        .from("lesson_tasks")
        .select("id, lesson_id, task_text, sort_order")
        .in("lesson_id", lessonIds)
        .order("sort_order"),
      supabase
        .from("lesson_resources")
        .select("id, lesson_id, title, type, file_url")
        .in("lesson_id", lessonIds),
    ]);
    tasks = tasksData || [];
    resources = resourcesData || [];
  }

  return (
    <CourseEditor
      course={course}
      modules={modules || []}
      lessons={lessons}
      tasks={tasks}
      resources={resources}
    />
  );
}
