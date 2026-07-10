-- 002: Course content tables

CREATE TABLE IF NOT EXISTS public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  subtitle text,
  description text,
  instructor_name text NOT NULL DEFAULT 'Bloom Facilitator',
  instructor_bio text,
  instructor_photo_url text,
  cover_image_url text,
  trailer_video_url text,
  price_inr integer NOT NULL DEFAULT 5000,
  outcomes jsonb DEFAULT '[]'::jsonb,
  total_lessons integer NOT NULL DEFAULT 0,
  total_weeks integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  category text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_modules_course ON public.modules(course_id, sort_order);

CREATE TABLE IF NOT EXISTS public.lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  video_url text,
  duration_minutes integer NOT NULL DEFAULT 0,
  transcript text,
  sort_order integer NOT NULL DEFAULT 0,
  is_free_preview boolean NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_lessons_module ON public.lessons(module_id, sort_order);

CREATE TABLE IF NOT EXISTS public.lesson_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  title text NOT NULL,
  type text NOT NULL DEFAULT 'workbook' CHECK (type IN ('workbook', 'audio', 'pdf')),
  file_url text
);

CREATE TABLE IF NOT EXISTS public.lesson_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  task_text text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0
);
