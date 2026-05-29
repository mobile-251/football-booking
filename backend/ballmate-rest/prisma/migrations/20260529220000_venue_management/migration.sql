-- CreateEnum
CREATE TYPE "FieldOperationalStatus" AS ENUM ('ACTIVE', 'MAINTENANCE', 'INACTIVE');

-- AlterTable
ALTER TABLE "venues" ADD COLUMN     "amenities" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "equipment" JSONB,
ADD COLUMN     "canteenItems" JSONB,
ADD COLUMN     "policies" JSONB;

-- AlterTable
ALTER TABLE "fields" ADD COLUMN     "operationalStatus" "FieldOperationalStatus" NOT NULL DEFAULT 'ACTIVE';
