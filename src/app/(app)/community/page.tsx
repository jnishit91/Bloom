import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Community — Bloom",
  description: "Connect with fellow Bloom members.",
};

export default function CommunityPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="font-display text-3xl text-botanical tracking-tight mb-2">
        Community
      </h1>
      <p className="text-muted-foreground text-lg">
        A space for reflection and connection. Coming in Phase 6.
      </p>
    </div>
  );
}
