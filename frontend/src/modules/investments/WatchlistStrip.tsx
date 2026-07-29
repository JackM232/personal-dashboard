import { useState } from "react";
import type { FormEvent } from "react";
import { investmentsApi } from "./api";
import { formatMoney, formatPercent, gainClass } from "./labels";
import type { WatchlistItem } from "./types";

interface WatchlistStripProps {
  items: WatchlistItem[];
  onWatchlistChanged: () => Promise<void>;
}

// Tickers the user follows but may not own. Full width above the tabs, so it
// reads as context for the whole page rather than part of either tab.
export function WatchlistStrip({ items, onWatchlistChanged }: WatchlistStripProps) {
  const [symbol, setSymbol] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!symbol.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      await investmentsApi.addToWatchlist(symbol);
      setSymbol("");
      await onWatchlistChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemove(item: WatchlistItem) {
    setError(null);
    try {
      await investmentsApi.removeFromWatchlist(item.symbol);
      await onWatchlistChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <section className="watchlist-strip">
      <div className="watchlist-cards">
        {items.length === 0 ? (
          <p className="investments-muted">
            Nothing on the watchlist yet — add a ticker to keep an eye on it.
          </p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="watchlist-card">
              <button
                type="button"
                className="watchlist-remove"
                aria-label={`Remove ${item.symbol} from watchlist`}
                onClick={() => handleRemove(item)}
              >
                ×
              </button>
              <span className="watchlist-symbol">{item.symbol}</span>
              <span className="watchlist-price">
                {item.quote ? formatMoney(item.quote.current) : "—"}
              </span>
              {/* The sign travels with the number, so the colour is never the
                  only cue for which way the day went. */}
              <span className={`watchlist-change ${item.quote ? gainClass(item.quote.change) : ""}`}>
                {item.quote ? formatPercent(item.quote.changePercent) : "no price"}
              </span>
            </div>
          ))
        )}
      </div>

      <form className="watchlist-add" onSubmit={handleAdd}>
        <input
          type="text"
          value={symbol}
          placeholder="Ticker"
          aria-label="Ticker to watch"
          // Symbols are stored uppercase; showing them that way as you type makes
          // the normalisation visible rather than surprising.
          onChange={(e) => setSymbol(e.target.value.toUpperCase())}
        />
        <button type="submit" className="add-button secondary" disabled={submitting || !symbol.trim()}>
          Add to watchlist
        </button>
      </form>

      {error && <p className="investments-error">{error}</p>}
    </section>
  );
}
