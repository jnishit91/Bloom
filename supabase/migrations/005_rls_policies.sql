-- 005: Row Level Security policies

-- ── Enable RLS on all tables ──
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

-- ── Helper: check if user is admin ──
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ── Helper: check if user is enrolled in a course ──
CREATE OR REPLACE FUNCTION public.is_enrolled(p_course_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.enrollments
    WHERE user_id = auth.uid()
      AND course_id = p_course_id
      AND status IN ('active', 'manual')
  );
$$;

-- ═══ PROFILES ═══
DROP POLICY IF EXISTS "Users read own profile" ON public.profiles;
CREATE POLICY "Users read own profile" ON public.profiles
  FOR SELECT USING (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ═══ COURSES (public metadata readable by all, full content by enrolled) ═══
DROP POLICY IF EXISTS "Anyone can read published courses" ON public.courses;
CREATE POLICY "Anyone can read published courses" ON public.courses
  FOR SELECT USING (status = 'published' OR public.is_admin());

DROP POLICY IF EXISTS "Admins manage courses" ON public.courses;
CREATE POLICY "Admins manage courses" ON public.courses
  FOR ALL USING (public.is_admin());

-- ═══ MODULES ═══
DROP POLICY IF EXISTS "Read modules of published courses" ON public.modules;
CREATE POLICY "Read modules of published courses" ON public.modules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE courses.id = modules.course_id
        AND (courses.status = 'published' OR public.is_admin())
    )
  );

DROP POLICY IF EXISTS "Admins manage modules" ON public.modules;
CREATE POLICY "Admins manage modules" ON public.modules
  FOR ALL USING (public.is_admin());

-- ═══ LESSONS ═══
DROP POLICY IF EXISTS "Read lessons if enrolled or free preview" ON public.lessons;
CREATE POLICY "Read lessons if enrolled or free preview" ON public.lessons
  FOR SELECT USING (
    is_free_preview = true
    OR public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.modules m
        JOIN public.courses c ON c.id = m.course_id
      WHERE m.id = lessons.module_id
        AND public.is_enrolled(c.id)
    )
  );

DROP POLICY IF EXISTS "Admins manage lessons" ON public.lessons;
CREATE POLICY "Admins manage lessons" ON public.lessons
  FOR ALL USING (public.is_admin());

-- ═══ LESSON RESOURCES ═══
DROP POLICY IF EXISTS "Read resources if enrolled" ON public.lesson_resources;
CREATE POLICY "Read resources if enrolled" ON public.lesson_resources
  FOR SELECT USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.lessons l
        JOIN public.modules m ON m.id = l.module_id
        JOIN public.courses c ON c.id = m.course_id
      WHERE l.id = lesson_resources.lesson_id
        AND public.is_enrolled(c.id)
    )
  );

DROP POLICY IF EXISTS "Admins manage resources" ON public.lesson_resources;
CREATE POLICY "Admins manage resources" ON public.lesson_resources
  FOR ALL USING (public.is_admin());

-- ═══ LESSON TASKS ═══
DROP POLICY IF EXISTS "Read tasks if enrolled" ON public.lesson_tasks;
CREATE POLICY "Read tasks if enrolled" ON public.lesson_tasks
  FOR SELECT USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.lessons l
        JOIN public.modules m ON m.id = l.module_id
        JOIN public.courses c ON c.id = m.course_id
      WHERE l.id = lesson_tasks.lesson_id
        AND public.is_enrolled(c.id)
    )
  );

DROP POLICY IF EXISTS "Admins manage tasks" ON public.lesson_tasks;
CREATE POLICY "Admins manage tasks" ON public.lesson_tasks
  FOR ALL USING (public.is_admin());

-- ═══ ENROLLMENTS ═══
DROP POLICY IF EXISTS "Users read own enrollments" ON public.enrollments;
CREATE POLICY "Users read own enrollments" ON public.enrollments
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Users create own enrollments" ON public.enrollments;
CREATE POLICY "Users create own enrollments" ON public.enrollments
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins manage enrollments" ON public.enrollments;
CREATE POLICY "Admins manage enrollments" ON public.enrollments
  FOR ALL USING (public.is_admin());

-- ═══ LESSON PROGRESS ═══
DROP POLICY IF EXISTS "Users manage own progress" ON public.lesson_progress;
CREATE POLICY "Users manage own progress" ON public.lesson_progress
  FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins read progress" ON public.lesson_progress;
CREATE POLICY "Admins read progress" ON public.lesson_progress
  FOR SELECT USING (public.is_admin());

-- ═══ TASK COMPLETIONS ═══
DROP POLICY IF EXISTS "Users manage own task completions" ON public.task_completions;
CREATE POLICY "Users manage own task completions" ON public.task_completions
  FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins read task completions" ON public.task_completions;
CREATE POLICY "Admins read task completions" ON public.task_completions
  FOR SELECT USING (public.is_admin());

-- ═══ QUIZ ATTEMPTS ═══
DROP POLICY IF EXISTS "Users manage own quiz attempts" ON public.quiz_attempts;
CREATE POLICY "Users manage own quiz attempts" ON public.quiz_attempts
  FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins read quiz attempts" ON public.quiz_attempts;
CREATE POLICY "Admins read quiz attempts" ON public.quiz_attempts
  FOR SELECT USING (public.is_admin());

-- ═══ REFLECTIONS ═══
DROP POLICY IF EXISTS "Users manage own reflections" ON public.reflections;
CREATE POLICY "Users manage own reflections" ON public.reflections
  FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Read public reflections" ON public.reflections;
CREATE POLICY "Read public reflections" ON public.reflections
  FOR SELECT USING (is_public = true);

DROP POLICY IF EXISTS "Admins read reflections" ON public.reflections;
CREATE POLICY "Admins read reflections" ON public.reflections
  FOR SELECT USING (public.is_admin());

-- ═══ AI CONVERSATIONS ═══
DROP POLICY IF EXISTS "Users manage own AI conversations" ON public.ai_conversations;
CREATE POLICY "Users manage own AI conversations" ON public.ai_conversations
  FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins read AI conversations" ON public.ai_conversations;
CREATE POLICY "Admins read AI conversations" ON public.ai_conversations
  FOR SELECT USING (public.is_admin());
