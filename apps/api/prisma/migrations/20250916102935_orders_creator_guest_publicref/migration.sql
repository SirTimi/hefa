/*
  Warnings:

  - You are about to drop the column `merchantId` on the `Order` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[publicRef]` on the table `Order` will be added. If there are existing duplicate values, this will fail.
  - The required column `publicRef` was added to the `Order` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterEnum
ALTER TYPE "public"."Role" ADD VALUE 'USER';

-- DropForeignKey
ALTER TABLE "public"."Order" DROP CONSTRAINT "Order_merchantId_fkey";

-- AlterTable
ALTER TABLE "public"."Order" DROP COLUMN "merchantId",
ADD COLUMN     "createdByRole" "public"."Role",
ADD COLUMN     "createdByUserId" TEXT,
ADD COLUMN     "customerEmail" TEXT,
ADD COLUMN     "customerName" TEXT,
ADD COLUMN     "customerPhone" TEXT,
ADD COLUMN     "publicRef" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Order_publicRef_key" ON "public"."Order"("publicRef");

-- AddForeignKey
ALTER TABLE "public"."Order" ADD CONSTRAINT "Order_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
