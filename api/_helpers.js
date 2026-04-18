// Shared helpers used by the /api routes.
// Not exposed as a route — no default export.

import { createClient } from '@supabase/supabase-js';

export function checkPassword(req) {
  const expected = process.env.APP_PASSWORD;
  if (!expected) return false;
  const provided = req.headers['x-app-password'] || req.body?.password;
  return provided === expected;
}

export function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase env vars');
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function json(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(body));
}
