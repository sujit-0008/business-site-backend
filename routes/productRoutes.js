const express = require("express");
const { PrismaClient } = require("@prisma/client");
const multer = require("multer");
const authMiddleware = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

const storage = multer.diskStorage({
    destination: "./uploads/",
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});
const upload = multer({ storage });

router.post("/products", authMiddleware, upload.single("productImage"), async (req, res) => {
    const supplierId = req.userId // Get from token
    const { name, description, price } = req.body;
    const productImage = req.file ? `/uploads/${req.file.filename}` : null;
    try {
        // Check if KYC is approved
        const supplier = await prisma.supplier.findUnique({
            where: {
                id: parseInt(supplierId), // Use the supplierId from the token
            },
        });
        if (!supplier) {
            return res.status(404).json({ error: "Supplier not found" });
        }
        if (!supplier.kycApproved) {
            return res.status(403).json({ error: "KYC not approved. Cannot upload products." });
        }

        const product = await prisma.product.create({
            data: {
                name,
                description,
                price: parseFloat(price),
                photo: productImage,
                supplierId: parseInt(supplierId),
            },
        });

        await prisma.notification.create({
            data: {
                message: `New product "${name}" uploaded by supplier ID ${supplierId}. View at /admin/kyc/${supplierId}`,
                type: "product",
                supplierId: parseInt(supplierId),
            },
        });

        res.status(201).json({ message: "Product created", productId: product.id });
    } catch (error) {
        console.error("Product creation error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.get("/products", authMiddleware, async (req, res) => {
    const supplierId = req.userId;

    try {
        const supplier = await prisma.supplier.findUnique({ where: { id: parseInt(supplierId) } });
        if (!supplier) {
            return res.status(404).json({ error: "Supplier not found" });
        }
        if (!supplier.kycApproved) {
            return res.status(403).json({ error: "KYC not approved. Cannot view products." });
        }

        const products = await prisma.product.findMany({
            where: { supplierId: parseInt(supplierId) },
        });
        res.status(200).json({ products });
    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});


module.exports = router;