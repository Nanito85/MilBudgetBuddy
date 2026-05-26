-- ─── MilBudgetBuddy Feedback System ──────────────────────────────────────────
-- Run this in the Supabase SQL editor: https://app.supabase.com → SQL Editor

-- ─── FEEDBACK TABLE ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.feedback (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       text,
  user_email    text,
  user_role     text,
  category      text        NOT NULL DEFAULT 'Other',
  message       text        NOT NULL,
  screen_name   text,
  app_version   text,
  device_type   text,
  status        text        NOT NULL DEFAULT 'new'
                            CHECK (status IN ('new','reviewed','in_progress','fixed','wont_fix','duplicate')),
  admin_notes   text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  reviewed_at   timestamptz,
  resolved_at   timestamptz
);

-- ─── FEEDBACK REPORTS TABLE ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.feedback_reports (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type     text        NOT NULL CHECK (report_type IN ('daily','weekly')),
  start_date      timestamptz NOT NULL,
  end_date        timestamptz NOT NULL,
  feedback_count  int         NOT NULL DEFAULT 0,
  summary         text,
  urgent_items    jsonb       NOT NULL DEFAULT '[]',
  top_categories  jsonb       NOT NULL DEFAULT '{}',
  full_report     jsonb       NOT NULL DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ─── INDEXES ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS feedback_status_idx    ON public.feedback (status);
CREATE INDEX IF NOT EXISTS feedback_category_idx  ON public.feedback (category);
CREATE INDEX IF NOT EXISTS feedback_created_idx   ON public.feedback (created_at DESC);
CREATE INDEX IF NOT EXISTS feedback_user_id_idx   ON public.feedback (user_id);
CREATE INDEX IF NOT EXISTS reports_created_idx    ON public.feedback_reports (created_at DESC);

-- ─── ROW-LEVEL SECURITY ──────────────────────────────────────────────────────
-- All access goes through the Hono backend with the service role key.
-- The service role bypasses RLS automatically.
-- These policies block any direct anon / client-side access as defense in depth.

ALTER TABLE public.feedback          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_reports  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "deny_anon_feedback"   ON public.feedback;
DROP POLICY IF EXISTS "deny_anon_reports"    ON public.feedback_reports;

CREATE POLICY "deny_anon_feedback"
  ON public.feedback FOR ALL TO anon, authenticated USING (false);

CREATE POLICY "deny_anon_reports"
  ON public.feedback_reports FOR ALL TO anon, authenticated USING (false);

-- ─── SCHEDULED REPORT (via pg_cron) ──────────────────────────────────────────
-- Enable pg_cron extension first: Dashboard → Database → Extensions → pg_cron
-- Replace <YOUR_HONO_URL> and <YOUR_REPORT_SECRET> before running.
--
-- SELECT cron.schedule(
--   'daily-feedback-report',
--   '0 6 * * *',
--   $$
--     SELECT net.http_post(
--       url        := 'https://<YOUR_HONO_URL>/api/feedback/reports/generate',
--       headers    := '{"Content-Type":"application/json","x-cron-secret":"<YOUR_REPORT_SECRET>"}',
--       body       := '{"report_type":"daily"}'
--     );
--   $$
-- );
--
-- SELECT cron.schedule(
--   'weekly-feedback-report',
--   '0 7 * * 1',
--   $$
--     SELECT net.http_post(
--       url        := 'https://<YOUR_HONO_URL>/api/feedback/reports/generate',
--       headers    := '{"Content-Type":"application/json","x-cron-secret":"<YOUR_REPORT_SECRET>"}',
--       body       := '{"report_type":"weekly"}'
--     );
--   $$
-- );
