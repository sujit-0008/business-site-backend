-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'SUPPLIER', 'CUSTOMER');

-- AlterTable
ALTER TABLE "Supplier" ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'SUPPLIER';
