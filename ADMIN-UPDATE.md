# Admin update

The original dashboard UI has been retained and its backend is being moved from the Google Apps Script/Google Sheets integration to Supabase.

- Supabase Auth replaces the preview username/password and custom Apps Script login.
- PostgreSQL stores phases, videos, registrations, consultation requests, quotes, contact messages, staff profiles, and visit analytics.
- Staff/admin permissions are checked server-side and supported by database Row Level Security.
- YouTube video links remain supported.
- Cloudinary supports signed video and thumbnail uploads.
- Resend replaces EmailJS for website submission notifications and admin bulk email.
- Existing tutorial phases and video records from `public/data/videos.json` are seeded by the SQL migration.

Setup and deployment instructions are in `README.md`.
