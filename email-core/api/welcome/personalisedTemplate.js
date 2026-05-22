/**
 * personalisedTemplate.js
 * 
 * Template for "Your Personalised Plan is Ready" email.
 */

export function buildPersonalisedEmailHtml({ name, siteName, viewUrl }) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Personalised Plan is Ready</title>
  <style>
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f9f9f9; }
    .container { max-width: 600px; margin: 20px auto; background: #fff; border: 1px solid #eee; border-radius: 8px; overflow: hidden; }
    .header { background-color: #10b981; color: #fff; padding: 30px; text-align: center; }
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
      <h1>Your Personalised Plan is Ready! 🎉</h1>
    </div>
    <div class="content">
      <p>Hello ${name || 'there'},</p>
      <p>Stewart Lucas has finished crafting your <strong>Premium Personalised Edition</strong>. We've tailored every detail to match your goals, activity level, and dietary preferences.</p>
      <p>Your custom guide is now available for you to read or download as a PDF.</p>
      
      <div class="cta-container">
        <a href="${viewUrl}" class="cta-button">View Your Personalised Plan</a>
      </div>
      
      <p>If the button above doesn't work, copy and paste this link into your browser:</p>
      <p style="word-break: break-all; font-size: 12px; color: #10b981;">${viewUrl}</p>
      
      <p>To your health and success,</p>
      <p><strong>The ${siteName} Team</strong></p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} ${siteName}. All rights reserved.</p>
      <p>You received this email because you requested a personalised plan on our website.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
