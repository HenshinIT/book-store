/*
  Warnings:

  - You are about to drop the column `author` on the `books` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "books_author_idx";

-- AlterTable
ALTER TABLE "books" DROP COLUMN "author",
ADD COLUMN     "authorId" TEXT,
ADD COLUMN     "publisherId" TEXT;

-- CreateTable
CREATE TABLE "authors" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bio" TEXT,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "authors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "publishers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "publishers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "authors_name_key" ON "authors"("name");

-- CreateIndex
CREATE INDEX "authors_name_idx" ON "authors"("name");

-- CreateIndex
CREATE UNIQUE INDEX "publishers_name_key" ON "publishers"("name");

-- CreateIndex
CREATE INDEX "publishers_name_idx" ON "publishers"("name");

-- CreateIndex
CREATE INDEX "books_authorId_idx" ON "books"("authorId");

-- CreateIndex
CREATE INDEX "books_publisherId_idx" ON "books"("publisherId");

-- AddForeignKey
ALTER TABLE "books" ADD CONSTRAINT "books_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "authors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "books" ADD CONSTRAINT "books_publisherId_fkey" FOREIGN KEY ("publisherId") REFERENCES "publishers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
