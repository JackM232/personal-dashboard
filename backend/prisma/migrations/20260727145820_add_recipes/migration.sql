-- CreateEnum
CREATE TYPE "MealType" AS ENUM ('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK', 'DESSERT', 'SIDE', 'DRINK');

-- CreateEnum
CREATE TYPE "Cuisine" AS ENUM ('AMERICAN', 'ITALIAN', 'MEXICAN', 'CHINESE', 'JAPANESE', 'KOREAN', 'INDIAN', 'THAI', 'MEDITERRANEAN', 'FRENCH', 'MIDDLE_EASTERN', 'OTHER');

-- CreateEnum
CREATE TYPE "RecipeDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "RecipeTag" AS ENUM ('HIGH_PROTEIN', 'LOW_CARB', 'HIGH_CARB', 'HIGH_FIBER', 'LOW_CALORIE', 'VEGETARIAN', 'VEGAN', 'GLUTEN_FREE', 'DAIRY_FREE', 'MEAL_PREP', 'ONE_POT', 'QUICK', 'BUDGET', 'SPICY');

-- CreateEnum
CREATE TYPE "MeasurementUnit" AS ENUM ('G', 'KG', 'ML', 'L', 'TSP', 'TBSP', 'CUP', 'OZ', 'LB', 'PIECE', 'CLOVE', 'SLICE', 'PINCH', 'CAN', 'BUNCH', 'TO_TASTE');

-- CreateTable
CREATE TABLE "recipes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "mealType" "MealType" NOT NULL,
    "cuisine" "Cuisine" NOT NULL DEFAULT 'OTHER',
    "difficulty" "RecipeDifficulty" NOT NULL DEFAULT 'EASY',
    "prepMinutes" INTEGER NOT NULL DEFAULT 0,
    "cookMinutes" INTEGER NOT NULL DEFAULT 0,
    "servings" INTEGER NOT NULL DEFAULT 2,
    "calories" INTEGER,
    "proteinGrams" INTEGER,
    "carbGrams" INTEGER,
    "fatGrams" INTEGER,
    "tags" "RecipeTag"[],
    "sourceUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recipes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_ingredients" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "quantity" DOUBLE PRECISION,
    "unit" "MeasurementUnit",
    "name" TEXT NOT NULL,
    "note" TEXT,

    CONSTRAINT "recipe_ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_steps" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "instruction" TEXT NOT NULL,
    "minutes" INTEGER,

    CONSTRAINT "recipe_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cook_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "cookedAt" TIMESTAMP(3) NOT NULL,
    "rating" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cook_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_favorites" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recipe_favorites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "recipes_name_key" ON "recipes"("name");

-- CreateIndex
CREATE UNIQUE INDEX "recipe_ingredients_recipeId_position_key" ON "recipe_ingredients"("recipeId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "recipe_steps_recipeId_position_key" ON "recipe_steps"("recipeId", "position");

-- CreateIndex
CREATE INDEX "cook_logs_userId_cookedAt_idx" ON "cook_logs"("userId", "cookedAt");

-- CreateIndex
CREATE INDEX "cook_logs_recipeId_idx" ON "cook_logs"("recipeId");

-- CreateIndex
CREATE UNIQUE INDEX "recipe_favorites_userId_recipeId_key" ON "recipe_favorites"("userId", "recipeId");

-- AddForeignKey
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_steps" ADD CONSTRAINT "recipe_steps_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cook_logs" ADD CONSTRAINT "cook_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cook_logs" ADD CONSTRAINT "cook_logs_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "recipes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_favorites" ADD CONSTRAINT "recipe_favorites_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_favorites" ADD CONSTRAINT "recipe_favorites_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
