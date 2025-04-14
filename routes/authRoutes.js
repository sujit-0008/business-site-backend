const express = require('express');
const { PrismaClient } = require('@prisma/client')
const multer = require('multer');
const { hashPassword, comparePassword, generateToken, verifyToken } = require('../utils/auth');
const { sendEmail } = require('../utils/email');
const router = express.Router()
const prisma = new PrismaClient()

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

            res.status(201).json({ message: "Supplier registered", supplierId: supplier.id });
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
    let b= supplier.id
    const token = generateToken(supplier.id);
    res.json({ token ,b});
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


// KYC submission

router.post('/kyc', upload.fields([{ name: "kycAdsressProof", maxCount: 1 }]), async (req, res) => {
    const { businessReg, taxId } = req.body;
    const supplierId = 1;// Replace with auth middleware later
    const kycAddressProof = req.files["kycAddressProof"]?.[0]
        ? `/uploads/${req.files["kycAddressProof"][0].filename}`
        : null;
    const supplier = await prisma.supplier.update({
        where: { id: supplierId },
        data: { kycBusinessReg: businessReg, kycTaxId: taxId, kycAddressProof }
    })
    await sendEmail(
        supplier.email,
        "KYC Submission",
        `KYC submission received for supplier ${supplier.name}.Your KYC details have been submitted for review.`
    )

    // Notify admin via email
    // const adminEmail = process.env.ADMIN_EMAIL;
    // await sendEmail(
    //   adminEmail,
    //   "New KYC Submission",
    //   `A new KYC submission has been made by supplier ID ${supplierId}. Please review it at http://localhost:5000/admin/kyc.`
    // ).catch((err) => console.error("Admin notification failed:", err.message));

    res.json({ message: "KYC submitted" });

})




module.exports = router;