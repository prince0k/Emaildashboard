/**
 * Verification Email HTML Template
 */
export function buildVerificationEmailHtml({ name, verifyUrl, siteName = "NutriGuide" }) {
  const displayName = name || "friend";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verify your email - ${siteName}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <tr>
            <td style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%); padding: 48px 40px; text-align: center;">
              <h1 style="margin:0;font-size:28px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">
                Verify Your Account 🛡️
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 20px;font-size:16px;line-height:1.7;color:#333333;">
                Hi <strong>${displayName}</strong>,
              </p>
              <p style="margin:0 0 24px;font-size:16px;line-height:1.7;color:#333333;">
                Thank you for joining ${siteName}! To complete your registration and start exploring our personalized nutrition plans, please verify your email address by clicking the button below:
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
                <tr>
                  <td align="center">
                    <a href="${verifyUrl}" target="_blank"
                       style="display:inline-block;padding:16px 40px;background:linear-gradient(135deg,#0f3460,#1a1a2e);color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;border-radius:10px;letter-spacing:0.5px;box-shadow:0 4px 12px rgba(15,52,96,0.3);">
                      Confirm My Email & Login →
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#666666;">
                If the button above doesn't work, copy and paste this link into your browser:
                <br />
                <span style="color:#0f3460;word-break:break-all;">${verifyUrl}</span>
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e8e8e8;padding-top:20px;margin-top:20px;">
                <tr>
                  <td>
                    <p style="margin:0 0 4px;font-size:14px;color:#999;">If you didn't create an account, you can safely ignore this email.</p>
                    <p style="margin:12px 0 0;font-size:15px;font-weight:600;color:#1a1a2e;">The ${siteName} Team</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
