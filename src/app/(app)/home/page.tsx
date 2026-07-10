import { createClient } from "@/lib/supabase/server";
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

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="space-y-8">
        {/* Welcome */}
        <div className="space-y-2">
          <h1 className="font-display text-3xl sm:text-4xl text-botanical tracking-tight">
            Welcome back, {firstName}
          </h1>
          <p className="text-muted-foreground text-lg">
            Pick up where you left off, or discover something new.
          </p>
        </div>

        {/* Continue Learning — empty state */}
        <section className="space-y-4">
          <h2 className="font-display text-xl text-botanical">
            Continue Learning
          </h2>
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
              Enrol in a course to begin transforming your relationships. Each
              lesson brings you closer to the love you deserve.
            </p>
            <a
              href="/courses"
              className="inline-flex items-center gap-2 rounded-xl bg-bloom-rose px-6 py-3 text-white font-medium shadow-bloom-sm hover:bg-bloom-rose-dark hover:shadow-bloom transition-all duration-200"
            >
              Browse Courses
            </a>
          </div>
        </section>

        {/* Catalog preview — placeholder */}
        <section className="space-y-4">
          <h2 className="font-display text-xl text-botanical">
            Explore Courses
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Placeholder cards will be populated in Phase 2/4 */}
            <div className="rounded-bloom bg-white border border-border overflow-hidden shadow-bloom-sm">
              <div className="aspect-[4/3] bg-dawn-gradient" />
              <div className="p-5 space-y-2">
                <span className="text-xs font-medium text-sage-dark uppercase tracking-wider">
                  Relationships
                </span>
                <h3 className="font-display text-lg text-botanical">
                  The Art of Conscious Love
                </h3>
                <p className="text-sm text-muted-foreground">
                  4 weeks · 20 lessons · ₹5,000
                </p>
              </div>
            </div>

            <div className="rounded-bloom bg-white border border-border overflow-hidden shadow-bloom-sm opacity-60">
              <div className="aspect-[4/3] bg-gradient-to-br from-[#1a1a2e] via-sage to-dawn-gold" />
              <div className="p-5 space-y-2">
                <span className="text-xs font-medium text-sage-dark uppercase tracking-wider">
                  Coming Soon
                </span>
                <h3 className="font-display text-lg text-botanical">
                  Healing After Heartbreak
                </h3>
                <p className="text-sm text-muted-foreground">
                  3 weeks · 15 lessons
                </p>
              </div>
            </div>

            <div className="rounded-bloom bg-white border border-border overflow-hidden shadow-bloom-sm opacity-60">
              <div className="aspect-[4/3] bg-gradient-to-br from-[#2D1B33] via-bloom-rose-dark to-dawn-gold" />
              <div className="p-5 space-y-2">
                <span className="text-xs font-medium text-sage-dark uppercase tracking-wider">
                  Coming Soon
                </span>
                <h3 className="font-display text-lg text-botanical">
                  The Language of Desire
                </h3>
                <p className="text-sm text-muted-foreground">
                  4 weeks · 16 lessons
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
