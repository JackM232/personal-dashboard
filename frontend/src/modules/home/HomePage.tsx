import { useMemo, useState } from "react";
import type { DragEvent } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queries } from "../../api/queries";
import { queryKeys } from "../../api/queryKeys";
import { useAuth } from "../../auth/useAuth";
import { dashboardApi } from "./api";
import { greeting } from "./labels";
import { PreviewSkeleton } from "./PreviewParts";
import {
  VISIBLE_SLOTS,
  dropPreview,
  hidePreview,
  movePreview,
  previewById,
  reconcile,
  showPreview,
  visibleIds,
} from "./previews";
import type { PreviewDefinition } from "./previews";
import type { DashboardLayout } from "./types";
import "./HomePage.css";

export function HomePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const layoutQuery = useQuery(queries.dashboardLayout);

  // Edit mode *is* holding a draft: Cancel throws it away, and the grid reads
  // from the draft whenever there is one, so there is no second flag to keep in
  // step with it.
  const [draft, setDraft] = useState<DashboardLayout | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // What the server sent, minus previews this build no longer has and plus any
  // it has gained since the layout was saved.
  const saved = useMemo(() => reconcile(layoutQuery.data), [layoutQuery.data]);
  const layout = draft ?? saved;
  const visible = visibleIds(layout);
  const editing = draft !== null;
  const full = visible.length >= VISIBLE_SLOTS;

  function handleSave() {
    if (!draft) return;
    const next: DashboardLayout = { order: draft.order, hidden: draft.hidden };

    setSaving(true);
    setError(null);
    // Written to the cache before the request so the grid holds the new
    // arrangement instead of snapping back to the old one until the refetch
    // lands. A failed save reverts it, because the invalidate below refetches
    // whatever the server actually has.
    queryClient.setQueryData(queryKeys.dashboard.layout, next);
    setDraft(null);

    return dashboardApi
      .saveLayout(next)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Failed to save your layout");
      })
      .finally(() => {
        setSaving(false);
        void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.layout });
      });
  }

  // The id travels in the drag payload rather than in `dragging`: a state update
  // from dragstart is not guaranteed to have committed by the time the drop
  // handler runs, and the transfer is the one thing the browser hands to both.
  // `dragging` is only the visual cue.
  function draggedIdFrom(event: DragEvent): string {
    return event.dataTransfer.getData("text/plain") || dragging || "";
  }

  function handleDrop(event: DragEvent, targetId: string) {
    event.preventDefault();
    const id = draggedIdFrom(event);
    setDragging(null);
    if (!draft || !id) return;
    setDraft(dropPreview(draft, id, targetId));
  }

  // The empty slots only exist while a preview is hidden, so a drop on one can
  // only mean "put this back on the grid".
  function handleDropOnSlot(event: DragEvent) {
    event.preventDefault();
    const id = draggedIdFrom(event);
    setDragging(null);
    if (!draft || !id) return;
    setDraft(showPreview(draft, id));
  }

  const hidden = layout.hidden.map(previewById).filter((preview): preview is PreviewDefinition => !!preview);

  return (
    <div className="home">
      <header className="home-header">
        <div>
          <h1 className="home-greeting">
            {greeting(new Date().getHours())}
            {user ? `, ${user.name || user.username}` : ""}
          </h1>
          <p className="home-subtitle">Here is where everything stands.</p>
        </div>
        <div className="home-header-actions">
          {editing ? (
            <>
              <button
                type="button"
                className="add-button secondary"
                onClick={() => {
                  setDraft(null);
                  setError(null);
                }}
              >
                Cancel
              </button>
              <button type="button" className="add-button" onClick={handleSave} disabled={saving}>
                Save
              </button>
            </>
          ) : (
            <button
              type="button"
              className="add-button secondary"
              onClick={() => setDraft(saved)}
              disabled={layoutQuery.isPending}
            >
              Customize
            </button>
          )}
        </div>
      </header>

      {error && <p className="home-error">{error}</p>}
      {/* Worth saying: without it, a user whose saved arrangement failed to load
          would see the default one and assume it had been lost. */}
      {layoutQuery.error && (
        <p className="home-error">Couldn't load your arrangement — showing the default one.</p>
      )}

      {editing && (
        <p className="home-hint">
          Drag a card to move it, or use the arrows. Six previews fit on the grid at a time.
        </p>
      )}

      <div className="home-grid">
        {/* The arrangement decides which cards exist, so the grid waits for it
            rather than rendering the default order and reshuffling a moment
            later. The previews themselves are usually already warm. */}
        {layoutQuery.isPending
          ? Array.from({ length: VISIBLE_SLOTS }, (_, index) => (
              <div key={`loading-${index}`} className="home-card is-loading">
                <PreviewSkeleton />
              </div>
            ))
          : visible.map((id, index) => {
              const preview = previewById(id);
              if (!preview) return null;
              return (
                <PreviewCard
                  key={id}
                  preview={preview}
                  editing={editing}
                  first={index === 0}
                  last={index === visible.length - 1}
                  onMove={(delta) => draft && setDraft(movePreview(draft, id, delta))}
                  onHide={() => draft && setDraft(hidePreview(draft, id))}
                  dragging={dragging === id}
                  onDragStart={(event) => startDrag(event, id, setDragging)}
                  onDragEnd={() => setDragging(null)}
                  onDrop={(event) => handleDrop(event, id)}
                />
              );
            })}

        {editing &&
          Array.from({ length: VISIBLE_SLOTS - visible.length }, (_, index) => (
            <div
              key={`slot-${index}`}
              className="home-slot"
              onDragOver={allowDrop}
              onDrop={handleDropOnSlot}
            >
              Drag a preview here
            </div>
          ))}
      </div>

      {editing && (
        <section className="home-tray">
          <h2 className="home-tray-title">Hidden previews</h2>
          {hidden.length === 0 ? (
            <p className="home-note">Every preview is on the grid.</p>
          ) : (
            <>
              <ul className="home-tray-list">
                {hidden.map((preview) => (
                  <li key={preview.id}>
                    <div
                      className={`home-tray-card theme-${preview.theme}`}
                      draggable
                      onDragStart={(event) => startDrag(event, preview.id, setDragging)}
                      onDragEnd={() => setDragging(null)}
                    >
                      <span className="home-handle" aria-hidden="true">
                        ⠿
                      </span>
                      <span className="home-tray-name">{preview.label}</span>
                      <button
                        type="button"
                        className="link-button"
                        // Refused rather than displacing a card the user didn't
                        // pick — the line below says what to do instead.
                        disabled={full}
                        onClick={() => draft && setDraft(showPreview(draft, preview.id))}
                      >
                        Show
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              {full && <p className="home-note">Hide a preview first to make room for another.</p>}
            </>
          )}
        </section>
      )}
    </div>
  );
}

function allowDrop(event: DragEvent) {
  // Without this the browser refuses the drop outright — the default for most
  // elements is "not a drop target".
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
}

function startDrag(event: DragEvent, id: string, setDragging: (id: string) => void) {
  setDragging(id);
  event.dataTransfer.effectAllowed = "move";
  // Firefox ignores a drag that carries no data, even when the id is tracked in
  // state rather than read back out of the transfer.
  event.dataTransfer.setData("text/plain", id);
}

interface PreviewCardProps {
  preview: PreviewDefinition;
  editing: boolean;
  first: boolean;
  last: boolean;
  dragging: boolean;
  onMove: (delta: number) => void;
  onHide: () => void;
  onDragStart: (event: DragEvent) => void;
  onDragEnd: () => void;
  onDrop: (event: DragEvent) => void;
}

function PreviewCard({
  preview,
  editing,
  first,
  last,
  dragging,
  onMove,
  onHide,
  onDragStart,
  onDragEnd,
  onDrop,
}: PreviewCardProps) {
  const Preview = preview.component;
  // Each card wears its module's accent: the .theme-* blocks in
  // DashboardLayout.css define --accent for both colour schemes and the
  // variables cascade, so nothing here needs a colour of its own.
  const className = `home-card theme-${preview.theme}`;

  const body = (
    <>
      <div className="home-card-head">
        {editing && (
          <span className="home-handle" aria-hidden="true">
            ⠿
          </span>
        )}
        <h2 className="home-card-title">{preview.label}</h2>
      </div>
      <Preview />
    </>
  );

  // Editing swaps the link for a plain div: the controls are buttons, and
  // nesting those inside an anchor is neither valid nor operable. It also stops
  // a drag that ends on the card from navigating away.
  if (!editing) {
    return (
      <Link to={preview.path} className={className}>
        {body}
      </Link>
    );
  }

  return (
    <div
      className={`${className} is-editing ${dragging ? "is-dragging" : ""}`}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={allowDrop}
      onDrop={onDrop}
    >
      {body}
      {/* Drag is the fast path, not the only one — the arrows and Hide make the
          same edits with a keyboard. */}
      <div className="home-card-controls">
        <button
          type="button"
          className="home-move"
          aria-label={`Move ${preview.label} earlier`}
          disabled={first}
          onClick={() => onMove(-1)}
        >
          ←
        </button>
        <button
          type="button"
          className="home-move"
          aria-label={`Move ${preview.label} later`}
          disabled={last}
          onClick={() => onMove(1)}
        >
          →
        </button>
        <button type="button" className="link-button" onClick={onHide}>
          Hide
        </button>
      </div>
    </div>
  );
}
