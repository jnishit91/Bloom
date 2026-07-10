import Link from "next/link";

export function BloomLogo({ size = 28 }: { size?: number }) {
  return (
    <Link href="/home" className="inline-flex items-center gap-2 group">
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        className="text-bloom-rose transition-transform duration-300 group-hover:scale-105"
      >
        <g transform="translate(60,55)" fill="currentColor" opacity="0.9">
          <ellipse cx="0" cy="-18" rx="8" ry="22" transform="rotate(0)" />
          <ellipse cx="0" cy="-18" rx="8" ry="22" transform="rotate(72)" />
          <ellipse cx="0" cy="-18" rx="8" ry="22" transform="rotate(144)" />
          <ellipse cx="0" cy="-18" rx="8" ry="22" transform="rotate(216)" />
          <ellipse cx="0" cy="-18" rx="8" ry="22" transform="rotate(288)" />
          <circle cx="0" cy="0" r="6" fill="#E8A94F" />
        </g>
      </svg>
      <span className="font-display text-xl text-botanical font-semibold tracking-tight">
        Bloom
      </span>
    </Link>
  );
}
