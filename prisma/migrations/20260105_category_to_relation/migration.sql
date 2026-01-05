-- CreateTable: ProductCategory
CREATE TABLE "ProductCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductCategory_name_key" ON "ProductCategory"("name");
CREATE UNIQUE INDEX "ProductCategory_slug_key" ON "ProductCategory"("slug");

-- Insert default categories
INSERT INTO "ProductCategory" (id, name, slug, description, "isActive", "createdAt", "updatedAt")
VALUES
    (gen_random_uuid()::text, 'Мотыль', 'motyl', 'Живой мотыль для рыбалки', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'Коретра', 'koretra', 'Живая коретра для рыбалки', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'Аксессуары', 'accessories', 'Аксессуары для хранения наживки', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Add categoryId column as nullable first
ALTER TABLE "Product" ADD COLUMN "categoryId" TEXT;

-- Migrate data from old enum to new foreign keys
UPDATE "Product" p
SET "categoryId" = (
    SELECT id FROM "ProductCategory"
    WHERE slug = CASE
        WHEN p.category = 'MOTYL' THEN 'motyl'
        WHEN p.category = 'KORETRA' THEN 'koretra'
        WHEN p.category = 'ACCESSORIES' THEN 'accessories'
    END
    LIMIT 1
);

-- Make categoryId NOT NULL
ALTER TABLE "Product" ALTER COLUMN "categoryId" SET NOT NULL;

-- Add foreign key constraint
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ProductCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Create index on categoryId
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");

-- Drop old category column
ALTER TABLE "Product" DROP COLUMN "category";

-- Drop old Category enum type
DROP TYPE "Category";
