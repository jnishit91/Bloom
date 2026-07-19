"use client";

import { useEffect, useRef } from "react";

const AVATAR_COLORS = [
  "bg-bloom-rose",
  "bg-sage",
  "bg-dawn-gold",
  "bg-bloom-rose-light",
  "bg-sage-light",
  "bg-dawn-gold-light",
  "bg-bloom-rose-dark",
  "bg-sage-dark",
  "bg-dawn-gold-dark",
];

const testimonials = [
  {
    quote:
      "I finally understand why I kept repeating the same patterns. This course gave me the tools to break free and love differently.",
    name: "Priya K.",
    detail: "The Art of Conscious Love",
  },
  {
    quote:
      "The AI assistant is incredible — it's like having a wise mentor available 24/7. I could ask questions and get clarity instantly.",
    name: "Arjun M.",
    detail: "Week 2 was life-changing",
  },
  {
    quote:
      "Worth every rupee. The quality is better than courses I've paid 10x for. My partner and I are communicating better than ever.",
    name: "Sneha R.",
    detail: "Enrolled as a couple",
  },
  {
    quote:
      "I was skeptical about an online course helping my marriage. After week two, my husband noticed the difference before I even told him.",
    name: "Meera G.",
    detail: "Healing Attachment Wounds",
  },
  {
    quote:
      "The journal prompts hit different. I cried on day three — in a healing way. This isn't surface-level stuff.",
    name: "Aditya K.",
    detail: "The Art of Conscious Love",
  },
  {
    quote:
      "Three months in, and my therapist asked what I'd been doing differently. I showed her Bloom. She now recommends it.",
    name: "Kavita R.",
    detail: "Communication Mastery",
  },
  {
    quote:
      "I'm single and took this for myself. Understanding my attachment style completely changed who I'm attracted to — in the best way.",
    name: "Neha S.",
    detail: "Healing Attachment Wounds",
  },
  {
    quote:
      "My partner and I took this together. We went from constant arguments to actually hearing each other.",
    name: "Sneha R.",
    detail: "Communication Mastery",
  },
  {
    quote:
      "The community discussions are incredible. Knowing others are going through the same things made me feel so much less alone.",
    name: "Ananya T.",
    detail: "The Art of Conscious Love",
  },
];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function TestimonialCard({
  quote,
  name,
  detail,
  index,
}: {
  quote: string;
  name: string;
  detail: string;
  index: number;
}) {
  const initials = getInitials(name);
  const colorClass = AVATAR_COLORS[index % AVATAR_COLORS.length];

  return (
    <div className="rounded-bloom bg-ivory p-5 border border-border space-y-3 flex-shrink-0">
      <span className="text-sm text-dawn-gold tracking-wider">★★★★★</span>
      <p className="text-botanical text-sm leading-relaxed italic">
        &ldquo;{quote}&rdquo;
      </p>
      <div className="flex items-center gap-2.5">
        <div
          className={`w-8 h-8 rounded-full ${colorClass} flex items-center justify-center text-white text-xs font-semibold flex-shrink-0`}
        >
          {initials}
        </div>
        <div>
          <p className="text-sm font-medium text-botanical">{name}</p>
          <p className="text-xs text-muted-foreground">{detail}</p>
        </div>
      </div>
    </div>
  );
}

function TickerColumn({
  items,
  direction,
  duration,
}: {
  items: typeof testimonials;
  direction: "up" | "down";
  duration: number;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleMouseEnter = () => {
      el.style.animationPlayState = "paused";
    };
    const handleMouseLeave = () => {
      el.style.animationPlayState = "running";
    };

    el.addEventListener("mouseenter", handleMouseEnter);
    el.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      el.removeEventListener("mouseenter", handleMouseEnter);
      el.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <div className="flex-1 max-w-[340px] overflow-hidden relative">
      <div
        ref={scrollRef}
        className="flex flex-col gap-4"
        style={{
          animation: `ticker-${direction} ${duration}s linear infinite`,
        }}
      >
        {[...items, ...items].map((t, i) => (
          <TestimonialCard key={i} {...t} index={i} />
        ))}
      </div>
    </div>
  );
}

export function TestimonialTicker() {
  const col1 = testimonials.slice(0, 3);
  const col2 = testimonials.slice(3, 6);
  const col3 = testimonials.slice(6, 9);

  return (
    <div
      className="flex gap-5 justify-center mx-auto max-w-7xl px-4"
      style={{
        height: "520px",
        overflow: "hidden",
        maskImage:
          "linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)",
      }}
    >
      <TickerColumn items={col1} direction="up" duration={25} />
      <div className="hidden sm:block flex-1 max-w-[340px]">
        <TickerColumn items={col2} direction="down" duration={30} />
      </div>
      <div className="hidden lg:block flex-1 max-w-[340px]">
        <TickerColumn items={col3} direction="up" duration={28} />
      </div>
    </div>
  );
}
