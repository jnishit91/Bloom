import { createClient } from "@/lib/supabase/server";
import { getEnrolledCoursesWithProgress, getCatalogCourses } from "@/lib/queries";
import { ContinueLearning } from "@/components/dashboard/continue-learning";
import { CourseCatalog } from "@/components/dashboard/course-catalog";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard — Bloom",
  description: "Your Bloom learning dashboard.",
};

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: { full_name: string | null } | null = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  const firstName = profile?.full_name?.split(" ")[0] || "there";

  const enrolledCourses = user
    ? await getEnrolledCoursesWithProgress(supabase, user.id)
    : [];

  const catalogCourses = await getCatalogCourses(supabase);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="space-y-10">
        {/* Welcome */}
        <div className="space-y-2">
          <h1 className="font-display text-3xl sm:text-4xl text-botanical tracking-tight">
            Welcome back, {firstName}
          </h1>
          <p className="text-muted-foreground text-lg">
            Pick up where you left off, or discover something new.
          </p>
        </div>

        {/* Continue Learning */}
        <ContinueLearning courses={enrolledCourses} />

        {/* Catalog */}
        <CourseCatalog courses={catalogCourses} />
      </div>
    </div>
  );
}
