"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export function BloomLogo({ size = 28 }: { size?: number }) {
  const [petalsVisible, setPetalsVisible] = useState(1);

  useEffect(() => {
    if (petalsVisible >= 5) return;
    const delay = 1000;
    const timer = setTimeout(() => {
      setPetalsVisible((p) => p + 1);
    }, delay);
    return () => clearTimeout(timer);
  }, [petalsVisible]);

  const petalAngles = [0, 72, 144, 216, 288];

  return (
    <Link href="/home" className="inline-flex items-center gap-2 group">
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        className="text-bloom-rose transition-transform duration-300 group-hover:scale-105"
      >
        <g transform="translate(60,55)">
          {petalAngles.map((angle, i) => (
            <ellipse
              key={angle}
              cx="0"
              cy="-18"
              rx="8"
              ry="22"
              fill="currentColor"
              opacity={i < petalsVisible ? 0.9 : 0}
              transform={`rotate(${angle})`}
              style={{
                transition: "opacity 0.8s ease-out, transform 0.8s ease-out",
                transformOrigin: "0px 0px",
              }}
            />
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
