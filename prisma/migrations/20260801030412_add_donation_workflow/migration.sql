/*
  Warnings:

  - Added the required column `updatedAt` to the `DonationRecord` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "DonationStatus" ADD VALUE 'ACCEPTED';
ALTER TYPE "DonationStatus" ADD VALUE 'REJECTED';

-- DropForeignKey
ALTER TABLE "DonationRecord" DROP CONSTRAINT "DonationRecord_donorId_fkey";

-- AlterTable
ALTER TABLE "DonationRecord" ADD COLUMN     "appointmentNote" TEXT,
ADD COLUMN     "feedback" TEXT,
ADD COLUMN     "rating" INTEGER,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "requestId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DonationRecord" ADD CONSTRAINT "DonationRecord_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "MedicalRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DonationRecord" ADD CONSTRAINT "DonationRecord_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
