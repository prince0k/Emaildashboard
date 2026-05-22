export default function logout(req, res) {
  const cookieName = process.env.COOKIE_NAME || "token";
  const cookiePath = process.env.COOKIE_PATH || "/";
  res.clearCookie(cookieName, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: cookiePath,
  });

  res.json({ success: true });
}
