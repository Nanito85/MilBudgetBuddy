// Supabase Edge Function — generate-feedback-report
// Thin scheduler wrapper: called by pg_cron, forwards to the Hono backend.
// Deploy: supabase functions deploy generate-feedback-report

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  const honoUrl    = Deno.env.get('HONO_API_URL') ?? '';
  const secret     = Deno.env.get('REPORT_SECRET') ?? '';

  if (!honoUrl || !secret) {
    return new Response(JSON.stringify({ error: 'HONO_API_URL or REPORT_SECRET not set' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: { report_type?: string } = {};
  try { body = await req.json(); } catch { /* default to daily */ }

  const res = await fetch(`${honoUrl}/api/feedback/reports/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-cron-secret': secret,
    },
    body: JSON.stringify({ report_type: body.report_type ?? 'daily' }),
  });

  const data = await res.json();
  return new Response(JSON.stringify(data), {
    status: res.status,
    headers: { 'Content-Type': 'application/json' },
  });
});
