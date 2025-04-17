const express = require("express");
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const { sendEmail } = require("../utils/email");
const router = express.Router();
const prisma = new PrismaClient();
const authMiddleware = require("../middleware/auth");
router.use(authMiddleware);


router.get("/notifications", async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { read: false },
      include: { supplier: true },
    });
    res.status(200).json({ notifications });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

//KYC Review

router.get("/kyc/:supplierId", async (req, res) => {
  const { supplierId } = req.params;

  try {
    const supplier = await prisma.supplier.findUnique({
      where: { id: parseInt(supplierId) },
      include: { notifications: true },
    });
    if (!supplier) {
      return res.status(404).json({ error: "Supplier not found" });
    }

    await prisma.notification.updateMany({
      where: { supplierId: parseInt(supplierId), read: false },
      data: { read: true },
    });

    res.status(200).json({
      supplierId: supplier.id,
      companyName: supplier.companyName,
      kycBusinessReg: supplier.kycBusinessReg,
      kycTaxId: supplier.kycTaxId,
      kycAddressProof: supplier.kycAddressProof,
      kycApproved: supplier.kycApproved,
    });
  } catch (error) {
    console.error("Error fetching KYC:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

//KYC Aproove

router.post("/kyc/:supplierId/approve", async (req, res) => {
  const { supplierId } = req.params;
  const { approved } = req.body;

  try {
    const supplier = await prisma.supplier.findUnique({ where: { id: parseInt(supplierId) } });
    if (!supplier) {
      return res.status(404).json({ error: "Supplier not found" });
    }

    await prisma.supplier.update({
      where: { id: parseInt(supplierId) },
      data: { kycApproved: approved },
    });

    res.status(200).json({ message: `KYC ${approved ? "approved" : "rejected"} successfully` });
  } catch (error) {
    console.error("Error updating KYC approval:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

//product review
router.get("/products/:supplierId", async (req, res) => {
  const { supplierId } = req.params;

  try {
    const products = await prisma.product.findMany({
      where: {
        supplierId: parseInt(supplierId),
      },
    });
    if (!products.length) {
      return res.status(404).json({ error: "No products found for this supplier" });
    }
// Mark product-related notifications as read
    await prisma.notification.updateMany({
      where: {
        supplierId: parseInt(supplierId),
        type: "product",
        read: false,
      },
      data: { read: true },
    });

    res.status(200).json({ products });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


//product Approve
router.post("/products/:productId/approve", async (req, res) => {
  const { productId } = req.params;
  const { approved } = req.body;

  try {
    const product = await prisma.product.findUnique({ where: { id: parseInt(productId) } });
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    await prisma.product.update({
      where: { id: parseInt(productId) },
      data: { approved },
    });

    // Notify supplier if approved
    if (approved) {
      const supplier = await prisma.supplier.findUnique({ where: { id: product.supplierId } });
      const subject = "Your Product Has Been Approved";
      const message = `Dear ${supplier.ownerName},\n\nYour product "${product.name}" (ID: ${productId}) has been approved and is now live. You can manage it via your dashboard.\n\nBest,\nThe Team`;
      await sendEmail(supplier.email, subject, message).catch((err) => console.error("Email failed:", err.message));
    }

    res.status(200).json({ message: `Product ${approved ? "approved" : "rejected"} successfully` });
  } catch (error) {
    console.error("Error updating product approval:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

//multiple product approvals
router.post("/products/batch-approve", async (req, res) => {
  const { productIds, approved } = req.body;

  try {
    if (!productIds || !Array.isArray(productIds)) {
      return res.status(400).json({ error: "productIds must be a non-empty array" });
    }

    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds.map(id => parseInt(id)) },
      },
    });
    if (products.length !== productIds.length) {
      return res.status(404).json({ error: "One or more products not found" });
    }

    await prisma.product.updateMany({
      where: {
        id: { in: productIds.map(id => parseInt(id)) },
      },
      data: { approved },
    });

    // Notify suppliers for approved products
    if (approved) {
      const supplierIds = [...new Set(products.map(p => p.supplierId))];
      for (const supplierId of supplierIds) {
        const supplier = await prisma.supplier.findUnique({ where: { id: supplierId } });
        const approvedProducts = products.filter(p => p.supplierId === supplierId);
        const subject = "Your Products Have Been Approved";
        const message = `Dear ${supplier.ownerName},\n\nThe following products have been approved:\n${approvedProducts.map(p => `- ${p.name} (ID: ${p.id})`).join('\n')}\n\nBest,\nThe Team`;
        await sendEmail(supplier.email, subject, message).catch((err) => console.error("Email failed:", err.message));
      }
    }

    res.status(200).json({ message: `Batch ${approved ? "approved" : "rejected"} successful for ${productIds.length} products` });
  } catch (error) {
    console.error("Error in batch approval:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
module.exports = router;