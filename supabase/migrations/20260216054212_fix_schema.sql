-- 1. Create jobs table
CREATE TABLE IF NOT EXISTS public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  department text,
  hiring_manager text,
  location text,
  salary_min integer DEFAULT 0,
  salary_max integer DEFAULT 0,
  status text DEFAULT 'Open',
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Jobs are viewable by everyone" ON public.jobs FOR SELECT USING (true);
CREATE POLICY "Jobs are manageable by authenticated users" ON public.jobs FOR ALL USING (auth.role() = 'authenticated');

-- 2. Fix profiles table: add missing columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS first_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS resume_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at timestamptz;

-- 3. Fix job_applications table: add missing columns
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS job_id text;
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS job_title text;
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS first_name text;
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS last_name text;
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS linkedin text;
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS portfolio text;
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS excitement_response text;
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS evidence_response text;
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS gender text;
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS race text;
ALTER TABLE public.job_applications ADD COLUMN IF NOT EXISTS application_type text;
