-- CreateEnum
CREATE TYPE "public"."KycStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "public"."DriverKyc" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "idNumber" TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "licenseExpiry" TIMESTAMP(3),
    "vehicleType" TEXT,
    "vehiclePlate" TEXT,
    "idDocUrl" TEXT,
    "licenseDocUrl" TEXT,
    "selfieUrl" TEXT,
    "status" "public"."KycStatus" NOT NULL DEFAULT 'PENDING',
    "reviewNote" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriverKyc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MerchantKyc" (
    "id" TEXT NOT NULL,
    "merchantProfileId" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "businessName" TEXT,
    "taxId" TEXT,
    "address" TEXT,
    "docUrl" TEXT,
    "status" "public"."KycStatus" NOT NULL DEFAULT 'PENDING',
    "reviewNote" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MerchantKyc_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DriverKyc_userId_key" ON "public"."DriverKyc"("userId");

-- CreateIndex
CREATE INDEX "DriverKyc_status_idx" ON "public"."DriverKyc"("status");

-- CreateIndex
CREATE UNIQUE INDEX "MerchantKyc_merchantProfileId_key" ON "public"."MerchantKyc"("merchantProfileId");

-- CreateIndex
CREATE INDEX "MerchantKyc_status_idx" ON "public"."MerchantKyc"("status");

-- AddForeignKey
ALTER TABLE "public"."DriverKyc" ADD CONSTRAINT "DriverKyc_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DriverKyc" ADD CONSTRAINT "DriverKyc_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MerchantKyc" ADD CONSTRAINT "MerchantKyc_merchantProfileId_fkey" FOREIGN KEY ("merchantProfileId") REFERENCES "public"."MerchantProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MerchantKyc" ADD CONSTRAINT "MerchantKyc_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
