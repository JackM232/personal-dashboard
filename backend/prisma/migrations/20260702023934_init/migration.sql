-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('UNATTEMPTED', 'STARTED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "TopicTag" AS ENUM ('ARRAY', 'STRING', 'LINKED_LIST', 'STACK', 'QUEUE', 'HASH_MAP', 'TWO_POINTERS', 'SLIDING_WINDOW', 'BINARY_SEARCH', 'TREE', 'TRIE', 'HEAP', 'GRAPH', 'BACKTRACKING', 'DYNAMIC_PROGRAMMING', 'GREEDY', 'INTERVALS', 'MATRIX', 'BIT_MANIPULATION', 'MATH');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leetcode_problems" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "difficulty" "Difficulty" NOT NULL,
    "topicTag" "TopicTag" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leetcode_problems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leetcode_entries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'UNATTEMPTED',
    "hintsUsed" INTEGER NOT NULL DEFAULT 0,
    "videoWatched" BOOLEAN NOT NULL DEFAULT false,
    "timeTaken" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leetcode_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "leetcode_problems_name_key" ON "leetcode_problems"("name");

-- CreateIndex
CREATE UNIQUE INDEX "leetcode_entries_userId_problemId_key" ON "leetcode_entries"("userId", "problemId");

-- AddForeignKey
ALTER TABLE "leetcode_entries" ADD CONSTRAINT "leetcode_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leetcode_entries" ADD CONSTRAINT "leetcode_entries_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "leetcode_problems"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
