/**
 * Pattern & Produce backend: runs free inside your Google Sheet.
 * Sheet > Extensions > Apps Script > paste this file > follow SETUP.md.
 * It stores form submissions, visitor counts, the video library and staff logins, and sends emails from your Gmail.
 */

/* ===== Edit these two lines, then run setupFirstAdmin() ONCE, then change the password below back to something else or delete it ===== */
const FIRST_ADMIN = { username: 'admin', name: 'Owner', password: 'CHANGE-THIS-PASSWORD' };

const LEAD_SHEETS = { registrations: 'Registrations', consultations: 'Consultations', quotes: 'Quotes', contacts: 'Contacts' };
const RESERVED = ['_row', 'id', 'createdAt', 'status', 'exported'];
const TOKEN_SECONDS = 6 * 3600;
const TZ = Session.getScriptTimeZone();

/* ---------- entry points ---------- */
function doGet() { return out({ ok: true, data: 'Pattern & Produce backend is running.' }); }
function doPost(e) {
  let res;
  try {
    const req = JSON.parse(e.postData.contents);
    res = { ok: true, data: route(String(req.action || ''), req.data || {}, req.token) };
  } catch (err) { res = { ok: false, error: err.message || String(err) }; }
  return out(res);
}
function out(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

function route(action, d, token) {
  switch (action) { // open to everyone (visitors)
    case 'login': return login(d);
    case 'library.get': return libraryGet();
    case 'lead.create': return leadCreate(d);
    case 'visit': return visit(d);
  }
  const user = auth(token); // everything below needs a signed-in employee
  switch (action) {
    case 'library.save': return librarySave(d);
    case 'leads.list': return leadsList(d.kind);
    case 'leads.mark': return leadsMark(d);
    case 'email.send': return emailSend(d);
    case 'analytics': return analytics(d.range);
    case 'thumb.upload': return thumbUpload(d);
    case 'staff.list': needAdmin(user); return staffList();
    case 'staff.save': needAdmin(user); return staffSave(d);
    case 'staff.setActive': needAdmin(user); return staffSetActive(d);
  }
  throw new Error('Unknown request');
}

/* ---------- sheet helpers ---------- */
function ss() { return SpreadsheetApp.getActiveSpreadsheet(); }
function sh(name) {
  let s = ss().getSheetByName(name);
  if (!s) { s = ss().insertSheet(name); s.getRange(1, 1, s.getMaxRows(), s.getMaxColumns()).setNumberFormat('@'); } // plain text keeps 0803... phone numbers intact
  return s;
}
function cell(v) { return v instanceof Date ? v.toISOString() : v; }
function rows(name) {
  const v = sh(name).getDataRange().getValues();
  if (v.length < 2) return [];
  const h = v[0].map(String);
  return v.slice(1).map(function (r, i) { const o = { _row: i + 2 }; h.forEach(function (k, j) { o[k] = cell(r[j]); }); return o; });
}
function appendObj(name, obj) {
  const s = sh(name);
  const h = s.getLastColumn() ? s.getRange(1, 1, 1, s.getLastColumn()).getValues()[0].map(String) : [];
  Object.keys(obj).forEach(function (k) { if (h.indexOf(k) < 0) { h.push(k); s.getRange(1, h.length).setValue(k).setFontWeight('bold'); } });
  s.appendRow(h.map(function (k) { return obj[k] === undefined ? '' : obj[k]; }));
}
function updateRow(name, rowNumber, patch) {
  const s = sh(name);
  const h = s.getRange(1, 1, 1, s.getLastColumn()).getValues()[0].map(String);
  Object.keys(patch).forEach(function (k) { const i = h.indexOf(k); if (i >= 0) s.getRange(rowNumber, i + 1).setValue(patch[k]); });
}
function safe(v) { // stops spreadsheet formulas typed into a form from running
  let t = String(v == null ? '' : v).slice(0, 3000);
  if (/^[=+\-@]/.test(t)) t = "'" + t;
  return t;
}
function withLock(fn) { const l = LockService.getScriptLock(); l.waitLock(15000); try { return fn(); } finally { l.releaseLock(); } }

/* ---------- staff and sign in ---------- */
function hash(salt, pw) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, salt + pw, Utilities.Charset.UTF_8)
    .map(function (b) { return ('0' + (b & 0xff).toString(16)).slice(-2); }).join('');
}
function setupFirstAdmin() { // run once from the editor
  if (rows('Staff').length) { Logger.log('There is already an account. Nothing changed.'); return; }
  if (FIRST_ADMIN.password === 'CHANGE-THIS-PASSWORD' || FIRST_ADMIN.password.length < 8) throw new Error('Change the password in FIRST_ADMIN first (8 or more characters).');
  const salt = Utilities.getUuid();
  appendObj('Staff', { username: FIRST_ADMIN.username.toLowerCase(), name: FIRST_ADMIN.name, role: 'admin', salt: salt, hash: hash(salt, FIRST_ADMIN.password), active: 'yes' });
  ['Registrations', 'Consultations', 'Quotes', 'Contacts', 'Visits', 'Library'].forEach(sh);
  Logger.log('Admin account created. You can now sign in at /admin.');
}
function login(d) {
  const username = String(d.username || '').trim().toLowerCase();
  const cache = CacheService.getScriptCache();
  const fails = Number(cache.get('f_' + username) || 0);
  if (fails >= 8) throw new Error('Too many attempts. Please try again in 15 minutes.');
  const u = rows('Staff').filter(function (r) { return String(r.username).toLowerCase() === username; })[0];
  if (!u || String(u.active) === 'no' || hash(String(u.salt), String(d.password || '')) !== String(u.hash)) {
    cache.put('f_' + username, String(fails + 1), 900);
    throw new Error('Wrong username or password.');
  }
  cache.remove('f_' + username);
  const token = Utilities.getUuid() + Utilities.getUuid();
  cache.put('t_' + token, JSON.stringify({ username: String(u.username), name: String(u.name), role: String(u.role) }), TOKEN_SECONDS);
  return { token: token, username: String(u.username), name: String(u.name), role: String(u.role) };
}
function auth(token) {
  const s = token ? CacheService.getScriptCache().get('t_' + token) : null;
  if (!s) throw new Error('Please sign in again.');
  return JSON.parse(s);
}
function needAdmin(user) { if (user.role !== 'admin') throw new Error('Only admins can do this.'); }
function staffList() {
  return rows('Staff').map(function (r) { return { username: String(r.username), name: String(r.name), role: String(r.role), active: String(r.active) !== 'no' }; });
}
function staffSave(d) {
  const username = String(d.username || '').trim().toLowerCase();
  if (!/^[a-z0-9._-]{3,30}$/.test(username)) throw new Error('Username: 3 to 30 letters, numbers, dots or dashes.');
  const role = d.role === 'admin' ? 'admin' : 'staff';
  const pw = String(d.password || '');
  if (pw && pw.length < 8) throw new Error('Password must be at least 8 characters.');
  return withLock(function () {
    const u = rows('Staff').filter(function (r) { return String(r.username) === username; })[0];
    if (u) {
      const patch = { name: safe(d.name), role: role };
      if (pw) { const salt = Utilities.getUuid(); patch.salt = salt; patch.hash = hash(salt, pw); }
      updateRow('Staff', u._row, patch);
    } else {
      if (!pw) throw new Error('Please set a password.');
      const salt = Utilities.getUuid();
      appendObj('Staff', { username: username, name: safe(d.name), role: role, salt: salt, hash: hash(salt, pw), active: 'yes' });
    }
    return { saved: true };
  });
}
function staffSetActive(d) {
  const u = rows('Staff').filter(function (r) { return String(r.username) === String(d.username); })[0];
  if (!u) throw new Error('Account not found.');
  updateRow('Staff', u._row, { active: d.active ? 'yes' : 'no' });
  return { saved: true };
}

/* ---------- leads (registrations, consultation, quote and contact messages) ---------- */
function leadCreate(d) {
  const name = LEAD_SHEETS[d.kind];
  if (!name) throw new Error('Unknown list');
  const data = d.data || {};
  const rec = {};
  Object.keys(data).slice(0, 40).forEach(function (k) { if (/^[a-z_]{1,40}$/.test(k) && RESERVED.indexOf(k) < 0) rec[k] = safe(data[k]); });
  if (!rec.email && !rec.phone) throw new Error('Missing contact details');
  rec.id = Utilities.getUuid(); rec.createdAt = new Date().toISOString(); rec.status = 'new'; rec.exported = 'no';
  withLock(function () { appendObj(name, rec); });
  return { saved: true };
}
function leadsList(kind) {
  const name = LEAD_SHEETS[kind];
  if (!name) throw new Error('Unknown list');
  return rows(name).map(function (r) {
    const data = {};
    Object.keys(r).forEach(function (k) { if (RESERVED.indexOf(k) < 0 && r[k] !== '') data[k] = String(r[k]); });
    return { id: String(r.id), createdAt: String(r.createdAt), status: String(r.status || 'new'), exported: String(r.exported) === 'yes', data: data };
  });
}
function leadsMark(d) {
  const name = LEAD_SHEETS[d.kind];
  if (!name) throw new Error('Unknown list');
  const ids = (d.ids || []).map(String);
  return withLock(function () {
    let n = 0;
    rows(name).forEach(function (r) {
      if (ids.indexOf(String(r.id)) < 0) return;
      const patch = {};
      if (d.status !== undefined) patch.status = d.status === 'contacted' ? 'contacted' : 'new';
      if (d.exported !== undefined) patch.exported = d.exported ? 'yes' : 'no';
      updateRow(name, r._row, patch); n++;
    });
    return { updated: n };
  });
}
function emailSend(d) {
  const subject = String(d.subject || '').trim(), body = String(d.body || '').trim();
  if (!subject || !body) throw new Error('A subject and a message are required.');
  const ids = (d.ids || []).map(String);
  const list = leadsList(d.kind).filter(function (r) { return ids.indexOf(r.id) >= 0 && /\S+@\S+\.\S+/.test(r.data.email || ''); });
  if (!list.length) throw new Error('None of the chosen people has a valid email address.');
  const quota = MailApp.getRemainingDailyQuota();
  if (list.length > quota) throw new Error('Google allows ' + quota + ' more emails today. Choose fewer people or try tomorrow.');
  let sent = 0, failed = 0;
  list.forEach(function (r) {
    try {
      const first = r.data.first_name || '', full = ((r.data.first_name || '') + ' ' + (r.data.last_name || '')).trim();
      const fill = function (t) { return t.replace(/\{\{\s*first_name\s*\}\}/g, first).replace(/\{\{\s*name\s*\}\}/g, full); };
      MailApp.sendEmail({ to: r.data.email, subject: fill(subject), body: fill(body), name: 'Pattern & Produce' });
      sent++;
    } catch (e) { failed++; }
  });
  return { sent: sent, failed: failed, remaining: MailApp.getRemainingDailyQuota() };
}

/* ---------- video library and thumbnails ---------- */
function libraryGet() {
  const s = sh('Library'), n = s.getLastRow();
  if (!n) return null;
  try { return JSON.parse(s.getRange(1, 1, n, 1).getValues().map(function (r) { return r[0]; }).join('')); } catch (e) { return null; }
}
function librarySave(d) {
  if (!d || !Array.isArray(d.phases) || !Array.isArray(d.videos)) throw new Error('Invalid library');
  const text = JSON.stringify({ phases: d.phases, videos: d.videos });
  if (text.length > 400000) throw new Error('The library is too large. Use uploaded thumbnails instead of pasted pictures.');
  const parts = [];
  for (let i = 0; i < text.length; i += 40000) parts.push([text.slice(i, i + 40000)]);
  withLock(function () { const s = sh('Library'); s.clear(); s.getRange(1, 1, parts.length, 1).setNumberFormat('@').setValues(parts); });
  return { saved: true };
}
function thumbUpload(d) {
  const m = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(String(d.data || ''));
  if (!m || m[2].length > 700000) throw new Error('Please choose a smaller image.');
  const it = DriveApp.getFoldersByName('Pattern & Produce thumbnails');
  const folder = it.hasNext() ? it.next() : DriveApp.createFolder('Pattern & Produce thumbnails');
  const file = folder.createFile(Utilities.newBlob(Utilities.base64Decode(m[2]), m[1], 'thumb-' + Date.now()));
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return { url: 'https://lh3.googleusercontent.com/d/' + file.getId() + '=w640' };
}

/* ---------- visitors ---------- */
function visit(d) {
  const s = sh('Visits');
  if (!s.getLastRow()) s.appendRow(['time', 'sid', 'path', 'device', 'ref']);
  const device = ['Mobile', 'Tablet', 'Desktop'].indexOf(d.device) >= 0 ? d.device : 'Desktop';
  s.appendRow([new Date().toISOString(), safe(d.sid).slice(0, 80), safe(d.path).slice(0, 120), device, safe(d.ref).slice(0, 80)]);
  return { ok: true };
}
function analytics(range) {
  const DAY = 86400000, now = new Date();
  const ymd = function (t) { return Utilities.formatDate(t, TZ, 'yyyy-MM-dd'); };
  const v = sh('Visits').getDataRange().getValues().slice(1);
  const visits = v.filter(function (r) { return r[0]; }).map(function (r) { return { t: new Date(r[0]), sid: String(r[1]), path: String(r[2]), device: String(r[3]), ref: String(r[4]) }; })
    .filter(function (x) { return !isNaN(x.t); });
  const uniq = function (a) { const o = {}; a.forEach(function (x) { o[x.sid] = 1; }); return Object.keys(o).length; };
  const since = function (ms) { return visits.filter(function (x) { return now - x.t < ms; }); };
  const totals = { today: uniq(visits.filter(function (x) { return ymd(x.t) === ymd(now); })), week: uniq(since(7 * DAY)), month: uniq(since(30 * DAY)), year: uniq(since(365 * DAY)) };
  const series = []; let win;
  if (range === 'day') {
    win = visits.filter(function (x) { return ymd(x.t) === ymd(now); });
    for (let h = 0; h < 24; h++) series.push({ label: ('0' + h).slice(-2) + ':00', visitors: uniq(win.filter(function (x) { return Number(Utilities.formatDate(x.t, TZ, 'H')) === h; })) });
  } else if (range === 'year') {
    win = since(365 * DAY);
    for (let i = 11; i >= 0; i--) {
      const dt = new Date(now.getFullYear(), now.getMonth() - i, 1), key = Utilities.formatDate(dt, TZ, 'yyyy-MM');
      series.push({ label: Utilities.formatDate(dt, TZ, 'MMM'), visitors: uniq(visits.filter(function (x) { return Utilities.formatDate(x.t, TZ, 'yyyy-MM') === key; })) });
    }
  } else {
    const n = range === 'month' ? 30 : 7; win = since(n * DAY);
    for (let i = n - 1; i >= 0; i--) {
      const dt = new Date(now.getTime() - i * DAY), key = ymd(dt);
      series.push({ label: Utilities.formatDate(dt, TZ, range === 'week' ? 'EEE' : 'd'), visitors: uniq(visits.filter(function (x) { return ymd(x.t) === key; })) });
    }
  }
  const devices = {}, sources = {}, pages = {}, seen = {};
  win.forEach(function (x) { pages[x.path] = (pages[x.path] || 0) + 1; });
  win.slice().sort(function (a, b) { return a.t - b.t; }).forEach(function (x) {
    if (seen[x.sid]) return; seen[x.sid] = 1;
    devices[x.device] = (devices[x.device] || 0) + 1;
    const r = x.ref || 'Direct'; sources[r] = (sources[r] || 0) + 1;
  });
  return { series: series, totals: totals, devices: devices, pages: pages, sources: sources };
}
