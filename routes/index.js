const express = require("express");
const authRoutes = require("./authRoutes");
const kycRoutes = require("./kycRoutes");
const productRoutes = require("./productRoutes");
const adminRoutes = require("./adminRoutes");

const router = express.Router();

router.use("/suppliers", authRoutes); // Prefix for auth-related routes
router.use("/suppliers", kycRoutes);  // Prefix for KYC-related routes
router.use("/suppliers", productRoutes); // Prefix for product-related routes
router.use("/admin", adminRoutes);     // Prefix for admin-related routes

module.exports = router;