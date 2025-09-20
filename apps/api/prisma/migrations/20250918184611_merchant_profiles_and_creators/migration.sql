/*
  Warnings:

  - The values [MERCHANT] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `buyerUserId` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `sellerId` on the `Order` table. All the data in the column will be lost.
  - Added the required column `creatorType` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."CreatorType" AS ENUM ('GUEST', 'USER', 'MERCHANT');

-- CreateEnum
CREATE TYPE "public"."MerchantStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED');

-- AlterEnum
BEGIN;
CREATE TYPE "public"."Role_new" AS ENUM ('ADMIN', 'USER', 'DRIVER');
ALTER TABLE "public"."User" ALTER COLUMN "role" TYPE "public"."Role_new" USING ("role"::text::"public"."Role_new");
ALTER TYPE "public"."Role" RENAME TO "Role_old";
ALTER TYPE "public"."Role_new" RENAME TO "Role";
DROP TYPE "public"."Role_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "public"."Order" DROP CONSTRAINT "Order_buyerUserId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Order" DROP CONSTRAINT "Order_sellerId_fkey";

-- AlterTable
ALTER TABLE "public"."Order" DROP COLUMN "buyerUserId",
DROP COLUMN "sellerId",
ADD COLUMN     "createdByMerchantId" TEXT,
ADD COLUMN     "createdByUserId" TEXT,
ADD COLUMN     "creatorType" "public"."CreatorType" NOT NULL;

-- CreateTable
CREATE TABLE "public"."MerchantProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "storeName" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "public"."MerchantStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MerchantProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MerchantProfile_slug_key" ON "public"."MerchantProfile"("slug");

-- AddForeignKey
ALTER TABLE "public"."Order" ADD CONSTRAINT "Order_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Order" ADD CONSTRAINT "Order_createdByMerchantId_fkey" FOREIGN KEY ("createdByMerchantId") REFERENCES "public"."MerchantProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MerchantProfile" ADD CONSTRAINT "MerchantProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
