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

## Phase 4: Commerce ✅

### Done
- [x] Public homepage at `/` — hero with transformation promise, featured courses from DB, how-it-works 4-step section, facilitator credibility, testimonials, pricing ("Every course ₹5,000. Lifetime access."), FAQ accordion, footer
- [x] Catalog at `/courses` — filterable grid of published courses (cover art, title, instructor, lesson count, weeks, price)
- [x] Course sales page at `/courses/[slug]` — cinematic dark hero with trailer video, "What you'll learn" outcomes grid, full curriculum accordion (modules → lessons with durations, free-preview lessons playable inline), instructor bio, testimonial stars, sticky enroll CTA (mobile bottom bar + desktop floating card)
- [x] `src/lib/razorpay.ts` — GST calculation (₹5,000 inclusive at 18%: base=4237, gst=763), Razorpay order creation via REST API, webhook HMAC-SHA256 signature verification, payment signature verification
- [x] `/api/checkout` — POST: creates Razorpay order + pending enrollment with GST breakup, returns config for Razorpay Checkout modal
- [x] `/api/checkout/status` — GET: polls enrollment status for post-payment confirmation page, returns receipt data + first lesson ID
- [x] `/api/webhooks/razorpay` — POST: verifies X-Razorpay-Signature, flips enrollment to 'active' on payment.captured or 'failed' on payment.failed; uses service role client (no user session); rejects tampered payloads
- [x] CheckoutButton component — loads Razorpay Checkout script, opens UPI-first modal (UPI block primary, cards/netbanking/wallets secondary), handles payment success → confirmation page, dismissal, and failure
- [x] PaymentConfirmation component — polls enrollment status every 1s (up to 30s), shows: "Confirming payment…" → celebration + "Start Lesson 1" on active, or clear retry on failed; includes branded receipt (order ID, payment ID, base amount, GST, total, date)
- [x] Enrollment confirmation page at `/courses/[slug]/enroll` with Suspense boundary
- [x] `npm run simulate:webhook` — dev script that posts correctly signed payload for payment.captured or payment.failed to local webhook route; also tests tampered signature rejection
- [x] Enrollment gating from Phase 2 verified: pending/failed enrollments don't grant access, only 'active'/'manual' do; free-preview lessons bypass check
- [x] Build compiles cleanly with zero TypeScript errors

### Decisions Made
- **No Razorpay npm SDK** — just fetch to Razorpay REST API with Basic auth for order creation; keeps dependencies minimal
- **GST inclusive** — single `computeGst()` function with one config constant (18%); ₹5,000 = ₹4,237 base + ₹763 GST
- **Enrollment status changes ONLY in webhook** — client never writes enrollment status; polling reads only
- **UPI-first Razorpay Checkout** — uses `config.display.blocks` to show UPI as primary payment method with QR + app intents
- **Homepage is a standalone page** — not inside the (app) layout group, has its own nav/footer for marketing feel
- **Sticky CTA** — mobile bottom bar + desktop floating card on sales page for maximum conversion

## Phase 5: Admin Portal ✅

### Done
- [x] `src/lib/admin.ts` — `requireAdmin()` server-side role gate: checks auth + profile.role='admin', redirects non-admins
- [x] `src/lib/admin-api.ts` — `withAdmin()` API route wrapper with 401/403 responses
- [x] Admin layout at `/admin` — dedicated sidebar nav (Dashboard, Courses, Members, Payments, Analytics, Import, Health), mobile hamburger menu, "Back to app" link, role check in layout (never client-side)
- [x] Admin dashboard (`/admin`) — headline stat cards: total users, paid enrollments, total revenue (₹), conversion rate, week-over-week enrollment comparison; courses summary table with status badges
- [x] Course management (`/admin/courses`) — grid of course cards with status/enrollment count; "New Course" flow at `/admin/courses/new`
- [x] Course editor (`/admin/courses/[id]`) — full CRUD: edit title, subtitle, description, instructor info, cover/trailer URLs, price, weeks, category, learning outcomes array; module management (add/rename/delete); lesson management (add/edit/delete with title, description, video URL, duration, transcript, free-preview toggle); publish/unpublish toggle that recounts lessons; delete course with confirmation
- [x] API routes: POST/PATCH/DELETE `/api/admin/courses`, modules, lessons, publish
- [x] Members table (`/admin/members`) — all registered users with name, email, phone, signup date; enrollment status badges (Paid green / Started checkout amber / Never attempted grey); expandable enrollment details per user; search by name/email/phone; filter by status; CSV export
- [x] Manual access grant — modal: select course, add note (e.g. "paid via direct UPI"), creates enrollment with status='manual'; tagged in analytics so revenue stays honest
- [x] Payments log (`/admin/payments`) — every enrollment record with user, course, Razorpay order/payment IDs, amount with GST breakup, status badge, note, timestamp; search and status filter
- [x] Analytics dashboard (`/admin/analytics`) — headline stats + per-course breakdown table (enrollments, revenue, avg completion rate with progress bar); enrollment-over-time bar chart (12-week view) per selected course
- [x] Course content import (`/admin/import`) — upload Markdown (.md) file or paste directly; parses `# Heading` as modules, `## Heading` as lessons, body as description/transcript; live preview of parsed structure; creates draft course with all modules/lessons; format guide on page
- [x] Health check page (`/admin/status`) — green/red indicators for: Database connection, Razorpay keys, Webhook secret, AI endpoint reachability, Service role key; overall status banner; recheck button
- [x] Build compiles cleanly with zero TypeScript errors

### Decisions Made
- **Admin layout is separate from (app) layout** — no TopNav, AiProvider, ChatDrawer in admin; denser utilitarian design as spec requires
- **Role check in layout** — `requireAdmin()` runs in the layout server component so every admin page is gated without repetition
- **Service role client for email lookups** — profiles table doesn't store email, so members/payments pages use `supabase.auth.admin.listUsers()` via service role key
- **Enrollment chart is pure CSS/HTML** — no charting library needed for the simple bar chart; keeps bundle minimal
- **Import uses Markdown only** — DOCX parsing would require a heavy library; Markdown covers the use case with a clear heading-level convention

## Phase 6: Community & Polish ✅

### Done
- [x] Discuss tab in lesson sidebar — real reflection composer + public reflections feed with relative timestamps, wired to `/api/reflections` endpoint; replaces Phase 2 placeholder
- [x] Community page (`/community`) — server-rendered feed of all public reflections across courses, with author avatars, lesson/course titles, relative timestamps
- [x] `/api/reflections` GET endpoint — fetches public reflections by lessonId or all (for community page), joins profiles and lessons/courses
- [x] Learning streak counter on dashboard — `getLearningStreak()` queries lesson_progress for consecutive learning days; flame icon with pulse animation at 3+ day streaks; displayed next to welcome message on `/home`
- [x] Completion certificate at `/courses/[slug]/certificate` — server-verified 100% completion gate; Bloom-branded certificate with botanical motifs, member name, course title, instructor, date; download via browser print dialog; share via Web Share API (clipboard fallback)
- [x] Lesson footer upgraded — detects course completion (completedLessons === totalLessons) and redirects to certificate page instead of next lesson
- [x] 360px mobile pass — input zoom prevention (font-size: 16px on inputs), tighter padding, safe area inset support, 44px minimum touch targets for coarse pointers
- [x] Accessibility improvements — skip-to-content link in root layout, `id="main-content"` on main elements (app + admin layouts), `role="banner"` on header, `aria-label` on nav elements (main + admin)
- [x] Loading skeletons — `/home/loading.tsx`, `/courses/loading.tsx`, `/admin/loading.tsx` with Bloom-themed shimmer animations
- [x] Safe area support for AI chat drawer input area on notched mobile devices
- [x] Build compiles cleanly with zero TypeScript errors across 35 routes

### Decisions Made
- **No charting library for community** — reflections feed is a simple card list; relative timestamps via manual calculation, no `date-fns` needed
- **Certificate download uses `window.print()`** — avoids `html2canvas` dependency; print stylesheets give clean PDF output
- **Streak calculation is server-side** — runs in `getLearningStreak()` with a single DB query grouping by date, no client-side date math
- **Mobile touch targets use `@media (pointer: coarse)`** — only enlarges targets on actual touch devices, desktop stays compact

---

## Phase 7: Final Walkthrough Fixes ✅

### Done — Blockers
- [x] Fixed `xs:` Tailwind breakpoint undefined — lesson footer labels ("Previous"/"Next"/"Completed") were invisible; added `--breakpoint-xs: 30rem` to `@theme`
- [x] Fixed module rename firing API PATCH on every keystroke — debounced to 500ms with `useRef` timer
- [x] Replaced `alert()` for checkout errors with inline error message below the button

### Done — Should-Fix (Customer Journey)
- [x] Fixed `BloomIcon` light prop rendering same color on both branches — footer icon now uses white petals on dark background
- [x] Fixed AI disclaimer to match spec: "Bloom AI offers general guidance, not professional or therapeutic advice."
- [x] Added working mobile hamburger menu — slide-in drawer with Home, Courses, Community links
- [x] Added `@media print` stylesheet for certificate — hides nav/buttons, clean PDF output
- [x] Public `/courses` page now includes Coming Soon (draft) courses with badge, matching dashboard catalog behavior
- [x] Fixed "already enrolled" checkout redirect: goes to `/home` instead of back to the sales page
- [x] Fixed `router.refresh()` firing after `router.push()` in lesson footer — only refreshes when no navigation occurred
- [x] Removed inert Profile/Settings menu items from profile dropdown (no pages exist for these)
- [x] Made Bloom AI button visible on mobile — icon-only button on small screens, labeled on larger
- [x] Added save success/error feedback to admin course editor

### Done — Should-Fix (Admin Journey)
- [x] Fixed slug auto-regeneration on every course title save — no longer overwrites existing slugs on PATCH
- [x] Replaced `window.location.reload()` with `router.refresh()` after manual enrollment grant
- [x] Added drag-and-drop support to course import file upload (had "drop it here" text but no handlers)

### Deliberately Deferred
- **Video hosting migration** — VideoPlayer uses `<video src>` which only works with direct file URLs. YouTube/Vimeo URLs require iframe embeds. Deferred until video hosting provider is chosen (Mux recommended for production)
- **Captions** — captions toggle button in video player is cosmetic; needs `<track>` elements with WebVTT files per lesson
- **`next/image` migration** — all images use CSS background-image or raw `<img>` tags. Switching to `next/image` improves performance on mid-range Android but requires refactoring cover art rendering across 6+ components
- **Reflection pre-loading** — revisiting a lesson shows an empty reflection form; existing reflection should be fetched on mount
- **Reflection upsert** — multiple saves create duplicate reflections; should upsert on `(user_id, lesson_id)`
- **Quiz score persistence** — quiz_attempts row is created with empty answers; client never updates it with actual score
- **Search functionality** — search button removed from nav (was non-functional); to be implemented when course count grows
- **Notifications** — bell icon removed from nav (was non-functional); to be implemented with engagement features
- **Admin lesson task/resource editing** — tasks and resources are read-only in the course editor; requires UI for add/edit/remove
- **Admin instructor photo URL field** — field exists in schema but has no input in the course editor form
- **N+1 query optimization** — dashboard and analytics queries make multiple sequential DB calls per course; should be batched for scale
- **Testimonials** — currently hardcoded on landing and sales pages; to be replaced with real testimonials from DB or removed pre-launch
- **Free preview without login** — clicking "Free Preview" on sales page requires login; unauthenticated access deferred pending auth flow decision
- **Email confirmation on signup** — Supabase requires email confirmation before dashboard access; deferred pending founder's auth preference
