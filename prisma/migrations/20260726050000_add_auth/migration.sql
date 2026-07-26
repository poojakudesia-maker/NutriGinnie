-- AlterTable
ALTER TABLE "users" ADD COLUMN "email" TEXT NOT NULL,
ADD COLUMN "passwordHash" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
