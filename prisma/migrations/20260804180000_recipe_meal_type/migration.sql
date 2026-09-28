-- DropEnum (unused)
DROP TYPE "MealSlot";

-- CreateEnum
CREATE TYPE "RecipeMealType" AS ENUM ('BREAKFAST', 'SNACK', 'LUNCH', 'DINNER');

-- AlterTable
ALTER TABLE "recipes" ADD COLUMN "mealType" "RecipeMealType";
