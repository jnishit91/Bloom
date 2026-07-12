import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { isEnrolled, getCurriculumWithProgress } from "@/lib/queries";
import { CertificateView } from "@/components/certificate/certificate-view";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `Certificate — ${slug} — Bloom`,
  };
}

export default async function CertificatePage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: course } = await supabase
    .from("courses")
    .select("id, slug, title, instructor_name, total_lessons")
    .eq("slug", slug)
    .single();

  if (!course) notFound();

  const enrolled = await isEnrolled(supabase, user.id, course.id);
  if (!enrolled) redirect(`/courses/${slug}`);

  const curriculum = await getCurriculumWithProgress(
    supabase,
    course.id,
    user.id
  );

  const completedLessons = curriculum.reduce(
    (acc, mod) => acc + mod.lessons.filter((l) => l.completed).length,
    0
  );

  const isComplete = completedLessons >= course.total_lessons && course.total_lessons > 0;

  if (!isComplete) redirect(`/home`);

  // Get user name
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  // Get completion date (last completed lesson date)
  const allLessonIds = curriculum.flatMap((m) => m.lessons.map((l) => l.id));
  const { data: progressData } = await supabase
    .from("lesson_progress")
    .select("completed_at")
    .eq("user_id", user.id)
    .in("lesson_id", allLessonIds)
    .eq("completed", true)
    .order("completed_at", { ascending: false })
    .limit(1);

  const completedAt = progressData?.[0]?.completed_at || new Date().toISOString();

  return (
    <CertificateView
      memberName={profile?.full_name || "Bloom Member"}
      courseTitle={course.title}
      instructorName={course.instructor_name}
      completedAt={completedAt}
      totalLessons={course.total_lessons}
    />
  );
}
