module.exports = {
    databaseUrl: process.env.DATABASE_URL || "postgresql://localhost:5432/dev_db",
    logLevel: "debug",
    baseUrl: process.env.BASE_URL || "http://localhost:5000"
  };