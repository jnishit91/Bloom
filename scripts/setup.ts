/**
 * Bloom — Idempotent Setup Script
 *
 * Usage: npm run setup
 *
 * Runs migrations, applies RLS, seeds demo course + Coming Soon courses,
 * and creates the first admin account. Safe to run multiple times.
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import "dotenv/config";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@bloom.app";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "bloom-admin-2024";
const ADMIN_NAME = process.env.ADMIN_NAME || "Bloom Admin";

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env"
  );
  console.error("   Copy .env.example to .env and fill in your Supabase keys.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Run SQL migrations ──
async function runMigrations() {
  console.log("\n📦 Running migrations...");
  const migrationsDir = path.join(__dirname, "..", "supabase", "migrations");
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf-8");
    console.log(`   → ${file}`);
    const { error } = await supabase.rpc("exec_sql", { sql_text: sql }).maybeSingle();
    if (error) {
      // Try direct REST approach if rpc not available
      const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: "POST",
        headers: {
          apikey: SERVICE_ROLE_KEY!,
          Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({ sql_text: sql }),
      });
      if (!res.ok) {
        // Fall back to executing via the SQL endpoint
        const sqlRes = await fetch(`${SUPABASE_URL}/pg`, {
          method: "POST",
          headers: {
            apikey: SERVICE_ROLE_KEY!,
            Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query: sql }),
        });
        if (!sqlRes.ok) {
          console.warn(
            `   ⚠ Migration ${file} may need manual execution via Supabase SQL Editor`
          );
          console.warn(`     Error: ${error.message}`);
        }
      }
    }
  }
  console.log("   ✅ Migrations complete");
}

// ── Create admin account ──
async function createAdmin() {
  console.log("\n👤 Creating admin account...");

  // Check if admin already exists
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const existingAdmin = existingUsers?.users?.find(
    (u) => u.email === ADMIN_EMAIL
  );

  if (existingAdmin) {
    console.log(`   ℹ Admin ${ADMIN_EMAIL} already exists`);
    // Ensure profile has admin role
    await supabase
      .from("profiles")
      .upsert(
        {
          id: existingAdmin.id,
          full_name: ADMIN_NAME,
          role: "admin",
        },
        { onConflict: "id" }
      );
    console.log("   ✅ Admin role confirmed");
    return existingAdmin.id;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: ADMIN_NAME },
  });

  if (error) {
    console.error(`   ❌ Failed to create admin: ${error.message}`);
    return null;
  }

  // Set admin role
  await supabase
    .from("profiles")
    .upsert(
      { id: data.user.id, full_name: ADMIN_NAME, role: "admin" },
      { onConflict: "id" }
    );

  console.log(`   ✅ Admin created: ${ADMIN_EMAIL}`);
  return data.user.id;
}

// ── Seed content ──
async function seedCourses() {
  console.log("\n🌱 Seeding courses...");

  // Check if demo course already exists
  const { data: existing } = await supabase
    .from("courses")
    .select("id")
    .eq("slug", "the-art-of-conscious-love")
    .maybeSingle();

  if (existing) {
    console.log('   ℹ Demo course "The Art of Conscious Love" already exists');
    return seedComingSoonCourses();
  }

  // ── Insert the demo course ──
  const { data: course, error: courseError } = await supabase
    .from("courses")
    .insert({
      slug: "the-art-of-conscious-love",
      title: "The Art of Conscious Love",
      subtitle: "Transform how you love, connect, and show up in relationships",
      description: `This transformative 4-week journey will reshape your understanding of love and relationships. Through guided lessons, reflective exercises, and practical tools, you'll learn to love with intention, communicate with depth, and build a relationship that elevates both partners.\n\nWhether you're single and preparing for the right connection, or in a relationship ready to deepen your bond — this course meets you exactly where you are and guides you toward conscious, high-vibration love.`,
      instructor_name: "Bloom Facilitator",
      instructor_bio:
        "A seasoned relationship coach with over a decade of experience helping individuals and couples across India build deeper, more meaningful connections. Certified in Gottman Method, Emotionally Focused Therapy, and mindfulness-based relationship enhancement.",
      cover_image_url: "/images/course-cover-conscious-love.svg",
      price_inr: 5000,
      outcomes: JSON.stringify([
        "Understand your attachment style and how it shapes your relationships",
        "Heal old emotional wounds that block intimacy",
        "Master the art of compassionate, honest communication",
        "Build daily rituals that keep your relationship vibrant",
        "Develop emotional intelligence for lasting love",
      ]),
      total_lessons: 20,
      total_weeks: 4,
      status: "published",
      category: "Relationships",
    })
    .select("id")
    .single();

  if (courseError || !course) {
    console.error(`   ❌ Failed to create course: ${courseError?.message}`);
    return;
  }

  const courseId = course.id;
  console.log("   → Course created");

  // ── Modules ──
  const modulesData = [
    { title: "Preparation: Setting Your Intention", sort_order: 0 },
    { title: "Week 1: Understanding Yourself in Love", sort_order: 1 },
    { title: "Week 2: Healing Old Wounds", sort_order: 2 },
    { title: "Week 3: Communication That Connects", sort_order: 3 },
    { title: "Week 4: Building a High-Vibration Relationship", sort_order: 4 },
  ];

  const { data: modules, error: modError } = await supabase
    .from("modules")
    .insert(modulesData.map((m) => ({ ...m, course_id: courseId })))
    .select("id, sort_order");

  if (modError || !modules) {
    console.error(`   ❌ Failed to create modules: ${modError?.message}`);
    return;
  }

  console.log("   → 5 modules created");

  const moduleIds = modules.sort((a, b) => a.sort_order - b.sort_order).map((m) => m.id);

  // ── Lessons ──
  const lessonsPerModule: {
    title: string;
    description: string;
    transcript: string;
    duration_minutes: number;
    tasks: string[];
    is_free_preview?: boolean;
  }[][] = [
    // Preparation (3 lessons)
    [
      {
        title: "Welcome to Your Transformation",
        description:
          "Meet your facilitator, understand the journey ahead, and set a powerful intention for the next four weeks.",
        transcript: `Welcome to The Art of Conscious Love. I'm so glad you're here — and I don't say that lightly. The fact that you've chosen to invest in your growth, in how you love, says something beautiful about who you are.\n\nOver the next four weeks, we'll go deep. Not in a clinical way — in a human way. We'll explore your patterns, your wounds, your gifts, and your untapped capacity for extraordinary connection. This isn't about fixing you. You're not broken. This is about removing the layers that prevent you from experiencing the love you already deserve.\n\nBefore we begin, I want you to set an intention. Not a goal — an intention. A goal says "I want to find love." An intention says "I am becoming someone who is ready for the love I desire." Write it down. Keep it close. We'll come back to it.`,
        duration_minutes: 12,
        tasks: [
          "Write your personal intention for this course in your journal",
          "Share one word that describes how you feel about starting this journey (optional reflection)",
        ],
        is_free_preview: true,
      },
      {
        title: "How This Course Works",
        description:
          "A practical walkthrough of the course structure, AI assistant features, workbooks, and how to get the most from each lesson.",
        transcript: `Let me walk you through how to get the absolute most from this experience. Each week has a theme, and within each week you'll find 4-5 lessons. Every lesson has a video (like this one), a transcript for reference, tasks to complete, and a workbook section.\n\nHere's what makes this different: you have Bloom AI as your companion. After each lesson, you can ask it to summarize what you learned, quiz you to test your understanding, or just chat about how the lesson relates to your personal situation. It's like having a wise friend available 24/7.\n\nMy advice: watch each lesson fully, complete the tasks before moving on, and be honest in your reflections. Growth happens in the spaces where you let yourself be real. There are no right answers here — only your answers.`,
        duration_minutes: 8,
        tasks: [
          "Explore the Bloom AI assistant — try asking it to summarize this lesson",
          "Download the Preparation workbook and review the first page",
        ],
      },
      {
        title: "Your Love Story So Far",
        description:
          "A guided reflection on your relationship history — not to judge it, but to understand the patterns that brought you here.",
        transcript: `Before we move forward, let's look back — gently. Your love story so far has been your greatest teacher, whether it felt like it at the time or not.\n\nI want you to think about your three most significant relationships — romantic or otherwise. For each one, ask yourself: What did I learn about love from this person? What pattern repeated? What did I need that I didn't get?\n\nThis isn't about blame. It's about awareness. When we understand our patterns, we stop being controlled by them. You might notice themes: choosing unavailable people, giving too much, building walls, or losing yourself in someone else.\n\nWrite these down. Be specific. The goal isn't a perfect analysis — it's honest recognition. We'll build on this self-knowledge throughout the entire course.`,
        duration_minutes: 15,
        tasks: [
          "Map your three most significant relationships using the workbook template",
          "Identify one recurring pattern you notice across these relationships",
          "Write a compassionate letter to your younger self about love",
        ],
      },
    ],
    // Week 1 (4 lessons)
    [
      {
        title: "The Four Attachment Styles",
        description:
          "Discover secure, anxious, avoidant, and disorganized attachment — and recognise which one drives your relationship behaviour.",
        transcript: `Attachment theory might be the single most important framework for understanding why you love the way you do. Developed by John Bowlby and expanded by researchers like Amir Levine, it explains how our early experiences with caregivers shape our adult romantic patterns.\n\nThere are four main styles. Secure attachment: you're comfortable with intimacy and independence. You can ask for what you need without anxiety. Anxious attachment: you crave closeness but worry about abandonment. You might overanalyse texts, need constant reassurance, or feel like you love harder than others.\n\nAvoidant attachment: you value independence highly and feel uncomfortable when things get too close. You might pull away when a partner needs you most. And disorganized: a confusing mix of craving and fearing intimacy, often rooted in early trauma.\n\nHere's the liberating truth: your attachment style is not your destiny. It's your starting point. With awareness and practice, you can earn secure attachment — and that's exactly what this course will help you do.`,
        duration_minutes: 18,
        tasks: [
          "Take the attachment style quiz in your workbook",
          "Reflect: how has your attachment style shown up in your last relationship?",
        ],
      },
      {
        title: "Your Emotional Blueprint",
        description:
          "Understand the unconscious beliefs about love you absorbed from family, culture, and past experiences.",
        transcript: `Every one of us carries an emotional blueprint — a set of unconscious beliefs about what love is, who deserves it, and how it's supposed to feel. These beliefs were written before you had any say in the matter.\n\nMaybe you grew up watching parents who never expressed affection, so love feels like something you have to earn through achievement. Maybe love was loud and chaotic, so calm relationships feel boring to you. Maybe you were told that needing someone is weakness, so you've built a life where you never have to depend on anyone.\n\nThese blueprints run silently in the background, like software you didn't install. They influence who you're attracted to, how you behave in conflict, and what you tolerate. Today, we're making them visible.\n\nIn your workbook, you'll find the Emotional Blueprint exercise. Fill it out honestly. Some of it might be uncomfortable. That discomfort is the blueprint resisting being seen — which means you're doing it right.`,
        duration_minutes: 20,
        tasks: [
          "Complete the Emotional Blueprint exercise in the workbook",
          "Identify your top 3 unconscious beliefs about love",
          "Share one insight in the community reflection (optional)",
        ],
      },
      {
        title: "The Stories We Tell Ourselves",
        description:
          "Learn how inner narratives about worthiness and love shape your relationship choices — and how to rewrite them.",
        transcript: `"I'm too much." "I'm not enough." "Love always ends in pain." "I don't deserve someone who treats me well." Sound familiar?\n\nThese are the stories we tell ourselves about love. They feel like facts, but they're narratives — constructed from limited experiences and filtered through wounded eyes. And here's what's powerful: if they were constructed, they can be reconstructed.\n\nI'm not talking about toxic positivity. I'm not going to tell you to just think happy thoughts. What I am going to teach you is narrative awareness — the ability to notice when a story is running, question its source, and choose whether to keep it or revise it.\n\nHere's a practice: the next time you feel triggered in a relationship context, pause and ask yourself three questions. What story am I telling myself right now? Where did this story come from? Is this story still true, or am I replaying an old tape?`,
        duration_minutes: 16,
        tasks: [
          "Write down your top 3 'love stories' — the narratives that repeat in your mind",
          "For each story, trace its origin: where did you first learn this?",
        ],
      },
      {
        title: "Meeting Yourself With Compassion",
        description:
          "A guided self-compassion practice that builds the emotional foundation for healthy love.",
        transcript: `Here's a truth that might surprise you: the quality of your relationships with others can never exceed the quality of your relationship with yourself. Not in a cliché way — in a very practical way.\n\nIf you don't believe you're worthy of patience, you'll accept impatience. If you don't extend yourself grace, you'll struggle to extend it to a partner. Self-compassion isn't selfish. It's the foundation.\n\nDr. Kristin Neff's research identifies three components of self-compassion: self-kindness (instead of self-criticism), common humanity (recognizing suffering is shared, not personal), and mindfulness (observing your pain without being consumed by it).\n\nToday, I'm going to guide you through a practice. Find a quiet space. Close your eyes if comfortable. Place your hand on your chest. And repeat after me: "This is a moment of difficulty. Difficulty is part of life. May I be kind to myself in this moment. May I give myself the love I need."`,
        duration_minutes: 14,
        tasks: [
          "Practice the self-compassion meditation for 5 minutes",
          "Write a letter to yourself from the perspective of someone who loves you unconditionally",
        ],
      },
    ],
    // Week 2 (5 lessons)
    [
      {
        title: "Understanding Emotional Wounds",
        description:
          "Learn to identify the core wounds that silently shape your relationship patterns — rejection, abandonment, betrayal, humiliation, and injustice.",
        transcript: `Lise Bourbeau identified five core emotional wounds that shape human behaviour: rejection, abandonment, betrayal, humiliation, and injustice. We all carry at least one or two of these, and they activate predictably in intimate relationships.\n\nThe rejection wound makes you disappear — you become small, quiet, invisible, hoping that if you take up less space, nobody can reject you. The abandonment wound makes you cling — you pursue, overfunction, and lose yourself trying to keep someone close.\n\nThe betrayal wound makes you control — you need to be in charge because trusting means vulnerability. The humiliation wound makes you please — you over-give, over-accommodate, over-sacrifice. And the injustice wound makes you perfect — you hold yourself and others to impossible standards.\n\nRecognising your wound isn't about labelling yourself. It's about understanding the logic behind behaviours that otherwise seem irrational. When you know your wound, its grip loosens.`,
        duration_minutes: 22,
        tasks: [
          "Identify which core wound(s) resonate most with you",
          "Journal about a specific moment when this wound was activated in a relationship",
        ],
      },
      {
        title: "The Grief You Haven't Processed",
        description:
          "Explore how unprocessed grief from past relationships, childhood, or loss continues to influence your present.",
        transcript: `There's a particular kind of grief that many of us carry without realising it — the grief of what didn't happen. The parent who didn't show up. The relationship that ended before it could become what you hoped. The love you poured into someone who couldn't receive it.\n\nThis unprocessed grief doesn't disappear. It transforms. It becomes anxiety about the future, numbness in the present, or a vague sense that something is always missing. And it follows you into new relationships, where it demands to be felt.\n\nToday, I'm inviting you to give yourself permission to grieve. Not just the dramatic losses, but the quiet ones. The disappointments you minimised. The hopes you tucked away. The version of love you expected but never received.\n\nGrief that is witnessed and honoured loses its power to control you. In your workbook, you'll find a guided grief inventory. Take your time with it. There's no rush. And remember: grieving what was lost makes space for what's coming.`,
        duration_minutes: 19,
        tasks: [
          "Complete the grief inventory in your workbook",
          "Write a goodbye letter to a past relationship, expectation, or version of yourself",
          "Practice the grief release breathing exercise (4 counts in, 7 counts hold, 8 counts out)",
        ],
      },
      {
        title: "Triggers Are Teachers",
        description:
          "Reframe emotional triggers as doorways to self-understanding rather than obstacles to happiness.",
        transcript: `I want to change how you think about triggers. Most people see them as problems — unwanted emotional reactions that mess up good moments. But what if triggers are actually your psyche's way of pointing you toward unfinished business?\n\nWhen your partner's late reply sends you into a spiral, that's not about the text. It's about the abandonment wound saying "see, they're leaving." When a compliment makes you uncomfortable, that's not about the words. It's about a deep belief that you're not worthy of them.\n\nThe practice I want to teach you is called "trigger tracking." When you're triggered, don't react immediately. Instead, pause and ask: What am I feeling right now? When is the earliest time I remember feeling this exact feeling? What did I need then that I didn't get?\n\nThis transforms your triggers from landmines into signposts. They're not obstacles on the path to love — they ARE the path. Each one, when explored with curiosity, brings you closer to freedom.`,
        duration_minutes: 17,
        tasks: [
          "Track three triggers this week using the template in your workbook",
          "For each trigger, identify the original wound it connects to",
        ],
      },
      {
        title: "Forgiveness as Freedom",
        description:
          "Learn the transformative (and often misunderstood) practice of forgiveness — not for their sake, but for yours.",
        transcript: `Let me be clear about what forgiveness is not. It is not saying what happened was okay. It is not reconciliation. It is not forgetting. And it is definitely not a one-time event.\n\nForgiveness is a practice of releasing yourself from the emotional debt of the past. It's putting down the hot coal you've been holding, thinking it was hurting the other person. As the saying goes: unforgiveness is the poison you drink hoping someone else will die.\n\nThe person who hurt you may never apologise. They may never understand. They may never change. Your healing cannot depend on their participation. That gives them power they haven't earned and don't deserve.\n\nForgiveness is a decision you make for yourself, often repeatedly. Some days you'll feel it fully. Other days, the anger returns and you have to choose again. Both are valid. The practice isn't about perfection — it's about direction. You're moving toward freedom, one choice at a time.`,
        duration_minutes: 15,
        tasks: [
          "Write a forgiveness letter (you don't need to send it)",
          "Identify one resentment you're ready to begin releasing",
        ],
      },
      {
        title: "Reparenting Your Inner Child",
        description:
          "A powerful guided practice for giving your younger self the love, safety, and validation they needed.",
        transcript: `Inside every adult navigating love is a younger version of you who experienced love first — imperfectly, as all children do. That younger you is still active. They still react. They still need.\n\nReparenting isn't about blaming your parents. Most parents did the best they could with what they had. Reparenting is about becoming the adult your inner child needed. The one who says "I see you" when they feel invisible. The one who says "you're safe" when they feel scared. The one who says "you're enough" when they feel inadequate.\n\nHere's a practice: close your eyes and picture yourself at age 6 or 7. What did that child need to hear? What did they need to feel? Now, as the adult you are today, say those words. Out loud if possible. "You are loved. You are safe. You don't have to perform to be worthy of love."\n\nThis might feel strange or emotional. That's because it's working. Do this daily for a week and watch how it shifts your relationship patterns.`,
        duration_minutes: 20,
        tasks: [
          "Complete the Inner Child Letter exercise in the workbook",
          "Practice the reparenting meditation daily this week (5 minutes minimum)",
          "Reflect: how does your inner child show up in your adult relationships?",
        ],
      },
    ],
    // Week 3 (4 lessons)
    [
      {
        title: "Why Most Communication Fails",
        description:
          "Understand the hidden dynamics that turn conversations into conflicts — and the simple shifts that change everything.",
        transcript: `Here's why most relationship communication fails: you're not actually having the conversation you think you're having. On the surface, you're arguing about the dishes. Underneath, one person is saying "I feel invisible in this relationship" and the other is hearing "you're not good enough."\n\nDr. John Gottman's research reveals four communication patterns that predict relationship failure with 93% accuracy. He calls them the Four Horsemen: criticism (attacking character instead of behaviour), contempt (mocking, eye-rolling, superiority), defensiveness (meeting complaints with counter-complaints), and stonewalling (shutting down completely).\n\nThe antidotes are equally specific. Replace criticism with gentle startup — "I feel X when Y happens" instead of "you always Z." Replace contempt with expressions of appreciation. Replace defensiveness with taking responsibility, even partially. Replace stonewalling with self-soothing and returning to the conversation.\n\nThese aren't just communication tips. They're relationship survival skills. And the good news? They can be learned.`,
        duration_minutes: 18,
        tasks: [
          "Identify which of the Four Horsemen you use most in conflict",
          "Practice reframing one criticism as a gentle startup",
        ],
      },
      {
        title: "The Art of Deep Listening",
        description:
          "Learn to listen not just to words, but to the emotions beneath them — the skill that transforms every relationship.",
        transcript: `Most of us listen to respond. Deep listening means listening to understand. There's a world of difference.\n\nDeep listening involves three layers. First, hearing the content — the actual words being said. Second, hearing the emotion — the feeling beneath the words. "I'm fine" said with a tight jaw is not fine. Third, hearing the need — what is this person really asking for? Usually it's one of five things: to be seen, to be heard, to be validated, to be safe, or to be loved.\n\nHere's a practice: the next time someone shares something with you, resist the urge to solve, relate, or redirect. Instead, reflect back what you heard. "It sounds like you're feeling overwhelmed and you need to know I'm in your corner." Then wait.\n\nThe magic of deep listening is that it gives the other person the experience of being truly understood — which is, fundamentally, what every human being wants. And when people feel understood, walls come down.`,
        duration_minutes: 15,
        tasks: [
          "Practice deep listening in one conversation today — reflect back what you hear",
          "Journal about the experience: what was hard? What surprised you?",
        ],
      },
      {
        title: "Expressing Needs Without Blame",
        description:
          "Master the art of vulnerability — saying what you need clearly, honestly, and without making the other person the enemy.",
        transcript: `Here's a radical idea: your needs are not too much. Let me say that again. Your needs are not too much. The way you express them might need work, but the needs themselves are valid.\n\nThe framework I teach is called CLEARER communication. C: Choose the right moment (not when either person is heated). L: Lead with your feeling, not their behaviour. E: Express the specific need. A: Ask, don't demand. R: Receive their response without defensiveness. E: Express appreciation for listening. R: Revisit if needed.\n\nInstead of "You never make time for us," try: "I've been feeling disconnected lately, and I need us to have some intentional time together. Could we plan something this week?"\n\nSame need, completely different energy. The first puts them on defense. The second invites them in. Vulnerability is not weakness — it's the courage to be honest about what you need while trusting that the relationship can hold it.`,
        duration_minutes: 16,
        tasks: [
          "Identify three unspoken needs in your current or most recent relationship",
          "Rewrite one complaint as a CLEARER request using the workbook template",
          "Practice expressing one need this week (start small)",
        ],
      },
      {
        title: "Navigating Conflict With Grace",
        description:
          "Transform conflict from a destructive force into a pathway for deeper understanding and intimacy.",
        transcript: `Conflict is inevitable. Damage is optional. The couples who last aren't the ones who never fight — they're the ones who fight well.\n\nFighting well means three things. First, staying regulated. When your heart rate exceeds 100 BPM, your prefrontal cortex goes offline and you lose access to empathy, perspective, and reason. If either person is flooded, take a break. Not a storm-out — a structured break: "I need 20 minutes to calm down. I'm committed to coming back to this."\n\nSecond, fighting about the real issue. Most surface arguments are proxies for deeper fears. Before you engage, ask yourself: what am I really upset about? Often it's not the dishes or the schedule — it's feeling unvalued or unseen.\n\nThird, repairing quickly. Gottman's research shows that the masters of love aren't perfect — they rupture and repair constantly. A repair attempt can be as simple as reaching for your partner's hand mid-argument, cracking a gentle joke, or saying "I don't want us to be on opposite sides."\n\nConflict handled well actually deepens intimacy. It says: we can be messy and honest and still come back to each other.`,
        duration_minutes: 21,
        tasks: [
          "Create your personal conflict protocol using the workbook guide",
          "Practice the structured break technique the next time you feel flooded",
        ],
      },
    ],
    // Week 4 (4 lessons)
    [
      {
        title: "Designing Your Relationship Vision",
        description:
          "Create a vivid, specific vision of the relationship you're building — one that excites and guides you forward.",
        transcript: `You wouldn't start a business without a plan. You wouldn't build a house without blueprints. But most people enter relationships with only a vague hope that things will work out.\n\nToday, we're getting specific. I want you to design your relationship vision — not a fantasy, but a detailed picture of what extraordinary love looks like in your daily life.\n\nThink about how you want to feel when you wake up next to this person. How you handle disagreements. How you celebrate each other. How you maintain your individual identities while building something together. What you do on a random Tuesday evening. How you talk about money. How you support each other's dreams.\n\nThe power of a vision is that it gives you criteria. When you know what you're building, you can evaluate whether your actions — and your partner's — are moving you toward it or away from it. This isn't about perfection. It's about intention.\n\nIn your workbook, you'll find the Relationship Vision Builder. Take your time. Be bold. You deserve to want what you want.`,
        duration_minutes: 17,
        tasks: [
          "Complete the Relationship Vision Builder in the workbook",
          "Share one element of your vision in the community reflection (optional)",
        ],
      },
      {
        title: "Daily Rituals for Connection",
        description:
          "Build small, sustainable habits that keep your relationship vibrant and your connection alive — even on busy days.",
        transcript: `Grand gestures are lovely. But relationships are built in the ordinary moments — the way you say goodbye in the morning, how you greet each other at the end of the day, whether you reach for your phone or your partner during quiet moments.\n\nGottman calls these "bids for connection" — small moments where one partner reaches out, and the other either turns toward them or away. Couples who last turn toward each other's bids 86% of the time. Couples who don't make it? Only 33%.\n\nHere are five micro-rituals that take less than 5 minutes each but compound into extraordinary connection: A 6-second kiss goodbye (long enough to actually feel something). A stress-reducing conversation at the end of each day (20 minutes, no problem-solving, just listening). A weekly appreciation practice (tell each other 3 things you're grateful for). A daily check-in (high of the day, low of the day, one thing you need). A weekly date (doesn't need to cost money — just needs your full attention).\n\nThese rituals are the compound interest of love. Small deposits, massive returns over time.`,
        duration_minutes: 14,
        tasks: [
          "Choose three daily rituals to implement this week",
          "Track your connection rituals using the habit tracker in the workbook",
        ],
      },
      {
        title: "Growing Together Without Growing Apart",
        description:
          "Learn how to maintain individual growth while deepening your partnership — the balance that sustains lifelong love.",
        transcript: `One of the biggest misconceptions about love is that being a great partner means sacrificing yourself. It doesn't. The most magnetic, sustainable relationships are between two whole people who choose each other daily — not two half-people desperately completing each other.\n\nThis means maintaining your own interests, friendships, and growth. It means having your own dreams alongside shared ones. It means being able to be alone without being lonely.\n\nThe paradox of togetherness is that the more secure you feel in yourself, the more deeply you can connect with another. When you don't need someone to complete you, you're free to love them fully without fear.\n\nHere's the practice: regularly ask yourself and your partner these three questions. What are you excited about personally right now? What are we excited about together? How can I support your individual growth this month? These questions create a relationship where both people feel encouraged to expand — and that expansion feeds back into the partnership.`,
        duration_minutes: 16,
        tasks: [
          "Map your personal goals alongside shared relationship goals",
          "Have a conversation about individual growth with your partner or a close friend",
        ],
      },
      {
        title: "Your Conscious Love Commitment",
        description:
          "Bring everything together into a personal love manifesto — your declaration of how you choose to love from this day forward.",
        transcript: `We've covered a lot in four weeks. You've explored your attachment style, uncovered your emotional blueprint, processed old wounds, learned to communicate with depth, and designed your relationship vision. That's extraordinary inner work.\n\nBut knowledge without commitment is just entertainment. Today, I want you to make a commitment — not to a specific person, but to a way of loving.\n\nYour Conscious Love Commitment is a personal manifesto. It captures who you're choosing to be in love, what you will and won't tolerate, how you'll handle difficulty, and what you're building. It's a living document. It will evolve as you do.\n\nHere's how I want you to write it. Start with: "I commit to loving consciously. This means..." and then list your principles. Maybe it's "I will always communicate my needs, even when it's scary." Or "I choose growth over comfort." Or "I will not abandon myself to keep someone else."\n\nThis manifesto becomes your compass. When love gets confusing — and it will — you return to this document and ask: am I living this? If yes, stay the course. If not, adjust.\n\nI'm so proud of you for doing this work. Remember: the love you're looking for is looking for you. And now, you're ready for it.`,
        duration_minutes: 18,
        tasks: [
          "Write your Conscious Love Commitment using the workbook template",
          "Share your commitment (or a piece of it) in the community reflection",
          "Review your original intention from Lesson 1 — how has it evolved?",
        ],
      },
    ],
  ];

  // Insert lessons for each module
  let lessonCount = 0;
  for (let mi = 0; mi < moduleIds.length; mi++) {
    const moduleId = moduleIds[mi]!;
    const moduleLessons = lessonsPerModule[mi]!;

    for (let li = 0; li < moduleLessons.length; li++) {
      const lesson = moduleLessons[li]!;
      const { data: lessonRow, error: lessonError } = await supabase
        .from("lessons")
        .insert({
          module_id: moduleId,
          title: lesson.title,
          description: lesson.description,
          transcript: lesson.transcript,
          duration_minutes: lesson.duration_minutes,
          sort_order: li,
          is_free_preview: lesson.is_free_preview || false,
          video_url: "",
        })
        .select("id")
        .single();

      if (lessonError || !lessonRow) {
        console.error(
          `   ❌ Failed to create lesson "${lesson.title}": ${lessonError?.message}`
        );
        continue;
      }

      // Insert tasks
      if (lesson.tasks.length > 0) {
        await supabase.from("lesson_tasks").insert(
          lesson.tasks.map((t, ti) => ({
            lesson_id: lessonRow.id,
            task_text: t,
            sort_order: ti,
          }))
        );
      }

      lessonCount++;
    }

    // Add workbook resource to the last lesson of each module (one per week/module)
    const lastLesson = moduleLessons[moduleLessons.length - 1]!;
    const { data: lastLessonRow } = await supabase
      .from("lessons")
      .select("id")
      .eq("module_id", moduleId)
      .eq("title", lastLesson.title)
      .single();

    if (lastLessonRow) {
      const weekLabels = [
        "Preparation",
        "Week 1",
        "Week 2",
        "Week 3",
        "Week 4",
      ];
      await supabase.from("lesson_resources").insert({
        lesson_id: lastLessonRow.id,
        title: `${weekLabels[mi]} Workbook`,
        type: "workbook",
        file_url: "",
      });
    }
  }

  console.log(`   → ${lessonCount} lessons created with tasks and resources`);

  await seedComingSoonCourses();
}

async function seedComingSoonCourses() {
  const comingSoon = [
    {
      slug: "healing-after-heartbreak",
      title: "Healing After Heartbreak",
      subtitle:
        "From broken to breakthrough — a guided journey back to yourself",
      description:
        "A 3-week course for anyone navigating the end of a relationship. Process the pain, reclaim your identity, and emerge stronger and more self-aware than before.",
      cover_image_url: "/images/course-cover-heartbreak.svg",
      outcomes: JSON.stringify([
        "Process grief without being consumed by it",
        "Understand why the relationship ended without blame",
        "Rebuild your identity and self-worth",
        "Create healthy closure, with or without their participation",
      ]),
      total_lessons: 15,
      total_weeks: 3,
      status: "draft" as const,
      category: "Healing",
      price_inr: 5000,
      instructor_name: "Bloom Facilitator",
    },
    {
      slug: "the-language-of-desire",
      title: "The Language of Desire",
      subtitle:
        "Reignite passion and deepen intimacy in your relationship",
      description:
        "A bold, compassionate 4-week course for couples and individuals who want more depth, passion, and honesty in their intimate lives. Grounded in research, free of shame.",
      cover_image_url: "/images/course-cover-desire.svg",
      outcomes: JSON.stringify([
        "Understand the science of desire and attraction",
        "Communicate about intimacy without awkwardness or shame",
        "Build emotional safety that enables physical vulnerability",
        "Create rituals of connection that sustain long-term passion",
      ]),
      total_lessons: 16,
      total_weeks: 4,
      status: "draft" as const,
      category: "Intimacy",
      price_inr: 5000,
      instructor_name: "Bloom Facilitator",
    },
  ];

  for (const course of comingSoon) {
    const { data: existing } = await supabase
      .from("courses")
      .select("id")
      .eq("slug", course.slug)
      .maybeSingle();

    if (!existing) {
      await supabase.from("courses").insert(course);
      console.log(`   → Created Coming Soon: "${course.title}"`);
    } else {
      console.log(`   ℹ "${course.title}" already exists`);
    }
  }
}

// ── Generate SVG cover art ──
async function generateCoverArt() {
  console.log("\n🎨 Generating cover art...");
  const publicDir = path.join(__dirname, "..", "public", "images");
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const covers: Record<string, string> = {
    "course-cover-conscious-love.svg": `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#2D1B33"/>
      <stop offset="50%" style="stop-color:#E75D7C"/>
      <stop offset="100%" style="stop-color:#E8A94F"/>
    </linearGradient>
    <linearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#E75D7C;stop-opacity:0.6"/>
      <stop offset="100%" style="stop-color:#E8A94F;stop-opacity:0.3"/>
    </linearGradient>
  </defs>
  <rect width="800" height="600" fill="url(#bg)"/>
  <circle cx="400" cy="260" r="120" fill="url(#glow)" opacity="0.4"/>
  <circle cx="400" cy="260" r="80" fill="none" stroke="#FAF6EF" stroke-width="1.5" opacity="0.3"/>
  <circle cx="400" cy="260" r="45" fill="none" stroke="#FAF6EF" stroke-width="1" opacity="0.2"/>
  <g transform="translate(400,250)" fill="#FAF6EF" opacity="0.9">
    <ellipse cx="0" cy="-25" rx="12" ry="30" transform="rotate(0)"/>
    <ellipse cx="0" cy="-25" rx="12" ry="30" transform="rotate(72)"/>
    <ellipse cx="0" cy="-25" rx="12" ry="30" transform="rotate(144)"/>
    <ellipse cx="0" cy="-25" rx="12" ry="30" transform="rotate(216)"/>
    <ellipse cx="0" cy="-25" rx="12" ry="30" transform="rotate(288)"/>
    <circle cx="0" cy="0" r="8" fill="#E8A94F"/>
  </g>
  <text x="400" y="430" font-family="Georgia,serif" font-size="28" fill="#FAF6EF" text-anchor="middle" opacity="0.95">The Art of Conscious Love</text>
  <text x="400" y="465" font-family="sans-serif" font-size="14" fill="#FAF6EF" text-anchor="middle" opacity="0.7">4 Weeks · 20 Lessons · Transform How You Love</text>
</svg>`,
    "course-cover-heartbreak.svg": `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <defs>
    <linearGradient id="bg2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a1a2e"/>
      <stop offset="50%" style="stop-color:#8FAE94"/>
      <stop offset="100%" style="stop-color:#E8A94F"/>
    </linearGradient>
  </defs>
  <rect width="800" height="600" fill="url(#bg2)"/>
  <circle cx="400" cy="260" r="100" fill="none" stroke="#FAF6EF" stroke-width="1" opacity="0.2"/>
  <path d="M400 320 Q360 260 400 220 Q440 260 400 320Z" fill="#FAF6EF" opacity="0.15" transform="scale(2) translate(-200,-130)"/>
  <text x="400" y="430" font-family="Georgia,serif" font-size="28" fill="#FAF6EF" text-anchor="middle" opacity="0.95">Healing After Heartbreak</text>
  <text x="400" y="465" font-family="sans-serif" font-size="14" fill="#FAF6EF" text-anchor="middle" opacity="0.7">Coming Soon · 3 Weeks · 15 Lessons</text>
</svg>`,
    "course-cover-desire.svg": `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <defs>
    <linearGradient id="bg3" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#2D1B33"/>
      <stop offset="40%" style="stop-color:#D04466"/>
      <stop offset="100%" style="stop-color:#E8A94F"/>
    </linearGradient>
  </defs>
  <rect width="800" height="600" fill="url(#bg3)"/>
  <circle cx="360" cy="260" r="60" fill="none" stroke="#FAF6EF" stroke-width="1" opacity="0.2"/>
  <circle cx="440" cy="260" r="60" fill="none" stroke="#FAF6EF" stroke-width="1" opacity="0.2"/>
  <text x="400" y="430" font-family="Georgia,serif" font-size="28" fill="#FAF6EF" text-anchor="middle" opacity="0.95">The Language of Desire</text>
  <text x="400" y="465" font-family="sans-serif" font-size="14" fill="#FAF6EF" text-anchor="middle" opacity="0.7">Coming Soon · 4 Weeks · 16 Lessons</text>
</svg>`,
  };

  for (const [filename, svg] of Object.entries(covers)) {
    const filePath = path.join(publicDir, filename);
    fs.writeFileSync(filePath, svg);
    console.log(`   → ${filename}`);
  }
  console.log("   ✅ Cover art generated");
}

// ── Main ──
async function main() {
  console.log("🌸 Bloom Setup");
  console.log("═══════════════════════════════════════");

  await runMigrations();
  await generateCoverArt();
  const adminId = await createAdmin();
  await seedCourses();

  console.log("\n═══════════════════════════════════════");
  console.log("✅ Setup complete!\n");
  console.log("   Admin login:");
  console.log(`   Email:    ${ADMIN_EMAIL}`);
  console.log(`   Password: ${ADMIN_PASSWORD}`);
  if (adminId) {
    console.log(`   ID:       ${adminId}`);
  }
  console.log("\n   Run: npm run dev");
  console.log("═══════════════════════════════════════\n");
}

main().catch((err) => {
  console.error("❌ Setup failed:", err);
  process.exit(1);
});
