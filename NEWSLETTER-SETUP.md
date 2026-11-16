# Newsletter management setup

This update adds newsletter subscriber management to the existing Pattern & Produce admin dashboard.

## Features added

- Collect optional city and country details and multiple interests on the public footer signup form.
- Group/filter subscribers by subscription month, subscription week, location, interests, or admin-managed tags.
- Search subscribers and select a group or individual recipients.
- Add custom tags to a subscriber from the admin list.
- Compose a custom subject and message, upload one campaign image to Cloudinary, preview, and send through Resend.
- Send campaigns in batches of up to 100 messages per Resend request.
- Add an unsubscribe link to every campaign email and keep unsubscribed records out of future sends.
- Export filtered subscriber details as an Excel `.xlsx` file or Google Sheets-compatible `.csv` file.

## 1. Apply the Supabase migration

In Supabase, open **SQL Editor**, create a new query, and run:

`supabase/migrations/202611160001_newsletter_management.sql`

This safely adds `city`, `country`, `interests`, `tags`, `unsubscribed_at`, and `unsubscribe_token` to the existing newsletter subscriber table. The server uses `SUPABASE_SECRET_KEY`; do not add public read policies for newsletter subscribers.

## 2. Environment variables

Keep the existing server-side variables in Vercel and your local `.env.local`:

- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

The browser-side Supabase variables already used by this project must also remain configured. Never put server-side secrets in variables beginning with `VITE_`.

## 3. Run locally

From the project root:

```bash
npm install
npm run dev
```

For local API testing with Vercel's serverless functions, use the Vercel development command already used for this project, with the local environment variables loaded.

## 4. Admin use

Sign in as an administrator and open **Newsletter** in the admin sidebar. Filter by month, week, location, interests, or tags. Select subscribers, compose the campaign, optionally upload an image, preview, and confirm sending.

The newsletter page is admin-only. Staff accounts do not see the navigation item and cannot call the newsletter management endpoints.

## 5. Google Sheets

Use **Google Sheets CSV** to download the currently filtered subscriber list. In Google Sheets, choose **File → Import → Upload**, select the downloaded CSV, and import it into a new or existing sheet. The `.xlsx` export can also be opened directly in Google Sheets.

This is a file export/import workflow, not a live Google Sheets account sync. A live sync needs a Google Apps Script deployment or Google Sheets API OAuth setup and a destination spreadsheet chosen by the account owner.

## Notes

- Existing subscribers will have blank city/country/interests until those details are collected or edited. Historical location cannot reliably be reconstructed from an email address.
- Campaign sending is a real action. The admin interface asks for confirmation before sending.
- Image uploads use the existing Cloudinary signed-upload endpoint and are limited to 10 MB in the admin interface.
