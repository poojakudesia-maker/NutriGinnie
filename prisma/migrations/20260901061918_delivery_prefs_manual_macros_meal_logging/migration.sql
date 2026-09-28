-- CreateEnum
CREATE TYPE "CalorieSource" AS ENUM ('CALCULATED', 'MANUAL');

-- CreateEnum
CREATE TYPE "MealLogSlot" AS ENUM ('BREAKFAST', 'SNACK1', 'LUNCH', 'SNACK2', 'DINNER');

-- CreateEnum
CREATE TYPE "MealLogMethod" AS ENUM ('PLANNED_CONFIRM', 'PHOTO', 'CUSTOM');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "calorieSource" "CalorieSource" NOT NULL DEFAULT 'CALCULATED',
ADD COLUMN     "carbTargetG" DOUBLE PRECISION,
ADD COLUMN     "dispatchHour" INTEGER NOT NULL DEFAULT 19,
ADD COLUMN     "fatTargetG" DOUBLE PRECISION,
ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
ADD COLUMN     "whatsappRemindersEnabled" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "meal_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "forDate" TIMESTAMP(3) NOT NULL,
    "slot" "MealLogSlot" NOT NULL,
    "method" "MealLogMethod" NOT NULL,
    "description" TEXT,
    "photoDataUrl" TEXT,
    "calories" DOUBLE PRECISION NOT NULL,
    "proteinG" DOUBLE PRECISION NOT NULL,
    "carbsG" DOUBLE PRECISION NOT NULL,
    "fatG" DOUBLE PRECISION NOT NULL,
    "aiEstimated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meal_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "glp1_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "loggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nauseaLevel" INTEGER,
    "hydrationMl" INTEGER,
    "proteinCompliant" BOOLEAN,
    "notes" TEXT,

    CONSTRAINT "glp1_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "meal_logs_userId_idx" ON "meal_logs"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "meal_logs_userId_forDate_slot_key" ON "meal_logs"("userId", "forDate", "slot");

-- CreateIndex
CREATE INDEX "glp1_logs_userId_idx" ON "glp1_logs"("userId");

-- AddForeignKey
ALTER TABLE "meal_logs" ADD CONSTRAINT "meal_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "glp1_logs" ADD CONSTRAINT "glp1_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
