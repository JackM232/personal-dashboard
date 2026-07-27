import { BODY_VIEW_BOX, BodyInert, MuscleRegion } from "./bodyParts";
import type { BodyViewProps } from "./bodyParts";

// Posterior view — 11 of the 20 groups. Same viewBox and same inert skeleton as
// the front, so the two faces register exactly when the figure spins.
export function BodyBack({ fillFor, handlers }: BodyViewProps) {
  const view = { fillFor, handlers };

  return (
    <svg viewBox={BODY_VIEW_BOX} className="body-svg" role="img" aria-label="Back view">
      <BodyInert />

      <MuscleRegion {...view} muscle="TRAPS" d="M 105 80 L 118 78 L 118 136 L 92 124 L 80 104 L 84 92 Z" />
      <MuscleRegion {...view} muscle="SIDE_DELT" d="M 48 114 L 68 98 L 74 130 L 52 138 Z" />
      <MuscleRegion {...view} muscle="REAR_DELT" d="M 70 96 L 90 104 L 88 132 L 72 134 Z" />

      <MuscleRegion {...view} muscle="RHOMBOIDS" d="M 96 140 L 118 138 L 118 162 L 97 160 Z" />
      <MuscleRegion {...view} muscle="LATS" d="M 84 152 L 95 164 L 118 168 L 118 210 L 89 204 Z" />
      <MuscleRegion {...view} muscle="LOWER_BACK" d="M 99 214 L 118 214 L 118 246 L 101 244 Z" />

      <MuscleRegion {...view} muscle="TRICEPS" d="M 48 140 L 74 136 L 76 182 L 52 186 Z" />
      <MuscleRegion {...view} muscle="FOREARMS" d="M 50 188 L 74 185 L 70 244 L 52 240 Z" />

      <MuscleRegion {...view} muscle="GLUTES" d="M 90 248 L 118 246 L 118 288 L 92 290 Z" />
      <MuscleRegion {...view} muscle="HAMSTRINGS" d="M 88 296 L 116 294 L 114 382 L 92 382 Z" />
      <MuscleRegion {...view} muscle="CALVES" d="M 90 394 L 114 394 L 111 464 L 93 464 Z" />
    </svg>
  );
}
