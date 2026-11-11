export function send(res, status, body) {
  res.status(status).setHeader('Cache-Control', 'no-store').json(body);
}
export function requireMethod(req, res, method = 'POST') {
  if (req.method !== method) { send(res, 405, { ok: false, error: 'Method not allowed' }); return false; }
  return true;
}
export function env(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Server configuration missing: ${name}`);
  return value;
}
