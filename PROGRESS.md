# Bloom — Build Progress

## Phase 1: Foundation ✅

### Done
- [x] Next.js 16 scaffold with App Router, TypeScript strict mode, Tailwind CSS v4
- [x] Bloom design system as Tailwind tokens: colors (botanical, ivory, bloom-rose, dawn-gold, sage), Fraunces + Inter fonts, 16–24px card radii, layered warm shadows
- [x] shadcn/ui installed and re-themed to Bloom palette (buttons, inputs, cards, avatars, dropdowns — nothing looks default)
- [x] Full Supabase schema migrations: profiles, courses, modules, lessons, lesson_resources, lesson_tasks, enrollments (with GST: base_amount, gst_rate, gst_amount), lesson_progress, task_completions, quiz_attempts, reflections, ai_conversations
- [x] Row Level Security: users own their data, course content gated by enrollment, free previews open, admin bypass via is_admin() helper
- [x] `npm run setup` idempotent script: runs migrations, generates SVG cover art, seeds demo course, 2 Coming Soon courses, creates admin account, enrolls admin in demo course
- [x] SETUP.md with complete Google sign-in walkthrough
- [x] .env.example with all required variables
- [x] Auth experience: /login, /signup, /forgot-password with split layout, dawn-gradient artwork, animated bloom motif, Google OAuth, email/password with inline validation, Supabase SSR sessions, protected-route redirect
- [x] Base app shell: global top nav (logo, Home, Courses, Community, search, notifications, Bloom AI, profile menu)

### Decisions Made
- **Next.js 16** — uses `proxy.ts` instead of deprecated `middleware.ts`
- **Tailwind CSS v4** — config via CSS `@theme` blocks
- **shadcn v4** — Base UI React primitives
- **Supabase SSR** for cookie-based sessions
- **Migrations stored as raw SQL** — manual SQL Editor fallback documented

---

## Phase 2: Member Core ✅

### Done
- [x] Dashboard /home with real DB queries: Continue Learning cards with circular progress rings, next lesson title, one-click resume
- [x] Category tabs (For You / Trending / Relationships / Coming Soon) filtering courses from DB
- [x] First-time welcome state for users with no enrollments
- [x] Lesson player at /learn/[courseSlug]/[lessonId] — two-column layout (main ~2/3, sidebar ~1/3)
- [x] VideoPlayer abstraction: play/pause, ±15s skip, playback speed cycling (0.5–2x), captions toggle, fullscreen, seek bar, mute; persists last_position_seconds to DB on pause/timeupdate/unmount; restores position on reload; gradient placeholder when no video URL
- [x] AI assistant bar (visually complete, disabled — wired in Phase 3): input + Summarize/Quiz/Chat pills
- [x] Lesson description rendered from markdown (paragraph splitting)
- [x] Getting Started tasks with checkable circles persisted to task_completions (toggle on/off, check-pop animation)
- [x] Workbook card with cover thumbnail, title, description, Download button (or "Coming soon" when no file)
- [x] Reflection prompt with journal textarea, save privately or share to community toggle, persisted to reflections table
- [x] Footer bar: Previous / Mark As Complete / Next — mark complete writes lesson_progress, fires celebration animation (confetti petals + PartyPopper icon), auto-advances to next lesson after 1.8s
- [x] Right sidebar: Lessons / Discuss tabs; Lessons tab shows "X / Y completed" counter, per-module linear progress bars, five-petal bloom motif filling as modules complete, full curriculum grouped by module with completion state and current lesson highlighted
- [x] Discuss tab: placeholder shell for Phase 6
- [x] Sidebar becomes mobile bottom sheet at <1024px: floating button shows lesson count, taps open slide-up drawer with full curriculum
- [x] Circular progress ring on dashboard course cards
- [x] Five-petal BloomProgress motif in sidebar — petals fill per completed module, gold center when course complete
- [x] /learn routes protected: enrollment check in page (server-side), free-preview lessons exempt, non-enrolled users redirected to course page
- [x] Setup script seeds active enrollment for admin user on demo course
- [x] Shared query helpers in lib/queries.ts: enrolled courses with progress, catalog, curriculum, lesson context, tasks, resources, progress, ordered lesson IDs for prev/next
- [x] Build compiles cleanly with zero TypeScript errors

### Decisions Made
- **VideoPlayer** uses HTML5 `<video>` behind abstraction — position saved via debounced Supabase upsert (2s delay)
- **Enrollment check** done at the page level (server component), not in proxy — proxy can't know lesson-level free-preview status
- **Mobile sidebar** is a CSS-driven bottom sheet with fixed toggle button, not a separate route
- **Celebration animation** uses CSS keyframes + floating SVG petals, respects prefers-reduced-motion

---

## Phase 3: AI Layer ✅

### Done
- [x] `src/lib/ai.ts` — AI client for OpenAI-compatible endpoints (Ollama, vLLM, etc.), transcript truncation (~6K tokens via middle-cut), JSON repair utility for quiz generation, system prompt builders for lesson-scoped and global modes
- [x] `/api/ai/chat` streaming endpoint — single route handling 3 modes (chat, summarize, quiz), lesson-context injection, conversation persistence to ai_conversations table
- [x] Summarize mode: structured summary streaming (Key Ideas, Action Step, Reflection Question), max_tokens 1000, temp 0.3
- [x] Quiz mode: non-streaming JSON generation with strict validation, retry-once with nudge on malformed output, saves quiz_attempts
- [x] Chat mode: streaming with conversation history, auto-creates/updates ai_conversations, sends conversationId back in stream
- [x] AiProvider context: drawer state, lesson context, mode switching, initial message passthrough
- [x] ChatDrawer slide-over: ~480px desktop, fullscreen mobile, dark botanical header, mode tabs, persistent disclaimer
- [x] ChatMessages: user/assistant bubbles with avatars, streaming typing indicator (bouncing dots)
- [x] ChatHistoryRail: past conversations list, new chat button, lesson-scoped filtering
- [x] SummaryPanel: streaming structured summary with markdown heading/bullet rendering
- [x] QuizPanel: interactive 5-question quiz (one card at a time, A-D option buttons, progress dots, correct=sage/wrong=bloom-rose, explanation reveal, final score screen, retry)
- [x] AiBar wired: input submits to chat drawer, Summarize/Quiz/Chat pills open drawer in correct mode, lesson context auto-set on mount
- [x] Global Bloom AI: top-nav button opens drawer without lesson context, knows enrolled courses
- [x] Build compiles cleanly with zero TypeScript errors

### Decisions Made
- **Single `/api/ai/chat` route** handles all 3 modes — keeps API surface minimal
- **Quiz uses non-streaming** completion + JSON repair (strip fences, fix trailing commas, close truncated arrays) — streaming JSON is unreliable with small models
- **Conversation persistence** happens in the stream flush handler — no extra round-trip needed
- **BloomAiButton** is a separate client component so top-nav remains a server component
- **Slide-in animation** for drawer with prefers-reduced-motion respect

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
