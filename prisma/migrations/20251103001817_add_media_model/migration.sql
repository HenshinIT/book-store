-- CreateTable
CREATE TABLE "media" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "path" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "uploadedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "media_uploadedBy_idx" ON "media"("uploadedBy");

-- CreateIndex
CREATE INDEX "media_createdAt_idx" ON "media"("createdAt");

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
