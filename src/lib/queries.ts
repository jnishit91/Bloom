import { SupabaseClient } from "@supabase/supabase-js";

// ── Types ──

export interface CourseWithProgress {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  cover_image_url: string | null;
  total_lessons: number;
  total_weeks: number;
  price_inr: number;
  status: string;
  category: string | null;
  instructor_name: string;
  completed_lessons: number;
  next_lesson: {
    id: string;
    title: string;
    module_title: string;
  } | null;
}

export interface ModuleWithLessons {
  id: string;
  title: string;
  sort_order: number;
  lessons: LessonRow[];
}

export interface LessonRow {
  id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  duration_minutes: number;
  sort_order: number;
  is_free_preview: boolean;
  completed: boolean;
  module_id: string;
}

export interface LessonFull {
  id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  duration_minutes: number;
  transcript: string | null;
  sort_order: number;
  is_free_preview: boolean;
  module_id: string;
  module: {
    id: string;
    title: string;
    course_id: string;
    course: {
      id: string;
      slug: string;
      title: string;
      total_lessons: number;
    };
  };
}

export interface TaskRow {
  id: string;
  task_text: string;
  sort_order: number;
  completed: boolean;
}

export interface ResourceRow {
  id: string;
  title: string;
  type: string;
  file_url: string | null;
}

// ── Queries ──

export async function getEnrolledCoursesWithProgress(
  supabase: SupabaseClient,
  userId: string
): Promise<CourseWithProgress[]> {
  // Get active enrollments
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("course_id")
    .eq("user_id", userId)
    .in("status", ["active", "manual"]);

  if (!enrollments || enrollments.length === 0) return [];

  const courseIds = enrollments.map((e) => e.course_id);

  // Get courses
  const { data: courses } = await supabase
    .from("courses")
    .select("id, slug, title, subtitle, cover_image_url, total_lessons, total_weeks, price_inr, status, category, instructor_name")
    .in("id", courseIds);

  if (!courses) return [];

  // Get lesson progress counts
  const result: CourseWithProgress[] = [];

  for (const course of courses) {
    // Get all lesson IDs for this course
    const { data: modules } = await supabase
      .from("modules")
      .select("id")
      .eq("course_id", course.id);

    if (!modules) continue;

    const moduleIds = modules.map((m) => m.id);

    const { data: lessons } = await supabase
      .from("lessons")
      .select("id, title, sort_order, module_id")
      .in("module_id", moduleIds)
      .order("sort_order");

    if (!lessons) continue;

    const lessonIds = lessons.map((l) => l.id);

    // Count completed
    const { count: completedCount } = await supabase
      .from("lesson_progress")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .in("lesson_id", lessonIds)
      .eq("completed", true);

    // Find next uncompleted lesson
    const { data: completedLessons } = await supabase
      .from("lesson_progress")
      .select("lesson_id")
      .eq("user_id", userId)
      .in("lesson_id", lessonIds)
      .eq("completed", true);

    const completedSet = new Set(
      (completedLessons || []).map((cl) => cl.lesson_id)
    );

    // Sort lessons by module sort_order then lesson sort_order
    const { data: modulesOrdered } = await supabase
      .from("modules")
      .select("id, title, sort_order")
      .eq("course_id", course.id)
      .order("sort_order");

    let nextLesson: CourseWithProgress["next_lesson"] = null;

    if (modulesOrdered) {
      for (const mod of modulesOrdered) {
        const modLessons = lessons
          .filter((l) => l.module_id === mod.id)
          .sort((a, b) => a.sort_order - b.sort_order);

        for (const lesson of modLessons) {
          if (!completedSet.has(lesson.id)) {
            nextLesson = {
              id: lesson.id,
              title: lesson.title,
              module_title: mod.title,
            };
            break;
          }
        }
        if (nextLesson) break;
      }
    }

    result.push({
      ...course,
      completed_lessons: completedCount || 0,
      next_lesson: nextLesson,
    });
  }

  return result;
}

export async function getCatalogCourses(supabase: SupabaseClient) {
  const { data } = await supabase
    .from("courses")
    .select(
      "id, slug, title, subtitle, cover_image_url, total_lessons, total_weeks, price_inr, status, category, instructor_name"
    )
    .order("created_at", { ascending: true });

  return data || [];
}

export async function getCourseBySlug(
  supabase: SupabaseClient,
  slug: string
) {
  const { data } = await supabase
    .from("courses")
    .select("id, slug, title, total_lessons, total_weeks, status")
    .eq("slug", slug)
    .single();

  return data;
}

export async function getCurriculumWithProgress(
  supabase: SupabaseClient,
  courseId: string,
  userId: string
): Promise<ModuleWithLessons[]> {
  const { data: modules } = await supabase
    .from("modules")
    .select("id, title, sort_order")
    .eq("course_id", courseId)
    .order("sort_order");

  if (!modules) return [];

  // Get all lessons
  const moduleIds = modules.map((m) => m.id);
  const { data: lessons } = await supabase
    .from("lessons")
    .select("id, title, description, video_url, duration_minutes, sort_order, is_free_preview, module_id")
    .in("module_id", moduleIds)
    .order("sort_order");

  if (!lessons) return modules.map((m) => ({ ...m, lessons: [] }));

  // Get user progress
  const lessonIds = lessons.map((l) => l.id);
  const { data: progress } = await supabase
    .from("lesson_progress")
    .select("lesson_id")
    .eq("user_id", userId)
    .in("lesson_id", lessonIds)
    .eq("completed", true);

  const completedSet = new Set((progress || []).map((p) => p.lesson_id));

  return modules.map((mod) => ({
    ...mod,
    lessons: lessons
      .filter((l) => l.module_id === mod.id)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((l) => ({
        ...l,
        completed: completedSet.has(l.id),
      })),
  }));
}

export async function getLessonWithContext(
  supabase: SupabaseClient,
  lessonId: string
): Promise<LessonFull | null> {
  const { data: lesson } = await supabase
    .from("lessons")
    .select(`
      id, title, description, video_url, duration_minutes, transcript, sort_order, is_free_preview, module_id
    `)
    .eq("id", lessonId)
    .single();

  if (!lesson) return null;

  const { data: module } = await supabase
    .from("modules")
    .select("id, title, course_id")
    .eq("id", lesson.module_id)
    .single();

  if (!module) return null;

  const { data: course } = await supabase
    .from("courses")
    .select("id, slug, title, total_lessons")
    .eq("id", module.course_id)
    .single();

  if (!course) return null;

  return {
    ...lesson,
    module: {
      ...module,
      course,
    },
  };
}

export async function getLessonTasks(
  supabase: SupabaseClient,
  lessonId: string,
  userId: string
): Promise<TaskRow[]> {
  const { data: tasks } = await supabase
    .from("lesson_tasks")
    .select("id, task_text, sort_order")
    .eq("lesson_id", lessonId)
    .order("sort_order");

  if (!tasks || tasks.length === 0) return [];

  const taskIds = tasks.map((t) => t.id);
  const { data: completions } = await supabase
    .from("task_completions")
    .select("lesson_task_id")
    .eq("user_id", userId)
    .in("lesson_task_id", taskIds);

  const completedSet = new Set(
    (completions || []).map((c) => c.lesson_task_id)
  );

  return tasks.map((t) => ({
    ...t,
    completed: completedSet.has(t.id),
  }));
}

export async function getLessonResources(
  supabase: SupabaseClient,
  lessonId: string
): Promise<ResourceRow[]> {
  const { data } = await supabase
    .from("lesson_resources")
    .select("id, title, type, file_url")
    .eq("lesson_id", lessonId);

  return data || [];
}

export async function getLessonProgress(
  supabase: SupabaseClient,
  lessonId: string,
  userId: string
) {
  const { data } = await supabase
    .from("lesson_progress")
    .select("completed, last_position_seconds")
    .eq("lesson_id", lessonId)
    .eq("user_id", userId)
    .maybeSingle();

  return data;
}

export async function isEnrolled(
  supabase: SupabaseClient,
  userId: string,
  courseId: string
): Promise<boolean> {
  const { count } = await supabase
    .from("enrollments")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .in("status", ["active", "manual"]);

  return (count || 0) > 0;
}

/** Get ordered flat list of all lesson IDs in a course for prev/next navigation */
export async function getOrderedLessonIds(
  supabase: SupabaseClient,
  courseId: string
): Promise<string[]> {
  const { data: modules } = await supabase
    .from("modules")
    .select("id, sort_order")
    .eq("course_id", courseId)
    .order("sort_order");

  if (!modules) return [];

  const { data: lessons } = await supabase
    .from("lessons")
    .select("id, module_id, sort_order")
    .in("module_id", modules.map((m) => m.id))
    .order("sort_order");

  if (!lessons) return [];

  // Sort by module order first, then lesson order
  const moduleOrder = new Map(modules.map((m, i) => [m.id, i]));
  return lessons
    .sort((a, b) => {
      const modDiff = (moduleOrder.get(a.module_id) ?? 0) - (moduleOrder.get(b.module_id) ?? 0);
      if (modDiff !== 0) return modDiff;
      return a.sort_order - b.sort_order;
    })
    .map((l) => l.id);
}
