-- CreateEnum
CREATE TYPE "public"."DeliveryStatus" AS ENUM ('NEW', 'OFFERING', 'ASSIGNED', 'PICKED_UP', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."OfferStatus" AS ENUM ('SENT', 'ACCEPTED', 'DECLINED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "public"."DeliveryEventKind" AS ENUM ('OFFER_SENT', 'OFFER_ACCEPTED', 'OFFER_DECLINED', 'OFFER_EXPIRED', 'DRIVER_ASSIGNED', 'DRIVER_ARRIVED', 'PICKED_UP', 'DELIVERED', 'CANCELLED', 'LOCATION_UPDATE', 'NOTE');

-- CreateTable
CREATE TABLE "public"."Delivery" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "status" "public"."DeliveryStatus" NOT NULL,
    "assignedDriverId" TEXT,
    "pickupAddress" TEXT,
    "pickupLat" DECIMAL(65,30),
    "pickupLng" DECIMAL(65,30),
    "dropoffAddress" TEXT,
    "dropoffLat" DECIMAL(65,30),
    "dropoffLng" DECIMAL(65,30),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Delivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Offer" (
    "id" TEXT NOT NULL,
    "deliveryId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "status" "public"."OfferStatus" NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DriverPresence" (
    "driverId" TEXT NOT NULL,
    "online" BOOLEAN NOT NULL DEFAULT false,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lat" DECIMAL(65,30),
    "lng" DECIMAL(65,30),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriverPresence_pkey" PRIMARY KEY ("driverId")
);

-- CreateTable
CREATE TABLE "public"."DeliveryEvent" (
    "id" TEXT NOT NULL,
    "deliveryId" TEXT NOT NULL,
    "actorUserId" TEXT,
    "kind" "public"."DeliveryEventKind" NOT NULL,
    "data" JSONB,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeliveryEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Delivery_orderId_idx" ON "public"."Delivery"("orderId");

-- CreateIndex
CREATE INDEX "Delivery_assignedDriverId_idx" ON "public"."Delivery"("assignedDriverId");

-- CreateIndex
CREATE INDEX "Offer_driverId_idx" ON "public"."Offer"("driverId");

-- CreateIndex
CREATE INDEX "Offer_deliveryId_status_idx" ON "public"."Offer"("deliveryId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Offer_deliveryId_driverId_key" ON "public"."Offer"("deliveryId", "driverId");

-- CreateIndex
CREATE INDEX "DeliveryEvent_deliveryId_at_idx" ON "public"."DeliveryEvent"("deliveryId", "at");

-- AddForeignKey
ALTER TABLE "public"."Delivery" ADD CONSTRAINT "Delivery_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Delivery" ADD CONSTRAINT "Delivery_assignedDriverId_fkey" FOREIGN KEY ("assignedDriverId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Offer" ADD CONSTRAINT "Offer_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "public"."Delivery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Offer" ADD CONSTRAINT "Offer_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DriverPresence" ADD CONSTRAINT "DriverPresence_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DeliveryEvent" ADD CONSTRAINT "DeliveryEvent_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "public"."Delivery"("id") ON DELETE CASCADE ON UPDATE CASCADE;
