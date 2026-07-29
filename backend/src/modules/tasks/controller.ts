// Barrel so router.ts can keep importing a single `controller` namespace while
// the handlers stay split by resource.
export * from "./tasks.controller";
export * from "./taskLists.controller";
