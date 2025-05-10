const jwt = require("jsonwebtoken");
require("dotenv").config();

const authMiddleware = (req, res, next) => {
  console.log("Auth middleware triggered for path:", req.path);
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) {
    console.log("No token provided");
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    req.role = decoded.role;
    console.log("Decoded role:", decoded.role);
    console.log("Path check:", req.originalUrl.startsWith("/admin"), "Role check:", req.role !== "ADMIN");

    if (req.originalUrl.startsWith("/admin") && req.role !== "ADMIN") {
      console.log("Blocking access: Non-admin trying to access /admin route");
      return res.status(403).json({ error: "Access denied. Admin role required." });
    }
    if (req.originalUrl.startsWith("/suppliers") && req.role === "ADMIN") {
      console.log("Blocking access: Admin trying to access /suppliers route");
      return res.status(403).json({ error: "Admins cannot access supplier routes directly." });
    }

    console.log("Access granted");
    next();
  } catch (error) {
    console.log("Token verification error:", error.message);
    res.status(401).json({ error: "Invalid token" });
  }
};

module.exports = authMiddleware;