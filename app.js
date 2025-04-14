const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();
const routes = require("./routes");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(routes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});




// app.get("/test-email", async (req, res) => {
//     try {
//       await sendEmail("test@example.com", "Test Email", "This is a test email.");
//       res.send("Email sent successfully!");
//     } catch (error) {
//       res.status(500).send("Email failed: " + error.message);
//     }
//   });



app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});