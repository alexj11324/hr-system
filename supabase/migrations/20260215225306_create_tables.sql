CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  role text DEFAULT 'employee',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  position text,
  status text DEFAULT 'pending',
  resume_url text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.passkey_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credential_id text NOT NULL UNIQUE,
  public_key text NOT NULL,
  counter bigint DEFAULT 0,
  transports jsonb DEFAULT '[]'::jsonb,
  device_type text,
  backed_up boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passkey_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own applications" ON public.job_applications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own applications" ON public.job_applications FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own credentials" ON public.passkey_credentials FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own credentials" ON public.passkey_credentials FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own credentials" ON public.passkey_credentials FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Service role full access profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access applications" ON public.job_applications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access credentials" ON public.passkey_credentials FOR ALL USING (true) WITH CHECK (true);
