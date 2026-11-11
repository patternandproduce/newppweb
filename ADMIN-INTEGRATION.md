# Admin backend integration

The production admin uses Supabase Auth + PostgreSQL, Vercel serverless API routes, Cloudinary signed uploads, and Resend. The Google Apps Script backend is no longer called by the React app and is retained only as a legacy reference.

Read `README.md` for full setup. Run `supabase/migrations/202611100001_initial_schema.sql` in Supabase SQL Editor, configure the environment variables, and create the first admin as described there.

## API contract

- `POST /api/admin` — `me`, `library.get`, `library.save`, `lead.create`, `leads.list`, `leads.mark`, `analytics`, `staff.list`, `staff.save`, `staff.setActive`, `email.send`, `visit`.
- `POST /api/cloudinary-signature` — validates a signed-in staff/admin user and returns a short-lived Cloudinary upload signature. The Cloudinary API secret remains server-side.

All staff/admin actions require a Supabase access token. Staff management is admin-only. Public routes can read published tutorial content and submit leads; private leads and visitor analytics require staff authentication.

## Data migration

The Supabase migration seeds the current `public/data/videos.json` phases and video records. The eight records in the supplied ZIP are placeholders with no YouTube IDs; they remain placeholders until a YouTube ID or Cloudinary upload is assigned. External Google Sheets rows are not included in the ZIP and must be exported from the original spreadsheet and imported separately if those submissions must be retained.
