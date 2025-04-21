const express = require("express");
const { PrismaClient } = require("@prisma/client");
const router = express.Router();
const prisma = new PrismaClient();

router.get("/products", async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { approved: true },
      select: { id: true, name: true, photo: true, price: true },
    });
    const productsWithUrls = products.map(product => ({
      ...product,
      photo: product.photo ? `${process.env.BASE_URL}${product.photo}` : null,
    }));
    res.status(200).json({ products: productsWithUrls });
  } catch (error) {
    console.error("Error fetching public products:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/products/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const product = await prisma.product.findUnique({
      where: {
        id: parseInt(id),
        approved: true,
      },
    });
    if (!product) return res.status(404).json({ error: "Product not found" });
    const photoUrl = product.photo ? `${process.env.BASE_URL}${product.photo}` : null;
    res.json({ ...product, photo: photoUrl });
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;