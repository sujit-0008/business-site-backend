// const express = require("express");
// const cors = require("cors");
// const path = require("path");
// require("dotenv").config();
// const routes = require("./routes");

// const app = express();

// app.use(cors());
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// app.use(routes);

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });

// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });

const express = require("express");
const path = require("path");
const routes = require("./routes/index");
const config = require("./config");
const cors = require("cors");
const viewCounts = require("../src/utils/viewCounts");

require("dotenv").config();
const app = express();
app.use(cors());
const logger = require("./utils/logger");

//process.env.NODE_ENV = process.env.NODE_ENV || "development";


app.use(express.json());

// Static file serving for uploads
app.use("/uploads", express.static(path.join(__dirname, "../public/uploads")));

// Mount routes
app.use("/", routes);

//temporary code snippets to reseat the viewcount on product remove in production
app.get("/reset-views", async (req, res) => {
  let clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.ip;
  
  if (clientIp.startsWith('::ffff:')) {
    clientIp = clientIp.split('::ffff:')[1];
  }
  if (clientIp === '::1') {
    clientIp = '127.0.0.1';
  }

  await viewCounts.set(clientIp, 0);
  const count = await viewCounts.get(clientIp)
  res.json({ message: "View count reset to 0!",count });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;