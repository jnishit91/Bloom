import Link from "next/link";

export function BloomLogo({ size = 28 }: { size?: number }) {
  const delays = [0, 0.2, 0.4, 1.0, 1.2];
  const angles = [0, 72, 144, 216, 288];

  return (
    <Link href="/home" className="inline-flex items-center gap-2 group">
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        className="text-bloom-rose transition-transform duration-300 group-hover:scale-105"
      >
        <style>{`
          @keyframes petalIn {
            from { opacity: 0 }
            to { opacity: 0.9 }
          }
        `}</style>
        <g transform="translate(60,55)">
          {angles.map((angle, i) => (
            <g key={angle} transform={`rotate(${angle})`}>
              <ellipse
                cx="0"
                cy="-18"
                rx="8"
                ry="22"
                fill="currentColor"
                style={{
                  opacity: 0,
                  animation: `petalIn 0.3s ease-out ${delays[i]}s forwards`,
                }}
              />
            </g>
          ))}
          <circle cx="0" cy="0" r="6" fill="#E8A94F" />
        </g>
      </svg>
      <span className="font-display text-xl text-botanical font-semibold tracking-tight">
        Bloom
      </span>
    </Link>
  );
}
