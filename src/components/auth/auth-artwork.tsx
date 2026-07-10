"use client";

export function BloomPetal({
  index,
  total = 5,
  size = 120,
}: {
  index: number;
  total?: number;
  size?: number;
}) {
  const rotation = (360 / total) * index;
  return (
    <ellipse
      cx={size / 2}
      cy={size / 4}
      rx={size / 8}
      ry={size / 3.5}
      fill="rgba(255,255,255,0.15)"
      transform={`rotate(${rotation} ${size / 2} ${size / 2})`}
      className="animate-petal-unfurl"
      style={{ animationDelay: `${index * 0.12}s` }}
    />
  );
}

export function BloomMotif({ size = 120 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="animate-float-gentle"
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <BloomPetal key={i} index={i} total={5} size={size} />
      ))}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={size / 12}
        fill="rgba(232,169,79,0.8)"
        className="animate-bloom-pulse"
      />
    </svg>
  );
}

export function AuthArtwork() {
  return (
    <div className="hidden lg:flex lg:w-1/2 bg-dawn-gradient relative overflow-hidden items-center justify-center">
      {/* Decorative circles */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-white/5 blur-sm" />
      <div className="absolute bottom-1/3 right-1/4 w-48 h-48 rounded-full bg-white/5 blur-sm" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full border border-white/10" />

      {/* Bloom motif */}
      <div className="relative z-10 flex flex-col items-center gap-8">
        <BloomMotif size={160} />
        <div className="text-center space-y-3">
          <h2 className="font-display text-4xl text-white/95 tracking-tight">
            Bloom
          </h2>
          <p className="text-white/70 text-lg max-w-xs">
            Where relationships transform and love finds its highest expression
          </p>
        </div>
      </div>
    </div>
  );
}
