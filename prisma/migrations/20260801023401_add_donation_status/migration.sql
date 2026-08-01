-- CreateEnum
CREATE TYPE "DonationStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED');

-- AlterTable
ALTER TABLE "DonationRecord" ADD COLUMN     "status" "DonationStatus" NOT NULL DEFAULT 'PENDING';
