/*
  Warnings:

  - You are about to drop the column `createdByRole` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `createdByUserId` on the `Order` table. All the data in the column will be lost.
  - Added the required column `sellerId` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Order" DROP CONSTRAINT "Order_createdByUserId_fkey";

-- AlterTable
ALTER TABLE "public"."Order" DROP COLUMN "createdByRole",
DROP COLUMN "createdByUserId",
ADD COLUMN     "buyerUserId" TEXT,
ADD COLUMN     "sellerId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Order" ADD CONSTRAINT "Order_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Order" ADD CONSTRAINT "Order_buyerUserId_fkey" FOREIGN KEY ("buyerUserId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
