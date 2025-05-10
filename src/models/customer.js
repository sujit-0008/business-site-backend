const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const createCustomer = async (data) => {
  return prisma.customer.create({ data });
};

const findCustomerByEmail = async (email) => {
  return prisma.customer.findUnique({ where: { email } });
};
const findCustomerById = async (id) => {
  return prisma.customer.findUnique({ where: { id: parseInt(id) } });
};

const updateCustomer = async (id, data) => {
  return prisma.customer.update({ where: { id: parseInt(id) }, data });
};

const deleteCustomer = async (id) => {
  return prisma.customer.delete({ where: { id: parseInt(id) } });
};
const generatePasswordResetToken = async (email) => {
  const customer = await findCustomerByEmail(email);
  if (!customer) {
    throw new Error("Customer not found");
  }
  const token = Math.random().toString(36).substring(2, 15);
  const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry
  await updateCustomer(customer.id, {
    resetPasswordToken: token,
    resetPasswordExpiry: expiry,
  });
  return { customer, token };
};
const verifyPasswordResetToken = async (token) => {
  const customer = await prisma.customer.findFirst({
    where: {
      resetPasswordToken: token,
      resetPasswordExpiry: { gt: new Date() },
    },
  });
  if (!customer) {
    throw new Error("Invalid or expired reset token");
  }
  return customer;
};
const resetPassword = async (token, newPassword) => {
  const customer = await verifyPasswordResetToken(token);
  const hashedPassword = await hashPassword(newPassword);
  return updateCustomer(customer.id, {
    password: hashedPassword,
    resetPasswordToken: null,
    resetPasswordExpiry: null,
  });
};
module.exports = {
  createCustomer, findCustomerByEmail, findCustomerById,
  updateCustomer,
  deleteCustomer,
  generatePasswordResetToken,
  verifyPasswordResetToken,
  resetPassword,
};