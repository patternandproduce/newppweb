import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const base = path.resolve('scripts/migration-data');
const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceKey) throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running this migration.');

function parseCsv(text) {
  const rows = []; let row = []; let field = ''; let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) { if (c === '"' && text[i + 1] === '"') { field += '"'; i++; } else if (c === '"') quoted = false; else field += c; }
    else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  const headers = (rows.shift() || []).map(x => x.trim());
  return rows.filter(r => r.some(x => x !== '')).map(r => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ''])));
}

async function upsert(table, rows) {
  if (!rows.length) return;
  const response = await fetch(`${supabaseUrl}/rest/v1/${table}?on_conflict=id`, {
    method: 'POST', headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(rows),
  });
  if (!response.ok) throw new Error(`Import into ${table} failed: ${response.status} ${await response.text()}`);
}

const leadSheets = { Registrations: 'registrations', Consultations: 'consultations', Quotes: 'quotes', Contacts: 'contacts' };
for (const [filename, kind] of Object.entries(leadSheets)) {
  const file = path.join(base, `${filename}.csv`);
  if (!fs.existsSync(file)) continue;
  const rows = parseCsv(fs.readFileSync(file, 'utf8')).map(r => {
    const data = {};
    for (const [key, value] of Object.entries(r)) if (!['_row','id','createdAt','status','exported'].includes(key) && value !== '') data[key] = value;
    return { id: /^[0-9a-f-]{36}$/i.test(r.id || '') ? r.id : randomUUID(), kind, data, status: r.status === 'contacted' ? 'contacted' : 'new', exported: ['yes','true','1'].includes(String(r.exported).toLowerCase()), created_at: r.createdAt && !Number.isNaN(Date.parse(r.createdAt)) ? new Date(r.createdAt).toISOString() : new Date().toISOString() };
  });
  await upsert('leads', rows);
  console.log(`Imported ${rows.length} ${kind}.`);
}

const visitsFile = path.join(base, 'Visits.csv');
if (fs.existsSync(visitsFile)) {
  const rows = parseCsv(fs.readFileSync(visitsFile, 'utf8')).map(r => ({ session_id: r.sid || randomUUID(), path: r.path || '/', device: r.device || 'Unknown', referrer: r.ref || '', created_at: r.time && !Number.isNaN(Date.parse(r.time)) ? new Date(r.time).toISOString() : new Date().toISOString() }));
  const response = await fetch(`${supabaseUrl}/rest/v1/visits`, { method: 'POST', headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify(rows) });
  if (!response.ok) throw new Error(`Import into visits failed: ${response.status} ${await response.text()}`);
  console.log(`Imported ${rows.length} visits.`);
}

console.log('CSV migration complete. Staff passwords cannot be migrated from the old hashed-password system; recreate staff accounts in Admin > Staff.');
