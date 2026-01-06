/*
  Warnings:

  - You are about to drop the column `description` on the `fields` table. All the data in the column will be lost.
  - You are about to drop the column `images` on the `fields` table. All the data in the column will be lost.
  - You are about to drop the column `pricePerHour` on the `fields` table. All the data in the column will be lost.
  - You are about to drop the column `facilities` on the `venues` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "DayType" AS ENUM ('WEEKDAY', 'WEEKEND');

-- AlterTable
ALTER TABLE "fields" DROP COLUMN "description",
DROP COLUMN "images",
DROP COLUMN "pricePerHour";

-- AlterTable
ALTER TABLE "venues" DROP COLUMN "facilities",
ADD COLUMN     "email" TEXT,
ADD COLUMN     "phoneNumber" TEXT;

-- CreateTable
CREATE TABLE "field_pricings" (
    "id" SERIAL NOT NULL,
    "fieldId" INTEGER NOT NULL,
    "dayType" "DayType" NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "field_pricings_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "field_pricings" ADD CONSTRAINT "field_pricings_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;
