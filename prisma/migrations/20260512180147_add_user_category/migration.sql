-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "user_category_id" UUID;

-- CreateTable
CREATE TABLE "user_categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_categories_user_id_idx" ON "user_categories"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_categories_user_id_name_key" ON "user_categories"("user_id", "name");

-- AddForeignKey
ALTER TABLE "user_categories" ADD CONSTRAINT "user_categories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_category_id_fkey" FOREIGN KEY ("user_category_id") REFERENCES "user_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
