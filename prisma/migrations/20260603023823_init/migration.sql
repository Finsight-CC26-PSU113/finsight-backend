-- CreateEnum
CREATE TYPE "risk_level_enum" AS ENUM ('low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "payment_method_enum" AS ENUM ('cash', 'debit_card', 'credit_card', 'e_wallet', 'bank_transfer');

-- CreateEnum
CREATE TYPE "transaction_type_enum" AS ENUM ('income', 'expense');

-- CreateEnum
CREATE TYPE "category_name_enum" AS ENUM ('makanan', 'transport', 'hiburan', 'belanja', 'kesehatan', 'tagihan', 'lainnya');

-- CreateEnum
CREATE TYPE "alert_level_enum" AS ENUM ('warning', 'alert', 'over');

-- CreateEnum
CREATE TYPE "recommendation_status_enum" AS ENUM ('active', 'done', 'dismissed');

-- CreateEnum
CREATE TYPE "recommendation_priority_enum" AS ENUM ('high', 'medium', 'low');

-- CreateEnum
CREATE TYPE "investment_category_enum" AS ENUM ('stock', 'mutual_fund', 'bond', 'gold');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(16),
    "birthday" DATE,
    "avatar" TEXT,
    "push_notifications_enabled" BOOLEAN NOT NULL DEFAULT true,
    "email_notifications_enabled" BOOLEAN NOT NULL DEFAULT false,
    "investment_portfolio_value" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "financial_goal_name" VARCHAR(100),
    "financial_goal_target" DECIMAL(15,2),
    "financial_goal_saved" DECIMAL(15,2),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" "category_name_enum" NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "transaction_type" "transaction_type_enum" NOT NULL DEFAULT 'expense',
    "category_id" UUID,
    "user_category_id" UUID,
    "description" TEXT,
    "amount" DECIMAL(15,2) NOT NULL,
    "payment_method" "payment_method_enum" NOT NULL,
    "transaction_date" DATE NOT NULL,
    "category_predicted" VARCHAR(255),
    "confidence_score" DOUBLE PRECISION,
    "is_anomaly" BOOLEAN NOT NULL DEFAULT false,
    "anomaly_score" DOUBLE PRECISION,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions_feedback" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "transaction_id" UUID NOT NULL,
    "corrected_category_id" UUID NOT NULL,
    "feedback_type" VARCHAR(50),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budgets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "period" VARCHAR(7) NOT NULL,
    "start_date" TIMESTAMPTZ NOT NULL,
    "end_date" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "budgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "budget_id" UUID NOT NULL,
    "level" "alert_level_enum" NOT NULL,
    "message" TEXT NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommendations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "type" VARCHAR(100) NOT NULL,
    "message" VARCHAR(1000) NOT NULL,
    "priority" "recommendation_priority_enum" NOT NULL,
    "status" "recommendation_status_enum" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_risk_profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "risk_level" "risk_level_enum" NOT NULL,
    "score" INTEGER NOT NULL,
    "answer" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "user_risk_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risk_profile_answers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "profile_user_id" UUID NOT NULL,
    "question" VARCHAR(10) NOT NULL,
    "answer" VARCHAR(5) NOT NULL,

    CONSTRAINT "risk_profile_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investment_recommendations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "risk_profile_id" UUID NOT NULL,
    "instrument_type" VARCHAR(255) NOT NULL,
    "instrument_name" VARCHAR(255) NOT NULL,
    "expected_return_min" DOUBLE PRECISION NOT NULL,
    "expected_return_max" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "investment_recommendations_pkey" PRIMARY KEY ("id")
);

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
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE INDEX "user_categories_user_id_idx" ON "user_categories"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_categories_user_id_name_key" ON "user_categories"("user_id", "name");

-- CreateIndex
CREATE INDEX "transactions_user_id_idx" ON "transactions"("user_id");

-- CreateIndex
CREATE INDEX "transactions_category_id_idx" ON "transactions"("category_id");

-- CreateIndex
CREATE INDEX "transactions_transaction_date_idx" ON "transactions"("transaction_date");

-- CreateIndex
CREATE INDEX "transactions_user_id_transaction_type_idx" ON "transactions"("user_id", "transaction_type");

-- CreateIndex
CREATE INDEX "transactions_user_id_transaction_date_idx" ON "transactions"("user_id", "transaction_date");

-- CreateIndex
CREATE INDEX "transactions_feedback_user_id_idx" ON "transactions_feedback"("user_id");

-- CreateIndex
CREATE INDEX "transactions_feedback_transaction_id_idx" ON "transactions_feedback"("transaction_id");

-- CreateIndex
CREATE INDEX "transactions_feedback_corrected_category_id_idx" ON "transactions_feedback"("corrected_category_id");

-- CreateIndex
CREATE INDEX "budgets_user_id_idx" ON "budgets"("user_id");

-- CreateIndex
CREATE INDEX "budgets_category_id_idx" ON "budgets"("category_id");

-- CreateIndex
CREATE UNIQUE INDEX "budgets_user_id_category_id_period_key" ON "budgets"("user_id", "category_id", "period");

-- CreateIndex
CREATE INDEX "alerts_user_id_idx" ON "alerts"("user_id");

-- CreateIndex
CREATE INDEX "alerts_category_id_idx" ON "alerts"("category_id");

-- CreateIndex
CREATE INDEX "alerts_budget_id_idx" ON "alerts"("budget_id");

-- CreateIndex
CREATE INDEX "alerts_is_read_idx" ON "alerts"("is_read");

-- CreateIndex
CREATE INDEX "recommendations_user_id_idx" ON "recommendations"("user_id");

-- CreateIndex
CREATE INDEX "recommendations_category_id_idx" ON "recommendations"("category_id");

-- CreateIndex
CREATE INDEX "recommendations_user_id_status_idx" ON "recommendations"("user_id", "status");

-- CreateIndex
CREATE INDEX "user_risk_profiles_user_id_idx" ON "user_risk_profiles"("user_id");

-- CreateIndex
CREATE INDEX "risk_profile_answers_profile_user_id_idx" ON "risk_profile_answers"("profile_user_id");

-- CreateIndex
CREATE INDEX "investment_recommendations_user_id_idx" ON "investment_recommendations"("user_id");

-- CreateIndex
CREATE INDEX "investment_recommendations_risk_profile_id_idx" ON "investment_recommendations"("risk_profile_id");

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
ALTER TABLE "user_categories" ADD CONSTRAINT "user_categories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_category_id_fkey" FOREIGN KEY ("user_category_id") REFERENCES "user_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions_feedback" ADD CONSTRAINT "transactions_feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions_feedback" ADD CONSTRAINT "transactions_feedback_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions_feedback" ADD CONSTRAINT "transactions_feedback_corrected_category_id_fkey" FOREIGN KEY ("corrected_category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_budget_id_fkey" FOREIGN KEY ("budget_id") REFERENCES "budgets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_risk_profiles" ADD CONSTRAINT "user_risk_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_profile_answers" ADD CONSTRAINT "risk_profile_answers_profile_user_id_fkey" FOREIGN KEY ("profile_user_id") REFERENCES "user_risk_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investment_recommendations" ADD CONSTRAINT "investment_recommendations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investment_recommendations" ADD CONSTRAINT "investment_recommendations_risk_profile_id_fkey" FOREIGN KEY ("risk_profile_id") REFERENCES "user_risk_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio_positions" ADD CONSTRAINT "portfolio_positions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portfolio_positions" ADD CONSTRAINT "portfolio_positions_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "investment_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
