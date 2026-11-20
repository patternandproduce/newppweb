function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function buildStudentApplicationEmail({
  fullName,
  email,
  application = {},
  submittedAt,
  adminUrl = "https://www.patternandproduce.com/admin",
}) {
  const safeName = escapeHtml(fullName || "New student");
  const safeEmail = escapeHtml(email || "Not provided");
  const safePhone = escapeHtml(application.phone || "Not provided");
  const safeSchool = escapeHtml(application.school || "Not provided");
  const safeAge = escapeHtml(application.age || "Not provided");
  const safeSex = escapeHtml(application.sex || "Not provided");
  const safeAvailability = escapeHtml(
    application.availability || "Not provided",
  );
  const safeMotivation = escapeHtml(application.motivation || "Not provided");
  const safeAdminUrl = escapeHtml(adminUrl);

  const dateValue = submittedAt || application.submitted_at;
  const formattedDate = dateValue
    ? new Date(dateValue).toLocaleString("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Africa/Lagos",
      })
    : "Not available";

  const safeDate = escapeHtml(formattedDate);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>New Student Application</title>
</head>
<body style="margin:0;padding:0;background:#f5f2ee;font-family:Arial,Helvetica,sans-serif;color:#171717;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f5f2ee;padding:36px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:620px;background:#ffffff;">

          <tr>
            <td style="padding:30px 36px;border-bottom:1px solid #e9e5df;">
              <p style="margin:0;font-size:13px;letter-spacing:3px;font-weight:bold;">
                PATTERN &amp; PRODUCE
              </p>
              <p style="margin:8px 0 0;font-size:10px;letter-spacing:2px;color:#9b8d78;">
                FASHION · TECHNOLOGY · PRODUCTION
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:42px 36px 28px;">
              <p style="margin:0 0 14px;font-size:11px;letter-spacing:2px;color:#9b8d78;font-weight:bold;">
                ADMINISTRATIVE NOTIFICATION
              </p>

              <h1 style="margin:0 0 18px;font-family:Georgia,serif;font-size:31px;line-height:1.25;font-weight:normal;">
                A new student has registered.
              </h1>

              <p style="margin:0;font-size:15px;line-height:1.8;color:#555;">
                A new student application has been submitted through the Pattern &amp; Produce website. The application has been saved and is awaiting administrative review.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:0 36px 30px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f8f6f2;border:1px solid #eee9e2;">
                <tr>
                  <td colspan="2" style="padding:20px 20px 12px;">
                    <p style="margin:0;font-size:11px;letter-spacing:1.8px;font-weight:bold;color:#9b8d78;">
                      STUDENT DETAILS
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:10px 20px;font-size:13px;color:#888;width:38%;border-top:1px solid #eee9e2;">Full name</td>
                  <td style="padding:10px 20px;font-size:14px;color:#171717;font-weight:bold;border-top:1px solid #eee9e2;">${safeName}</td>
                </tr>

                <tr>
                  <td style="padding:10px 20px;font-size:13px;color:#888;border-top:1px solid #eee9e2;">Email address</td>
                  <td style="padding:10px 20px;font-size:14px;color:#171717;border-top:1px solid #eee9e2;">${safeEmail}</td>
                </tr>

                <tr>
                  <td style="padding:10px 20px;font-size:13px;color:#888;border-top:1px solid #eee9e2;">Phone number</td>
                  <td style="padding:10px 20px;font-size:14px;color:#171717;border-top:1px solid #eee9e2;">${safePhone}</td>
                </tr>

                <tr>
                  <td style="padding:10px 20px;font-size:13px;color:#888;border-top:1px solid #eee9e2;">School / Institution</td>
                  <td style="padding:10px 20px;font-size:14px;color:#171717;border-top:1px solid #eee9e2;">${safeSchool}</td>
                </tr>

                <tr>
                  <td style="padding:10px 20px;font-size:13px;color:#888;border-top:1px solid #eee9e2;">Age</td>
                  <td style="padding:10px 20px;font-size:14px;color:#171717;border-top:1px solid #eee9e2;">${safeAge}</td>
                </tr>

                <tr>
                  <td style="padding:10px 20px;font-size:13px;color:#888;border-top:1px solid #eee9e2;">Sex</td>
                  <td style="padding:10px 20px;font-size:14px;color:#171717;border-top:1px solid #eee9e2;">${safeSex}</td>
                </tr>

                <tr>
                  <td style="padding:10px 20px;font-size:13px;color:#888;border-top:1px solid #eee9e2;">Availability</td>
                  <td style="padding:10px 20px;font-size:14px;color:#171717;border-top:1px solid #eee9e2;">${safeAvailability}</td>
                </tr>

                <tr>
                  <td style="padding:10px 20px;font-size:13px;color:#888;border-top:1px solid #eee9e2;">Submitted</td>
                  <td style="padding:10px 20px;font-size:14px;color:#171717;border-top:1px solid #eee9e2;">${safeDate}</td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:0 36px 34px;">
              <p style="margin:0 0 10px;font-size:11px;letter-spacing:1.5px;font-weight:bold;color:#9b8d78;">
                STUDENT'S MOTIVATION
              </p>
              <p style="margin:0;padding:18px;background:#faf9f7;border-left:3px solid #c9b99a;font-size:14px;line-height:1.8;color:#555;white-space:pre-wrap;">
                ${safeMotivation}
              </p>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:0 36px 42px;">
              <a href="${safeAdminUrl}" style="display:inline-block;background:#171717;color:#ffffff;text-decoration:none;padding:16px 28px;font-size:12px;font-weight:bold;letter-spacing:1px;">
                REVIEW APPLICATION
              </a>
              <p style="margin:16px 0 0;font-size:11px;line-height:1.7;color:#888;">
                Sign in to your administrator account before reviewing the application.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:25px 36px;background:#171717;">
              <p style="margin:0 0 8px;color:#ffffff;font-size:12px;letter-spacing:1.5px;font-weight:bold;">
                PATTERN &amp; PRODUCE LIMITED
              </p>
              <p style="margin:0;color:#b9b3aa;font-size:11px;line-height:1.8;">
                Building better possibilities through fashion and technology.
              </p>
              <p style="margin:16px 0 0;color:#777;font-size:10px;line-height:1.7;">
                Automated administrative notification. Please do not reply directly.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
