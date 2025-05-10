const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

//used in supplier/products
const createProduct = async (data) => {
  return prisma.product.create({ data });
};

//used in supplier/products
const findProductsBySupplierId = async (supplierId) => {
  return prisma.product.findMany({
    where: { supplierId: parseInt(supplierId), approved: true },
    select: { id: true, name: true, photo: true, price: true },
  });
};

//used in public/products
const findProductById = async (id) => {
  return prisma.product.findUnique({
    where: { id: parseInt(id), approved: true },
    select: { id: true, name: true, photo: true, price: true, approved: true },
  });
};

//get all aprroved product 
const getAllProduct = async () => {
  return prisma.product.findMany({
    where: { approved: true },
    select: { id: true, name: true, photo: true, price: true },
  });
}



const updateProduct = async (id, data) => {
  return prisma.product.update({ where: { id: parseInt(id) }, data });
};

const deleteProduct = async (id) => {
  return prisma.product.delete({ where: { id: parseInt(id) } });
};

const approveProduct = async (id, approved) => {
  return prisma.product.update({
    where: { id: parseInt(id) },
    data: { approved },
  });
};

const batchApproveProducts = async (productIds, approved) => {
  return prisma.product.updateMany({
    where: { id: { in: productIds.map(id => parseInt(id)) } },
    data: { approved },
  });
};

const findAllProductsForReview = async (supplierId) => {
  return prisma.product.findMany({
    where: { supplierId: parseInt(supplierId) },
  });
};

module.exports = {
  createProduct,
  getAllProduct,
  findProductsBySupplierId,
  findProductById,
  updateProduct,
  deleteProduct,
  approveProduct,
  batchApproveProducts,
  findAllProductsForReview,
};