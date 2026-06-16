/**
 * customTemplate.js
 * 
 * Generic HTML template that wraps arbitrary HTML content in a beautiful email layout.
 */
export function buildCustomEmailHtml({ subject, htmlContent }) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f9f9f9; }
    .container { max-width: 600px; margin: 20px auto; background: #fff; border: 1px solid #eee; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .header { background-color: #e60023; color: #fff; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 800; tracking: -0.5px; }
    .content { padding: 35px 30px; }
    .cta-container { text-align: center; margin: 30px 0; }
    .cta-button { background-color: #e60023; color: #ffffff !important; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block; box-shadow: 0 4px 6px rgba(230,0,35,0.15); }
    .footer { background: #f1f1f1; color: #777; padding: 20px; text-align: center; font-size: 11px; }
    ul { padding-left: 20px; margin: 15px 0; }
    li { margin-bottom: 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${subject}</h1>
    </div>
    <div class="content">
      ${htmlContent}
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} NutriGuide. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
