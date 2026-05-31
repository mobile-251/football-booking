-- CreateEnum
CREATE TYPE "CoinTransactionType" AS ENUM ('TOP_UP', 'TOP_UP_BONUS', 'BOOKING_SPEND', 'SERVICE_SPEND', 'COMBO_PURCHASE', 'COMBO_REFUND', 'CHECKIN_REWARD', 'REFUND', 'ADMIN_ADJUST');

-- CreateEnum
CREATE TYPE "TopUpOrderStatus" AS ENUM ('PENDING', 'PAID', 'EXPIRED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "TopUpPurpose" AS ENUM ('WALLET_TOPUP', 'BOOKING_JIT', 'COMBO_JIT');

-- CreateEnum
CREATE TYPE "VenueServiceCategory" AS ENUM ('REFEREE', 'EQUIPMENT', 'FOOD_DRINK', 'OTHER');

-- CreateEnum
CREATE TYPE "VenueServiceUnit" AS ENUM ('PER_MATCH', 'PER_HOUR', 'PER_ITEM');

-- CreateEnum
CREATE TYPE "PlayerComboStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'EXHAUSTED', 'REFUNDED');

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "extrasJson" JSONB,
ADD COLUMN     "totalCoin" DECIMAL(12,2);

-- CreateTable
CREATE TABLE "wallets" (
    "id" SERIAL NOT NULL,
    "playerId" INTEGER NOT NULL,
    "coinBalance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coin_transactions" (
    "id" SERIAL NOT NULL,
    "walletId" INTEGER NOT NULL,
    "type" "CoinTransactionType" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "balanceAfter" DECIMAL(12,2) NOT NULL,
    "referenceType" TEXT,
    "referenceId" INTEGER,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coin_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "top_up_packages" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "priceVnd" INTEGER NOT NULL,
    "baseCoin" DECIMAL(12,2) NOT NULL,
    "bonusCoin" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "top_up_packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "top_up_orders" (
    "id" SERIAL NOT NULL,
    "playerId" INTEGER NOT NULL,
    "packageId" INTEGER,
    "paymentCode" TEXT NOT NULL,
    "priceVnd" INTEGER NOT NULL,
    "baseCoin" DECIMAL(12,2) NOT NULL,
    "bonusCoin" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "expectedCoin" DECIMAL(12,2) NOT NULL,
    "purpose" "TopUpPurpose" NOT NULL DEFAULT 'WALLET_TOPUP',
    "holdId" INTEGER,
    "comboPackageId" INTEGER,
    "status" "TopUpOrderStatus" NOT NULL DEFAULT 'PENDING',
    "sepayQrUrl" TEXT,
    "sepayMeta" JSONB,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "top_up_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_holds" (
    "id" SERIAL NOT NULL,
    "fieldId" INTEGER NOT NULL,
    "playerId" INTEGER NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "totalCoin" DECIMAL(12,2) NOT NULL,
    "payload" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_holds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "check_ins" (
    "id" SERIAL NOT NULL,
    "playerId" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "streakCount" INTEGER NOT NULL,
    "coinRewarded" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "check_ins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "check_in_reward_configs" (
    "id" SERIAL NOT NULL,
    "streakDay" INTEGER NOT NULL,
    "coinReward" DECIMAL(12,2) NOT NULL,
    "isMilestone" BOOLEAN NOT NULL DEFAULT false,
    "label" TEXT,

    CONSTRAINT "check_in_reward_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "venue_services" (
    "id" SERIAL NOT NULL,
    "venueId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "VenueServiceCategory" NOT NULL DEFAULT 'OTHER',
    "priceCoin" DECIMAL(12,2) NOT NULL,
    "unit" "VenueServiceUnit" NOT NULL DEFAULT 'PER_MATCH',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "venue_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_services" (
    "id" SERIAL NOT NULL,
    "bookingId" INTEGER NOT NULL,
    "venueServiceId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "priceCoinAtBooking" DECIMAL(12,2) NOT NULL,
    "totalCoin" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "booking_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "combo_packages" (
    "id" SERIAL NOT NULL,
    "venueId" INTEGER NOT NULL,
    "fieldType" "FieldType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "matchCount" INTEGER NOT NULL,
    "priceCoin" DECIMAL(12,2) NOT NULL,
    "validityDays" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "combo_packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_combos" (
    "id" SERIAL NOT NULL,
    "playerId" INTEGER NOT NULL,
    "comboPackageId" INTEGER NOT NULL,
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "matchesTotal" INTEGER NOT NULL,
    "matchesRemaining" INTEGER NOT NULL,
    "status" "PlayerComboStatus" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "player_combos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_combo_usages" (
    "id" SERIAL NOT NULL,
    "bookingId" INTEGER NOT NULL,
    "playerComboId" INTEGER NOT NULL,
    "matchesConsumed" INTEGER NOT NULL DEFAULT 1,
    "consumedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_combo_usages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "wallets_playerId_key" ON "wallets"("playerId");

-- CreateIndex
CREATE INDEX "coin_transactions_walletId_createdAt_idx" ON "coin_transactions"("walletId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "top_up_orders_paymentCode_key" ON "top_up_orders"("paymentCode");

-- CreateIndex
CREATE INDEX "top_up_orders_playerId_status_idx" ON "top_up_orders"("playerId", "status");

-- CreateIndex
CREATE INDEX "booking_holds_fieldId_startTime_endTime_idx" ON "booking_holds"("fieldId", "startTime", "endTime");

-- CreateIndex
CREATE UNIQUE INDEX "check_ins_playerId_date_key" ON "check_ins"("playerId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "check_in_reward_configs_streakDay_key" ON "check_in_reward_configs"("streakDay");

-- CreateIndex
CREATE INDEX "venue_services_venueId_isActive_idx" ON "venue_services"("venueId", "isActive");

-- CreateIndex
CREATE INDEX "combo_packages_venueId_fieldType_isActive_idx" ON "combo_packages"("venueId", "fieldType", "isActive");

-- CreateIndex
CREATE INDEX "player_combos_playerId_status_idx" ON "player_combos"("playerId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "booking_combo_usages_bookingId_key" ON "booking_combo_usages"("bookingId");

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coin_transactions" ADD CONSTRAINT "coin_transactions_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "top_up_orders" ADD CONSTRAINT "top_up_orders_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "top_up_orders" ADD CONSTRAINT "top_up_orders_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "top_up_packages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "top_up_orders" ADD CONSTRAINT "top_up_orders_holdId_fkey" FOREIGN KEY ("holdId") REFERENCES "booking_holds"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_holds" ADD CONSTRAINT "booking_holds_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venue_services" ADD CONSTRAINT "venue_services_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_services" ADD CONSTRAINT "booking_services_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_services" ADD CONSTRAINT "booking_services_venueServiceId_fkey" FOREIGN KEY ("venueServiceId") REFERENCES "venue_services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "combo_packages" ADD CONSTRAINT "combo_packages_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_combos" ADD CONSTRAINT "player_combos_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_combos" ADD CONSTRAINT "player_combos_comboPackageId_fkey" FOREIGN KEY ("comboPackageId") REFERENCES "combo_packages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_combo_usages" ADD CONSTRAINT "booking_combo_usages_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_combo_usages" ADD CONSTRAINT "booking_combo_usages_playerComboId_fkey" FOREIGN KEY ("playerComboId") REFERENCES "player_combos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
