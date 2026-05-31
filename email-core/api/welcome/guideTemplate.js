/**
 * guideTemplate.js
 * 
 * Template for "Your Requested Guide is Ready" email.
 */

export function buildGuideEmailHtml({ name, siteName, guideTitle, downloadUrl }) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Guide is Ready: ${guideTitle}</title>
  <style>
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f9f9f9; }
    .container { max-width: 600px; margin: 20px auto; background: #fff; border: 1px solid #eee; border-radius: 8px; overflow: hidden; }
    .header { background-color: #0f3460; color: #fff; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 30px; }
    .cta-container { text-align: center; margin: 30px 0; }
    .cta-button { background-color: #10b981; color: #ffffff !important; padding: 15px 30px; border-radius: 5px; text-decoration: none; font-weight: bold; display: inline-block; }
    .footer { background: #f1f1f1; color: #777; padding: 20px; text-align: center; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Your Guide is Ready! 🎉</h1>
    </div>
    <div class="content">
      <p>Hello ${name || 'there'},</p>
      <p>Thank you for requesting the full guide for <strong>${guideTitle}</strong> from Stewart Lucas.</p>
      <p>Your complete guide, including grocery lists, batch prep instructions, and clean meal blueprints, is ready for download.</p>
      
      <div class="cta-container">
        <a href="${downloadUrl}" class="cta-button">Download Full Guide (PDF)</a>
      </div>
      
      <p>If the button above doesn't work, copy and paste this link into your browser:</p>
      <p style="word-break: break-all; font-size: 12px; color: #0f3460;">${downloadUrl}</p>
      
      <p>To your health and success,</p>
      <p><strong>The ${siteName} Team</strong></p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} ${siteName}. All rights reserved.</p>
      <p>You received this email because you requested a download on our website.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
