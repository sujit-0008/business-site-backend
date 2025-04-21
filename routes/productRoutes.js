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

//upload Product

router.post("/products", authMiddleware, upload.single("productImage"), async (req, res) => {
    const supplierId = req.userId;
    const { name, description, price, type, category } = req.body;
    const productImage = req.file ? `/uploads/${req.file.filename}` : null;
  
    try {
      const supplier = await prisma.supplier.findUnique({
        where: { id: parseInt(supplierId) },
      });
      if (!supplier) return res.status(404).json({ error: "Supplier not found" });
      if (!supplier.kycApproved) return res.status(403).json({ error: "KYC not approved. Cannot upload products." });
  
      const product = await prisma.product.create({
        data: {
          name,
          description,
          price: parseFloat(price),
          photo: productImage,
          type: type || null,
          category: category || null,
          approved: false,
          supplierId: parseInt(supplierId),
        },
      });
  
      await prisma.notification.create({
        data: {
          message: `New product "${name}" uploaded by supplier ID ${supplierId}. Review at /admin/products/${supplierId}`,
          type: "product",
          supplierId: parseInt(supplierId),
          productId: product.id,
        },
      });
  
      res.status(201).json({ message: "Product created", productId: product.id });
    } catch (error) {
      console.error("Product creation error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  //get product by supplier
router.get("/products", authMiddleware, async (req, res) => {
    const supplierId = req.userId;
  
    try {
      const supplier = await prisma.supplier.findUnique({
        where: {
          id: parseInt(supplierId),
        },
      });
      if (!supplier) {
        return res.status(404).json({ error: "Supplier not found" });
      }
      if (!supplier.kycApproved) {
        return res.status(403).json({ error: "KYC not approved. Cannot view products." });
      }
      
  
      const products = await prisma.product.findMany({
        where: {
          supplierId: parseInt(supplierId),
          approved: true, // Only show approved products
        },
      });
      
     // Add BASE_URL to photo URLs
    const productsWithUrls = products.map(product => ({
      ...product,
      photo: product.photo ? `${process.env.BASE_URL}${product.photo}` : null,
    }));

    res.status(200).json({ products: productsWithUrls });
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });



module.exports = router;