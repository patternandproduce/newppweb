# Student tutorial access setup

## What is now in the project

- All four cards on `/workforce-upskilling` send visitors to `/student-access`.
- New applicants create a student login password on the existing `/register` form.
- New Supabase accounts are created with `role = student`, `approval_status = pending`, and `active = false`.
- Student applications appear in **Admin → Student access**.
- Admins can approve, deny, or revoke a student's access.
- `/tutorials` and the legacy `/workforce-upskilling/tutorials` route both require an approved student session.
- The public library response contains only preview fields; video playback IDs and URLs are withheld.
- New Cloudinary tutorial uploads use the `authenticated` delivery type. The server issues a time-limited Cloudinary download URL only after checking the student's account status.

## Required deployment steps

1. Back up the Supabase database and current deployment.
2. In Supabase SQL Editor, run `supabase/migrations/202611170001_student_access.sql`.
3. Confirm the Vercel server environment variables already used by the project remain configured: `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`. The browser still needs `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
4. Deploy a Preview build first. Test a new registration, approve it in **Admin → Student access**, log in, and open `/tutorials`.
5. Test a pending, denied, and revoked student account. Each must be refused access.
6. Re-upload each existing tutorial video through Admin → Tutorial videos. New uploads are stored as authenticated Cloudinary assets. Existing YouTube videos and previously uploaded public Cloudinary videos are not made private retroactively by this code. The playback API deliberately refuses to play old Cloudinary assets unless their stored URL contains `/video/authenticated/`, and student responses do not include YouTube IDs. Replace those legacy videos before approving students for the full library.

## Supabase email confirmation

If email confirmation is enabled in Supabase Auth, students must confirm their email address before they can sign in. They will still remain pending until an administrator approves them. If email confirmation is disabled, approval remains the access gate, but email ownership is not independently verified by Supabase.

## Media security limitation

Cloudinary authenticated delivery protects the original asset and derived versions unless a signed URL is issued. The app creates a signed, time-limited download URL after checking the student's current status. That URL remains usable until its two-hour expiry if copied, so this reduces sharing and direct-link bypass but cannot prevent screen recording or copying during the authorised window. Cloudinary's token-based CDN access can provide tighter expiry/path controls but requires Cloudinary to enable token access and provision a separate encryption key (available on Advanced plan or higher). See Cloudinary's access-control documentation: https://cloudinary.com/documentation/control_access_to_media.

## Existing registrations

The historical entries in Admin → Registered users remain intact. They were submitted before student accounts existed, so they do not automatically have passwords or student profiles. Those students need to complete the updated registration flow once to create their login account, after which their new application appears in Admin → Student access.
