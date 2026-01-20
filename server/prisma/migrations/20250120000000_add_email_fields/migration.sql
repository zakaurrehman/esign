-- AlterTable
ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "emailSubject" TEXT;
ALTER TABLE "Document" ADD COLUMN IF NOT EXISTS "emailMessage" TEXT;
