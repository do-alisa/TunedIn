-- DropIndex
DROP INDEX "AlbumReview_userId_albumId_key";

-- AlterTable
ALTER TABLE "AlbumReview" ADD COLUMN     "listenedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
