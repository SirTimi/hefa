-- CreateTable
CREATE TABLE "public"."AudtLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AudtLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AudtLog_createdAt_idx" ON "public"."AudtLog"("createdAt");

-- CreateIndex
CREATE INDEX "AudtLog_actorId_createdAt_idx" ON "public"."AudtLog"("actorId", "createdAt");
