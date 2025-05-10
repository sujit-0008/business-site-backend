const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();


const hashPassword = async (password) => {
    return await bcrypt.hash(password, 10);
}
const comparePassword = async (password, hashPassword) => { return await bcrypt.compare(password, hashPassword) }

const generateToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });
  };

const verifyToken = (token) => { return jwt.verify(token, process.env.JWT_SECRET) }

module.exports = { hashPassword, comparePassword, generateToken, verifyToken };