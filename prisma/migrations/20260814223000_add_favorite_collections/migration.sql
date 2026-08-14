CREATE TABLE "FavoriteCollection" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FavoriteCollection_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Favorite" ADD COLUMN "collectionId" TEXT;

CREATE UNIQUE INDEX "FavoriteCollection_userId_name_key" ON "FavoriteCollection"("userId", "name");
CREATE INDEX "FavoriteCollection_userId_updatedAt_idx" ON "FavoriteCollection"("userId", "updatedAt");
CREATE INDEX "Favorite_userId_collectionId_idx" ON "Favorite"("userId", "collectionId");

ALTER TABLE "FavoriteCollection" ADD CONSTRAINT "FavoriteCollection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "FavoriteCollection"("id") ON DELETE SET NULL ON UPDATE CASCADE;
