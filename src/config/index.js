const env = process.env.NODE_ENV || "development";
const configs = {
  development: require("./development"),
  production: require("./production"),
};
module.exports = configs[env];