-- AlterTable
ALTER TABLE "public"."Delivery" ADD COLUMN     "deliveredAt" TIMESTAMP(3),
ADD COLUMN     "pickedUpAt" TIMESTAMP(3),
ADD COLUMN     "podCode" TEXT,
ADD COLUMN     "podVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "recipientName" TEXT,
ADD COLUMN     "recipientPhotoUrl" TEXT;
