// Finnhub market-data client. The API key lives in backend/.env and never
// leaves this process — the browser only ever talks to our own /api routes.
//
// Finnhub's /quote is one symbol per request on the free tier (60 calls/min), so
// a portfolio of a dozen holdings would burn the budget in five page loads
// without a cache. Everything below exists to keep repeat reads off the wire:
// a short TTL, and de-duplication of concurrent requests for the same symbol.
//
// Nothing here throws. A missing key, a rate limit, or a dead network resolves
// to `null` for that symbol so the portfolio still renders on cost basis.

const BASE_URL = "https://finnhub.io/api/v1/quote";

// Long enough that a page open at the default refetch interval is mostly cache
// hits, short enough that a price still reads as live.
const TTL_MS = 60_000;
// Failures are cached too, briefly — otherwise a bad key retries on every render.
const FAILURE_TTL_MS = 30_000;
const TIMEOUT_MS = 5_000;

export interface Quote {
  symbol: string;
  current: number;
  previousClose: number;
  change: number;
  changePercent: number;
}

interface CacheEntry {
  quote: Quote | null;
  fetchedAt: number;
}

const cache = new Map<string, CacheEntry>();
// One in-flight request per symbol: a cold portfolio page asking for AAPL while
// the watchlist strip asks for AAPL should cost one call, not two.
const inFlight = new Map<string, Promise<Quote | null>>();

// Counters exist so the cache can be proven to work from a running server
// (GET /api/investments/quote-stats in dev, or just the logs below).
const stats = { hits: 0, misses: 0, fetches: 0, failures: 0 };

export function quoteCacheStats() {
  return { ...stats, cached: cache.size };
}

// The "log once" flags. A broken key would otherwise print per symbol per
// request, which is thousands of identical lines an hour.
let warnedMissingKey = false;
let warnedRateLimited = false;
let warnedUnavailable = false;

function fresh(entry: CacheEntry | undefined): entry is CacheEntry {
  if (!entry) return false;
  const ttl = entry.quote === null ? FAILURE_TTL_MS : TTL_MS;
  return Date.now() - entry.fetchedAt < ttl;
}

function remember(symbol: string, quote: Quote | null): Quote | null {
  cache.set(symbol, { quote, fetchedAt: Date.now() });
  if (quote === null) stats.failures += 1;
  return quote;
}

// Finnhub's payload: c = current, pc = previous close, d = change, dp = percent.
// An unknown symbol comes back as a 200 with every field zeroed rather than a
// 404, so that shape has to be treated as "no quote" explicitly.
interface FinnhubQuote {
  c?: number;
  pc?: number;
  d?: number | null;
  dp?: number | null;
}

async function fetchQuote(symbol: string): Promise<Quote | null> {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) {
    if (!warnedMissingKey) {
      console.warn("[finnhub] FINNHUB_API_KEY is not set — prices fall back to cost basis");
      warnedMissingKey = true;
    }
    return remember(symbol, null);
  }

  stats.fetches += 1;
  console.log(`[finnhub] fetch ${symbol}`);

  try {
    const url = `${BASE_URL}?symbol=${encodeURIComponent(symbol)}&token=${encodeURIComponent(apiKey)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });

    if (res.status === 429) {
      if (!warnedRateLimited) {
        console.warn("[finnhub] rate limited — prices fall back to cost basis");
        warnedRateLimited = true;
      }
      return remember(symbol, null);
    }
    if (!res.ok) {
      if (!warnedUnavailable) {
        console.warn(`[finnhub] request failed with ${res.status} — prices fall back to cost basis`);
        warnedUnavailable = true;
      }
      return remember(symbol, null);
    }

    const body = (await res.json()) as FinnhubQuote;
    const current = typeof body.c === "number" ? body.c : 0;
    const previousClose = typeof body.pc === "number" ? body.pc : 0;

    // All-zero means Finnhub does not know the symbol.
    if (current === 0 && previousClose === 0) {
      return remember(symbol, null);
    }

    return remember(symbol, {
      symbol,
      current,
      previousClose,
      // d/dp are null outside trading hours for some symbols; derive instead of
      // trusting them, so the day change is never silently missing.
      change: current - previousClose,
      changePercent: previousClose === 0 ? 0 : ((current - previousClose) / previousClose) * 100,
    });
  }
  catch (err) {
    if (!warnedUnavailable) {
      console.warn("[finnhub] unreachable — prices fall back to cost basis");
      warnedUnavailable = true;
    }
    return remember(symbol, null);
  }
}

// Fetches every symbol, one request each, and returns a map keyed by uppercase
// symbol. A symbol with no usable quote maps to `null` rather than being absent —
// callers must be able to tell "no price" from "not asked for".
export async function getQuotes(symbols: string[]): Promise<Map<string, Quote | null>> {
  const wanted = [...new Set(symbols.map((symbol) => symbol.trim().toUpperCase()).filter(Boolean))];
  const result = new Map<string, Quote | null>();

  await Promise.all(
    wanted.map(async (symbol) => {
      const cached = cache.get(symbol);
      if (fresh(cached)) {
        stats.hits += 1;
        result.set(symbol, cached.quote);
        return;
      }

      stats.misses += 1;
      // Join an in-flight request rather than starting a second one.
      let pending = inFlight.get(symbol);
      if (!pending) {
        pending = fetchQuote(symbol).finally(() => inFlight.delete(symbol));
        inFlight.set(symbol, pending);
      }
      result.set(symbol, await pending);
    }),
  );

  return result;
}
