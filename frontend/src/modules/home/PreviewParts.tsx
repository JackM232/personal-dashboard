import type { ReactNode } from "react";

// The card body is the same three shapes everywhere — one hero figure, a short
// list of label/value rows, and a muted line for the states where there is
// nothing to report. Keeping them here is what makes seven previews written by
// hand still read as one grid.

export function PreviewHero({ value, label }: { value: ReactNode; label: string }) {
  return (
    <div className="home-hero">
      <span className="home-hero-value">{value}</span>
      <span className="home-hero-label">{label}</span>
    </div>
  );
}

export function PreviewRows({ children }: { children: ReactNode }) {
  return <ul className="home-rows">{children}</ul>;
}

export function PreviewRow({
  label,
  value,
  tone,
}: {
  label: ReactNode;
  value?: ReactNode;
  /** "warn" for overdue, "up"/"down" for a signed money figure. */
  tone?: "warn" | "up" | "down";
}) {
  return (
    <li className="home-row">
      <span className="home-row-label">{label}</span>
      {value !== undefined && (
        <span className={`home-row-value ${tone ? `is-${tone}` : ""}`}>{value}</span>
      )}
    </li>
  );
}

// The empty case is a sentence, never a bare zero — "0 sessions" and "you have
// never logged one" mean different things to someone reading at a glance.
export function PreviewNote({ children }: { children: ReactNode }) {
  return <p className="home-note">{children}</p>;
}

// Sized to the hero-plus-three-rows shape, so a card that is still loading takes
// up the same room as the one that replaces it and the grid doesn't jump.
export function PreviewSkeleton() {
  return (
    <div className="home-skeleton" role="status" aria-label="Loading">
      <span className="home-skeleton-bar is-hero" />
      <span className="home-skeleton-bar" />
      <span className="home-skeleton-bar" />
      <span className="home-skeleton-bar" />
    </div>
  );
}

// One preview failing is not a reason to fail the page — the module itself will
// report the error properly when it is opened.
export function PreviewFailed() {
  return <PreviewNote>Couldn't load this one.</PreviewNote>;
}
