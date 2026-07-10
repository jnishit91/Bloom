-- 003: Enrollments (with GST fields) and progress tracking

CREATE TABLE IF NOT EXISTS public.enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  razorpay_order_id text,
  razorpay_payment_id text,
  amount_paid integer,
  base_amount integer,
  gst_rate numeric NOT NULL DEFAULT 18,
  gst_amount integer,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'failed', 'refunded', 'manual')),
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  enrolled_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_enrollments_user ON public.enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON public.enrollments(course_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_enrollments_user_course_active
  ON public.enrollments(user_id, course_id) WHERE status IN ('active', 'manual');

CREATE TABLE IF NOT EXISTS public.lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  last_position_seconds integer NOT NULL DEFAULT 0,
  UNIQUE (user_id, lesson_id)
);

CREATE TABLE IF NOT EXISTS public.task_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_task_id uuid NOT NULL REFERENCES public.lesson_tasks(id) ON DELETE CASCADE,
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, lesson_task_id)
);
