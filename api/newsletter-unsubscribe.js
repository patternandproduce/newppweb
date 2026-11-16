import { createClient } from '@supabase/supabase-js';
import { env } from '../server/http.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).send('Method not allowed');
  const token = String(req.query?.token || '').trim();
  if (!token) return res.status(400).send('This unsubscribe link is incomplete.');
  try {
    const client = createClient(env('SUPABASE_URL'), env('SUPABASE_SECRET_KEY'), { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await client.from('newsletter_subscribers').update({ unsubscribed_at: new Date().toISOString() }).eq('unsubscribe_token', token).is('unsubscribed_at', null).select('id').maybeSingle();
    if (error) throw error;
    const message = data ? 'You have been unsubscribed from Pattern & Produce newsletter updates.' : 'This link has already been used, or it is no longer valid.';
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Newsletter preferences</title></head><body style="font-family:Arial,sans-serif;max-width:600px;margin:12vh auto;padding:24px;color:#222;line-height:1.6"><h1>Pattern &amp; Produce</h1><p>${message}</p><p>You can close this page now.</p></body></html>`);
  } catch (error) {
    console.error('Newsletter unsubscribe failed:', error);
    return res.status(500).send('We could not process your request. Please try again later.');
  }
}
