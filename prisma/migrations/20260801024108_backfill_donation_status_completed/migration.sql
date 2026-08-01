-- Backfill: donation records created before the DonationStatus feature
-- were all completed donations (logged via the "Log Donation" flow).
UPDATE "DonationRecord" SET "status" = 'COMPLETED';
