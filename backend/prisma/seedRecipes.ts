// Seeds the shared recipe catalog. Idempotent — safe to re-run after editing
// the dataset below. Run with: npx ts-node prisma/seedRecipes.ts
import { prisma } from "../src/lib/prisma";
import {
  Cuisine,
  MealType,
  MeasurementUnit,
  RecipeDifficulty,
  RecipeTag,
} from "../src/generated/prisma";

interface SeedIngredient {
  quantity?: number;
  unit?: MeasurementUnit;
  name: string;
  note?: string;
}

interface SeedStep {
  instruction: string;
  minutes?: number;
}

interface SeedRecipe {
  name: string;
  description: string;
  mealType: MealType;
  cuisine: Cuisine;
  difficulty: RecipeDifficulty;
  prepMinutes: number;
  cookMinutes: number;
  servings: number;
  calories?: number;
  proteinGrams?: number;
  carbGrams?: number;
  fatGrams?: number;
  tags: RecipeTag[];
  sourceUrl?: string;
  ingredients: SeedIngredient[];
  steps: SeedStep[];
}

const RECIPES: SeedRecipe[] = [
  {
    name: "Greek Yogurt Protein Pancakes",
    description: "Fluffy oat pancakes that land near 30g of protein without protein powder.",
    mealType: "BREAKFAST",
    cuisine: "AMERICAN",
    difficulty: "EASY",
    prepMinutes: 5,
    cookMinutes: 10,
    servings: 2,
    calories: 410,
    proteinGrams: 31,
    carbGrams: 44,
    fatGrams: 11,
    tags: ["HIGH_PROTEIN", "VEGETARIAN", "QUICK"],
    ingredients: [
      { quantity: 1, unit: "CUP", name: "rolled oats" },
      { quantity: 200, unit: "G", name: "Greek yogurt", note: "0% or 2%" },
      { quantity: 2, unit: "PIECE", name: "eggs" },
      { quantity: 1, unit: "TSP", name: "baking powder" },
      { quantity: 1, unit: "TBSP", name: "maple syrup" },
      { unit: "PINCH", name: "salt" },
      { quantity: 1, unit: "TSP", name: "butter", note: "for the pan" },
    ],
    steps: [
      { instruction: "Blitz the oats in a blender until they look like coarse flour.", minutes: 1 },
      { instruction: "Add the yogurt, eggs, baking powder, maple syrup and salt. Blend until smooth, then let the batter rest so the oats hydrate.", minutes: 5 },
      { instruction: "Melt the butter in a non-stick pan over medium-low heat. Too hot and the outsides brown before the middles set.", minutes: 2 },
      { instruction: "Pour 3-inch rounds. Cook until bubbles hold their shape on the surface, then flip.", minutes: 3 },
      { instruction: "Cook the second side until golden and springy in the centre. Serve straight away.", minutes: 2 },
    ],
  },
  {
    name: "Sheet Pan Chicken Fajitas",
    description: "Everything roasts on one tray — the weeknight answer to wanting Mexican food.",
    mealType: "DINNER",
    cuisine: "MEXICAN",
    difficulty: "EASY",
    prepMinutes: 15,
    cookMinutes: 25,
    servings: 4,
    calories: 480,
    proteinGrams: 42,
    carbGrams: 34,
    fatGrams: 18,
    tags: ["HIGH_PROTEIN", "ONE_POT", "MEAL_PREP", "GLUTEN_FREE"],
    ingredients: [
      { quantity: 700, unit: "G", name: "chicken thighs", note: "boneless, sliced into strips" },
      { quantity: 3, unit: "PIECE", name: "bell peppers", note: "mixed colours, sliced" },
      { quantity: 1, unit: "PIECE", name: "red onion", note: "sliced thick" },
      { quantity: 2, unit: "TBSP", name: "olive oil" },
      { quantity: 1, unit: "TBSP", name: "chili powder" },
      { quantity: 2, unit: "TSP", name: "ground cumin" },
      { quantity: 1, unit: "TSP", name: "smoked paprika" },
      { quantity: 1, unit: "PIECE", name: "lime", note: "juiced" },
      { quantity: 8, unit: "PIECE", name: "corn tortillas", note: "to serve" },
      { unit: "TO_TASTE", name: "salt and black pepper" },
    ],
    steps: [
      { instruction: "Heat the oven to 220°C / 425°F and slide the empty sheet pan in — a hot pan sears rather than steams.", minutes: 10 },
      { instruction: "Toss the chicken, peppers and onion with the oil and all the spices until everything is evenly coated." },
      { instruction: "Spread across the hot pan in a single layer. Crowding is the difference between roasted and boiled.", minutes: 2 },
      { instruction: "Roast until the chicken is cooked through and the pepper edges have charred.", minutes: 22 },
      { instruction: "Squeeze the lime over the whole tray, scrape up the browned bits, and pile into warm tortillas.", minutes: 3 },
    ],
  },
  {
    name: "Cacio e Pepe",
    description: "Four ingredients and nowhere to hide. The technique is the recipe.",
    mealType: "DINNER",
    cuisine: "ITALIAN",
    difficulty: "HARD",
    prepMinutes: 5,
    cookMinutes: 15,
    servings: 2,
    calories: 620,
    proteinGrams: 24,
    carbGrams: 78,
    fatGrams: 22,
    tags: ["VEGETARIAN", "HIGH_CARB", "BUDGET"],
    ingredients: [
      { quantity: 200, unit: "G", name: "tonnarelli or spaghetti" },
      { quantity: 120, unit: "G", name: "Pecorino Romano", note: "finely grated, at room temperature" },
      { quantity: 2, unit: "TSP", name: "black peppercorns", note: "coarsely cracked" },
      { unit: "TO_TASTE", name: "salt", note: "for the pasta water" },
    ],
    steps: [
      { instruction: "Boil the pasta in less water than usual and salt it lightly — you want starchy water, and the pecorino brings plenty of salt.", minutes: 9 },
      { instruction: "Toast the cracked pepper in a dry pan until fragrant, then kill the heat.", minutes: 2 },
      { instruction: "Whisk the pecorino with a few tablespoons of warm (not boiling) pasta water into a smooth paste. Boiling water is what makes it clump.", minutes: 3 },
      { instruction: "Drain the pasta, reserving a mug of water. Add the pasta to the pepper pan off the heat." },
      { instruction: "Add the cheese paste and toss hard, loosening with splashes of pasta water until it turns glossy and coats every strand.", minutes: 2 },
    ],
  },
  {
    name: "Miso Glazed Salmon",
    description: "A 3-ingredient glaze that caramelises under the broiler in minutes.",
    mealType: "DINNER",
    cuisine: "JAPANESE",
    difficulty: "EASY",
    prepMinutes: 10,
    cookMinutes: 12,
    servings: 2,
    calories: 450,
    proteinGrams: 38,
    carbGrams: 12,
    fatGrams: 26,
    tags: ["HIGH_PROTEIN", "LOW_CARB", "DAIRY_FREE", "QUICK"],
    ingredients: [
      { quantity: 2, unit: "PIECE", name: "salmon fillets", note: "skin on, about 170g each" },
      { quantity: 2, unit: "TBSP", name: "white miso paste" },
      { quantity: 1, unit: "TBSP", name: "mirin" },
      { quantity: 1, unit: "TBSP", name: "soy sauce" },
      { quantity: 1, unit: "TSP", name: "toasted sesame oil" },
      { quantity: 2, unit: "PIECE", name: "spring onions", note: "sliced, to finish" },
    ],
    steps: [
      { instruction: "Whisk the miso, mirin, soy and sesame oil into a loose glaze." },
      { instruction: "Pat the salmon dry and coat the flesh side. Leave it to sit while the broiler heats.", minutes: 10 },
      { instruction: "Broil 15cm from the element until the glaze blisters and darkens in patches.", minutes: 8 },
      { instruction: "Rest for two minutes — the centre carries on cooking — then scatter with spring onion.", minutes: 2 },
    ],
  },
  {
    name: "Red Lentil Dal",
    description: "Cheap, freezer-friendly, and quietly one of the highest-fibre things you can make.",
    mealType: "DINNER",
    cuisine: "INDIAN",
    difficulty: "EASY",
    prepMinutes: 10,
    cookMinutes: 30,
    servings: 4,
    calories: 340,
    proteinGrams: 18,
    carbGrams: 48,
    fatGrams: 8,
    tags: ["VEGAN", "VEGETARIAN", "HIGH_FIBER", "BUDGET", "MEAL_PREP", "ONE_POT"],
    ingredients: [
      { quantity: 250, unit: "G", name: "red lentils", note: "rinsed until the water runs clear" },
      { quantity: 1, unit: "PIECE", name: "onion", note: "finely diced" },
      { quantity: 4, unit: "CLOVE", name: "garlic", note: "minced" },
      { quantity: 1, unit: "TBSP", name: "fresh ginger", note: "grated" },
      { quantity: 1, unit: "CAN", name: "chopped tomatoes", note: "400g" },
      { quantity: 2, unit: "TSP", name: "ground cumin" },
      { quantity: 1, unit: "TSP", name: "ground turmeric" },
      { quantity: 1, unit: "TSP", name: "garam masala" },
      { quantity: 800, unit: "ML", name: "vegetable stock" },
      { quantity: 2, unit: "TBSP", name: "coconut oil" },
      { unit: "TO_TASTE", name: "salt" },
    ],
    steps: [
      { instruction: "Soften the onion in the coconut oil over medium heat until translucent and sweet.", minutes: 8 },
      { instruction: "Add the garlic, ginger and dry spices. Fry until they smell toasted — about a minute, and don't let the garlic catch.", minutes: 1 },
      { instruction: "Stir in the tomatoes and cook down until the mixture darkens and pulls away from the pan.", minutes: 5 },
      { instruction: "Add the lentils and stock. Simmer uncovered, stirring occasionally so nothing sticks, until the lentils collapse.", minutes: 22 },
      { instruction: "Season with salt at the end — salting early keeps lentils firm. Loosen with water if it has gone past soup." },
    ],
  },
  {
    name: "Overnight Oats with Berries",
    description: "Assembled in three minutes tonight, breakfast for the next four days.",
    mealType: "BREAKFAST",
    cuisine: "AMERICAN",
    difficulty: "EASY",
    prepMinutes: 5,
    cookMinutes: 0,
    servings: 1,
    calories: 380,
    proteinGrams: 20,
    carbGrams: 52,
    fatGrams: 10,
    tags: ["MEAL_PREP", "HIGH_FIBER", "VEGETARIAN", "QUICK", "BUDGET"],
    ingredients: [
      { quantity: 50, unit: "G", name: "rolled oats" },
      { quantity: 150, unit: "ML", name: "milk", note: "dairy or oat" },
      { quantity: 100, unit: "G", name: "Greek yogurt" },
      { quantity: 1, unit: "TBSP", name: "chia seeds" },
      { quantity: 1, unit: "TSP", name: "honey" },
      { quantity: 80, unit: "G", name: "mixed berries", note: "frozen is fine" },
    ],
    steps: [
      { instruction: "Stir the oats, milk, yogurt, chia and honey together in a jar until there are no dry pockets.", minutes: 3 },
      { instruction: "Top with the berries, lid on, and refrigerate overnight — at least 6 hours for the chia to gel." },
      { instruction: "Stir before eating and loosen with a splash of milk if it has set too thick." },
    ],
  },
  {
    name: "Smashed Chickpea Salad Sandwich",
    description: "The texture of a tuna salad sandwich, built from a tin of chickpeas.",
    mealType: "LUNCH",
    cuisine: "MEDITERRANEAN",
    difficulty: "EASY",
    prepMinutes: 12,
    cookMinutes: 0,
    servings: 2,
    calories: 420,
    proteinGrams: 17,
    carbGrams: 56,
    fatGrams: 14,
    tags: ["VEGETARIAN", "HIGH_FIBER", "QUICK", "BUDGET"],
    ingredients: [
      { quantity: 1, unit: "CAN", name: "chickpeas", note: "400g, drained and rinsed" },
      { quantity: 3, unit: "TBSP", name: "mayonnaise", note: "or tahini" },
      { quantity: 1, unit: "TBSP", name: "Dijon mustard" },
      { quantity: 2, unit: "PIECE", name: "celery stalks", note: "finely diced" },
      { quantity: 2, unit: "TBSP", name: "red onion", note: "minced" },
      { quantity: 1, unit: "TBSP", name: "lemon juice" },
      { quantity: 4, unit: "SLICE", name: "sourdough bread" },
      { unit: "TO_TASTE", name: "salt and black pepper" },
    ],
    steps: [
      { instruction: "Smash the chickpeas with a fork or potato masher, leaving plenty of half-broken ones for texture.", minutes: 4 },
      { instruction: "Fold in the mayo, mustard, celery, onion and lemon juice. Season hard — chickpeas soak up salt." },
      { instruction: "Taste and adjust; it should be bright and a little sharp, not just creamy." },
      { instruction: "Pile onto toasted sourdough and press the top slice down firmly." },
    ],
  },
  {
    name: "Korean Gochujang Beef Bowl",
    description: "Sticky, spicy minced beef over rice — faster than ordering it.",
    mealType: "DINNER",
    cuisine: "KOREAN",
    difficulty: "MEDIUM",
    prepMinutes: 10,
    cookMinutes: 15,
    servings: 3,
    calories: 560,
    proteinGrams: 34,
    carbGrams: 58,
    fatGrams: 20,
    tags: ["HIGH_PROTEIN", "SPICY", "QUICK", "DAIRY_FREE"],
    ingredients: [
      { quantity: 500, unit: "G", name: "ground beef", note: "15% fat" },
      { quantity: 2, unit: "TBSP", name: "gochujang" },
      { quantity: 2, unit: "TBSP", name: "soy sauce" },
      { quantity: 1, unit: "TBSP", name: "brown sugar" },
      { quantity: 1, unit: "TBSP", name: "rice vinegar" },
      { quantity: 3, unit: "CLOVE", name: "garlic", note: "minced" },
      { quantity: 1, unit: "TBSP", name: "sesame oil" },
      { quantity: 300, unit: "G", name: "short grain rice", note: "cooked" },
      { quantity: 1, unit: "PIECE", name: "cucumber", note: "sliced, to serve" },
      { quantity: 3, unit: "PIECE", name: "eggs", note: "fried, to serve" },
    ],
    steps: [
      { instruction: "Whisk the gochujang, soy, sugar and vinegar into a sauce so it goes in all at once later." },
      { instruction: "Brown the beef hard in a dry, very hot pan without stirring for the first minute — that crust is most of the flavour.", minutes: 7 },
      { instruction: "Drain off excess fat, then add the garlic and cook for 30 seconds.", minutes: 1 },
      { instruction: "Pour in the sauce and simmer until it thickens and glazes the beef.", minutes: 4 },
      { instruction: "Finish with sesame oil off the heat. Serve over rice with cucumber and a fried egg.", minutes: 3 },
    ],
  },
  {
    name: "Dark Chocolate Olive Oil Mousse",
    description: "No cream, no eggs raw enough to worry about — just good chocolate and technique.",
    mealType: "DESSERT",
    cuisine: "FRENCH",
    difficulty: "MEDIUM",
    prepMinutes: 20,
    cookMinutes: 10,
    servings: 4,
    calories: 320,
    proteinGrams: 5,
    carbGrams: 26,
    fatGrams: 22,
    tags: ["VEGETARIAN", "GLUTEN_FREE", "DAIRY_FREE"],
    ingredients: [
      { quantity: 200, unit: "G", name: "dark chocolate", note: "70%, chopped" },
      { quantity: 60, unit: "ML", name: "extra virgin olive oil", note: "a fruity one" },
      { quantity: 180, unit: "ML", name: "water" },
      { quantity: 2, unit: "TBSP", name: "sugar" },
      { unit: "PINCH", name: "flaky sea salt", note: "to finish" },
    ],
    steps: [
      { instruction: "Melt the chocolate with the water and sugar over a low bain-marie, stirring until completely smooth.", minutes: 6 },
      { instruction: "Whisk in the olive oil a little at a time so it emulsifies rather than splits.", minutes: 2 },
      { instruction: "Set the bowl over ice water and whisk continuously. The mixture will thicken suddenly — stop the moment it holds soft peaks.", minutes: 5 },
      { instruction: "If it seizes or goes grainy, warm it back to liquid and whisk over ice again. It forgives you." },
      { instruction: "Spoon into glasses and chill. Finish with flaky salt just before serving.", minutes: 2 },
    ],
  },
  {
    name: "Thai Green Curry with Vegetables",
    description: "Blooming the paste in coconut cream first is what separates this from a soup.",
    mealType: "DINNER",
    cuisine: "THAI",
    difficulty: "MEDIUM",
    prepMinutes: 15,
    cookMinutes: 25,
    servings: 4,
    calories: 430,
    proteinGrams: 12,
    carbGrams: 38,
    fatGrams: 27,
    tags: ["VEGETARIAN", "SPICY", "GLUTEN_FREE", "ONE_POT"],
    ingredients: [
      { quantity: 3, unit: "TBSP", name: "green curry paste" },
      { quantity: 2, unit: "CAN", name: "coconut milk", note: "400ml each, not shaken" },
      { quantity: 200, unit: "G", name: "firm tofu", note: "cubed and patted dry" },
      { quantity: 1, unit: "PIECE", name: "aubergine", note: "cubed" },
      { quantity: 150, unit: "G", name: "green beans", note: "trimmed" },
      { quantity: 1, unit: "PIECE", name: "red bell pepper", note: "sliced" },
      { quantity: 2, unit: "TBSP", name: "soy sauce" },
      { quantity: 1, unit: "TSP", name: "brown sugar" },
      { quantity: 1, unit: "BUNCH", name: "Thai basil" },
      { quantity: 1, unit: "PIECE", name: "lime", note: "to serve" },
    ],
    steps: [
      { instruction: "Open the coconut milk without shaking and spoon the thick cream off the top into a hot pan." },
      { instruction: "Fry the curry paste in that cream until the oil separates out and the paste smells fragrant. This step is the whole dish.", minutes: 5 },
      { instruction: "Add the remaining coconut milk, soy sauce and sugar, then bring to a gentle simmer.", minutes: 3 },
      { instruction: "Add the aubergine first and cook until it starts to soften, then the beans, pepper and tofu.", minutes: 14 },
      { instruction: "Kill the heat, stir through the Thai basil so it wilts but stays green, and serve with lime.", minutes: 2 },
    ],
  },
];

async function main() {
  for (const recipe of RECIPES) {
    const { name, ingredients, steps, ...fields } = recipe;

    // Ingredients and steps are replaced wholesale rather than upserted —
    // positions are derived from array order, so a partial update would leave
    // stale rows behind.
    const nested = {
      ingredients: {
        create: ingredients.map((ingredient, position) => ({ position, ...ingredient })),
      },
      steps: {
        create: steps.map((step, position) => ({ position, ...step })),
      },
    };

    const existing = await prisma.recipe.findUnique({ where: { name }, select: { id: true } });
    if (existing) {
      await prisma.$transaction([
        prisma.recipeIngredient.deleteMany({ where: { recipeId: existing.id } }),
        prisma.recipeStep.deleteMany({ where: { recipeId: existing.id } }),
        prisma.recipe.update({ where: { id: existing.id }, data: { ...fields, ...nested } }),
      ]);
    }
    else {
      await prisma.recipe.create({ data: { name, ...fields, ...nested } });
    }
  }

  console.log(`Seeded ${RECIPES.length} recipes.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
