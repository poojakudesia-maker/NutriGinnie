-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('LOCAL', 'GOOGLE');

-- AlterEnum
ALTER TYPE "RecipeSource" ADD VALUE 'DOCX';
ALTER TYPE "RecipeSource" ADD VALUE 'YOUTUBE';

-- AlterTable
ALTER TABLE "users"
  ALTER COLUMN "passwordHash" DROP NOT NULL,
  ALTER COLUMN "age" DROP NOT NULL,
  ALTER COLUMN "gender" DROP NOT NULL,
  ALTER COLUMN "heightCm" DROP NOT NULL,
  ALTER COLUMN "weightKg" DROP NOT NULL,
  ALTER COLUMN "targetWeightKg" DROP NOT NULL,
  ALTER COLUMN "activityLevel" DROP NOT NULL,
  ADD COLUMN "authProvider" "AuthProvider" NOT NULL DEFAULT 'LOCAL',
  ADD COLUMN "googleId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");
