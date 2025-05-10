const express = require("express");
const { PrismaClient } = require("@prisma/client");
const multer = require("multer");
const authMiddleware = require("../../middleware/auth");
const router = express.Router();
const prisma = new PrismaClient();

const storage = multer.diskStorage({
  destination: "./public/uploads/",
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

router.post("/kyc",authMiddleware, upload.fields([
  { name: "kycBusinessReg", maxCount: 1 },
  { name: "kycTaxId", maxCount: 1 },
  { name: "kycAddressProof", maxCount: 1 },
]), async (req, res) => {
    const supplierId = req.userId;
  const kycBusinessReg = req.files["kycBusinessReg"]?.[0]
    ? `/uploads/${req.files["kycBusinessReg"][0].filename}`
    : null;
  const kycTaxId = req.files["kycTaxId"]?.[0]
    ? `/uploads/${req.files["kycTaxId"][0].filename}`
    : null;
  const kycAddressProof = req.files["kycAddressProof"]?.[0]
    ? `/uploads/${req.files["kycAddressProof"][0].filename}`
    : null;

  try {
    const supplier = await prisma.supplier.findUnique({ where: { id: parseInt(supplierId) } });
    if (!supplier) {
      return res.status(404).json({ error: "Supplier not found" });
    }

    await prisma.supplier.update({
      where: { id: parseInt(supplierId) },
      data: {
        kycBusinessReg,
        kycTaxId,
        kycAddressProof,
      },
    });

    await prisma.notification.create({
      data: {
        message: `New KYC submission from supplier ID ${supplierId}. View at /admin/kyc/${supplierId}`,
        type: "kyc",
        supplierId: parseInt(supplierId),
      },
    });

    //Notify admin via email
    // const adminEmail = process.env.ADMIN_EMAIL;
    // await sendEmail(
    //   adminEmail,
    //   "New KYC Submission",
    //   `A new KYC submission has been made by supplier ID ${supplierId}. Please review it at http://localhost:5000/admin/kyc.`
    // ).catch((err) => console.error("Admin notification failed:", err.message));


    res.status(200).json({ message: "KYC submitted successfully" });
  } catch (error) {
    console.error("KYC submission error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;