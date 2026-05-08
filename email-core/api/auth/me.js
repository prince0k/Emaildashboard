export default function me(req, res) {
  res.json({
    user: {
      id: req.user.mongoId,     // Mongo ObjectId
      userId: req.user.userId,  // 🔥 Business ID (USR00001)
      email: req.user.email,
      permissions: req.user.permissions || [],
    },
  });
}