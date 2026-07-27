// The gym module's handlers split by resource; router.ts imports them all from
// here as one `controller` namespace.
export * from "./catalog.controller";
export * from "./workouts.controller";
export * from "./bodyweight.controller";
export * from "./progression.controller";
export * from "./muscleVolume.controller";
