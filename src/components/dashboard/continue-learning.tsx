"use client";

import Link from "next/link";
import { ProgressRing } from "@/components/learn/progress-ring";
import type { CourseWithProgress } from "@/lib/queries";
import { Play } from "lucide-react";

export function ContinueLearning({
  courses,
}: {
  courses: CourseWithProgress[];
}) {
  if (courses.length === 0) {
    return <EmptyState />;
  }

  return (
    <section className="space-y-4">
      <h2 className="font-display text-xl text-botanical">Continue Learning</h2>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
    </section>
  );
}

function CourseCard({ course }: { course: CourseWithProgress }) {
  const progress =
    course.total_lessons > 0
      ? course.completed_lessons / course.total_lessons
      : 0;

  const resumeHref = course.next_lesson
    ? `/learn/${course.slug}/${course.next_lesson.id}`
    : `/courses`;

  return (
    <Link
      href={resumeHref}
      className="group rounded-bloom bg-white border border-border overflow-hidden shadow-bloom-sm hover:shadow-bloom transition-all duration-200"
    >
      {/* Cover art */}
      <div className="relative aspect-[16/9] overflow-hidden">
        {course.cover_image_url ? (
          <div
            className="w-full h-full bg-cover bg-center"
            style={{ backgroundImage: `url(${course.cover_image_url})` }}
          />
        ) : (
          <div className="w-full h-full bg-dawn-gradient" />
        )}
        {/* Play overlay */}
        <div className="absolute inset-0 bg-botanical/0 group-hover:bg-botanical/20 transition-colors duration-200 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-bloom">
            <Play className="size-5 text-bloom-rose ml-0.5" fill="currentColor" />
          </div>
        </div>
        {/* Progress ring */}
        <div className="absolute top-3 right-3">
          <ProgressRing progress={progress} size={44} strokeWidth={3} />
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-2">
        <h3 className="font-display text-base text-botanical leading-snug group-hover:text-bloom-rose transition-colors">
          {course.title}
        </h3>

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-bloom-rose transition-all duration-500"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {course.completed_lessons} of {course.total_lessons} lessons
          </p>
        </div>

        {/* Next lesson */}
        {course.next_lesson && (
          <div className="pt-1 border-t border-border">
            <p className="text-xs text-muted-foreground">Up next</p>
            <p className="text-sm text-botanical font-medium truncate">
              {course.next_lesson.title}
            </p>
          </div>
        )}
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <section className="space-y-4">
      <h2 className="font-display text-xl text-botanical">Continue Learning</h2>
      <div className="rounded-bloom bg-white border border-border p-8 text-center shadow-bloom-sm">
        <div className="mx-auto w-16 h-16 rounded-full bg-bloom-rose/10 flex items-center justify-center mb-4">
          <svg
            className="size-8 text-bloom-rose"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5"
            />
          </svg>
        </div>
        <h3 className="font-display text-lg text-botanical mb-2">
          Your journey starts here
        </h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Enrol in a course to begin transforming your relationships. Each lesson
          brings you closer to the love you deserve.
        </p>
        <Link
          href="/courses"
          className="inline-flex items-center gap-2 rounded-xl bg-bloom-rose px-6 py-3 text-white font-medium shadow-bloom-sm hover:bg-bloom-rose-dark hover:shadow-bloom transition-all duration-200"
        >
          Browse Courses
        </Link>
      </div>
    </section>
  );
}
