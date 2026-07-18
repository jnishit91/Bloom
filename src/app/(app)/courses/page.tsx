import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { BookOpen, Clock, User } from "lucide-react";
import { OfferPriceBlock } from "@/components/commerce/offer-price";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Courses — Bloom",
  description: "Browse Bloom's relationship-transformation courses.",
};

export default async function CoursesPage() {
  const supabase = await createClient();

  const { data: courses } = await supabase
    .from("courses")
    .select(
      "id, slug, title, subtitle, cover_image_url, total_lessons, total_weeks, price_inr, status, category, instructor_name",
    )
    .in("status", ["published", "draft"])
    .order("created_at");

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="max-w-2xl mb-10">
        <h1 className="font-display text-3xl sm:text-4xl text-botanical tracking-tight">
          Courses
        </h1>
        <p className="mt-2 text-muted-foreground text-lg">
          Premium relationship-transformation courses. Each one is a guided journey of inner work — not just information.
        </p>
      </div>

      {courses && courses.length > 0 ? (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => {
            const isDraft = course.status === "draft";
            return (
              <Link
                key={course.id}
                href={isDraft ? "#" : `/courses/${course.slug}`}
                className={`group rounded-bloom bg-white border border-border overflow-hidden shadow-bloom-sm hover:shadow-bloom transition-all duration-200 ${isDraft ? "opacity-75 pointer-events-none" : ""}`}
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  {course.cover_image_url ? (
                    <div
                      className="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform duration-300"
                      style={{ backgroundImage: `url(${course.cover_image_url})` }}
                    />
                  ) : (
                    <div className="w-full h-full bg-dawn-gradient group-hover:scale-105 transition-transform duration-300" />
                  )}
                  {isDraft && (
                    <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-botanical/80 text-white text-xs font-medium">
                      Coming Soon
                    </div>
                  )}
                </div>
                <div className="p-5 space-y-3">
                  {course.category && (
                    <span className="text-xs font-medium text-sage-dark uppercase tracking-wider">
                      {course.category}
                    </span>
                  )}
                  <h3 className="font-display text-xl text-botanical leading-snug">
                    {course.title}
                  </h3>
                  {course.subtitle && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {course.subtitle}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground pt-1">
                    <span className="flex items-center gap-1">
                      <User className="size-3.5" />
                      {course.instructor_name}
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="size-3.5" />
                      {course.total_lessons} lessons
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="size-3.5" />
                      {course.total_weeks} weeks
                    </span>
                  </div>
                  {!isDraft && (
                    <div className="pt-2 border-t border-border">
                      <OfferPriceBlock />
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="py-20 text-center">
          <BookOpen className="size-10 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">
            No courses available yet. Check back soon!
          </p>
        </div>
      )}
    </div>
  );
}
