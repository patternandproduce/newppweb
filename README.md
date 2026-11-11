# Pattern & Produce

React + Vite website with a Supabase-backed admin dashboard, Supabase Auth, Cloudinary signed media uploads, YouTube embeds, and Resend email delivery.

## Local development

1. Install Node.js 20 or newer.
2. Copy `.env.example` to `.env.local` and fill in the values.
3. Run `npm install`.
4. Run `npm run dev`.
5. Open `http://localhost:5173` and `/admin`.

## Backend setup

### Supabase

1. Create a Supabase project.
2. Open SQL Editor and run `supabase/migrations/202611100001_initial_schema.sql`.
3. Copy the project URL, anon/publishable key, and service-role key into the appropriate environment variables.
4. Create the first administrator in Authentication > Users. Use the email/password you want for the admin login.
5. Run this SQL, replacing the email with that administrator's email:

```sql
update public.profiles
set role = 'admin', active = true, name = 'Pattern & Produce Administrator'
where email = 'admin@example.com';
```

6. Disable public signups in Supabase Authentication settings after creating the first admin. New employee accounts are created by the protected Staff screen.

The migration seeds the current four tutorial phases and eight existing video placeholders from `public/data/videos.json`. Any YouTube links already present in that JSON are retained. Placeholder videos with no YouTube ID remain placeholders until a source is assigned. The ZIP does not contain the live Google Spreadsheet, so submissions stored there must be exported separately to preserve them.

### Cloudinary

Create a Cloudinary account and add `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` as server-only environment variables. Admin/staff video uploads and thumbnail uploads are signed by `/api/cloudinary-signature`; the API secret is never sent to the browser. YouTube links continue to work without Cloudinary.

### Email (Resend)

1. Create a Resend account and verify the sending domain you control.
2. Create an API key.
3. Set `RESEND_API_KEY`, `EMAIL_FROM` (must use the verified domain), and `CONTACT_NOTIFY_EMAIL`.
4. Website form submissions are stored in Supabase and trigger a notification email. Admin bulk email is sent through Resend from the server. EmailJS is no longer used.

## Environment variables

| Variable | Where | Purpose |
|---|---|---|
| `VITE_SUPABASE_URL` | Browser | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Browser | Supabase anon/publishable key; protected by RLS |
| `SUPABASE_URL` | Server only | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Privileged server access; never expose |
| `CLOUDINARY_CLOUD_NAME` | Server only | Cloudinary cloud identifier |
| `CLOUDINARY_API_KEY` | Server only | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Server only | Signs upload requests; never expose |
| `RESEND_API_KEY` | Server only | Sends notification and admin emails |
| `EMAIL_FROM` | Server only | Verified sender identity |
| `CONTACT_NOTIFY_EMAIL` | Server only | Receives website form notifications |

Set all variables locally in `.env.local` and in Vercel > Project > Settings > Environment Variables. Redeploy after changing production variables.

## Deploy to Vercel

1. Push the project to GitHub.
2. Import it into Vercel. Build command: `npm run build`; output directory: `dist`.
3. Add all variables above to Vercel. The `VITE_*` variables are browser-visible by design; the remaining variables must remain server-only.
4. Deploy and test `/admin`, public forms, video playback, signed uploads, and email delivery.

## Security notes

- Do not commit `.env.local` or paste service-role/API secrets into chat.
- Admin login uses Supabase Auth email/password. The `profiles.role` value controls staff/admin access.
- Staff and admin API actions verify the Supabase access token on the server.
- Database tables have Row Level Security enabled. Public visitors can read published tutorial content and submit forms; only authenticated staff can access private dashboard records.
- Disable public user signups once the initial admin is created.
- The original `apps-script/` directory is retained as a historical reference only; the application no longer calls it. To migrate the old spreadsheet data, export the `Registrations`, `Consultations`, `Quotes`, `Contacts`, and `Visits` tabs as CSV files into `scripts/migration-data/` (use those exact filenames), then run `node scripts/import-apps-script-csv.mjs` with `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` available in the terminal environment. The importer preserves submission IDs, timestamps, statuses, and exported flags. Recreate employee accounts in Admin > Staff because old password hashes cannot be transferred to Supabase Auth.
