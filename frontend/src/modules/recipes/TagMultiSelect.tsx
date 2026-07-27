import { TAG_SECTIONS, humanize } from "./labels";
import type { RecipeTag } from "./types";
import "./TagMultiSelect.css";

interface TagMultiSelectProps {
  label: string;
  value: RecipeTag[];
  onChange: (value: RecipeTag[]) => void;
}

export function TagMultiSelect({ label, value, onChange }: TagMultiSelectProps) {
  function toggle(tag: RecipeTag, checked: boolean) {
    onChange(checked ? [...value, tag] : value.filter((t) => t !== tag));
  }

  return (
    <fieldset className="tag-select">
      <legend>{label}</legend>

      <div className="tag-select-sections">
        {TAG_SECTIONS.map((section) => (
          <div key={section.label} className="tag-select-section">
            <span className="tag-select-section-label">{section.label}</span>
            <div className="tag-select-options">
              {section.tags.map((tag) => (
                <label
                  key={tag}
                  className={`tag-select-option ${value.includes(tag) ? "checked" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={value.includes(tag)}
                    onChange={(e) => toggle(tag, e.target.checked)}
                  />
                  <span>{humanize(tag)}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </fieldset>
  );
}
