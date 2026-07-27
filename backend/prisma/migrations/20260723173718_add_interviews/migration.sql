-- CreateEnum
CREATE TYPE "InterviewStage" AS ENUM ('PHONE_SCREEN', 'ONLINE_ASSESSMENT', 'TECHNICAL', 'BEHAVIORAL', 'SYSTEM_DESIGN', 'ONSITE', 'FINAL');

-- CreateEnum
CREATE TYPE "InterviewFormat" AS ENUM ('PHONE', 'VIDEO', 'ONSITE');

-- CreateTable
CREATE TABLE "interviews" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "stage" "InterviewStage" NOT NULL DEFAULT 'PHONE_SCREEN',
    "format" "InterviewFormat",
    "interviewer" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "interviews_applicationId_idx" ON "interviews"("applicationId");

-- AddForeignKey
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "internship_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
