/*
  Warnings:

  - A unique constraint covering the columns `[verificationToken]` on the table `Supplier` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Supplier_verificationToken_key" ON "Supplier"("verificationToken");
