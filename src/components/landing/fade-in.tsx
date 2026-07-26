'use client';

import { useEffect, useRef, type ReactNode } from 'react';

export function FadeIn({
  children,
  className = '',
  delay = 0,
  direction = 'up',
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setTimeout(() => el.classList.add('fade-in-visible'), delay);
          observer.unobserve(el);
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  const dirClass =
    direction === 'up' ? 'fade-in-up-start' :
    direction === 'down' ? 'fade-in-down-start' :
    direction === 'left' ? 'fade-in-left-start' :
    direction === 'right' ? 'fade-in-right-start' :
    'fade-in-none-start';

  return (
    <div ref={ref} className={`${dirClass} ${className}`}>
      {children}
    </div>
  );
}
