"use client";

import { Button } from "@/components/ui/button";
import { Download, Share2, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface CertificateViewProps {
  memberName: string;
  courseTitle: string;
  instructorName: string;
  completedAt: string;
  totalLessons: number;
}

export function CertificateView({
  memberName,
  courseTitle,
  instructorName,
  completedAt,
  totalLessons,
}: CertificateViewProps) {
  const formattedDate = new Date(completedAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  function handleDownload() {
    window.print();
  }

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `I completed ${courseTitle} on Bloom!`,
          text: `I just finished all ${totalLessons} lessons of "${courseTitle}" on Bloom. My growth journey continues! 🌸`,
        });
      } catch {
        // User cancelled
      }
    } else {
      // Copy text to clipboard
      const text = `I just completed "${courseTitle}" on Bloom — all ${totalLessons} lessons! 🌸`;
      await navigator.clipboard.writeText(text);
      alert("Copied to clipboard!");
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-8">
      <Link
        href="/home"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-botanical transition-colors"
      >
        <ArrowLeft className="size-4" />
        Back to dashboard
      </Link>

      {/* Certificate card */}
      <div
        className="relative overflow-hidden rounded-3xl border-2 border-dawn-gold/30 bg-gradient-to-br from-ivory via-white to-ivory-warm p-8 sm:p-12 shadow-bloom-lg"
      >
        {/* Decorative border pattern */}
        <div className="absolute inset-3 rounded-2xl border border-dawn-gold/20 pointer-events-none" />

        {/* Corner bloom petals */}
        <svg className="absolute top-4 left-4 size-16 text-bloom-rose/10" viewBox="0 0 120 120">
          <g transform="translate(60,60)">
            {[0, 72, 144, 216, 288].map((rot) => (
              <ellipse key={rot} cx="0" cy="-22" rx="10" ry="26" transform={`rotate(${rot})`} fill="currentColor" />
            ))}
          </g>
        </svg>
        <svg className="absolute bottom-4 right-4 size-16 text-bloom-rose/10 rotate-180" viewBox="0 0 120 120">
          <g transform="translate(60,60)">
            {[0, 72, 144, 216, 288].map((rot) => (
              <ellipse key={rot} cx="0" cy="-22" rx="10" ry="26" transform={`rotate(${rot})`} fill="currentColor" />
            ))}
          </g>
        </svg>

        <div className="relative text-center space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2">
              {/* Bloom logo mark */}
              <svg width="28" height="28" viewBox="0 0 120 120" className="text-bloom-rose">
                <g transform="translate(60,60)">
                  {[0, 72, 144, 216, 288].map((rot) => (
                    <ellipse key={rot} cx="0" cy="-22" rx="10" ry="26" transform={`rotate(${rot})`} fill="currentColor" opacity="0.9" />
                  ))}
                  <circle cx="0" cy="0" r="8" fill="#E8A94F" />
                </g>
              </svg>
              <span className="font-display text-xl text-botanical tracking-wide">
                Bloom
              </span>
            </div>
            <p className="text-xs tracking-[0.3em] uppercase text-dawn-gold-dark font-medium">
              Certificate of Completion
            </p>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-dawn-gold/20" />
            <svg width="20" height="20" viewBox="0 0 120 120" className="text-dawn-gold/40">
              <g transform="translate(60,60)">
                {[0, 72, 144, 216, 288].map((rot) => (
                  <ellipse key={rot} cx="0" cy="-14" rx="6" ry="16" transform={`rotate(${rot})`} fill="currentColor" />
                ))}
              </g>
            </svg>
            <div className="flex-1 h-px bg-dawn-gold/20" />
          </div>

          {/* Member name */}
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">This certifies that</p>
            <h1 className="font-display text-3xl sm:text-4xl text-botanical">
              {memberName}
            </h1>
          </div>

          {/* Course */}
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              has successfully completed
            </p>
            <h2 className="font-display text-xl sm:text-2xl text-bloom-rose">
              {courseTitle}
            </h2>
            <p className="text-sm text-muted-foreground">
              {totalLessons} lessons · Facilitated by {instructorName}
            </p>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-dawn-gold/20" />
            <svg width="20" height="20" viewBox="0 0 120 120" className="text-dawn-gold/40">
              <g transform="translate(60,60)">
                {[0, 72, 144, 216, 288].map((rot) => (
                  <ellipse key={rot} cx="0" cy="-14" rx="6" ry="16" transform={`rotate(${rot})`} fill="currentColor" />
                ))}
              </g>
            </svg>
            <div className="flex-1 h-px bg-dawn-gold/20" />
          </div>

          {/* Date */}
          <p className="text-sm text-muted-foreground">
            Completed on {formattedDate}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-center gap-3">
        <Button onClick={handleDownload} variant="outline" className="gap-2">
          <Download className="size-4" />
          Download
        </Button>
        <Button onClick={handleShare} className="gap-2">
          <Share2 className="size-4" />
          Share
        </Button>
      </div>
    </div>
  );
}
