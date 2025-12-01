-- Drop old columns
ALTER TABLE "books" DROP COLUMN IF EXISTS "thumbnailUrl";
ALTER TABLE "books" DROP COLUMN IF EXISTS "galleryImages";

-- Add thumbnailId column with unique constraint
ALTER TABLE "books" ADD COLUMN "thumbnailId" TEXT;

-- Create book_gallery table
CREATE TABLE "book_gallery" (
    "id" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "book_gallery_pkey" PRIMARY KEY ("id")
);

-- Add foreign keys
ALTER TABLE "books" ADD CONSTRAINT "books_thumbnailId_fkey" FOREIGN KEY ("thumbnailId") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "book_gallery" ADD CONSTRAINT "book_gallery_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "book_gallery" ADD CONSTRAINT "book_gallery_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create indexes
CREATE UNIQUE INDEX "books_thumbnailId_key" ON "books"("thumbnailId");
CREATE INDEX "books_thumbnailId_idx" ON "books"("thumbnailId");
CREATE UNIQUE INDEX "book_gallery_bookId_mediaId_key" ON "book_gallery"("bookId", "mediaId");
CREATE INDEX "book_gallery_bookId_idx" ON "book_gallery"("bookId");
CREATE INDEX "book_gallery_mediaId_idx" ON "book_gallery"("mediaId");

