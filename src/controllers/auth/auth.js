const express = require("express");
const { findSupplierByEmail, generatePasswordResetToken: generateSupplierResetToken, verifyPasswordResetToken: verifySupplierResetToken, resetPassword: resetSupplierPassword } = require("../../models/supplier");
const { findCustomerByEmail, generatePasswordResetToken: generateCustomerResetToken, verifyPasswordResetToken: verifyCustomerResetToken, resetPassword: resetCustomerPassword } = require("../../models/customer");
const { comparePassword, generateToken } = require("../../utils/auth");
const { sendEmail } = require("../../utils/email");
const authMiddleware = require("../../middleware/auth");
const { PrismaClient } = require("@prisma/client");
const router = express.Router();
const prisma = new PrismaClient();



// Unified login for both CUSTOMER and SUPPLIER
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    let user = await findSupplierByEmail(email);
    let role = "SUPPLIER";
    if (!user) {
      user = await findCustomerByEmail(email);
      role = "CUSTOMER";
    }
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    if (role === "SUPPLIER" && !user.emailVerified) {
      return res.status(403).json({ error: "Email not verified" });
    }
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) return res.status(401).json({ error: "Incorrect Password" });
    const token = generateToken({ userId: user.id, role });
    res.json({ token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


// Unified forgot-password for both CUSTOMER and SUPPLIER
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  try {
    let user, token, role;
    const supplier = await findSupplierByEmail(email);
    if (supplier) {
      role = "SUPPLIER";
      const result = await generateSupplierResetToken(email);
      user = result.supplier;
      token = result.token;
    } else {
      const customer = await findCustomerByEmail(email);
      if (!customer) {
        return res.status(404).json({ error: "User not found" });
      }
      role = "CUSTOMER";
      const result = await generateCustomerResetToken(email);
      user = result.customer;
      token = result.token;
    }
    const resetLink = `${process.env.BASE_URL}/auth/reset-password?token=${token}&role=${role}`;
    await sendEmail(
      user.email,
      "Password Reset Request",
      `Click here to reset your password: ${resetLink}\nThis link expires in 1 hour.`
    );
    res.status(200).json({ message: "Password reset link sent to your email" });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(400).json({ error: error.message });
  }
});


// Unified reset-password for both CUSTOMER and SUPPLIER
router.post("/reset-password", async (req, res) => {
  const { token, newPassword, role } = req.body;
  try {
    if (!token || !newPassword || !role) {
      return res.status(400).json({ error: "Token, new password, and role are required" });
    }
    if (role === "SUPPLIER") {
      await resetSupplierPassword(token, newPassword);
    } else if (role === "CUSTOMER") {
      await resetCustomerPassword(token, newPassword);
    } else {
      return res.status(400).json({ error: "Invalid role" });
    }
    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(400).json({ error: error.message });
  }
});

// Get profile information for both CUSTOMER and SUPPLIER
router.get("/me", authMiddleware, async (req, res) => {
  try {
    if (req.role === "SUPPLIER") {
      const supplier = await prisma.supplier.findUnique({
        where: { id: parseInt(req.userId) },
        select: {
          id: true,
          ownerName: true,
          email: true,
          phone: true,
          companyName: true,
          address: true,
          ownerPhoto: true,
          companyPhotos: true,
          kycApproved: true,
          kycBusinessReg: true,
          kycTaxId: true,
          kycAddressProof: true,
        },
      });
      if (!supplier) return res.status(404).json({ error: "Supplier not found" });
      const supplierWithUrls = {
        ...supplier,
        ownerPhoto: supplier.ownerPhoto ? `${process.env.BASE_URL}${supplier.ownerPhoto}` : null,
        companyPhotos: supplier.companyPhotos ? supplier.companyPhotos.map(photo => (photo ? `${process.env.BASE_URL}${photo}` : null)) : [],
      };
      res.status(200).json(supplierWithUrls);
    } else if (req.role === "CUSTOMER") {
      const customer = await prisma.customer.findUnique({
        where: { id: parseInt(req.userId) },
        select: {
          id: true,
          name: true,
          email: true,
          address: true,
          phone: true,
        },
      });
      if (!customer) return res.status(404).json({ error: "Customer not found" });
      res.status(200).json(customer);
    } else {
      res.status(403).json({ error: "Access denied" });
    }
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;