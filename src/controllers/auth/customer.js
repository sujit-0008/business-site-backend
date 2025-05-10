const express = require("express");
const { hashPassword } = require("../../utils/auth");
const { createCustomer, findCustomerByEmail } = require("../../models/customer");
const router = express.Router();


router.post("/register", async (req, res) => {
  const { name, email, address, phone, password } = req.body;


  try {
    if (!name || !email || !address || !phone || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }
    const existingCustomer = await findCustomerByEmail(email);
    if (existingCustomer) return res.status(400).json({ error: "Email already registered" });


    const hashedPassword = await hashPassword(password);

    const customer = await createCustomer({
      name,
      email,
      address,
      phone,
      password: hashedPassword,
      role: "CUSTOMER",
    }
    );

    const clientIp = req.ip;
    if (clientIp) {
      const viewCounts = require("../../utils/viewCounts");
      viewCounts.DEL(clientIp);
    }

    res.status(201).json({ message: "Customer registered successfully", customerId: customer.id });
  } catch (error) {
    console.error("Customer registration error:", error);
    if (error.code === "P2002") {
      res.status(400).json({ error: "Email already exists" });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

module.exports = router;