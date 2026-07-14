import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CheckoutButton } from "@/components/commerce/checkout-button";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Play,
  Clock,
  BookOpen,
  Check,
  ChevronRight,
  User,
  Star,
  MessageCircle,
  Lock,
} from "lucide-react";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: course } = await supabase
    .from("courses")
    .select("title, subtitle")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (!course) return { title: "Course — Bloom" };
  return {
    title: `${course.title} — Bloom`,
    description: course.subtitle || undefined,
  };
}

export default async function CourseSalesPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  // Fetch course with full details
  const { data: course } = await supabase
    .from("courses")
    .select(
      "id, slug, title, subtitle, description, instructor_name, instructor_bio, instructor_photo_url, cover_image_url, trailer_video_url, price_inr, outcomes, total_lessons, total_weeks, status",
    )
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (!course) notFound();

  // Fetch curriculum
  const { data: modules } = await supabase
    .from("modules")
    .select("id, title, sort_order")
    .eq("course_id", course.id)
    .order("sort_order");

  let curriculum: {
    id: string;
    title: string;
    lessons: { id: string; title: string; duration_minutes: number; is_free_preview: boolean }[];
  }[] = [];

  if (modules && modules.length > 0) {
    const { data: lessons } = await supabase
      .from("lessons")
      .select("id, title, duration_minutes, is_free_preview, module_id, sort_order")
      .in("module_id", modules.map((m) => m.id))
      .order("sort_order");

    curriculum = modules.map((mod) => ({
      id: mod.id,
      title: mod.title,
      lessons: (lessons || [])
        .filter((l) => l.module_id === mod.id)
        .sort((a, b) => a.sort_order - b.sort_order),
    }));
  }

  // Check if user is already enrolled
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isEnrolled = false;
  if (user) {
    const { count } = await supabase
      .from("enrollments")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("course_id", course.id)
      .in("status", ["active", "manual"]);
    isEnrolled = (count || 0) > 0;
  }

  const rawOutcomes = course.outcomes || [];
  const outcomes: string[] = typeof rawOutcomes === "string" ? JSON.parse(rawOutcomes) : rawOutcomes;
  const totalMinutes = curriculum.reduce(
    (acc, mod) => acc + mod.lessons.reduce((a, l) => a + l.duration_minutes, 0),
    0,
  );

  return (
    <div className="min-h-screen">
      {/* Cinematic Hero */}
      <section className="relative bg-botanical overflow-hidden">
        <div className="absolute inset-0 bg-dawn-gradient opacity-20" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/80 text-xs font-medium">
                <BookOpen className="size-3.5" />
                {course.total_weeks} weeks · {course.total_lessons} lessons
              </div>
              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl text-white leading-tight">
                {course.title}
              </h1>
              {course.subtitle && (
                <p className="text-lg text-white/70 leading-relaxed">
                  {course.subtitle}
                </p>
              )}
              <div className="flex items-center gap-4 text-sm text-white/60">
                <span className="flex items-center gap-1.5">
                  <User className="size-4" />
                  {course.instructor_name}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="size-4" />
                  {Math.round(totalMinutes / 60)}+ hours
                </span>
              </div>

              {/* CTA */}
              {isEnrolled ? (
                <Link href={`/learn/${course.slug}/${curriculum[0]?.lessons[0]?.id || ""}`}>
                  <Button size="lg" className="gap-2 text-base">
                    <Play className="size-5" />
                    Continue Learning
                  </Button>
                </Link>
              ) : (
                <CheckoutButton
                  courseId={course.id}
                  courseSlug={course.slug}
                  priceInr={course.price_inr}
                  className="max-w-xs"
                />
              )}
            </div>

            {/* Trailer / Cover */}
            <div className="relative aspect-video rounded-bloom-lg overflow-hidden shadow-bloom-lg bg-black/20">
              {course.trailer_video_url ? (
                <video
                  src={course.trailer_video_url}
                  controls
                  className="w-full h-full object-cover"
                  poster={course.cover_image_url || undefined}
                />
              ) : course.cover_image_url ? (
                <div
                  className="w-full h-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${course.cover_image_url})` }}
                />
              ) : (
                <div className="w-full h-full bg-dawn-gradient flex items-center justify-center">
                  <Play className="size-16 text-white/50" />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* What You'll Learn */}
      {outcomes.length > 0 && (
        <section className="py-16 bg-ivory">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="font-display text-2xl sm:text-3xl text-botanical mb-8">
              What you&apos;ll learn
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {outcomes.map((outcome, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="mt-0.5 w-6 h-6 rounded-full bg-sage/20 flex items-center justify-center flex-shrink-0">
                    <Check className="size-3.5 text-sage" />
                  </div>
                  <span className="text-sm text-botanical leading-relaxed">
                    {outcome}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Curriculum */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-display text-2xl sm:text-3xl text-botanical">
              Course curriculum
            </h2>
            <span className="text-sm text-muted-foreground">
              {course.total_lessons} lessons · {Math.round(totalMinutes / 60)}+ hours
            </span>
          </div>

          <div className="space-y-4">
            {curriculum.map((mod) => (
              <details
                key={mod.id}
                className="group rounded-bloom-sm border border-border overflow-hidden bg-ivory/50"
                open
              >
                <summary className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <ChevronRight className="size-4 text-muted-foreground group-open:rotate-90 transition-transform" />
                    <h3 className="text-sm font-semibold text-botanical">
                      {mod.title}
                    </h3>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {mod.lessons.length} lessons ·{" "}
                    {mod.lessons.reduce((a, l) => a + l.duration_minutes, 0)} min
                  </span>
                </summary>

                <div className="border-t border-border divide-y divide-border">
                  {mod.lessons.map((lesson) => (
                    <div
                      key={lesson.id}
                      className="flex items-center justify-between px-5 py-3 hover:bg-white/80 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {lesson.is_free_preview ? (
                          <Play className="size-4 text-bloom-rose" />
                        ) : (
                          <Lock className="size-3.5 text-muted-foreground/50" />
                        )}
                        <span className="text-sm text-botanical">
                          {lesson.title}
                        </span>
                        {lesson.is_free_preview && (
                          <Link
                            href={`/learn/${course.slug}/${lesson.id}`}
                            className="text-xs text-bloom-rose font-medium hover:underline"
                          >
                            Free Preview
                          </Link>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {lesson.duration_minutes} min
                      </span>
                    </div>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Instructor */}
      <section className="py-16 bg-ivory">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h2 className="font-display text-2xl sm:text-3xl text-botanical mb-6">
              Your facilitator
            </h2>
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="w-20 h-20 rounded-full bg-dawn-gradient flex items-center justify-center flex-shrink-0">
                {course.instructor_photo_url ? (
                  <img
                    src={course.instructor_photo_url}
                    alt={course.instructor_name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="size-8 text-white" />
                )}
              </div>
              <div>
                <h3 className="font-display text-lg text-botanical">
                  {course.instructor_name}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {course.instructor_bio ||
                    "An experienced relationship facilitator passionate about helping people transform their connections through self-awareness, communication, and intentional growth."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-2xl sm:text-3xl text-botanical text-center mb-10">
            Members love this course
          </h2>
          <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              "The depth of this course surprised me. It's not surface-level advice — it's real inner work that changes how you show up.",
              "I was sceptical about an online course for relationships, but the AI assistant and structured reflections made all the difference.",
              "Best ₹5,000 I've ever spent. The workbooks alone are worth it. My communication has completely transformed.",
            ].map((quote, i) => (
              <div key={i} className="rounded-bloom-sm bg-ivory p-5 border border-border space-y-3">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} className="size-3.5 text-dawn-gold fill-dawn-gold" />
                  ))}
                </div>
                <p className="text-sm text-botanical/80 italic leading-relaxed">
                  &ldquo;{quote}&rdquo;
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sticky CTA (mobile) */}
      {!isEnrolled && (
        <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white border-t border-border px-4 py-3 shadow-bloom-lg">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-botanical">
                ₹{course.price_inr.toLocaleString("en-IN")}
              </p>
              <p className="text-xs text-muted-foreground">Lifetime access</p>
            </div>
            <CheckoutButton
              courseId={course.id}
              courseSlug={course.slug}
              priceInr={course.price_inr}
              size="default"
            />
          </div>
        </div>
      )}

      {/* Desktop sticky CTA sidebar indicator */}
      {!isEnrolled && (
        <div className="hidden lg:block fixed bottom-8 right-8 z-40">
          <div className="rounded-bloom bg-white border border-border shadow-bloom-lg p-5 w-72">
            <p className="font-display text-2xl text-botanical">
              ₹{course.price_inr.toLocaleString("en-IN")}
            </p>
            <p className="text-xs text-muted-foreground mt-1 mb-4">
              One-time payment · Lifetime access
            </p>
            <CheckoutButton
              courseId={course.id}
              courseSlug={course.slug}
              priceInr={course.price_inr}
              size="default"
            />
          </div>
        </div>
      )}
    </div>
  );
}
