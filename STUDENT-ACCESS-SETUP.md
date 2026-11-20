# Student tutorial access setup

## Data model

- Supabase Auth stores login credentials and identity for students, staff and administrators.
- `public.profiles` stores staff and administrator profiles only.
- `public.student_applications` stores each student's registration data, email, Auth user ID and approval status.
- Students do not need a row in `profiles` to register, log in, be approved or access tutorials.
- Student approval/revocation is enforced by the server API and the database video-access policy.

## Required deployment steps

1. Back up the Supabase database and current deployment.
2. Confirm the original schema, newsletter-management and student-access migrations have been applied in timestamp order.
3. Apply `supabase/migrations/202611200001_separate_form_tables_and_student_profiles.sql` in Supabase SQL Editor. This migration creates dedicated form tables, moves legacy student profile identity into `student_applications` where possible, removes student rows from `profiles`, and updates the user-role function and video policy.
4. Keep the Vercel server environment variables configured: `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `RESEND_API_KEY`, and `EMAIL_FROM`. The browser needs `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
5. Deploy a Preview build first. Test a new student registration, verify the email if confirmation is enabled, approve the application in Admin → Registered students, log in and open `/tutorials`.
6. Test pending, denied and revoked accounts. Each must be blocked from the tutorial library.
7. Re-upload existing tutorial videos through Admin → Tutorial videos. Existing public YouTube videos and previously uploaded public Cloudinary videos are not made private retroactively.

## Supabase email confirmation

If email confirmation is enabled in Supabase Auth, students must confirm their email address before they can sign in. Email verification and administrator approval are separate requirements.

## Media security limitation

Cloudinary authenticated delivery protects the original asset and derived versions unless a signed URL is issued. The app creates a signed, time-limited download URL after checking the student's current application status. That URL remains usable until its two-hour expiry if copied, so this reduces sharing and direct-link bypass but cannot prevent screen recording or copying during the authorised window.
