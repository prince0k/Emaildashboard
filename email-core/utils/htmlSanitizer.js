export default function sanitizeHtml(html) {
  return html.replace(/<script.*?>.*?<\/script>/gi, "");
}
