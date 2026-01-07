/*
  Warnings:

  - A unique constraint covering the columns `[bookingCode]` on the table `bookings` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `bookingCode` to the `bookings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customerName` to the `bookings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customerPhone` to the `bookings` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "bookingCode" TEXT NOT NULL,
ADD COLUMN     "customerName" TEXT NOT NULL,
ADD COLUMN     "customerPhone" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "venues" ALTER COLUMN "openTime" DROP NOT NULL,
ALTER COLUMN "closeTime" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "bookings_bookingCode_key" ON "bookings"("bookingCode");

-- CreateIndex
CREATE INDEX "bookings_bookingCode_idx" ON "bookings"("bookingCode");
