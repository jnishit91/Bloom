import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getLessonWithContext,
  getCurriculumWithProgress,
  getLessonTasks,
  getLessonResources,
  getLessonProgress,
  isEnrolled,
  getOrderedLessonIds,
} from "@/lib/queries";
import { VideoPlayer } from "@/components/learn/video-player";
import { AiBar } from "@/components/learn/ai-bar";
import { LessonTasks } from "@/components/learn/lesson-tasks";
import { WorkbookCard } from "@/components/learn/workbook-card";
import { ReflectionPrompt } from "@/components/learn/reflection-prompt";
import { LessonFooter } from "@/components/learn/lesson-footer";
import { LessonSidebar } from "@/components/learn/lesson-sidebar";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ courseSlug: string; lessonId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lessonId } = await params;
  const supabase = await createClient();
  const lesson = await getLessonWithContext(supabase, lessonId);

  return {
    title: lesson ? `${lesson.title} — Bloom` : "Lesson — Bloom",
  };
}

export default async function LessonPage({ params }: PageProps) {
  const { courseSlug, lessonId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Get lesson data
  const lesson = await getLessonWithContext(supabase, lessonId);
  if (!lesson) notFound();

  // Verify the courseSlug matches
  if (lesson.module.course.slug !== courseSlug) notFound();

  const courseId = lesson.module.course.id;

  // Enrollment check — free preview lessons bypass
  if (!lesson.is_free_preview) {
    const enrolled = await isEnrolled(supabase, user.id, courseId);
    if (!enrolled) {
      redirect(`/courses/${courseSlug}?access=required`);
    }
  }

  // Fetch all data in parallel
  const [curriculum, tasks, resources, progress, orderedLessonIds] =
    await Promise.all([
      getCurriculumWithProgress(supabase, courseId, user.id),
      getLessonTasks(supabase, lessonId, user.id),
      getLessonResources(supabase, lessonId),
      getLessonProgress(supabase, lessonId, user.id),
      getOrderedLessonIds(supabase, courseId),
    ]);

  // Calculate prev/next
  const currentIndex = orderedLessonIds.indexOf(lessonId);
  const prevLessonId =
    currentIndex > 0 ? orderedLessonIds[currentIndex - 1] ?? null : null;
  const nextLessonId =
    currentIndex < orderedLessonIds.length - 1
      ? orderedLessonIds[currentIndex + 1] ?? null
      : null;

  // Count completed
  const completedLessons = curriculum.reduce(
    (acc, mod) => acc + mod.lessons.filter((l) => l.completed).length,
    0
  );

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)]">
      {/* Main column */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-24">
          {/* Breadcrumb */}
          <Link
            href="/home"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-botanical transition-colors"
          >
            <ChevronLeft className="size-4" />
            Back to Program
          </Link>

          {/* Lesson title */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-sage-dark uppercase tracking-wider">
              {lesson.module.title}
            </p>
            <h1 className="font-display text-2xl sm:text-3xl text-botanical tracking-tight">
              {lesson.title}
            </h1>
          </div>

          {/* Video player */}
          <VideoPlayer
            videoUrl={lesson.video_url}
            lessonId={lessonId}
            lessonTitle={lesson.title}
            initialPosition={progress?.last_position_seconds || 0}
          />

          {/* AI assistant bar */}
          <AiBar
            lessonId={lessonId}
            lessonTitle={lesson.title}
            moduleTitle={lesson.module.title}
            courseTitle={lesson.module.course.title}
          />

          {/* Description */}
          {lesson.description && (
            <div className="prose prose-sm max-w-none text-botanical/90 leading-relaxed">
              {lesson.description.split("\n").map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          )}

          {/* Tasks */}
          <LessonTasks tasks={tasks} lessonId={lessonId} />

          {/* Workbook */}
          <WorkbookCard resources={resources} />

          {/* Reflection */}
          <ReflectionPrompt lessonId={lessonId} />
        </div>

        {/* Footer bar */}
        <LessonFooter
          lessonId={lessonId}
          courseSlug={courseSlug}
          prevLessonId={prevLessonId}
          nextLessonId={nextLessonId}
          isCompleted={progress?.completed || false}
          completedLessons={completedLessons}
          totalLessons={lesson.module.course.total_lessons}
        />
      </div>

      {/* Sidebar */}
      <LessonSidebar
        modules={curriculum}
        courseSlug={courseSlug}
        currentLessonId={lessonId}
        totalLessons={lesson.module.course.total_lessons}
        completedLessons={completedLessons}
        lessonId={lessonId}
      />
    </div>
  );
}
