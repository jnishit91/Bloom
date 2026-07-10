"use client";

/** Circular SVG progress ring */
export function ProgressRing({
  progress,
  size = 48,
  strokeWidth = 4,
  className,
}: {
  progress: number; // 0–1
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(1, Math.max(0, progress)));

  return (
    <svg width={size} height={size} className={className}>
      {/* Background ring */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-muted/40"
      />
      {/* Progress arc */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="text-bloom-rose transition-all duration-700 ease-out"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      {/* Center text */}
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-botanical text-[10px] font-semibold"
      >
        {Math.round(progress * 100)}%
      </text>
    </svg>
  );
}

/** Five-petal bloom motif that fills petals as modules complete */
export function BloomProgress({
  completedModules,
  totalModules,
  size = 64,
}: {
  completedModules: number;
  totalModules: number;
  size?: number;
}) {
  const petals = Math.min(totalModules, 5);

  return (
    <svg width={size} height={size} viewBox="0 0 120 120">
      <g transform="translate(60,60)">
        {Array.from({ length: petals }).map((_, i) => {
          const rotation = (360 / petals) * i;
          const filled = i < completedModules;
          return (
            <ellipse
              key={i}
              cx="0"
              cy="-22"
              rx="10"
              ry="26"
              transform={`rotate(${rotation})`}
              fill={filled ? "#E75D7C" : "#E5E0D5"}
              opacity={filled ? 0.9 : 0.4}
              className="transition-all duration-500 ease-out"
            />
          );
        })}
        <circle
          cx="0"
          cy="0"
          r="8"
          fill={completedModules >= totalModules ? "#E8A94F" : "#E5E0D5"}
          className="transition-all duration-500 ease-out"
        />
      </g>
      {completedModules >= totalModules && (
        <text
          x="60"
          y="105"
          textAnchor="middle"
          className="fill-bloom-rose text-[9px] font-semibold"
        >
          Complete!
        </text>
      )}
    </svg>
  );
}
