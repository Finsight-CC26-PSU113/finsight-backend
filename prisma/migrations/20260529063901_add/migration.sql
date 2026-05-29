-- AlterTable
ALTER TABLE "users" ADD COLUMN     "email_notifications_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "financial_goal_name" VARCHAR(100),
ADD COLUMN     "financial_goal_saved" DECIMAL(15,2),
ADD COLUMN     "financial_goal_target" DECIMAL(15,2),
ADD COLUMN     "investment_portfolio_value" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "push_notifications_enabled" BOOLEAN NOT NULL DEFAULT true;
