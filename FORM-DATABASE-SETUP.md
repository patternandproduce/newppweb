# Form database structure and setup

Each public form writes to its own Supabase table. Form submissions are stored in a `data` JSONB column so the complete submitted payload is retained without dropping optional fields. Passwords are never included in student application data.

| Website form | Supabase Table Editor table | What is stored |
|---|---|---|
| Footer newsletter signup | `newsletter_subscribers` | Email, city, country, interests, tags, unsubscribe token and subscription timestamps |
| Register with us | `student_applications` | Auth user ID, email, full name, complete application JSON and approval/review status |
| Contact us page (training/learning, consultation and quote tabs) | `contact_submissions` | Name, email, phone, selected enquiry type, interest, quantity where relevant, message, page and submission timestamp. The `type` value distinguishes the three tabs. |
| FashionTech tech pack checklist | `checklist_requests` | Email, page and submission timestamp |

The contact page is one form with three tabs, so all three variants are stored in `contact_submissions`; the admin dashboard provides separate filtered views for training, consultation and quote enquiries. The enquiry/checklist tables share `id`, `data`, `status`, `exported` and `created_at` columns. Newsletter and student applications have their own structured columns. All form-submission tables have Row Level Security enabled and no public read policies; the server API uses the server-only Supabase secret key to write and administer them.

## Apply the migration

1. Back up the Supabase project first.
2. If this is an existing installation, ensure migrations `202611100001_initial_schema.sql`, `202611160001_newsletter_management.sql` and `202611170001_student_access.sql` have already been applied.
3. Run `supabase/migrations/202611200001_separate_form_tables_and_student_profiles.sql` in Supabase SQL Editor.
4. Deploy the updated project to a Vercel Preview deployment.
5. Submit a test from each form and confirm that a new row appears in the corresponding table in Supabase → Table Editor.
6. Confirm student submissions appear in `student_applications` and do not create a `profiles` row. Confirm staff/admin accounts remain in `profiles`.

## Existing data

Historical enquiry records in the former shared `leads` table are not deleted. The admin enquiry pages read the new dedicated tables and include historical matching records from `leads` so old submissions remain visible. New submissions are written only to their dedicated tables. Historical student records in `leads` are not automatically moved or deleted by this migration.

## Checklist delivery

The FashionTech checklist form stores the request in `checklist_requests` and sends the checklist content by email through Resend. Ensure `RESEND_API_KEY` and `EMAIL_FROM` are valid and that the sender domain is verified in Resend.

## Secrets

Never commit `.env` or `.env.local`, and never expose `SUPABASE_SECRET_KEY`, Cloudinary API secrets or Resend API keys in browser-side `VITE_` variables. Use `.env.example` as the variable-name reference only.
