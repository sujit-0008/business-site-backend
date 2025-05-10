const express = require("express");
const authController = require("../controllers/auth/auth");
const supplierAuthController = require("../controllers/auth/supplier");
const customerAuthController = require("../controllers/auth/customer");
const kycController = require("../controllers/supplier/kyc");
const productController = require("../controllers/supplier/products");
const adminController = require("../controllers/admin/index");
const publicProductController = require("../controllers/public/products");

const router = express.Router();
router.use("/auth", authController);
router.use("/suppliers", supplierAuthController);
router.use("/customers", customerAuthController);
router.use("/suppliers", kycController);
router.use("/suppliers", productController);
router.use("/admin", adminController);
router.use("/public", publicProductController);

module.exports = router;