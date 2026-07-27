import { BODY_VIEW_BOX, BodyInert, MuscleRegion } from "./bodyParts";
import type { BodyViewProps } from "./bodyParts";

// Anterior view — 13 of the 20 groups. SIDE_DELT, TRAPS, FOREARMS and CALVES also
// appear on the back; both copies take the same fill, because intensity is
// per-muscle, not per-view.
//
// Stylized and blocky on purpose. Regions are recognizable and no thinner than
// ~10 units, which keeps every one of them a real hover target.
export function BodyFront({ fillFor, handlers }: BodyViewProps) {
  const view = { fillFor, handlers };

  return (
    <svg viewBox={BODY_VIEW_BOX} className="body-svg" role="img" aria-label="Front view">
      <BodyInert />

      <MuscleRegion {...view} muscle="TRAPS" d="M 105 80 L 118 78 L 118 100 L 80 104 L 84 92 Z" />
      <MuscleRegion {...view} muscle="SIDE_DELT" d="M 48 114 L 68 98 L 74 130 L 52 138 Z" />
      <MuscleRegion {...view} muscle="FRONT_DELT" d="M 70 96 L 90 104 L 88 132 L 72 134 Z" />

      <MuscleRegion {...view} muscle="UPPER_CHEST" d="M 92 104 L 118 100 L 118 124 L 91 128 Z" />
      <MuscleRegion {...view} muscle="MID_CHEST" d="M 91 130 L 118 126 L 118 150 L 90 152 Z" />
      <MuscleRegion {...view} muscle="LOWER_CHEST" d="M 90 154 L 118 152 L 118 172 L 92 170 Z" />

      <MuscleRegion {...view} muscle="BICEPS" d="M 48 140 L 74 136 L 76 182 L 52 186 Z" />
      <MuscleRegion {...view} muscle="FOREARMS" d="M 50 188 L 74 185 L 70 244 L 52 240 Z" />

      <MuscleRegion {...view} muscle="OBLIQUES" d="M 85 176 L 99 178 L 97 240 L 88 232 Z" />
      <MuscleRegion {...view} muscle="UPPER_ABS" d="M 100 176 L 118 176 L 118 206 L 101 206 Z" />
      <MuscleRegion {...view} muscle="LOWER_ABS" d="M 101 210 L 118 210 L 118 242 L 104 242 Z" />

      <MuscleRegion {...view} muscle="QUADS" d="M 86 288 L 116 288 L 114 384 L 90 384 Z" />
      <MuscleRegion {...view} muscle="CALVES" d="M 90 394 L 114 394 L 111 464 L 93 464 Z" />
    </svg>
  );
}
