-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "ActivityLevel" AS ENUM ('SEDENTARY', 'LIGHT', 'MODERATE', 'HIGH');

-- CreateEnum
CREATE TYPE "DietType" AS ENUM ('VEG', 'EGGETARIAN', 'NON_VEG');

-- CreateEnum
CREATE TYPE "RecipeSource" AS ENUM ('PDF', 'INSTAGRAM', 'MANUAL_TEXT', 'AI_GENERATED');

-- CreateEnum
CREATE TYPE "MealSlot" AS ENUM ('BREAKFAST', 'SNACK_1', 'LUNCH', 'SNACK_2', 'DINNER');

-- CreateEnum
CREATE TYPE "WhatsAppMessageType" AS ENUM ('DIET_TEXT', 'DIET_VOICE', 'GROCERY_TEXT');

-- CreateEnum
CREATE TYPE "WhatsAppStatus" AS ENUM ('QUEUED', 'SENT', 'DELIVERED', 'READ', 'FAILED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "gender" "Gender" NOT NULL,
    "heightCm" DOUBLE PRECISION NOT NULL,
    "weightKg" DOUBLE PRECISION NOT NULL,
    "targetWeightKg" DOUBLE PRECISION NOT NULL,
    "activityLevel" "ActivityLevel" NOT NULL,
    "medicalConditions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isGlp1" BOOLEAN NOT NULL DEFAULT false,
    "glp1Medication" TEXT,
    "glp1DosageMg" DOUBLE PRECISION,
    "dietType" "DietType" NOT NULL DEFAULT 'VEG',
    "allergies" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "cuisinePreference" TEXT[] DEFAULT ARRAY['Indian']::TEXT[],
    "whatsappNumbers" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "bmi" DOUBLE PRECISION,
    "bmr" DOUBLE PRECISION,
    "tdee" DOUBLE PRECISION,
    "calorieTarget" DOUBLE PRECISION,
    "proteinTargetG" DOUBLE PRECISION,
    "deficitKcal" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "source" "RecipeSource" NOT NULL,
    "sourceUrl" TEXT,
    "rawInput" TEXT,
    "ingredients" JSONB NOT NULL,
    "instructions" TEXT,
    "calories" DOUBLE PRECISION,
    "proteinG" DOUBLE PRECISION,
    "carbsG" DOUBLE PRECISION,
    "fatG" DOUBLE PRECISION,
    "fiberG" DOUBLE PRECISION,
    "ironMg" DOUBLE PRECISION,
    "calciumMg" DOUBLE PRECISION,
    "micros" JSONB,
    "aiEstimated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recipes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meal_plans" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weekStartDate" TIMESTAMP(3) NOT NULL,
    "dayIndex" INTEGER NOT NULL,
    "dayLabel" TEXT NOT NULL,
    "meals" JSONB NOT NULL,
    "totalCalories" DOUBLE PRECISION NOT NULL,
    "totalProteinG" DOUBLE PRECISION NOT NULL,
    "totalCarbsG" DOUBLE PRECISION NOT NULL,
    "totalFatG" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meal_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "groceries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "forDate" TIMESTAMP(3) NOT NULL,
    "items" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "groceries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "messageType" "WhatsAppMessageType" NOT NULL,
    "status" "WhatsAppStatus" NOT NULL DEFAULT 'QUEUED',
    "providerMessageId" TEXT,
    "errorMessage" TEXT,
    "payloadPreview" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weight_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weightKg" DOUBLE PRECISION NOT NULL,
    "loggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "weight_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "water_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amountMl" INTEGER NOT NULL,
    "loggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "water_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "recipes_userId_idx" ON "recipes"("userId");

-- CreateIndex
CREATE INDEX "meal_plans_userId_idx" ON "meal_plans"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "meal_plans_userId_weekStartDate_dayIndex_key" ON "meal_plans"("userId", "weekStartDate", "dayIndex");

-- CreateIndex
CREATE INDEX "groceries_userId_idx" ON "groceries"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "groceries_userId_forDate_key" ON "groceries"("userId", "forDate");

-- CreateIndex
CREATE INDEX "whatsapp_logs_userId_idx" ON "whatsapp_logs"("userId");

-- CreateIndex
CREATE INDEX "weight_logs_userId_idx" ON "weight_logs"("userId");

-- CreateIndex
CREATE INDEX "water_logs_userId_idx" ON "water_logs"("userId");

-- AddForeignKey
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_plans" ADD CONSTRAINT "meal_plans_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groceries" ADD CONSTRAINT "groceries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_logs" ADD CONSTRAINT "whatsapp_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weight_logs" ADD CONSTRAINT "weight_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "water_logs" ADD CONSTRAINT "water_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
