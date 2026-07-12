import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  BookOpen,
  Users,
  Heart,
  MessageCircle,
  ChevronRight,
  Play,
  Shield,
  Star,
  Zap,
  ArrowRight,
} from "lucide-react";

export default async function HomePage() {
  const supabase = await createClient();

  // Fetch published courses for the featured section
  const { data: courses } = await supabase
    .from("courses")
    .select("id, slug, title, subtitle, cover_image_url, total_lessons, total_weeks, price_inr, instructor_name")
    .eq("status", "published")
    .order("created_at")
    .limit(3);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Nav */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-ivory/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <BloomIcon />
            <span className="font-display text-xl text-botanical">Bloom</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Log in</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-dawn-gradient-subtle">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-bloom-rose/10 text-bloom-rose text-sm font-medium mb-6">
              <Sparkles className="size-4" />
              Transform your relationships
            </div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-botanical tracking-tight leading-[1.1]">
              Love better.{" "}
              <span className="text-bloom-rose">Heal deeper.</span>{" "}
              Grow together.
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Premium courses that guide you through the inner work of relationships — communication, healing, intimacy, and becoming your highest self.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/courses">
                <Button size="lg" className="gap-2 text-base px-8">
                  Explore Courses
                  <ArrowRight className="size-5" />
                </Button>
              </Link>
              <Link href="/signup">
                <Button variant="outline" size="lg" className="gap-2 text-base">
                  Start Free Preview
                  <Play className="size-4" />
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Every course ₹5,000 · Lifetime access · AI-powered learning
            </p>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-40 h-40 rounded-full bg-bloom-rose/5 blur-3xl" />
        <div className="absolute bottom-10 right-10 w-60 h-60 rounded-full bg-dawn-gold/5 blur-3xl" />
      </section>

      {/* Featured Courses */}
      {courses && courses.length > 0 && (
        <section className="py-20 bg-ivory">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="font-display text-3xl sm:text-4xl text-botanical">
                Courses that change lives
              </h2>
              <p className="mt-3 text-muted-foreground text-lg max-w-xl mx-auto">
                Each course is a guided transformation — not just information, but real inner work.
              </p>
            </div>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <Link
                  key={course.id}
                  href={`/courses/${course.slug}`}
                  className="group rounded-bloom bg-white border border-border overflow-hidden shadow-bloom-sm hover:shadow-bloom transition-all duration-200"
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
                  </div>
                  <div className="p-6 space-y-3">
                    <h3 className="font-display text-xl text-botanical leading-snug">
                      {course.title}
                    </h3>
                    {course.subtitle && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {course.subtitle}
                      </p>
                    )}
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-sm text-muted-foreground">
                        {course.total_weeks} weeks · {course.total_lessons} lessons
                      </span>
                      <span className="font-semibold text-botanical">
                        ₹{course.price_inr.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="text-center mt-10">
              <Link href="/courses">
                <Button variant="outline" className="gap-2">
                  View All Courses
                  <ChevronRight className="size-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl sm:text-4xl text-botanical">
              How Bloom works
            </h2>
            <p className="mt-3 text-muted-foreground text-lg">
              A simple path to deeper relationships
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: BookOpen,
                title: "Choose your course",
                desc: "Pick the relationship area you want to transform. Each course is 4 weeks of guided inner work.",
              },
              {
                icon: Play,
                title: "Watch & learn",
                desc: "Expert-led video lessons with real stories, practical frameworks, and exercises that shift how you relate.",
              },
              {
                icon: Sparkles,
                title: "Get AI support",
                desc: "Bloom AI summarises lessons, quizzes you, and answers your questions — like a wise friend who's always there.",
              },
              {
                icon: Heart,
                title: "Transform",
                desc: "Complete reflections, journal prompts, and workbooks. Watch your relationships — and yourself — bloom.",
              },
            ].map((step, i) => (
              <div key={i} className="text-center space-y-3">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-bloom-rose/10 flex items-center justify-center">
                  <step.icon className="size-6 text-bloom-rose" />
                </div>
                <h3 className="font-display text-lg text-botanical">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Facilitator / Credibility */}
      <section className="py-20 bg-ivory">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-dawn-gradient flex items-center justify-center">
              <Users className="size-8 text-white" />
            </div>
            <h2 className="font-display text-3xl sm:text-4xl text-botanical">
              Created by relationship experts
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Every Bloom course is designed by experienced facilitators who have spent years helping couples and individuals navigate the complexities of love, healing, and intimacy. This isn&apos;t generic advice — it&apos;s structured transformation.
            </p>
            <div className="flex items-center justify-center gap-8 pt-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield className="size-4 text-sage" />
                Evidence-based methods
              </div>
              <div className="flex items-center gap-2">
                <Star className="size-4 text-dawn-gold" />
                Practitioner-designed
              </div>
              <div className="flex items-center gap-2">
                <Zap className="size-4 text-bloom-rose" />
                AI-enhanced learning
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl sm:text-4xl text-botanical text-center mb-12">
            What our members say
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                quote: "I finally understand why I kept repeating the same patterns. This course gave me the tools to break free and love differently.",
                name: "Priya K.",
                detail: "The Art of Conscious Love",
              },
              {
                quote: "The AI assistant is incredible — it's like having a wise mentor available 24/7. I could ask questions and get clarity instantly.",
                name: "Arjun M.",
                detail: "Week 2 was life-changing",
              },
              {
                quote: "Worth every rupee. The quality is better than courses I've paid 10x for. My partner and I are communicating better than ever.",
                name: "Sneha R.",
                detail: "Enrolled as a couple",
              },
            ].map((t, i) => (
              <div
                key={i}
                className="rounded-bloom bg-ivory p-6 space-y-4 border border-border"
              >
                <MessageCircle className="size-5 text-bloom-rose/40" />
                <p className="text-botanical text-sm leading-relaxed italic">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div>
                  <p className="text-sm font-medium text-botanical">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 bg-botanical text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-3xl sm:text-4xl">
            Simple, honest pricing
          </h2>
          <p className="mt-4 text-white/70 text-lg max-w-xl mx-auto">
            No subscriptions. No hidden fees. One payment, lifetime access.
          </p>
          <div className="mt-10 max-w-sm mx-auto rounded-bloom-lg bg-white/10 backdrop-blur-sm border border-white/20 p-8">
            <p className="text-white/60 text-sm uppercase tracking-wider font-medium">
              Every course
            </p>
            <p className="font-display text-5xl mt-2">
              ₹5,000
            </p>
            <p className="text-white/60 mt-2 text-sm">
              GST inclusive · Lifetime access
            </p>
            <ul className="mt-6 space-y-3 text-left text-sm">
              {[
                "All video lessons + transcripts",
                "AI learning assistant (Bloom AI)",
                "Interactive quizzes & reflections",
                "Downloadable workbooks",
                "Community discussions",
                "Lifetime access, learn at your pace",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-bloom-rose mt-0.5">✓</span>
                  <span className="text-white/90">{item}</span>
                </li>
              ))}
            </ul>
            <Link href="/courses" className="block mt-8">
              <Button size="lg" className="w-full text-base">
                Browse Courses
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-ivory">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl sm:text-4xl text-botanical text-center mb-12">
            Frequently asked questions
          </h2>
          <div className="space-y-4">
            {[
              {
                q: "How long do I have access to a course?",
                a: "Lifetime. Once you enroll, the course is yours forever. Go at your own pace — there are no deadlines.",
              },
              {
                q: "What payment methods do you accept?",
                a: "We accept UPI (GPay, PhonePe, Paytm), debit/credit cards, netbanking, and wallets via Razorpay. UPI is the fastest way to pay.",
              },
              {
                q: "Can I share my account with my partner?",
                a: "Each enrollment is for one person. We recommend both partners enroll — couples who learn together grow together.",
              },
              {
                q: "What is Bloom AI?",
                a: "Bloom AI is your personal learning companion built into every lesson. It can summarise content, quiz you on what you've learned, and answer your questions — available 24/7.",
              },
              {
                q: "Is this therapy?",
                a: "No. Bloom courses are educational, not therapeutic. They're designed by relationship experts, but if you're in crisis, we always recommend working with a licensed professional.",
              },
              {
                q: "Can I get a refund?",
                a: "If you're not satisfied within 7 days of purchase and haven't completed more than 20% of the course, contact us for a full refund.",
              },
            ].map((faq, i) => (
              <details
                key={i}
                className="group rounded-bloom-sm bg-white border border-border overflow-hidden"
              >
                <summary className="flex items-center justify-between px-5 py-4 cursor-pointer text-sm font-medium text-botanical hover:bg-muted/50 transition-colors">
                  {faq.q}
                  <ChevronRight className="size-4 text-muted-foreground group-open:rotate-90 transition-transform" />
                </summary>
                <p className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-botanical text-white/70 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <BloomIcon light />
              <span className="font-display text-lg text-white">Bloom</span>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <Link href="/courses" className="hover:text-white transition-colors">
                Courses
              </Link>
              <Link href="/login" className="hover:text-white transition-colors">
                Log in
              </Link>
              <Link href="/signup" className="hover:text-white transition-colors">
                Sign up
              </Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-white/10 text-center text-xs">
            <p>© {new Date().getFullYear()} Bloom. All rights reserved.</p>
            <p className="mt-1">Made with love in India.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function BloomIcon({ light = false }: { light?: boolean }) {
  const petalColor = light ? "#FFFFFF" : "#E75D7C";
  const centerColor = light ? "#E8A94F" : "#E8A94F";
  return (
    <svg width="28" height="28" viewBox="0 0 40 40">
      {[0, 72, 144, 216, 288].map((angle) => (
        <ellipse
          key={angle}
          cx="20"
          cy="12"
          rx="6"
          ry="12"
          fill={petalColor}
          opacity={0.85}
          transform={`rotate(${angle} 20 20)`}
        />
      ))}
      <circle cx="20" cy="20" r="4" fill={centerColor} />
    </svg>
  );
}
