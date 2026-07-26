import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  BookOpen,
  Users,
  Heart,
  ChevronRight,
  Play,
  Shield,
  Star,
  Zap,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { TestimonialTicker } from "@/components/landing/testimonial-ticker";
import { BloomAnimation } from "@/components/landing/bloom-animation";
import { FadeIn } from "@/components/landing/fade-in";
import { LandingMobileNav } from "@/components/landing/landing-mobile-nav";

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
            <span id="nav-bloom-logo" className="flex items-center gap-2">
              <BloomIcon />
              <span className="font-display text-xl text-botanical">Bloom</span>
            </span>
          </Link>
          <div className="hidden sm:flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Log in</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
          <LandingMobileNav />
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-dawn-gradient-subtle">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-bloom-rose/10 text-bloom-rose text-sm font-medium mb-6 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}>
              <Sparkles className="size-4" />
              Transform your relationships
            </div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-botanical tracking-tight leading-[1.1] opacity-0 animate-fade-in-up" style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}>
              Love better.{" "}
              <span className="text-bloom-rose">Heal deeper.</span>{" "}
              Grow together.
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed opacity-0 animate-fade-in-up" style={{ animationDelay: '0.55s', animationFillMode: 'forwards' }}>
              Premium courses that guide you through the inner work of relationships — communication, healing, intimacy, and becoming your highest self.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.75s', animationFillMode: 'forwards' }}>
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
            <p className="mt-4 text-sm text-muted-foreground opacity-0 animate-fade-in-up" style={{ animationDelay: '0.9s', animationFillMode: 'forwards' }}>
              Lifetime access · AI-powered learning
            </p>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-40 h-40 rounded-full bg-bloom-rose/5 blur-3xl" />
        <div className="absolute bottom-10 right-10 w-60 h-60 rounded-full bg-dawn-gold/5 blur-3xl" />
      </section>

      {/* Bloom Scroll Animation */}
      <BloomAnimation />

      {/* Featured Courses */}
      {courses && courses.length > 0 && (
        <section className="relative py-24 bg-ivory overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-bloom-rose/[0.03] blur-3xl -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-dawn-gold/[0.04] blur-3xl translate-y-1/3 -translate-x-1/4" />
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
            <FadeIn className="text-center mb-14">
              <p className="text-sm font-medium text-bloom-rose tracking-wider uppercase mb-3">Explore</p>
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl text-botanical">
                Courses that change lives
              </h2>
              <p className="mt-4 text-muted-foreground text-lg max-w-xl mx-auto">
                Each course is a guided transformation — not just information, but real inner work.
              </p>
            </FadeIn>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course, i) => (
                <FadeIn key={course.id} delay={i * 150}>
                  <Link
                    href={`/courses/${course.slug}`}
                    className="group block rounded-bloom-lg bg-white border border-border overflow-hidden shadow-bloom-sm hover:shadow-bloom-lg hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden">
                      {course.cover_image_url ? (
                        <div
                          className="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform duration-500"
                          style={{ backgroundImage: `url(${course.cover_image_url})` }}
                        />
                      ) : (
                        <div className="w-full h-full bg-dawn-gradient group-hover:scale-105 transition-transform duration-500" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                    <div className="p-6 space-y-3">
                      <h3 className="font-display text-xl text-botanical leading-snug group-hover:text-bloom-rose transition-colors duration-200">
                        {course.title}
                      </h3>
                      {course.subtitle && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {course.subtitle}
                        </p>
                      )}
                      <div className="pt-2 border-t border-border/50">
                        <span className="text-sm text-muted-foreground">
                          {course.total_weeks} weeks · {course.total_lessons} lessons
                        </span>
                      </div>
                    </div>
                  </Link>
                </FadeIn>
              ))}
            </div>
            <FadeIn className="text-center mt-12" delay={450}>
              <Link href="/courses">
                <Button variant="outline" size="lg" className="gap-2 text-base">
                  View All Courses
                  <ChevronRight className="size-4" />
                </Button>
              </Link>
            </FadeIn>
          </div>
        </section>
      )}

      {/* How It Works */}
      <section className="relative py-24 bg-white overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(143,174,148,0.05)_0%,transparent_50%)]" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <FadeIn className="text-center mb-16">
            <p className="text-sm font-medium text-sage tracking-wider uppercase mb-3">Your Journey</p>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl text-botanical">
              How Bloom works
            </h2>
            <p className="mt-4 text-muted-foreground text-lg">
              A simple path to deeper relationships
            </p>
          </FadeIn>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: BookOpen,
                title: "Choose your course",
                desc: "Pick the relationship area you want to transform. Each course is 4 weeks of guided inner work.",
                accent: "bg-bloom-rose/10 text-bloom-rose",
              },
              {
                icon: Play,
                title: "Watch & learn",
                desc: "Expert-led video lessons with real stories, practical frameworks, and exercises that shift how you relate.",
                accent: "bg-dawn-gold/10 text-dawn-gold",
              },
              {
                icon: Sparkles,
                title: "Get AI support",
                desc: "Bloom AI summarises lessons, quizzes you, and answers your questions — like a wise friend who's always there.",
                accent: "bg-sage/10 text-sage",
              },
              {
                icon: Heart,
                title: "Transform",
                desc: "Complete reflections, journal prompts, and workbooks. Watch your relationships — and yourself — bloom.",
                accent: "bg-bloom-rose/10 text-bloom-rose",
              },
            ].map((step, i) => (
              <FadeIn key={i} delay={i * 120}>
                <div className="group relative text-center space-y-4 p-6 rounded-bloom bg-ivory/50 border border-transparent hover:border-border hover:bg-white hover:shadow-bloom transition-all duration-300">
                  <div className="text-xs font-semibold text-muted-foreground/50 tracking-widest uppercase">Step {i + 1}</div>
                  <div className={`w-14 h-14 mx-auto rounded-2xl ${step.accent} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <step.icon className="size-6" />
                  </div>
                  <h3 className="font-display text-lg text-botanical">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Facilitator / Credibility */}
      <section className="relative py-24 overflow-hidden" style={{ background: 'linear-gradient(135deg, #FAF6EF 0%, #FFF8ED 50%, #FFF0F3 100%)' }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <FadeIn>
              <div className="relative rounded-bloom-lg bg-white/70 backdrop-blur-sm border border-border/50 p-10 sm:p-14 text-center shadow-bloom">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2">
                  <div className="w-12 h-12 rounded-full bg-dawn-gradient flex items-center justify-center shadow-bloom">
                    <Users className="size-5 text-white" />
                  </div>
                </div>
                <p className="text-sm font-medium text-dawn-gold tracking-wider uppercase mb-4 mt-2">Why Bloom</p>
                <h2 className="font-display text-3xl sm:text-4xl text-botanical">
                  Created by relationship experts
                </h2>
                <p className="mt-5 text-muted-foreground text-lg leading-relaxed max-w-2xl mx-auto">
                  Every Bloom course is designed by experienced facilitators who have spent years helping couples and individuals navigate the complexities of love, healing, and intimacy. This isn&apos;t generic advice — it&apos;s structured transformation.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 pt-8 mt-8 border-t border-border/50">
                  {[
                    { icon: Shield, label: "Evidence-based methods", color: "text-sage" },
                    { icon: Star, label: "Practitioner-designed", color: "text-dawn-gold" },
                    { icon: Zap, label: "AI-enhanced learning", color: "text-bloom-rose" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <item.icon className={`size-4 ${item.color}`} />
                      {item.label}
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative py-24 bg-white overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-bloom-rose/[0.02] blur-3xl" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <FadeIn className="text-center mb-14">
            <p className="text-sm font-medium text-bloom-rose tracking-wider uppercase mb-3">Testimonials</p>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl text-botanical">
              What our members say
            </h2>
          </FadeIn>
        </div>
        <FadeIn>
          <TestimonialTicker />
        </FadeIn>
      </section>

      {/* Pricing */}
      <section className="relative py-24 bg-botanical text-white overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(231,93,124,0.08)_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(232,169,79,0.06)_0%,transparent_50%)]" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center relative">
          <div>
            <p className="text-sm font-medium text-bloom-rose tracking-wider uppercase mb-3">What you get</p>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl">
              Everything included
            </h2>
            <p className="mt-4 text-white/60 text-lg max-w-xl mx-auto">
              No subscriptions. No hidden fees. One payment, lifetime access.
            </p>
          </div>
          <div className="mt-12 max-w-md mx-auto relative">
            <div className="absolute -inset-[1px] rounded-bloom-lg bg-gradient-to-b from-white/20 to-white/5" />
            <div className="relative rounded-bloom-lg bg-white/[0.08] backdrop-blur-sm p-10">
              <ul className="space-y-4 text-left text-sm">
                {[
                  "All video lessons + transcripts",
                  "AI learning assistant (Bloom AI)",
                  "Interactive quizzes & reflections",
                  "Downloadable workbooks",
                  "Community discussions",
                  "Lifetime access, learn at your pace",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="size-4 text-bloom-rose mt-0.5 shrink-0" />
                    <span className="text-white/85">{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/courses" className="block mt-10">
                <Button size="lg" className="w-full text-base">
                  Browse Courses
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="relative py-24 bg-ivory overflow-hidden">
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-sage/[0.04] blur-3xl translate-x-1/3 translate-y-1/4" />
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 relative">
          <FadeIn className="text-center mb-14">
            <p className="text-sm font-medium text-sage tracking-wider uppercase mb-3">FAQ</p>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl text-botanical">
              Frequently asked questions
            </h2>
          </FadeIn>
          <div className="space-y-3">
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
            ].map((faq, i) => (
              <FadeIn key={i} delay={i * 80}>
                <details className="group rounded-bloom bg-white border border-border/70 overflow-hidden shadow-bloom-sm">
                  <summary className="flex items-center justify-between px-6 py-5 cursor-pointer text-[15px] font-medium text-botanical hover:text-bloom-rose transition-colors">
                    {faq.q}
                    <ChevronRight className="size-4 text-muted-foreground group-open:rotate-90 transition-transform duration-200 shrink-0 ml-4" />
                  </summary>
                  <p className="px-6 pb-5 text-sm text-muted-foreground leading-relaxed">
                    {faq.a}
                  </p>
                </details>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-botanical text-white/70 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-3">
              <BloomIcon light />
              <span className="font-display text-xl text-white">Bloom</span>
            </div>
            <div className="flex items-center gap-8 text-sm">
              <Link href="/courses" className="hover:text-white transition-colors duration-200">
                Courses
              </Link>
              <Link href="/login" className="hover:text-white transition-colors duration-200">
                Log in
              </Link>
              <Link href="/signup" className="hover:text-white transition-colors duration-200">
                Sign up
              </Link>
            </div>
          </div>
          <div className="mt-10 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <p>&copy; {new Date().getFullYear()} Bloom. All rights reserved.</p>
            <p className="text-white/40">Made with love in India.</p>
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
