const express = require("express");
const authRoutes = require("./authRoutes");
const kycRoutes = require("./kycRoutes");
const productRoutes = require("./productRoutes");
const adminRoutes = require("./adminRoutes");
const publicProductRoutes = require("./publicProductRoutes");

const router = express.Router();

router.use("/suppliers", authRoutes); // Prefix for auth-related routes
router.use("/suppliers", kycRoutes);  // Prefix for KYC-related routes
router.use("/suppliers", productRoutes); // Prefix for supplier product routes
router.use("/admin", adminRoutes);     // Prefix for admin-related routes
router.use("/public", publicProductRoutes); // Prefix for public product routes

module.exports = router;