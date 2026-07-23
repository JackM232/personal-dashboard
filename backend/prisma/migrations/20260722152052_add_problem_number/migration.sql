-- AlterTable: add `number` as nullable first, backfill, then enforce NOT NULL + UNIQUE
ALTER TABLE "leetcode_problems" ADD COLUMN "number" INTEGER;

-- Backfill known existing rows (Two Sum -> LeetCode #1)
UPDATE "leetcode_problems" SET "number" = 1 WHERE "name" = 'Two Sum' AND "number" IS NULL;

ALTER TABLE "leetcode_problems" ALTER COLUMN "number" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "leetcode_problems_number_key" ON "leetcode_problems"("number");
