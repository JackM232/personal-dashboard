import type { MuscleGroup } from "../../api/gym";
import { MUSCLE_LABELS, MUSCLE_SECTIONS } from "./muscles";
import "./MuscleMultiSelect.css";

interface MuscleMultiSelectProps {
  label: string;
  value: MuscleGroup[];
  onChange: (value: MuscleGroup[]) => void;
  // Disabled groups are already claimed by the other list — a muscle cannot be
  // both primary and secondary, so the UI blocks it before the server has to.
  disabled?: MuscleGroup[];
  hint?: string;
}

export function MuscleMultiSelect({
  label,
  value,
  onChange,
  disabled = [],
  hint,
}: MuscleMultiSelectProps) {
  function toggle(muscle: MuscleGroup, checked: boolean) {
    onChange(checked ? [...value, muscle] : value.filter((m) => m !== muscle));
  }

  return (
    <fieldset className="muscle-select">
      <legend>{label}</legend>
      {hint && <p className="muscle-select-hint">{hint}</p>}

      <div className="muscle-select-sections">
        {MUSCLE_SECTIONS.map((section) => (
          <div key={section.label} className="muscle-select-section">
            <span className="muscle-select-section-label">{section.label}</span>
            {section.muscles.map((muscle) => (
              <label key={muscle} className="muscle-select-option">
                <input
                  type="checkbox"
                  checked={value.includes(muscle)}
                  disabled={disabled.includes(muscle)}
                  onChange={(e) => toggle(muscle, e.target.checked)}
                />
                <span>{MUSCLE_LABELS[muscle]}</span>
              </label>
            ))}
          </div>
        ))}
      </div>
    </fieldset>
  );
}
