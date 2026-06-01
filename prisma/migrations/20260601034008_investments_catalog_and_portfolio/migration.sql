-- CreateEnum
CREATE TYPE "investment_category_enum" AS ENUM ('stock', 'mutual_fund', 'bond', 'gold');

-- CreateTable
CREATE TABLE "investment_products" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "category" "investment_category_enum" NOT NULL,
    "symbol" VARCHAR(64) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "provider" VARCHAR(100),
    "currency" VARCHAR(10) NOT NULL DEFAULT 'IDR',
    "risk_level" "risk_level_enum",
    "tenor_months" INTEGER,
    "coupon_rate" DOUBLE PRECISION,
    "return_1y" DOUBLE PRECISION,
    "return_3y" DOUBLE PRECISION,
    "meta" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "investment_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portfolio_positions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "quantity" DECIMAL(20,8) NOT NULL,
    "avg_cost" DECIMAL(20,8),
    "purchased_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "portfolio_positions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "investment_products_symbol_key" ON "investment_products"("symbol");

-- CreateIndex
CREATE INDEX "investment_products_category_idx" ON "investment_products"("category");

-- CreateIndex
CREATE INDEX "investment_products_symbol_idx" ON "investment_products"("symbol");

-- CreateIndex
CREATE INDEX "portfolio_positions_user_id_idx" ON "portfolio_positions"("user_id");

-- CreateIndex
CREATE INDEX "portfolio_positions_product_id_idx" ON "portfolio_positions"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "portfolio_positions_user_id_product_id_key" ON "portfolio_positions"("user_id", "product_id");

-- AddForeignKey
ALTER TABLE "portfolio_positions" ADD CONSTRAINT "portfolio_positions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio_positions" ADD CONSTRAINT "portfolio_positions_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "investment_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
