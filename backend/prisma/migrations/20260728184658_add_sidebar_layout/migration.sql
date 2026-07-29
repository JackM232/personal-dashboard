-- CreateTable
CREATE TABLE "sidebar_layouts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "order" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sidebar_layouts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sidebar_layouts_userId_key" ON "sidebar_layouts"("userId");

-- AddForeignKey
ALTER TABLE "sidebar_layouts" ADD CONSTRAINT "sidebar_layouts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
