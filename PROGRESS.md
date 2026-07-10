# Bloom — Build Progress

## Phase 1: Foundation ✅

### Done
- [x] Next.js 14+ scaffold with App Router, TypeScript strict mode, Tailwind CSS v4
- [x] Bloom design system as Tailwind tokens: colors (botanical, ivory, bloom-rose, dawn-gold, sage), Fraunces + Inter fonts, 16–24px card radii, layered warm shadows
- [x] shadcn/ui installed and re-themed to Bloom palette (buttons, inputs, cards, avatars, dropdowns — nothing looks default)
- [x] Full Supabase schema migrations: profiles, courses, modules, lessons, lesson_resources, lesson_tasks, enrollments (with GST: base_amount, gst_rate, gst_amount), lesson_progress, task_completions, quiz_attempts, reflections, ai_conversations
- [x] Row Level Security: users own their data, course content gated by enrollment, free previews open, admin bypass via is_admin() helper
- [x] `npm run setup` idempotent script: runs migrations, generates SVG cover art, creates admin account, seeds "The Art of Conscious Love" (5 modules, 20 lessons with realistic transcripts/tasks/workbooks) + 2 Coming Soon courses
- [x] SETUP.md with complete Google sign-in walkthrough (Google Cloud console → OAuth consent → client ID → Supabase callback URI → enable provider)
- [x] .env.example with all required variables
- [x] Auth experience: /login, /signup, /forgot-password with split layout (dawn-gradient bloom artwork + form), animated five-petal motif, warm microcopy, Continue with Google prominent, email/password with friendly inline validation, Supabase SSR sessions, protected-route redirect preserving destination
- [x] Auth callback routes: /auth/callback (OAuth), /auth/confirm (email verify/reset)
- [x] Proxy (middleware) for session refresh, protected route redirect, auth page redirect for logged-in users
- [x] Base app shell: global top nav (Bloom logo, Home, Courses, Community, search, notifications bell, Bloom AI button, profile avatar menu with sign-out)
- [x] Dashboard /home with welcome state, Continue Learning empty state, course catalog preview
- [x] Placeholder pages: /courses, /community
- [x] CSS/SVG gradient cover art for all 3 courses
- [x] Build compiles cleanly with zero TypeScript errors

### Decisions Made
- **Next.js 16** (latest) — uses `proxy.ts` instead of deprecated `middleware.ts`
- **Tailwind CSS v4** — config via CSS `@theme` blocks, not `tailwind.config.ts`
- **shadcn v4** — Base UI React primitives under the hood
- **Supabase SSR** for cookie-based sessions (not JWT in localStorage)
- **Migrations stored as raw SQL** — setup script executes them via Supabase client; manual SQL Editor fallback documented in SETUP.md

---

## Phase 2: Member Core — Pending
- [ ] Dashboard with Continue Learning cards (real enrolled courses, progress bars)
- [ ] Lesson player page (/learn/[courseSlug]/[lessonId]) with video, description, tasks, workbook, curriculum sidebar, prev/next/complete
- [ ] Progress tracking end to end (lesson_progress, task_completions)

## Phase 3: AI Layer — Pending
- [ ] /api/ai/chat streaming endpoint with lesson-context injection
- [ ] Summarize lesson, Quiz me (JSON + interactive panel), Chat slide-over
- [ ] Global Bloom AI

## Phase 4: Commerce — Pending
- [ ] Public homepage, catalog, course sales page
- [ ] Razorpay checkout with webhook verification
- [ ] Enrollment gating, free-preview lessons

## Phase 5: Admin Portal — Pending
- [ ] Role-gated /admin with course CRUD
- [ ] Enrollment & accountability analytics dashboard
- [ ] Manual access grant, payments log, content import, health check

## Phase 6: Community & Polish — Pending
- [ ] Reflections/Discuss tab, streaks, completion certificate
- [ ] Full mobile pass at 360px, performance, accessibility
