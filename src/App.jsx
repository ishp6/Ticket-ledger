import { useState, useEffect, useRef, useCallback } from "react";

/* ---------- design tokens ---------- */
const C = {
  paper: "#FFFFFF",
  stripe: "#DCEEDD",
  ink: "#1B2A22",
  inkFaint: "#5C6F63",
  gain: "#1E7A46",
  gainBg: "#E1F0E4",
  loss: "#B23A2E",
  lossBg: "#F3E1DD",
  band: "#14532D",
  bandLight: "#1E6E3C",
  ruleLine: "#B9CFBE",
};

const fonts = {
  digital: "'VT323', monospace",
  body: "'Space Mono', monospace",
};

const SEED_SYMBOLS = ["AAPL", "TSLA"];
const POLL_MS = 20000; // stay well under free-tier rate limits
const STORAGE_KEY = "ticker-ledger-watchlist";

function fmt(n, d = 2) {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return Number(n).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
}

function loadStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return SEED_SYMBOLS.map((symbol) => ({
    symbol,
    name: "",
    shares: 0,
    price: null,
    previousClose: null,
    history: [],
    error: null,
  }));
}

function Sparkline({ history, color }) {
  if (history.length < 2) return <svg width="72" height="28" />;
  const min = Math.min(...history);
  const max = Math.max(...history);
  const range = max - min || 1;
  const pts = history
    .map((v, i) => {
      const x = (i / (history.length - 1)) * 70 + 1;
      const y = 26 - ((v - min) / range) * 24;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg width="72" height="28" viewBox="0 0 72 28">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export default function App() {
  const [rows, setRows] = useState(loadStored);
  const [symbolInput, setSymbolInput] = useState("");
  const [sharesInput, setSharesInput] = useState("");
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const pollRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
    } catch {
      /* ignore */
    }
  }, [rows]);

  const refreshQuotes = useCallback(async () => {
    setRows((current) => {
      if (current.length === 0) return current;
      const symbols = current.map((r) => r.symbol).join(",");
      fetch(`/api/quote?symbols=${encodeURIComponent(symbols)}`)
        .then((res) => res.json())
        .then((quotes) => {
          setRows((prev) =>
            prev.map((r) => {
              const q = quotes[r.symbol];
              if (!q || q.error) {
                return { ...r, error: q?.error || "No data" };
              }
              const history = [...r.history, q.price].slice(-24);
              return {
                ...r,
                name: q.name || r.name,
                price: q.price,
                previousClose: q.previousClose,
                history,
                error: null,
              };
            })
          );
          setLastUpdated(new Date());
        })
        .catch(() => {
          setRows((prev) => prev.map((r) => ({ ...r, error: "Fetch failed" })));
        });
      return current;
    });
  }, []);

  useEffect(() => {
    refreshQuotes();
    pollRef.current = setInterval(refreshQuotes, POLL_MS);
    return () => clearInterval(pollRef.current);
  }, [refreshQuotes]);

  const addSymbol = useCallback(() => {
    const sym = symbolInput.trim().toUpperCase();
    if (!sym) return;
    if (rows.some((r) => r.symbol === sym)) {
      setError(`${sym} is already on your ledger.`);
      return;
    }
    const shares = Number(sharesInput) || 0;
    setRows((prev) => [
      ...prev,
      { symbol: sym, name: "", shares, price: null, previousClose: null, history: [], error: null },
    ]);
    setSymbolInput("");
    setSharesInput("");
    setError("");
    setTimeout(refreshQuotes, 300);
  }, [symbolInput, sharesInput, rows, refreshQuotes]);

  const removeSymbol = (sym) => {
    setRows((prev) => prev.filter((r) => r.symbol !== sym));
  };

  const totalValue = rows.reduce((sum, r) => sum + (r.shares > 0 && r.price ? r.price * r.shares : 0), 0);
  const hasHoldings = rows.some((r) => r.shares > 0);

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=VT323&family=Space+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; }
        .lg-row { transition: background-color 0.4s ease; }
        .lg-btn:hover { filter: brightness(1.1); }
        .lg-btn:active { transform: translateY(1px); }
        .lg-input { outline: none; }
        .lg-input:focus { border-color: ${C.band} !important; }
        .lg-x:hover { opacity: 1 !important; }
        .lg-table-wrap { overflow-x: auto; }
        table.lg { width: 100%; border-collapse: collapse; min-width: 640px; }
        table.lg th { text-align: left; font-family: ${fonts.body}; font-size: 11px; letter-spacing: 0.06em; color: ${C.paper}; padding: 10px 14px; }
        table.lg td { padding: 12px 14px; border-bottom: 1px solid ${C.ruleLine}; }
        @media (max-width: 560px) {
          .lg-title { font-size: 26px !important; }
        }
      `}</style>

      <div style={styles.band}>
        <div className="lg-title" style={styles.title}>THE WATCHLIST LEDGER</div>
        <div style={styles.subtitle}>
          {lastUpdated ? `Last updated ${lastUpdated.toLocaleTimeString()}` : "Fetching live quotes…"}
        </div>
      </div>

      <div style={styles.controlBar}>
        <input
          className="lg-input"
          style={styles.input}
          placeholder="SYMBOL e.g. AAPL, RELIANCE.NSE"
          value={symbolInput}
          onChange={(e) => setSymbolInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addSymbol()}
        />
        <input
          className="lg-input"
          style={{ ...styles.input, width: 130 }}
          placeholder="shares (optional)"
          value={sharesInput}
          onChange={(e) => setSharesInput(e.target.value.replace(/[^0-9.]/g, ""))}
          onKeyDown={(e) => e.key === "Enter" && addSymbol()}
        />
        <button className="lg-btn" style={styles.addBtn} onClick={addSymbol}>
          + Add to Ledger
        </button>
        {error && <span style={styles.errorText}>{error}</span>}
      </div>

      <div className="lg-table-wrap">
        <table className="lg">
          <thead>
            <tr style={{ background: C.band }}>
              <th>SYMBOL</th>
              <th>TREND</th>
              <th>PRICE</th>
              <th>CHANGE</th>
              <th>SHARES</th>
              <th>VALUE</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const changePct =
                r.price != null && r.previousClose
                  ? ((r.price - r.previousClose) / r.previousClose) * 100
                  : null;
              const up = changePct !== null && changePct >= 0;
              const color = changePct === null ? C.inkFaint : up ? C.gain : C.loss;
              const rowBg = i % 2 === 0 ? C.paper : C.stripe;
              return (
                <tr key={r.symbol} className="lg-row" style={{ background: rowBg }}>
                  <td>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{r.symbol}</div>
                    {r.name && <div style={{ fontSize: 11, color: C.inkFaint }}>{r.name}</div>}
                    {r.error && <div style={{ fontSize: 11, color: C.loss }}>{r.error}</div>}
                  </td>
                  <td><Sparkline history={r.history} color={color} /></td>
                  <td>
                    <span style={{ fontFamily: fonts.digital, fontSize: 26, color: C.ink }}>
                      {fmt(r.price)}
                    </span>
                  </td>
                  <td>
                    {changePct !== null && (
                      <span style={{ ...styles.changePill, background: up ? C.gainBg : C.lossBg, color }}>
                        {up ? "▲" : "▼"} {fmt(Math.abs(changePct))}%
                      </span>
                    )}
                  </td>
                  <td style={{ fontSize: 13 }}>{r.shares > 0 ? r.shares : "—"}</td>
                  <td style={{ fontSize: 13, fontWeight: 700 }}>
                    {r.shares > 0 && r.price ? fmt(r.price * r.shares, 0) : "—"}
                  </td>
                  <td>
                    <button className="lg-x" style={styles.xBtn} onClick={() => removeSymbol(r.symbol)} title="Remove">
                      ✕
                    </button>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: 24, textAlign: "center", color: C.inkFaint }}>
                  Your ledger is empty — add a symbol above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {hasHoldings && (
        <div style={styles.totalBar}>
          <span style={{ fontSize: 13, letterSpacing: "0.05em" }}>TOTAL HOLDINGS VALUE</span>
          <span style={{ fontFamily: fonts.digital, fontSize: 30, color: C.paper }}>{fmt(totalValue, 0)}</span>
        </div>
      )}

      <div style={styles.footer}>
        Quotes refresh every 20 seconds via Twelve Data. Your ledger is saved in this browser.
      </div>
    </div>
  );
}

const styles = {
  page: {
    background: C.paper,
    minHeight: "100vh",
    fontFamily: fonts.body,
    color: C.ink,
    paddingBottom: 40,
  },
  band: {
    background: `linear-gradient(135deg, ${C.band}, ${C.bandLight})`,
    color: C.paper,
    padding: "26px 24px 20px",
  },
  title: {
    fontFamily: fonts.body,
    fontWeight: 700,
    fontSize: 22,
    letterSpacing: "0.08em",
  },
  subtitle: {
    fontSize: 12.5,
    opacity: 0.85,
    marginTop: 6,
  },
  controlBar: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 10,
    padding: "18px 24px",
    borderBottom: `1px solid ${C.ruleLine}`,
  },
  input: {
    background: C.paper,
    border: `1.5px solid ${C.ruleLine}`,
    borderRadius: 3,
    padding: "9px 12px",
    fontFamily: fonts.body,
    fontSize: 13,
    color: C.ink,
    width: 220,
  },
  addBtn: {
    background: C.band,
    color: C.paper,
    border: "none",
    borderRadius: 3,
    padding: "10px 16px",
    fontFamily: fonts.body,
    fontWeight: 700,
    fontSize: 12.5,
    cursor: "pointer",
    letterSpacing: "0.03em",
  },
  errorText: { color: C.loss, fontSize: 12.5 },
  changePill: {
    display: "inline-block",
    fontSize: 12.5,
    fontWeight: 700,
    padding: "3px 9px",
    borderRadius: 20,
  },
  xBtn: {
    background: "transparent",
    border: "none",
    color: C.inkFaint,
    opacity: 0.5,
    cursor: "pointer",
    fontSize: 13,
  },
  totalBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: C.band,
    color: C.paper,
    padding: "16px 24px",
    margin: "0 24px",
    borderRadius: 4,
  },
  footer: {
    marginTop: 26,
    padding: "0 24px",
    fontSize: 11.5,
    color: C.inkFaint,
    textAlign: "center",
  },
};
