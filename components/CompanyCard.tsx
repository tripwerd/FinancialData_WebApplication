"use client";

import { useState, useEffect } from "react";
import ComparisonChart from "./ComparisonChart";

interface EarningsData {
  date: string;
  epsEstimated: number | null;
  revenueEstimated: number | null;
}

interface CompanyCardProps {
  symbol: string;
  companyName: string;
  marketCap: number;
  revenueTTM: number;
  earningsTTM: number;
  beta: number;
  operatingMargin: number;
  peRatio: number | null;
  fcfTTM: number;
  debtToEquity: number;
  suggestedTickers?: string[];
  rank?: number;
}

function formatCurrency(num: number): string {
  const absNum = Math.abs(num);
  const sign = num < 0 ? "-" : "";
  if (absNum >= 1e12) {
    return `${sign}$${(absNum / 1e12).toFixed(1)}T`;
  }
  if (absNum >= 1e9) {
    return `${sign}$${(absNum / 1e9).toFixed(1)}B`;
  }
  if (absNum >= 1e6) {
    return `${sign}$${(absNum / 1e6).toFixed(1)}M`;
  }
  return `${sign}$${absNum.toLocaleString()}`;
}

function formatPercent(num: number): string {
  return `${(num * 100).toFixed(1)}%`;
}

function formatNumber(num: number | null, decimals: number = 2): string {
  if (num === null) return "N/A";
  return num.toFixed(decimals);
}

export default function CompanyCard({
  symbol,
  companyName,
  marketCap,
  revenueTTM,
  earningsTTM,
  beta,
  operatingMargin,
  peRatio,
  fcfTTM,
  debtToEquity,
  suggestedTickers = [],
  rank,
}: CompanyCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [advancedExpanded, setAdvancedExpanded] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [compareSymbol, setCompareSymbol] = useState("");
  const [compareCompany, setCompareCompany] = useState<string | null>(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareError, setCompareError] = useState<string | null>(null);
  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [earningsLoading, setEarningsLoading] = useState(false);
  const [countdown, setCountdown] = useState<string>("");

  // Fetch earnings data when card expands
  useEffect(() => {
    if (!expanded && !comparing) return;
    if (earnings) return; // Already fetched

    async function fetchEarnings() {
      setEarningsLoading(true);
      try {
        const response = await fetch(`/api/earnings/${symbol}`);
        if (response.ok) {
          const data = await response.json();
          setEarnings(data);
        }
      } catch {
        // Silently fail - earnings is optional
      } finally {
        setEarningsLoading(false);
      }
    }

    fetchEarnings();
  }, [expanded, comparing, symbol, earnings]);

  // Live countdown timer
  useEffect(() => {
    if (!earnings?.date) return;

    function updateCountdown() {
      const now = new Date();
      const earningsDate = new Date(earnings!.date + "T16:00:00"); // Assume 4pm market close
      const diff = earningsDate.getTime() - now.getTime();

      if (diff <= 0) {
        setCountdown("Today");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setCountdown(`${days}d`);
      } else if (hours > 0) {
        setCountdown(`${hours}h`);
      } else {
        setCountdown(`${minutes}m`);
      }
    }

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [earnings]);

  async function handleCompareSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!compareSymbol.trim()) return;

    setCompareLoading(true);
    setCompareError(null);

    try {
      // Verify the ticker exists by fetching its data
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(compareSymbol.trim())}`
      );
      if (response.status === 429) {
        setCompareError("We've temporarily hit our API usage limit. Please try again later - this helps us keep the app free.");
        return;
      }
      if (!response.ok) throw new Error("Failed to search");

      const data = await response.json();
      if (!data) {
        setCompareError("Ticker not found");
        return;
      }

      setCompareCompany(compareSymbol.toUpperCase());
    } catch {
      setCompareError("Something went wrong");
    } finally {
      setCompareLoading(false);
    }
  }

  function handleCloseCompare() {
    setComparing(false);
    setCompareSymbol("");
    setCompareCompany(null);
    setCompareError(null);
  }

  function handleCardClick() {
    if (expanded || comparing) {
      // Collapse everything
      handleCloseCompare();
      setExpanded(false);
    } else {
      // Expand
      setExpanded(true);
    }
  }

  return (
    <div className="w-full rounded-lg border border-card-border bg-card-bg p-5">
      <div className="flex gap-4">
        {/* Rank number on the left */}
        {rank && (
          <div className="flex items-start justify-center">
            <span className="text-lg font-light text-text-muted">
              {rank}
            </span>
          </div>
        )}

        {/* Main content area */}
        <div className="flex-1">
          {/* Clickable area - always clickable */}
          <div
            className="cursor-pointer"
            onClick={handleCardClick}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-lg font-semibold text-green-primary">
                  {symbol}
                </span>
                <h2 className="text-xl font-medium text-foreground">
                  {companyName}
                </h2>
              </div>
              <span className="text-2xl text-text-muted">
                {expanded || comparing ? "−" : "+"}
              </span>
            </div>

        {/* Core metrics - always visible */}
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-text-muted">Market Cap</p>
            <p className="text-lg font-medium">{formatCurrency(marketCap)}</p>
          </div>
          <div>
            <p className="text-sm text-text-muted">Revenue</p>
            <p className="text-lg font-medium">{formatCurrency(revenueTTM)}</p>
          </div>
          <div>
            <p className="text-sm text-text-muted">Earnings</p>
            <p className="text-lg font-medium">{formatCurrency(earningsTTM)}</p>
          </div>
        </div>

        {/* Earnings countdown - positioned under Revenue/Earnings columns, only when expanded */}
        {(expanded || comparing) && earnings && countdown && (
          <div className="mt-3 grid grid-cols-3 gap-4">
            <div></div>
            <div className="col-span-2 flex items-center gap-1.5">
              <span className="text-sm text-text-muted">Earnings & Revenue Update:</span>
              <span className="text-sm font-medium text-green-primary">{countdown}</span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                className="text-green-primary"
              >
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                <line x1="12" y1="12" x2="12" y2="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <line
                  x1="12"
                  y1="12"
                  x2="16"
                  y2="12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  style={{
                    transformOrigin: "12px 12px",
                    animation: "spin 4s linear infinite",
                  }}
                />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Expanded view - Chart, Compare controls, and Advanced */}
      {(expanded || comparing) && (
        <div className="mt-4 border-t border-card-border pt-4">
          {/* Chart - always visible, shows comparison if compareCompany is set */}
          <ComparisonChart symbol1={symbol} symbol2={compareCompany || undefined} />

          {/* Compare controls - consistent position below chart */}
          <div className="mt-4">
            <p className="mb-3 text-sm text-text-muted">
              Compare {symbol} against a different company:
            </p>

            {/* Suggested ticker chips */}
            {suggestedTickers.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {suggestedTickers.map((ticker) => (
                  <button
                    key={ticker}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCompareCompany(ticker);
                      setComparing(true);
                    }}
                    className={`cursor-pointer rounded-full border px-3 py-1 text-sm transition-colors ${
                      compareCompany === ticker
                        ? "border-green-primary text-green-primary"
                        : "border-card-border text-text-muted hover:border-green-primary hover:text-green-primary"
                    }`}
                  >
                    {ticker}
                  </button>
                ))}
              </div>
            )}

            {/* Custom ticker input */}
            <form onSubmit={handleCompareSearch} className="flex gap-3">
              <input
                type="text"
                value={compareSymbol}
                onChange={(e) => setCompareSymbol(e.target.value.toUpperCase())}
                placeholder="Enter a ticker"
                className="flex-1 rounded-lg border border-card-border bg-background px-4 py-2 text-foreground placeholder:text-text-muted focus:border-green-primary"
                onClick={(e) => e.stopPropagation()}
              />
              <button
                type="submit"
                disabled={compareLoading || !compareSymbol.trim()}
                className="cursor-pointer rounded-lg bg-green-primary px-4 py-2 font-medium text-black transition-colors hover:bg-green-light disabled:cursor-not-allowed disabled:opacity-50"
                onClick={(e) => e.stopPropagation()}
              >
                {compareLoading ? "..." : "Go"}
              </button>
            </form>
            {compareError && (
              <p className="mt-2 text-sm text-red-400">{compareError}</p>
            )}
          </div>

          {/* Advanced section */}
          <div className="mt-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setAdvancedExpanded(!advancedExpanded);
              }}
              className="flex cursor-pointer items-center gap-2 text-sm text-text-muted hover:text-foreground"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`transition-transform ${advancedExpanded ? "rotate-90" : ""}`}
              >
                <path d="m9 18 6-6-6-6"/>
              </svg>
              Advanced
            </button>

            {advancedExpanded && (
              <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-5">
                <div>
                  <p className="text-sm text-text-muted">FCF (TTM)</p>
                  <p className="text-lg font-medium">{formatCurrency(fcfTTM)}</p>
                </div>
                <div>
                  <p className="text-sm text-text-muted">Operating Margin</p>
                  <p className="text-lg font-medium">{formatPercent(operatingMargin)}</p>
                </div>
                <div>
                  <p className="text-sm text-text-muted">P/E Ratio</p>
                  <p className="text-lg font-medium">{formatNumber(peRatio)}</p>
                </div>
                <div>
                  <p className="text-sm text-text-muted">Beta</p>
                  <p className="text-lg font-medium">{formatNumber(beta)}</p>
                </div>
                <div>
                  <p className="text-sm text-text-muted">Debt/Equity</p>
                  <p className="text-lg font-medium">{formatNumber(debtToEquity)}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
}
