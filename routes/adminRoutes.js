const express = require("express");
const { PrismaClient } = require("@prisma/client");
const router = express.Router();
const prisma = new PrismaClient();

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

module.exports = router;