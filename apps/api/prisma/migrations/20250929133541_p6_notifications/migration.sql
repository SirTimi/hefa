-- CreateEnum
CREATE TYPE "public"."SupportStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED');

-- CreateTable
CREATE TABLE "public"."SupportMessage" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "public"."SupportStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."NotificationPrefs" (
    "userId" TEXT NOT NULL,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "smsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "orderPaidEmail" BOOLEAN NOT NULL DEFAULT true,
    "orderPaidSms" BOOLEAN NOT NULL DEFAULT true,
    "deliveryAssignedEmail" BOOLEAN NOT NULL DEFAULT true,
    "deliveryAssignedSms" BOOLEAN NOT NULL DEFAULT true,
    "deliveryDeliveredEmail" BOOLEAN NOT NULL DEFAULT true,
    "deliveryDeliveredSms" BOOLEAN NOT NULL DEFAULT true,
    "payoutSentEmail" BOOLEAN NOT NULL DEFAULT true,
    "payoutSentSms" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationPrefs_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE INDEX "SupportMessage_status_createdAt_idx" ON "public"."SupportMessage"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."NotificationPrefs" ADD CONSTRAINT "NotificationPrefs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
