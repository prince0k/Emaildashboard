export function buildPreview(html) {
  return `
    <html>
      <head><meta charset="utf-8"/></head>
      <body>${html}</body>
    </html>
  `;
}
