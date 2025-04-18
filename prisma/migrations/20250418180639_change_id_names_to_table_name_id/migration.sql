/*
  Warnings:

  - The primary key for the `PayPeriod` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `PayPeriod` table. All the data in the column will be lost.
  - The primary key for the `Session` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Session` table. All the data in the column will be lost.
  - The primary key for the `TimeEntry` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `duration` on the `TimeEntry` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `TimeEntry` table. All the data in the column will be lost.
  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[payPeriodId]` on the table `PayPeriod` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sessionId]` on the table `Session` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[timeEntryId]` on the table `TimeEntry` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - The required column `payPeriodId` was added to the `PayPeriod` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `sessionId` was added to the `Session` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `timeEntryId` was added to the `TimeEntry` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `userId` was added to the `User` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- DropForeignKey
ALTER TABLE "PayPeriod" DROP CONSTRAINT "PayPeriod_userId_fkey";

-- DropForeignKey
ALTER TABLE "Session" DROP CONSTRAINT "Session_userId_fkey";

-- DropForeignKey
ALTER TABLE "TimeEntry" DROP CONSTRAINT "TimeEntry_payPeriodId_fkey";

-- DropForeignKey
ALTER TABLE "TimeEntry" DROP CONSTRAINT "TimeEntry_userId_fkey";

-- AlterTable
ALTER TABLE "PayPeriod" DROP CONSTRAINT "PayPeriod_pkey",
DROP COLUMN "id",
ADD COLUMN     "payPeriodId" TEXT NOT NULL,
ADD CONSTRAINT "PayPeriod_pkey" PRIMARY KEY ("payPeriodId");

-- AlterTable
ALTER TABLE "Session" DROP CONSTRAINT "Session_pkey",
DROP COLUMN "id",
ADD COLUMN     "sessionId" TEXT NOT NULL,
ADD CONSTRAINT "Session_pkey" PRIMARY KEY ("sessionId");

-- AlterTable
ALTER TABLE "TimeEntry" DROP CONSTRAINT "TimeEntry_pkey",
DROP COLUMN "duration",
DROP COLUMN "id",
ADD COLUMN     "minutesWorked" INTEGER,
ADD COLUMN     "timeEntryId" TEXT NOT NULL,
ADD CONSTRAINT "TimeEntry_pkey" PRIMARY KEY ("timeEntryId");

-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT "User_pkey",
DROP COLUMN "id",
ADD COLUMN     "userId" TEXT NOT NULL,
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PayPeriod_payPeriodId_key" ON "PayPeriod"("payPeriodId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionId_key" ON "Session"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "TimeEntry_timeEntryId_key" ON "TimeEntry"("timeEntryId");

-- CreateIndex
CREATE UNIQUE INDEX "User_userId_key" ON "User"("userId");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_payPeriodId_fkey" FOREIGN KEY ("payPeriodId") REFERENCES "PayPeriod"("payPeriodId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayPeriod" ADD CONSTRAINT "PayPeriod_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
