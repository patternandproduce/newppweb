# Connect the admin to Google Sheets (free, about 15 minutes)

This turns the preview admin into the real thing: submissions are saved in your own Google Sheet, visitor counts are recorded,
employees get their own logins, and emails go out from your Gmail. Nothing in this folder has been run against a live Google
account yet, so do the test at step 8 before you rely on it.

1. Go to sheets.google.com and create a new blank spreadsheet called "Pattern & Produce data".
2. In it choose **Extensions > Apps Script**. Delete the sample code and paste the whole of `Code.gs`.
3. Near the top, change `FIRST_ADMIN` (username, name and a strong password of 8+ characters).
4. In the Apps Script left menu open **Project Settings** and set the time zone to Lagos (GMT+1).
5. Choose the function `setupFirstAdmin` in the toolbar and click **Run**. Approve the permissions (Google shows a "not verified" warning because it is your own script: Advanced > Go to project).
   Afterwards replace the password in `FIRST_ADMIN` with a placeholder such as CHANGE-THIS-PASSWORD, so your real password is not left in the code.
6. Click **Deploy > New deployment > Web app**. Execute as: **Me**. Who has access: **Anyone**. Deploy and copy the **Web app URL**.
7. In Vercel (Project > Settings > Environment Variables) add:
   - `VITE_API_BASE` = the Web app URL
   - `VITE_SHEET_URL` = the normal address of your spreadsheet (for the "Open my Google Sheet" button)
   - `VITE_FORM_MODE` = `both`  (emails you AND saves to the sheet)
   Then redeploy (Deployments > the latest one > Redeploy).
8. Test: open the website and send a test registration, then sign in at /admin with the username and password from step 3. The registration should appear under Registered users and as a row in the sheet. Try the Message button with a test email to yourself.

## Good to know
- If you change `Code.gs` later: Deploy > Manage deployments > Edit > Version: New version > Deploy.
- Free Gmail accounts can send about 100 emails a day through this (Workspace accounts about 1,500).
- Keep the spreadsheet private and share it only with people who need it. It holds personal details, including those of under-18s and their parents. Ask a professional how Nigeria's data protection rules apply to you.
- The "Anyone" web address is public, but every admin action needs a signed-in employee. Visitors can only submit forms, send visit counts and read the video list.
- Visitor counting works only after step 7, never while running `npm run dev`.
