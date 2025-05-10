const { PrismaClient } = require("@prisma/client");
const { hashPassword } = require("../utils/auth");
const prisma = new PrismaClient();


const createSupplier = async (data) => {
  return prisma.supplier.create({ data });
};

const verifySupplierEmail = async (token) => {
  const supplier = await prisma.supplier.findUnique({ where: { verificationToken: token } });
  if (!supplier || supplier.verificationTokenExpiry < new Date()) {
    throw new Error("Invalid or expired verification token");
  }
  return prisma.supplier.update({
    where: { id: supplier.id },
    data: { emailVerified: true, verificationToken: null, verificationTokenExpiry: null },
  });
};

const findSupplierByEmail = async (email) => {
  return prisma.supplier.findUnique({ where: { email } });
};

const findSupplierById = async (id) => {
  return prisma.supplier.findUnique({ where: { id: parseInt(id) } });
};

const updateSupplierKYC = async (id, kycData) => {
  return prisma.supplier.update({
    where: { id: parseInt(id) },
    data: kycData,
  });
};

const updateSupplierApproval = async (id, approved) => {
  return prisma.supplier.update({
    where: { id: parseInt(id) },
    data: { kycApproved: approved },
  });
};

const deleteSupplier = async (email) => {
  return prisma.supplier.delete({ where: { email } });
};

const getSupplierDetails = async (id) => {
  return prisma.supplier.findUnique({
    where: { id: parseInt(id) },
    select: {
      id: true,
      ownerName: true,
      email: true,
      phone: true,
      companyName: true,
      address: true,
      ownerPhoto: true,
      companyPhotos: true,
      kycApproved: true,
      kycBusinessReg: true,
      kycTaxId: true,
      kycAddressProof: true,
    },
  });
};

const generatePasswordResetToken = async (email) => {
  const supplier = await findSupplierByEmail(email);
  if (!supplier) {
    throw new Error("Supplier not found");
  }
  const token = Math.random().toString(36).substring(2, 15);
  const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry
  await prisma.supplier.update({
    where: { id: supplier.id },
    data: {
      resetPasswordToken: token,
      resetPasswordExpiry: expiry,
    },
  });
  return { supplier, token };
};

const verifyPasswordResetToken = async (token) => {
  const supplier = await prisma.supplier.findFirst({
    where: {
      resetPasswordToken: token,
      resetPasswordExpiry: { gt: new Date() },
    },
  });
  if (!supplier) {
    throw new Error("Invalid or expired reset token");
  }
  return supplier;
};

const resetPassword = async (token, newPassword) => {
  const supplier = await verifyPasswordResetToken(token);
  const hashedPassword = await hashPassword(newPassword);
  return prisma.supplier.update({
    where: { id: supplier.id },
    data: {
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpiry: null,
    },
  });
};

module.exports = {
  createSupplier,
  verifySupplierEmail,
  findSupplierByEmail,
  findSupplierById,
  updateSupplierKYC,
  updateSupplierApproval,
  deleteSupplier,
  getSupplierDetails,
  generatePasswordResetToken,
  verifyPasswordResetToken,
  resetPassword
};