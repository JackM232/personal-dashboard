import { humanize, tagFamily } from "./labels";
import type { RecipeDifficulty, RecipeTag } from "./types";
import "./RecipeChip.css";

// One pill, three flavours. `tone` picks the colour family; the CSS does the
// rest, so nothing here needs to know about individual tag values.
interface ChipProps {
  label: string;
  tone: string;
}

export function Chip({ label, tone }: ChipProps) {
  return <span className={`recipe-chip recipe-chip-${tone}`}>{label}</span>;
}

export function DifficultyChip({ difficulty }: { difficulty: RecipeDifficulty }) {
  return <Chip label={humanize(difficulty)} tone={difficulty.toLowerCase()} />;
}

export function TagChip({ tag }: { tag: RecipeTag }) {
  return <Chip label={humanize(tag)} tone={tagFamily(tag)} />;
}

export function TagChips({ tags, limit }: { tags: RecipeTag[]; limit?: number }) {
  const shown = limit ? tags.slice(0, limit) : tags;
  const hidden = tags.length - shown.length;

  return (
    <span className="recipe-chip-row">
      {shown.map((tag) => (
        <TagChip key={tag} tag={tag} />
      ))}
      {hidden > 0 && <Chip label={`+${hidden}`} tone="muted" />}
    </span>
  );
}
