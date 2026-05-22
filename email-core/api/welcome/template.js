/**
 * Welcome Email HTML Template Builder
 * Generates branded welcome emails for NutriGuide / Stewart Lucas
 */

export function buildWelcomeEmailHtml({ name, siteUrl, siteName = "NutriGuide" }) {
  const displayName = name || "friend";
  const url = siteUrl || "https://stewartlucas.com";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to ${siteName}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">

  <!-- Wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;">
    <tr>
      <td align="center" style="padding:40px 20px;">

        <!-- Card -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%); padding: 48px 40px; text-align: center;">
              <h1 style="margin:0;font-size:28px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">
                Welcome to ${siteName}! 🎉
              </h1>
              <p style="margin:12px 0 0;font-size:15px;color:rgba(255,255,255,0.75);line-height:1.5;">
                Science-backed nutrition, just for you.
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">

              <p style="margin:0 0 20px;font-size:16px;line-height:1.7;color:#333333;">
                Hi <strong>${displayName}</strong>,
              </p>

              <p style="margin:0 0 20px;font-size:16px;line-height:1.7;color:#333333;">
                We're thrilled to have you join the ${siteName} community! You now have full access to our curated collection of:
              </p>

              <!-- Feature List -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
                <tr>
                  <td style="padding:12px 16px;background:#f8f9fa;border-radius:8px;border-left:4px solid #0f3460;">
                    <p style="margin:0 0 8px;font-size:15px;color:#333;">
                      ✅ <strong>Personalized Diet Plans</strong> — Tailored to your goals
                    </p>
                    <p style="margin:0 0 8px;font-size:15px;color:#333;">
                      ✅ <strong>Healthy Recipes</strong> — Chef-crafted, nutritionist-approved
                    </p>
                    <p style="margin:0 0 8px;font-size:15px;color:#333;">
                      ✅ <strong>Quick-Reference Cheat Sheets</strong> — Print-ready guides
                    </p>
                    <p style="margin:0;font-size:15px;color:#333;">
                      ✅ <strong>Expert Nutrition Tips</strong> — Updated weekly
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
                <tr>
                  <td align="center">
                    <a href="${url}" target="_blank"
                       style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#0f3460,#1a1a2e);color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;border-radius:8px;letter-spacing:0.3px;">
                      Explore ${siteName} →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 20px;font-size:16px;line-height:1.7;color:#333333;">
                If you have any questions or need personalized recommendations, simply reply to this email — we'd love to hear from you.
              </p>

              <!-- Signature -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e8e8e8;padding-top:20px;margin-top:12px;">
                <tr>
                  <td>
                    <p style="margin:0 0 4px;font-size:15px;color:#666;">To your health,</p>
                    <p style="margin:0;font-size:16px;font-weight:600;color:#1a1a2e;">The ${siteName} Team</p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8f9fa;padding:24px 40px;text-align:center;border-top:1px solid #e8e8e8;">
              <p style="margin:0 0 8px;font-size:13px;color:#999;">
                You're receiving this because you subscribed at ${siteName}.
              </p>
              <p style="margin:0;font-size:13px;color:#999;">
                © ${new Date().getFullYear()} ${siteName}. All rights reserved.
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
