-- AlterTable
ALTER TABLE "Badge" ADD COLUMN     "key" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "MedicalRequest" ADD COLUMN     "targetUserId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Badge_key_key" ON "Badge"("key");

-- AddForeignKey
ALTER TABLE "MedicalRequest" ADD CONSTRAINT "MedicalRequest_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
