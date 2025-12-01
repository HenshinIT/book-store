-- CreateTable
CREATE TABLE "book_series" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "book_series_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "book_series_name_key" ON "book_series"("name");

-- CreateIndex
CREATE INDEX "book_series_name_idx" ON "book_series"("name");

-- AlterTable
ALTER TABLE "books" ADD COLUMN "seriesId" TEXT;

-- AddForeignKey
ALTER TABLE "books" ADD CONSTRAINT "books_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "book_series"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "books_seriesId_idx" ON "books"("seriesId");

