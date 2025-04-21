const express = require('express');
const { PrismaClient } = require('@prisma/client')
const multer = require('multer');
const { hashPassword, comparePassword, generateToken, verifyToken } = require('../utils/auth');
const { sendEmail } = require('../utils/email');
const router = express.Router()
const prisma = new PrismaClient()
const authMiddleware = require("../middleware/auth");

const storage = multer.diskStorage({
    destination: "./uploads/",
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
})
const upload = multer({ storage })

// Register supplier
router.post(
    "/register",
    upload.fields([
        { name: "ownerPhoto", maxCount: 1 },
        { name: "companyPhotos", maxCount: 5 },
    ]),
    async (req, res) => {
        const { ownerName, email, phone, companyName, address, password } = req.body;
        const ownerPhoto = req.files["ownerPhoto"]?.[0]
            ? `/uploads/${req.files["ownerPhoto"][0].filename}`
            : null;
        const companyPhotos = req.files["companyPhotos"]
            ? req.files["companyPhotos"].map((file) => `/uploads/${file.filename}`)
            : [];

        try {

            const hashedPassword = await hashPassword(password);
            //verificationToken
            const verificationToken = Math.random().toString(36).substring(2, 15);
//
            const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
            const supplier = await prisma.supplier.create({
                data: {
                    ownerName,
                    ownerPhoto,
                    email,
                    phone,
                    companyName,
                    address,
                    password: hashedPassword,
                    companyPhotos,
                    emailVerified: false,
                    verificationToken,
                    verificationTokenExpiry
                },
            });

            // Send verification email
            const verificationLink = `http://localhost:5000/suppliers/verify?token=${verificationToken}`;
            sendEmail(
                email,
                "Verify Your Email Within 24 Hours",
                `Please verify your email by clicking this link: ${verificationLink}`
            ).catch((err) => console.error("Email failed:", err.message));

            res.status(201).json({ message: "Supplier registered,please check youre e-mail for varification!", supplierId: supplier.id });
        } catch (error) {
            console.error("Registration error:", error);
            if (error.code === "P2002") {
                res.status(400).json({ error: "Email already exists" });
            } else {
                res.status(500).json({ error: "Internal server error" });
            }
        }
    }
);
router.get("/verify", async (req, res) => {
    const { token } = req.query;
    if (!token) {
        return res.status(400).json({ error: "Verification token is required" });
    }

    const supplier = await prisma.supplier.findUnique({ where: { verificationToken: token } });
    if (!supplier || supplier.verificationTokenExpiry < new Date()) {
        return res.status(400).json({ error: "Invalid or expired verification token" });
      }

    await prisma.supplier.update({
        where: { id: supplier.id },
        data: {
            emailVerified: true,
            verificationToken: null,
            verificationTokenExpiry: null,
        },
    });

    res.send("Email verified successfully! You can now login.");
});

router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    const supplier = await prisma.supplier.findUnique({ where: { email } });
    if (!supplier || !(await comparePassword(password, supplier.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
  
    if (!supplier.emailVerified) {
      return res.status(403).json({ error: "Email not verified" });
    }
  
    const token = generateToken({ userId: supplier.id, role: supplier.role });
    res.json({ token });
  });


  router.get("/me", authMiddleware, async (req, res) => {
    try {
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
        companyPhotos: supplier.companyPhotos.map(photo => photo ? `${process.env.BASE_URL}${photo}` : null),
      };
      res.status(200).json(supplierWithUrls);
    } catch (error) {
      console.error("Error fetching supplier details:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

router.get("/getSuppliers", async (req, res) => {
    try {
        const suppliers = await prisma.supplier.findMany();
        res.json(suppliers);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch suppliers' });
    }
});

router.post("/deleteSupplier", async (req, res) => {
    try {
        const { email } = req.params;
        await prisma.supplier.delete({ where: { email } });
        res.json({ message: 'Supplier deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete supplier' });
    }
});

module.exports = router;