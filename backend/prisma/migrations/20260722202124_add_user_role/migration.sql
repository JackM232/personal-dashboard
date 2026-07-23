-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'CONTRIBUTOR', 'ADMIN');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'USER';
