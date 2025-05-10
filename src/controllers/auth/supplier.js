
const express = require("express");
const { PrismaClient } = require("@prisma/client");
const multer = require("multer");
const { hashPassword, comparePassword, generateToken } = require("../../utils/auth");
const{getSupplierDetails,createSupplier,findSupplierByEmail}= require("../../models/supplier")
const { sendEmail } = require("../../utils/email");
const authMiddleware = require("../../middleware/auth");
const{findCustomerByEmail } = require("../../models/customer");
const router = express.Router();
const prisma = new PrismaClient();

const storage = multer.diskStorage({
  destination: "./public/uploads/",
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

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
            const supplier = await createSupplier({
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
            });

            // Send verification email
            const verificationLink = `${process.env.BASE_URL}/suppliers/verify?token=${verificationToken}`;
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

// verify supplier email on Registration
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


//Works for boath CUSTOMER and SUPPLIER
// router.post("/login", async (req, res) => {
//     const { email, password } = req.body;
  
//     try {
//       // Check Supplier model first
//       let user = await findSupplierByEmail (email);
//       let role = "SUPPLIER";
  
//       // If not found in Supplier, check Customer model
//       if (!user) {
//         user = await findCustomerByEmail(email);
//         role = "CUSTOMER";
//       }
  
//       if (!user) return res.status(401).json({ error: "Invalid credentials" });
//       if (user.role === "SUPPLIER" && !user.emailVerified) {
//         return res.status(403).json({ error: "Email not verified" });
//       }
  
//       const isPasswordValid = await comparePassword(password, user.password);
//       if (!isPasswordValid) return res.status(401).json({ error: "Invalid credentials" });
  
//       const token = generateToken({ userId: user.id, role: user.role });
//       res.json({ token });
//     } catch (error) {
//       console.error("Login error:", error);
//       res.status(500).json({ error: "Internal server error" });
//     }
//   });



//   //get profile imformation for both CUSTOMER AND SUPPLIER
//   router.get("/me", authMiddleware, async (req, res) => {
//     try {
//       if (req.role === "SUPPLIER") {
//         const supplier = await getSupplierDetails(req.userId)
//         if (!supplier) return res.status(404).json({ error: "Supplier not found" });
//         const supplierWithUrls = {
//           ...supplier,
//           ownerPhoto: supplier.ownerPhoto ? `${process.env.BASE_URL}${supplier.ownerPhoto}` : null,
//           companyPhotos: supplier.companyPhotos.map(photo => (photo ? `${process.env.BASE_URL}${photo}` : null)),
//         };
//         res.status(200).json(supplierWithUrls);
//       } else if (req.role === "CUSTOMER") {
//         const customer = await prisma.customer.findUnique({
//           where: { id: parseInt(req.userId) },
//           select: {
//             id: true,
//             name: true,
//             email: true,
//             address: true,
//             phone: true,
//           },
//         });
//         if (!customer) return res.status(404).json({ error: "Customer not found" });
//         res.status(200).json(customer);
//       } else {
//         res.status(403).json({ error: "Access denied" });
//       }
//     } catch (error) {
//       console.error("Error fetching user details:", error);
//       res.status(500).json({ error: "Internal server error" });
//     }
//   });



// router.get("/getSuppliers", async (req, res) => {
//     try {
//         const suppliers = await prisma.supplier.findMany();
//         res.json(suppliers);
//     } catch (error) {
//         res.status(500).json({ error: 'Failed to fetch suppliers' });
//     }
// });

// router.post("/deleteSupplier", async (req, res) => {
//     try {
//         const { email } = req.params;
//         await prisma.supplier.delete({ where: { email } });
//         res.json({ message: 'Supplier deleted successfully' });
//     } catch (error) {
//         res.status(500).json({ error: 'Failed to delete supplier' });
//     }
// });

module.exports = router;