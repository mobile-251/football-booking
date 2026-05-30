-- CreateEnum
CREATE TYPE "BookingSource" AS ENUM ('MOBILE_APP', 'WEB_WALK_IN');

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "createdByUserId" INTEGER,
ADD COLUMN     "customerEmail" TEXT,
ADD COLUMN     "source" "BookingSource" NOT NULL DEFAULT 'MOBILE_APP',
ALTER COLUMN "playerId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
