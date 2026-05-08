export default function checkPermission(requiredPermission) {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { permissions } = req.user;

      if (!permissions || !permissions.includes(requiredPermission)) {
        return res.status(403).json({ message: "Access denied" });
      }

      next();
    } catch (err) {
      console.error("Permission middleware error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  };
}