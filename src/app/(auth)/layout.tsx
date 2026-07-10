import { AuthArtwork } from "@/components/auth/auth-artwork";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <AuthArtwork />

      <div className="flex flex-1 flex-col justify-center px-6 py-12 lg:px-12">
        <div className="mb-8 lg:hidden">
          <Link href="/" className="inline-flex items-center gap-2">
            <svg width="32" height="32" viewBox="0 0 120 120" className="text-bloom-rose">
              <g transform="translate(60,55)" fill="currentColor" opacity="0.9">
                <ellipse cx="0" cy="-18" rx="8" ry="22" transform="rotate(0)" />
                <ellipse cx="0" cy="-18" rx="8" ry="22" transform="rotate(72)" />
                <ellipse cx="0" cy="-18" rx="8" ry="22" transform="rotate(144)" />
                <ellipse cx="0" cy="-18" rx="8" ry="22" transform="rotate(216)" />
                <ellipse cx="0" cy="-18" rx="8" ry="22" transform="rotate(288)" />
                <circle cx="0" cy="0" r="6" fill="#E8A94F" />
              </g>
            </svg>
            <span className="font-display text-xl text-botanical">Bloom</span>
          </Link>
        </div>

        <div className="flex flex-col items-center lg:items-start">
          {children}
        </div>
      </div>
    </div>
  );
}
