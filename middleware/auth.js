const jwt = require("jsonwebtoken");
require("dotenv").config();
const { verifyToken } = require('../utils/auth')
const authMiddleware =  (req, res, next) => {
    const token = req.header("Authorization")?.replace("Bearer", "").trim();;
    if (!token) {
        return res.status(401).json({ error: "No token provided" });
    }
    try {
        const decoded =  verifyToken(token);
        req.userId = decoded.supplierId; // Attach supplierId to request
        next();
    } catch (error) {
        res.status(401).json({ error: "Invalid token" });
    }
};

module.exports = authMiddleware;