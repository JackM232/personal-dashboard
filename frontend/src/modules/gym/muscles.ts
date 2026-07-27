import type { EquipmentType, MuscleGroup } from "../../api/gym";

// Display grouping, in anatomical order. Drives the multi-select headings and the
// order muscles appear anywhere in the module.
export interface MuscleSection {
  label: string;
  muscles: MuscleGroup[];
}

export const MUSCLE_SECTIONS: MuscleSection[] = [
  { label: "Chest", muscles: ["UPPER_CHEST", "MID_CHEST", "LOWER_CHEST"] },
  { label: "Shoulders", muscles: ["FRONT_DELT", "SIDE_DELT", "REAR_DELT"] },
  { label: "Back", muscles: ["TRAPS", "LATS", "RHOMBOIDS", "LOWER_BACK"] },
  { label: "Arms", muscles: ["BICEPS", "TRICEPS", "FOREARMS"] },
  { label: "Core", muscles: ["UPPER_ABS", "LOWER_ABS", "OBLIQUES"] },
  { label: "Legs", muscles: ["QUADS", "HAMSTRINGS", "GLUTES", "CALVES"] },
];

export const MUSCLE_GROUPS: MuscleGroup[] = MUSCLE_SECTIONS.flatMap((section) => section.muscles);

// Every muscle label in the UI comes from here — no ad-hoc underscore stripping.
export const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  UPPER_CHEST: "Upper Chest",
  MID_CHEST: "Mid Chest",
  LOWER_CHEST: "Lower Chest",
  FRONT_DELT: "Front Delt",
  SIDE_DELT: "Side Delt",
  REAR_DELT: "Rear Delt",
  LATS: "Lats",
  TRAPS: "Traps",
  RHOMBOIDS: "Rhomboids",
  LOWER_BACK: "Lower Back",
  BICEPS: "Biceps",
  TRICEPS: "Triceps",
  FOREARMS: "Forearms",
  UPPER_ABS: "Upper Abs",
  LOWER_ABS: "Lower Abs",
  OBLIQUES: "Obliques",
  QUADS: "Quads",
  HAMSTRINGS: "Hamstrings",
  GLUTES: "Glutes",
  CALVES: "Calves",
};

export const EQUIPMENT_TYPES: EquipmentType[] = [
  "BARBELL",
  "DUMBBELL",
  "MACHINE",
  "CABLE",
  "BODYWEIGHT",
  "KETTLEBELL",
  "BAND",
  "OTHER",
];

export const EQUIPMENT_LABELS: Record<EquipmentType, string> = {
  BARBELL: "Barbell",
  DUMBBELL: "Dumbbell",
  MACHINE: "Machine",
  CABLE: "Cable",
  BODYWEIGHT: "Bodyweight",
  KETTLEBELL: "Kettlebell",
  BAND: "Band",
  OTHER: "Other",
};
