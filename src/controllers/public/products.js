const express = require("express");
const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");
const router = express.Router();
const prisma = new PrismaClient();
const viewCounts = require("../../utils/viewCounts");
const logger = require("../../utils/logger");
const { findProductById, getAllProduct } = require("../../models/product");
const ip = require("ip"); // Using `ip` package for better IP handling

// Route to fetch all products
router.get("/products", async (req, res) => {
  try {
    const products = await getAllProduct();

    // Ensure product list is valid before mapping
    if (!products || products.length === 0) {
      return res.status(404).json({ error: "No products found" });
    }

    // Append full image URLs
    const productsWithUrls = products.map((product) => ({
      ...product,
      photo: product.photo ? `${process.env.BASE_URL}${product.photo}` : null,
    }));

    res.status(200).json({ products: productsWithUrls });
  } catch (error) {
    console.error("Database query failed:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Route to fetch a single product by ID with condition
// router.get("/products/:id", async (req, res) => {
//   let clientIp = req.headers["x-forwarded-for"] || req.connection.remoteAddress || req.ip;

//   const { id } = req.params;
//   const token = req.header("Authorization")?.replace("Bearer ", "");

//   try {
//     if (token) {
//       try {
//         const decoded = jwt.verify(token, process.env.JWT_SECRET);

//         if (!decoded || !decoded.role) {
//           return res.status(403).json({ error: "Unauthorized access" });
//         }

//         // Directly return product for authenticated users (skipping view limits)
//         if (["SUPPLIER", "CUSTOMER", "ADMIN"].includes(decoded.role)) {
//           const product = await findProductById(id);
//           if (!product) return res.status(404).json({ error: "Product not found" });

//           return res.json({
//             ...product,
//             photo: product.photo ? `${process.env.BASE_URL}${product.photo}` : null,
//           });
//         }
//       } catch (error) {
//         // Invalid or expired token—fall through to guest logic
//         console.error("Token verification failed:", error);
//       }
//     }

//     // Guest user logic (only runs if no valid token)
//     let currentViews = await viewCounts.get(clientIp);
//     currentViews = currentViews ? parseInt(currentViews) : 0;

//     if (currentViews >= 5) {
//       logger.info(`Blocking ${clientIp} due to view limit`);
//       return res.status(403).json({ error: "Please sign up or log in to continue browsing" });
//     }

//     // Increment view count for guests
//     await viewCounts.set(clientIp, currentViews + 1);
//     await viewCounts.expire(clientIp, 86400);

//     console.log("Current Views:", await viewCounts.get(clientIp));

//     // Fetch product only once
//     const product = await findProductById(id);
//     if (!product) return res.status(404).json({ error: "Product not found" });

//     res.json({
//       ...product,
//       photo: product.photo ? `${process.env.BASE_URL}${product.photo}` : null,
//     });

//   } catch (error) {
//     console.error("Error fetching product:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });

router.get("/products/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // Fetch product without checking authentication or view limits
    const product = await findProductById(id);
    if (!product) return res.status(404).json({ error: "Product not found" });

    res.json({
      ...product,
      photo: product.photo ? `${process.env.BASE_URL}${product.photo}` : null,
    });

  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;