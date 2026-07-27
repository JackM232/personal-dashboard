// Seeds the shared exercise catalog. Idempotent — safe to re-run after editing
// the dataset below. Run with: npx ts-node prisma/seedExercises.ts
import { prisma } from "../src/lib/prisma";
import { EquipmentType, MuscleGroup } from "../src/generated/prisma";

interface SeedExercise {
  name: string;
  equipment: EquipmentType;
  primaryMuscles: MuscleGroup[];
  secondaryMuscles: MuscleGroup[];
  isUnilateral?: boolean;
}

const EXERCISES: SeedExercise[] = [
  // Chest
  {
    name: "Barbell Bench Press",
    equipment: "BARBELL",
    primaryMuscles: ["MID_CHEST"],
    secondaryMuscles: ["FRONT_DELT", "TRICEPS"],
  },
  {
    name: "Incline Barbell Bench Press",
    equipment: "BARBELL",
    primaryMuscles: ["UPPER_CHEST"],
    secondaryMuscles: ["FRONT_DELT", "TRICEPS"],
  },
  {
    name: "Decline Barbell Bench Press",
    equipment: "BARBELL",
    primaryMuscles: ["LOWER_CHEST"],
    secondaryMuscles: ["TRICEPS", "FRONT_DELT"],
  },
  {
    name: "Dumbbell Bench Press",
    equipment: "DUMBBELL",
    primaryMuscles: ["MID_CHEST"],
    secondaryMuscles: ["FRONT_DELT", "TRICEPS"],
  },
  {
    name: "Incline Dumbbell Press",
    equipment: "DUMBBELL",
    primaryMuscles: ["UPPER_CHEST"],
    secondaryMuscles: ["FRONT_DELT", "TRICEPS"],
  },
  {
    name: "Dumbbell Fly",
    equipment: "DUMBBELL",
    primaryMuscles: ["MID_CHEST"],
    secondaryMuscles: ["FRONT_DELT"],
  },
  {
    name: "Cable Crossover",
    equipment: "CABLE",
    primaryMuscles: ["LOWER_CHEST"],
    secondaryMuscles: ["MID_CHEST", "FRONT_DELT"],
  },
  {
    name: "Push-Up",
    equipment: "BODYWEIGHT",
    primaryMuscles: ["MID_CHEST"],
    secondaryMuscles: ["FRONT_DELT", "TRICEPS", "UPPER_ABS"],
  },
  {
    name: "Chest Dip",
    equipment: "BODYWEIGHT",
    primaryMuscles: ["LOWER_CHEST"],
    secondaryMuscles: ["TRICEPS", "FRONT_DELT"],
  },

  // Shoulders
  {
    name: "Overhead Press",
    equipment: "BARBELL",
    primaryMuscles: ["FRONT_DELT"],
    secondaryMuscles: ["SIDE_DELT", "TRICEPS", "UPPER_ABS"],
  },
  {
    name: "Seated Dumbbell Shoulder Press",
    equipment: "DUMBBELL",
    primaryMuscles: ["FRONT_DELT"],
    secondaryMuscles: ["SIDE_DELT", "TRICEPS"],
  },
  {
    name: "Lateral Raise",
    equipment: "DUMBBELL",
    primaryMuscles: ["SIDE_DELT"],
    secondaryMuscles: ["TRAPS"],
  },
  {
    name: "Cable Lateral Raise",
    equipment: "CABLE",
    primaryMuscles: ["SIDE_DELT"],
    secondaryMuscles: ["TRAPS"],
  },
  {
    name: "Rear Delt Fly",
    equipment: "DUMBBELL",
    primaryMuscles: ["REAR_DELT"],
    secondaryMuscles: ["RHOMBOIDS", "TRAPS"],
  },
  {
    name: "Face Pull",
    equipment: "CABLE",
    primaryMuscles: ["REAR_DELT"],
    secondaryMuscles: ["TRAPS", "RHOMBOIDS"],
  },

  // Back
  {
    name: "Upright Row",
    equipment: "BARBELL",
    primaryMuscles: ["TRAPS"],
    secondaryMuscles: ["SIDE_DELT", "BICEPS"],
  },
  {
    name: "Barbell Shrug",
    equipment: "BARBELL",
    primaryMuscles: ["TRAPS"],
    secondaryMuscles: ["FOREARMS"],
  },
  {
    name: "Pull-Up",
    equipment: "BODYWEIGHT",
    primaryMuscles: ["LATS"],
    secondaryMuscles: ["BICEPS", "RHOMBOIDS", "FOREARMS"],
  },
  {
    name: "Chin-Up",
    equipment: "BODYWEIGHT",
    primaryMuscles: ["LATS"],
    secondaryMuscles: ["BICEPS", "FOREARMS"],
  },
  {
    name: "Lat Pulldown",
    equipment: "CABLE",
    primaryMuscles: ["LATS"],
    secondaryMuscles: ["BICEPS", "RHOMBOIDS"],
  },
  {
    name: "Barbell Row",
    equipment: "BARBELL",
    primaryMuscles: ["LATS"],
    secondaryMuscles: ["RHOMBOIDS", "REAR_DELT", "LOWER_BACK", "BICEPS"],
  },
  {
    name: "Seated Cable Row",
    equipment: "CABLE",
    primaryMuscles: ["RHOMBOIDS"],
    secondaryMuscles: ["LATS", "BICEPS", "REAR_DELT"],
  },
  {
    name: "Single-Arm Dumbbell Row",
    equipment: "DUMBBELL",
    primaryMuscles: ["LATS"],
    secondaryMuscles: ["RHOMBOIDS", "BICEPS"],
    isUnilateral: true,
  },
  {
    name: "T-Bar Row",
    equipment: "MACHINE",
    primaryMuscles: ["RHOMBOIDS"],
    secondaryMuscles: ["LATS", "REAR_DELT", "BICEPS"],
  },
  {
    name: "Deadlift",
    equipment: "BARBELL",
    primaryMuscles: ["LOWER_BACK"],
    secondaryMuscles: ["GLUTES", "HAMSTRINGS", "TRAPS", "FOREARMS", "QUADS"],
  },
  {
    name: "Romanian Deadlift",
    equipment: "BARBELL",
    primaryMuscles: ["HAMSTRINGS"],
    secondaryMuscles: ["GLUTES", "LOWER_BACK", "FOREARMS"],
  },
  {
    name: "Back Extension",
    equipment: "BODYWEIGHT",
    primaryMuscles: ["LOWER_BACK"],
    secondaryMuscles: ["GLUTES", "HAMSTRINGS"],
  },

  // Arms
  {
    name: "Barbell Curl",
    equipment: "BARBELL",
    primaryMuscles: ["BICEPS"],
    secondaryMuscles: ["FOREARMS"],
  },
  {
    name: "Dumbbell Curl",
    equipment: "DUMBBELL",
    primaryMuscles: ["BICEPS"],
    secondaryMuscles: ["FOREARMS"],
  },
  {
    name: "Hammer Curl",
    equipment: "DUMBBELL",
    primaryMuscles: ["FOREARMS"],
    secondaryMuscles: ["BICEPS"],
    isUnilateral: true, // alternating
  },
  {
    name: "Preacher Curl",
    equipment: "BARBELL",
    primaryMuscles: ["BICEPS"],
    secondaryMuscles: ["FOREARMS"],
  },
  {
    name: "Cable Tricep Pushdown",
    equipment: "CABLE",
    primaryMuscles: ["TRICEPS"],
    secondaryMuscles: [],
  },
  {
    name: "Overhead Tricep Extension",
    equipment: "DUMBBELL",
    primaryMuscles: ["TRICEPS"],
    secondaryMuscles: [],
  },
  {
    name: "Close-Grip Bench Press",
    equipment: "BARBELL",
    primaryMuscles: ["TRICEPS"],
    secondaryMuscles: ["MID_CHEST", "FRONT_DELT"],
  },
  {
    name: "Skull Crusher",
    equipment: "BARBELL",
    primaryMuscles: ["TRICEPS"],
    secondaryMuscles: [],
  },
  {
    name: "Wrist Curl",
    equipment: "DUMBBELL",
    primaryMuscles: ["FOREARMS"],
    secondaryMuscles: [],
  },

  // Legs
  {
    name: "Back Squat",
    equipment: "BARBELL",
    primaryMuscles: ["QUADS"],
    secondaryMuscles: ["GLUTES", "HAMSTRINGS", "LOWER_BACK", "UPPER_ABS"],
  },
  {
    name: "Front Squat",
    equipment: "BARBELL",
    primaryMuscles: ["QUADS"],
    secondaryMuscles: ["GLUTES", "UPPER_ABS", "LOWER_BACK"],
  },
  {
    name: "Leg Press",
    equipment: "MACHINE",
    primaryMuscles: ["QUADS"],
    secondaryMuscles: ["GLUTES", "HAMSTRINGS"],
  },
  {
    name: "Bulgarian Split Squat",
    equipment: "DUMBBELL",
    primaryMuscles: ["QUADS"],
    secondaryMuscles: ["GLUTES", "HAMSTRINGS"],
    isUnilateral: true,
  },
  {
    name: "Walking Lunge",
    equipment: "DUMBBELL",
    primaryMuscles: ["QUADS"],
    secondaryMuscles: ["GLUTES", "HAMSTRINGS", "CALVES"],
    isUnilateral: true,
  },
  {
    name: "Leg Extension",
    equipment: "MACHINE",
    primaryMuscles: ["QUADS"],
    secondaryMuscles: [],
  },
  {
    name: "Lying Leg Curl",
    equipment: "MACHINE",
    primaryMuscles: ["HAMSTRINGS"],
    secondaryMuscles: ["CALVES"],
  },
  {
    name: "Seated Leg Curl",
    equipment: "MACHINE",
    primaryMuscles: ["HAMSTRINGS"],
    secondaryMuscles: [],
  },
  {
    name: "Hip Thrust",
    equipment: "BARBELL",
    primaryMuscles: ["GLUTES"],
    secondaryMuscles: ["HAMSTRINGS"],
  },
  {
    name: "Cable Pull-Through",
    equipment: "CABLE",
    primaryMuscles: ["GLUTES"],
    secondaryMuscles: ["HAMSTRINGS", "LOWER_BACK"],
  },
  {
    name: "Standing Calf Raise",
    equipment: "MACHINE",
    primaryMuscles: ["CALVES"],
    secondaryMuscles: [],
  },
  {
    name: "Seated Calf Raise",
    equipment: "MACHINE",
    primaryMuscles: ["CALVES"],
    secondaryMuscles: [],
  },

  // Core
  {
    name: "Hanging Leg Raise",
    equipment: "BODYWEIGHT",
    primaryMuscles: ["LOWER_ABS"],
    secondaryMuscles: ["UPPER_ABS", "OBLIQUES", "FOREARMS"],
  },
  {
    name: "Cable Crunch",
    equipment: "CABLE",
    primaryMuscles: ["UPPER_ABS"],
    secondaryMuscles: ["OBLIQUES"],
  },
  {
    name: "Plank",
    equipment: "BODYWEIGHT",
    primaryMuscles: ["UPPER_ABS"],
    secondaryMuscles: ["LOWER_ABS", "OBLIQUES"],
  },
  {
    name: "Russian Twist",
    equipment: "BODYWEIGHT",
    primaryMuscles: ["OBLIQUES"],
    secondaryMuscles: ["UPPER_ABS"],
  },
  {
    name: "Farmer's Carry",
    equipment: "DUMBBELL",
    primaryMuscles: ["FOREARMS"],
    secondaryMuscles: ["TRAPS", "OBLIQUES"],
  },
];

// A MuscleGroup with no exercise tagging it as primary is a permanently grey
// region on the muscle map, so this is a hard failure, not a warning.
function assertFullPrimaryCoverage() {
  const covered = new Set<string>(EXERCISES.flatMap((exercise) => exercise.primaryMuscles));
  const uncovered = Object.values(MuscleGroup).filter((group) => !covered.has(group));

  if (uncovered.length > 0) {
    throw new Error(
      `Seed data leaves these muscle groups without a primary exercise: ${uncovered.join(", ")}`,
    );
  }
}

async function main() {
  assertFullPrimaryCoverage();

  for (const exercise of EXERCISES) {
    const data = {
      equipment: exercise.equipment,
      primaryMuscles: exercise.primaryMuscles,
      secondaryMuscles: exercise.secondaryMuscles,
      isUnilateral: exercise.isUnilateral ?? false,
    };

    await prisma.exercise.upsert({
      where: { name: exercise.name },
      update: data,
      create: { name: exercise.name, ...data },
    });
  }

  console.log(`Seeded ${EXERCISES.length} exercises; all ${Object.values(MuscleGroup).length} muscle groups covered.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
