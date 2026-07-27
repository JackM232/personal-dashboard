import { useMemo, useRef, useState } from "react";
import type { MouseEvent } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../../api/queryKeys";
import { gymApi } from "../../../api/gym";
import type { MuscleGroup, MuscleVolume } from "../../../api/gym";
import { MUSCLE_GROUPS, MUSCLE_LABELS } from "../muscles";
import { BodyFront } from "./BodyFront";
import { BodyBack } from "./BodyBack";
import { HEAT_BINS, heatVar } from "./muscleColor";
import type { RegionHandlers } from "./bodyParts";
import "./MuscleMap.css";

interface WindowOption {
  key: string;
  label: string;
  /** 0 = all-time. */
  days: number;
  /** How the legend names this window in its basis sentence. */
  phrase: string;
}

const WINDOWS: WindowOption[] = [
  { key: "7", label: "7d", days: 7, phrase: "over the last 7 days" },
  { key: "30", label: "30d", days: 30, phrase: "over the last 30 days" },
  { key: "90", label: "90d", days: 90, phrase: "over the last 90 days" },
  { key: "0", label: "All", days: 0, phrase: "over all time" },
];

function formatSets(stimulus: number): string {
  return stimulus.toFixed(1);
}

// ─────────────────────────────────────────
// Legend — required, and required to state its basis
// ─────────────────────────────────────────

function Legend({ phrase }: { phrase: string }) {
  return (
    <div className="muscle-legend">
      <div className="muscle-legend-scale">
        <span className="muscle-legend-item">
          <span
            className="muscle-legend-swatch"
            style={{ background: "var(--muscle-untrained)" }}
          />
          Not trained
        </span>

        <span className="muscle-legend-item">
          Least
          <span className="muscle-legend-ramp">
            {HEAT_BINS.map((bin) => (
              <span
                key={bin}
                className="muscle-legend-swatch"
                style={{ background: `var(--heat-${bin})` }}
              />
            ))}
          </span>
          Most
        </span>
      </div>

      {/* Intensity is relative to the user's own maximum (D5), so the scale means
          nothing without this sentence. */}
      <p className="muscle-legend-basis">
        Relative to your most-trained muscle {phrase}.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────
// The map
// ─────────────────────────────────────────

interface MuscleMapProps {
  groups: MuscleVolume[];
  /** Legend phrasing for the active window, e.g. "over the last 30 days". */
  windowPhrase: string;
  /** Owned by the panel so the Front/Back toggle can share the filter row. */
  back: boolean;
  onBackChange: (back: boolean) => void;
  /** Suppresses the empty state until the first response lands. */
  loading: boolean;
}

export function MuscleMap({ groups, windowPhrase, back, onBackChange, loading }: MuscleMapProps) {
  const [hover, setHover] = useState<{ muscle: MuscleGroup; x: number; y: number } | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const byMuscle = useMemo(() => {
    const map = new Map<MuscleGroup, MuscleVolume>();
    for (const group of groups) map.set(group.muscle, group);
    return map;
  }, [groups]);

  // Descending by stimulus, ties broken by anatomical order so the list is stable.
  const ranked = useMemo(() => {
    return MUSCLE_GROUPS.map(
      (muscle) => byMuscle.get(muscle) ?? { muscle, stimulus: 0, intensity: 0 },
    ).sort((a, b) => b.stimulus - a.stimulus);
  }, [byMuscle]);

  const maxStimulus = ranked.length > 0 ? ranked[0].stimulus : 0;

  function intensityOf(muscle: MuscleGroup): number {
    return byMuscle.get(muscle)?.intensity ?? 0;
  }

  function fillFor(muscle: MuscleGroup): string {
    return heatVar(intensityOf(muscle));
  }

  function pointFrom(event: MouseEvent): { x: number; y: number } {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: event.clientX - rect.left, y: event.clientY - rect.top - 8 };
  }

  const handlers: RegionHandlers = {
    onEnter: (muscle, event) => setHover({ muscle, ...pointFrom(event) }),
    onMove: (event) => setHover((current) => (current ? { ...current, ...pointFrom(event) } : current)),
    onLeave: () => setHover(null),
    // Tapping a region reports it; only a tap on the rest of the figure spins it.
    onSelect: (muscle, event) => {
      event.stopPropagation();
      setHover({ muscle, ...pointFrom(event) });
    },
  };

  const hovered = hover ? byMuscle.get(hover.muscle) : undefined;

  return (
    <div className="muscle-map-layout">
      <div className="muscle-map-stage" ref={stageRef}>
        {/* Clicking anywhere on the figure that is not a muscle region spins it. */}
        <div
          className={`muscle-map-flipper${back ? " is-back" : ""}`}
          onClick={() => onBackChange(!back)}
        >
          <div className="muscle-map-face front">
            <BodyFront fillFor={fillFor} handlers={handlers} />
          </div>
          <div className="muscle-map-face back">
            <BodyBack fillFor={fillFor} handlers={handlers} />
          </div>
        </div>

        {hover && hovered && (
          <div className="muscle-map-tooltip" style={{ left: hover.x, top: hover.y }}>
            {MUSCLE_LABELS[hovered.muscle]} — {formatSets(hovered.stimulus)} sets ·{" "}
            {Math.round(hovered.intensity * 100)}% of most-trained
          </div>
        )}
      </div>

      <div className="muscle-rank">
        {/* Empty state keeps the figure on screen and grey — hiding it would lose
            the "nothing trained yet" message the grey is making. Held back until
            the first response, so a slow fetch never claims nothing was logged. */}
        {!loading && maxStimulus === 0 && (
          <p className="gym-muted">No working sets logged in this window.</p>
        )}

        <h3 className="muscle-rank-heading">Working sets by muscle</h3>
        <ul className="muscle-rank-list">
          {ranked.map((group) => (
            <li
              key={group.muscle}
              className={`muscle-rank-row${group.stimulus === 0 ? " is-untrained" : ""}`}
            >
              <span
                className="muscle-rank-swatch"
                style={{ background: heatVar(group.intensity) }}
              />
              <span className="muscle-rank-name">{MUSCLE_LABELS[group.muscle]}</span>
              <span className="muscle-rank-sets">{formatSets(group.stimulus)}</span>
            </li>
          ))}
        </ul>

        <Legend phrase={windowPhrase} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Panel — owns the window selector and the fetch
// ─────────────────────────────────────────

export function MuscleMapPanel() {
  const [windowKey, setWindowKey] = useState("30");
  const [back, setBack] = useState(false);

  const active = WINDOWS.find((option) => option.key === windowKey) ?? WINDOWS[1];

  const volumeQuery = useQuery({
    queryKey: queryKeys.gym.muscleVolume(active.days),
    queryFn: () => gymApi.getMuscleVolume(active.days),
    // Hold the previous figure while a new window loads, so switching 30d/90d
    // recolours in place rather than emptying the body first.
    placeholderData: keepPreviousData,
  });

  const groups: MuscleVolume[] = volumeQuery.data?.groups ?? [];
  const error = volumeQuery.error;

  return (
    <div className="muscle-map">
      {/* One filter row above the figure: the window selector and the Front/Back
          toggle sit together. */}
      <div className="muscle-map-filters">
        <div className="gym-segmented" role="group" aria-label="Window">
          {WINDOWS.map((option) => (
            <button
              key={option.key}
              type="button"
              className={option.key === windowKey ? "active" : ""}
              aria-pressed={option.key === windowKey}
              onClick={() => setWindowKey(option.key)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="gym-segmented" role="group" aria-label="View">
          <button
            type="button"
            className={back ? "" : "active"}
            aria-pressed={!back}
            onClick={() => setBack(false)}
          >
            Front
          </button>
          <button
            type="button"
            className={back ? "active" : ""}
            aria-pressed={back}
            onClick={() => setBack(true)}
          >
            Back
          </button>
        </div>
      </div>

      {error && <p className="gym-muted">Failed to load muscle volume: {error.message}</p>}

      <MuscleMap
        groups={groups}
        windowPhrase={active.phrase}
        back={back}
        onBackChange={setBack}
        loading={volumeQuery.isPending}
      />
    </div>
  );
}
