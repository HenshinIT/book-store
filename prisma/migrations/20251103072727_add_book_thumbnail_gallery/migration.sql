-- Add thumbnailUrl column
ALTER TABLE "books" ADD COLUMN "thumbnailUrl" TEXT;

-- Copy data from imageUrl to thumbnailUrl
UPDATE "books" SET "thumbnailUrl" = "imageUrl" WHERE "imageUrl" IS NOT NULL;

-- Add galleryImages column (JSON)
ALTER TABLE "books" ADD COLUMN "galleryImages" JSONB;

-- Drop old imageUrl column
ALTER TABLE "books" DROP COLUMN "imageUrl";

