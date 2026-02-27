-- CreateTable
CREATE TABLE "Upload" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fileName" TEXT NOT NULL,
    "uploadDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "discountAmount" REAL NOT NULL,
    "totalCost" REAL NOT NULL,
    "totalExtraCost" REAL NOT NULL,
    "totalNubiavilleCost" REAL NOT NULL,
    "orderCount" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "uploadId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "vendor" TEXT NOT NULL,
    "foodItems" TEXT NOT NULL,
    "totalCost" REAL NOT NULL,
    "discountAmount" REAL NOT NULL,
    "extraCost" REAL NOT NULL,
    "nubiavilleCost" REAL NOT NULL,
    "startTime" TEXT,
    "completionTime" TEXT,
    CONSTRAINT "Order_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "Upload" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Order_uploadId_idx" ON "Order"("uploadId");

-- CreateIndex
CREATE INDEX "Order_vendor_idx" ON "Order"("vendor");

-- CreateIndex
CREATE INDEX "Order_name_idx" ON "Order"("name");
