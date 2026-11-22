CREATE TABLE IF NOT EXISTS public.access_requests (
  user_id uuid PRIMARY KEY,
  email text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz
);

GRANT SELECT ON public.access_requests TO authenticated;
GRANT ALL ON public.access_requests TO service_role;
ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'access_requests'
      AND policyname = 'Users read own access request'
  ) THEN
    CREATE POLICY "Users read own access request"
      ON public.access_requests
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END
$$;

CREATE OR REPLACE FUNCTION public.handle_new_access_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.access_requests (user_id, email)
  VALUES (NEW.id, COALESCE(NEW.email, ''))
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_access_request() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS on_auth_user_created_access_request ON auth.users;
CREATE TRIGGER on_auth_user_created_access_request
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_access_request();

-- Existing accounts also need a request row so the developer can review them.
INSERT INTO public.access_requests (user_id, email)
SELECT id, COALESCE(email, '')
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;
