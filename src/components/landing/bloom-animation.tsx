'use client';

import { useEffect, useRef, useCallback } from 'react';

const RX = 8, RY = 22;
const ANGLES = [0, 60, 120, 180, 240, 300];
const PS = [0.03, 0.08, 0.13, 0.18, 0.23, 0.28];
const PD = 0.06;

function easeOut(t: number) { return 1 - Math.pow(1 - t, 3); }
function easeOutBack(t: number) {
  const c = 1.7;
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
}
function easeInOut(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
function mix(a: number, b: number, t: number) { return a + (b - a) * t; }
function clamp01(v: number) { return v < 0 ? 0 : v > 1 ? 1 : v; }

const WORDS: [number, number, number, number, string][] = [
  [0.48, 0.53, 0.56, 0.60, 'Relationships'],
  [0.61, 0.66, 0.69, 0.73, 'Friendships'],
  [0.74, 0.79, 0.82, 0.86, 'Love'],
];

export function BloomAnimation() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const flowerRef = useRef<SVGSVGElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const bloomRef = useRef<HTMLSpanElement>(null);
  const ingRef = useRef<HTMLSpanElement>(null);
  const suffixRef = useRef<HTMLSpanElement>(null);
  const navCacheRef = useRef<{ cx: number; cy: number; h: number } | null>(null);

  const getMax = useCallback(() => {
    if (typeof window === 'undefined') return 320;
    const w = window.innerWidth;
    return w < 480 ? 180 : w < 768 ? 240 : 320;
  }, []);

  useEffect(() => {
    let ticking = false;
    let MAX = getMax();
    const MIN = 60;

    const update = () => {
      ticking = false;
      const wrapper = wrapperRef.current;
      if (!wrapper) return;

      const rect = wrapper.getBoundingClientRect();
      const maxScroll = wrapper.offsetHeight - window.innerHeight;
      if (maxScroll <= 0) return;

      const scrolled = -rect.top;
      if (scrolled < -window.innerHeight || scrolled > maxScroll + window.innerHeight) return;
      const p = clamp01(scrolled / maxScroll);

      // ── Flower size ──
      const sizeT = easeOut(clamp01(p / 0.38));
      const sz = mix(MIN, MAX, sizeT);
      if (flowerRef.current) {
        flowerRef.current.style.width = sz + 'px';
        flowerRef.current.style.height = sz + 'px';
      }

      // ── Glow ──
      if (glowRef.current) {
        const gs = sz * 2.4;
        glowRef.current.style.width = gs + 'px';
        glowRef.current.style.height = gs + 'px';
        glowRef.current.style.opacity = String(clamp01(p * 3));
      }

      // ── Petals ──
      const petals = flowerRef.current?.querySelectorAll('.bp');
      petals?.forEach((pg, i) => {
        const el = pg.querySelector('ellipse');
        if (!el || i >= PS.length || i >= ANGLES.length) return;
        const s = PS[i] as number;
        const angle = ANGLES[i] as number;
        const rawT = clamp01((p - s) / PD);
        if (rawT <= 0) {
          pg.setAttribute('transform', `rotate(${angle - 25})`);
          el.setAttribute('rx', '0'); el.setAttribute('ry', '0'); el.setAttribute('opacity', '0');
        } else if (rawT >= 1) {
          pg.setAttribute('transform', `rotate(${angle})`);
          el.setAttribute('rx', String(RX)); el.setAttribute('ry', String(RY)); el.setAttribute('opacity', '0.85');
        } else {
          const tB = easeOutBack(rawT);
          const tE = easeOut(rawT);
          pg.setAttribute('transform', `rotate(${mix(angle - 25, angle, tE)})`);
          el.setAttribute('rx', String(mix(0, RX, tB)));
          el.setAttribute('ry', String(mix(0, RY, tB)));
          el.setAttribute('opacity', mix(0, 0.85, tE).toFixed(3));
        }
      });

      // ── Phase 2: "Bloom" text appears (0.36 → 0.44) ──
      const bloomT = easeOut(clamp01((p - 0.36) / 0.08));
      if (bloomRef.current) {
        bloomRef.current.style.opacity = String(bloomT);
        bloomRef.current.style.transform = `translateX(${mix(16, 0, bloomT)}px)`;
      }

      // ── Centering offset: compensate for invisible text so visible content stays centered ──
      const bloomW = bloomRef.current?.offsetWidth ?? 0;
      const ingW = ingRef.current?.offsetWidth ?? 0;
      const gap = 12;
      const fullOffset = (gap + bloomW + ingW) / 2;
      const bloomOnlyOffset = ingW / 2;
      const bloomAppearT = easeInOut(clamp01((p - 0.36) / 0.10));
      const ingAppearT = easeInOut(clamp01((p - 0.45) / 0.05));
      const offsetX = mix(fullOffset, mix(bloomOnlyOffset, 0, ingAppearT), bloomAppearT);

      // ── Phase 3: "ing" (0.45 → 0.50 in, 0.78 → 0.81 out) ──
      const ingIn = easeOut(clamp01((p - 0.45) / 0.05));
      const ingOut = easeOut(clamp01((p - 0.86) / 0.03));
      const ingOp = ingIn * (1 - ingOut);
      if (ingRef.current) {
        ingRef.current.style.opacity = String(ingOp);
        if (ingOp < 0.01) ingRef.current.style.visibility = 'hidden';
        else ingRef.current.style.visibility = 'visible';
      }

      // ── Phase 3: Suffix word cycling (smoother crossfade) ──
      let suffixOp = 0;
      let suffixY = 10;
      let currentWord = '';
      for (const [fis, fie, fos, foe, word] of WORDS) {
        if (p >= fis - 0.02 && p < foe + 0.02) {
          const inT = easeInOut(clamp01((p - fis) / (fie - fis)));
          const outT = p >= fos ? easeInOut(clamp01((p - fos) / (foe - fos))) : 0;
          suffixOp = inT * (1 - outT);
          suffixY = mix(6, 0, inT);
          currentWord = word;
          break;
        }
      }
      if (suffixRef.current) {
        if (currentWord) suffixRef.current.textContent = currentWord;
        suffixRef.current.style.opacity = String(suffixOp);
        suffixRef.current.style.transform = `translateY(${suffixY}px)`;
        suffixRef.current.style.visibility = suffixOp < 0.01 ? 'hidden' : 'visible';
      }

      // ── Phase 4: Logo moves to nav (0.89 → 0.96) ──
      const navT = easeInOut(clamp01((p - 0.89) / 0.07));
      let tx = offsetX;
      let ty = 0;
      let sc = 1;

      if (navT > 0 && stageRef.current) {
        if (!navCacheRef.current) {
          const prev = stageRef.current.style.transform;
          stageRef.current.style.transform = 'none';
          const sr = stageRef.current.getBoundingClientRect();
          stageRef.current.style.transform = prev;
          navCacheRef.current = { cx: sr.left + sr.width / 2, cy: sr.top + sr.height / 2, h: sr.height };
        }
        const navLogo = document.getElementById('nav-bloom-logo');
        if (navLogo && navCacheRef.current) {
          const nr = navLogo.getBoundingClientRect();
          const targetTx = (nr.left + nr.width / 2) - navCacheRef.current.cx;
          const targetTy = (nr.top + nr.height / 2) - navCacheRef.current.cy;
          const targetSc = nr.height / Math.max(1, navCacheRef.current.h);
          tx = mix(offsetX, targetTx, navT);
          ty = mix(0, targetTy, navT);
          sc = mix(1, targetSc, navT);
        }
      }
      if (navT <= 0) navCacheRef.current = null;

      // Boost z-index above nav (z-50) during Phase 4
      if (wrapperRef.current) {
        wrapperRef.current.style.zIndex = navT > 0 ? '60' : '';
      }

      // ── Phase 5: Fade out (0.97 → 1.0) ──
      const fadeOp = 1 - easeOut(clamp01((p - 0.97) / 0.03));

      // ── Apply combined transform ──
      if (stageRef.current) {
        stageRef.current.style.transform = `translate(${tx}px, ${ty}px) scale(${sc})`;
        stageRef.current.style.opacity = String(fadeOp);
      }
    };

    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    const onResize = () => { MAX = getMax(); navCacheRef.current = null; };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    update();
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onResize); };
  }, [getMax]);

  return (
    <section ref={wrapperRef} className="relative bg-background" style={{ height: '500vh' }}>
      <div className="sticky top-0 overflow-hidden" style={{ height: '100dvh' }}>
        <div className="relative w-full flex items-center justify-center" style={{ height: '100dvh' }}>
        <div
          ref={glowRef}
          className="absolute rounded-full opacity-0 pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(231,93,124,0.10) 0%, transparent 68%)' }}
        />

        <div ref={stageRef} className="flex items-center gap-3 relative z-10">
          <svg
            ref={flowerRef}
            viewBox="0 0 120 120"
            className="w-[60px] h-[60px] shrink-0"
            style={{ willChange: 'width, height' }}
          >
            <defs>
              <radialGradient id="bloom-anim-gg" cx="50%" cy="46%" r="50%">
                <stop offset="0%" stopColor="#E8A94F" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#E8A94F" stopOpacity={0} />
              </radialGradient>
            </defs>
            <g transform="translate(60,55)">
              <circle cx={0} cy={0} r={16} fill="url(#bloom-anim-gg)" />
              {ANGLES.map((angle) => (
                <g key={angle} className="bp" transform={`rotate(${angle - 25})`}>
                  <ellipse cx={0} cy={-18} rx={0} ry={0} fill="#E75D7C" opacity={0} />
                </g>
              ))}
              <circle cx={0} cy={0} r={6} fill="#E8A94F" />
            </g>
          </svg>

          <div className="flex items-baseline">
            <span
              ref={bloomRef}
              className="font-display text-2xl sm:text-3xl lg:text-5xl text-botanical font-semibold tracking-tight opacity-0"
            >
              Bloom
            </span>
            <span
              ref={ingRef}
              className="font-display text-2xl sm:text-3xl lg:text-5xl font-semibold tracking-tight opacity-0 invisible"
              style={{ color: '#9C9890' }}
            >
              ing
            </span>
            <span
              ref={suffixRef}
              className="font-display text-xl sm:text-2xl lg:text-4xl font-medium ml-4 opacity-0 invisible"
              style={{ color: '#9C9890' }}
            />
          </div>
        </div>
        </div>
      </div>
    </section>
  );
}
