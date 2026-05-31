-- AlterTable
ALTER TABLE "payments" ADD COLUMN "sepayPaymentCode" TEXT,
ADD COLUMN "sepayQrUrl" TEXT,
ADD COLUMN "sepayOrderMeta" JSONB,
ADD COLUMN "expiresAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "payments_sepayPaymentCode_key" ON "payments"("sepayPaymentCode");

-- CreateTable
CREATE TABLE "sepay_webhook_events" (
    "id" SERIAL NOT NULL,
    "sepayTransactionId" INTEGER NOT NULL,
    "payload" JSONB NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sepay_webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sepay_webhook_events_sepayTransactionId_key" ON "sepay_webhook_events"("sepayTransactionId");
