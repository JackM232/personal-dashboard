import type { MouseEvent } from "react";
import type { MuscleGroup } from "../../../api/gym";
import { MUSCLE_LABELS } from "../muscles";

// Geometry shared by both views. The front and back faces are stacked and flipped
// through each other, so they must line up exactly — keeping the viewBox and the
// inert skeleton in one place is what makes that true by construction rather than
// by two files happening to agree.

export const BODY_VIEW_BOX = "0 0 240 520";

// Most muscles are bilateral, so every region is authored once on the left half
// and reflected about x = 120. Symmetry is then a property of the transform, not
// of two hand-typed path strings.
const MIRROR = "translate(240 0) scale(-1 1)";

export interface RegionHandlers {
  onEnter: (muscle: MuscleGroup, event: MouseEvent) => void;
  onMove: (event: MouseEvent) => void;
  onLeave: () => void;
  onSelect: (muscle: MuscleGroup, event: MouseEvent) => void;
}

export interface BodyViewProps {
  fillFor: (muscle: MuscleGroup) => string;
  handlers: RegionHandlers;
}

interface MuscleRegionProps extends BodyViewProps {
  muscle: MuscleGroup;
  /** Left-half path; the right half is this same path, mirrored. */
  d: string;
}

// One <g> per muscle, wrapping both sides of the pair — so a hover lights up and
// reports the left and right halves together, and the fill is set once.
//
// data-muscle is the raw MuscleGroup enum string. No mapping table, no aliases:
// a typo here is a permanently grey region and nothing else would catch it.
export function MuscleRegion({ muscle, d, fillFor, handlers }: MuscleRegionProps) {
  return (
    <g
      data-muscle={muscle}
      className="muscle-region"
      fill={fillFor(muscle)}
      // Hairline separation, so adjacent regions at similar intensity stay
      // distinguishable.
      stroke="var(--muscle-stroke)"
      strokeWidth="1"
      aria-label={MUSCLE_LABELS[muscle]}
      onMouseEnter={(event) => handlers.onEnter(muscle, event)}
      onMouseMove={handlers.onMove}
      onMouseLeave={handlers.onLeave}
      onClick={(event) => handlers.onSelect(muscle, event)}
    >
      <path d={d} />
      <path d={d} transform={MIRROR} />
    </g>
  );
}

// Head, neck, hands, feet and the limb/torso scaffolding. Not data — it is drawn
// first, underneath every region, and stays visually subordinate.
export function BodyInert() {
  return (
    <g className="body-inert" fill="var(--muscle-inert)">
      <ellipse cx="120" cy="42" rx="23" ry="27" />
      <rect x="108" y="62" width="24" height="28" />
      <path d="M 76 90 L 164 90 L 154 200 L 158 250 L 82 250 L 86 200 Z" />
      <path d="M 82 244 L 158 244 L 150 294 L 90 294 Z" />

      {/* The arms hang clear of the torso below the shoulder joint, so the limb
          regions never read as part of the trunk. */}
      <path d="M 44 100 L 74 94 L 76 186 L 48 190 Z" />
      <path d="M 44 100 L 74 94 L 76 186 L 48 190 Z" transform={MIRROR} />
      <path d="M 48 184 L 76 180 L 72 250 L 46 246 Z" />
      <path d="M 48 184 L 76 180 L 72 250 L 46 246 Z" transform={MIRROR} />
      <path d="M 47 248 L 71 251 L 69 276 L 49 273 Z" />
      <path d="M 47 248 L 71 251 L 69 276 L 49 273 Z" transform={MIRROR} />

      <path d="M 84 284 L 118 284 L 116 388 L 88 388 Z" />
      <path d="M 84 284 L 118 284 L 116 388 L 88 388 Z" transform={MIRROR} />
      <path d="M 88 388 L 116 388 L 112 476 L 90 476 Z" />
      <path d="M 88 388 L 116 388 L 112 476 L 90 476 Z" transform={MIRROR} />
      <path d="M 90 474 L 114 474 L 118 500 L 84 500 Z" />
      <path d="M 90 474 L 114 474 L 118 500 L 84 500 Z" transform={MIRROR} />
    </g>
  );
}
