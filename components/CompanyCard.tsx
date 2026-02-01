"use client";

import { useState } from "react";
import ComparisonChart from "./ComparisonChart";

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
}

function formatCurrency(num: number): string {
  const absNum = Math.abs(num);
  const sign = num < 0 ? "-" : "";
  if (absNum >= 1e12) {
    return `${sign}$${(absNum / 1e12).toFixed(2)}T`;
  }
  if (absNum >= 1e9) {
    return `${sign}$${(absNum / 1e9).toFixed(2)}B`;
  }
  if (absNum >= 1e6) {
    return `${sign}$${(absNum / 1e6).toFixed(2)}M`;
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
}: CompanyCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [compareSymbol, setCompareSymbol] = useState("");
  const [compareCompany, setCompareCompany] = useState<string | null>(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareError, setCompareError] = useState<string | null>(null);

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

  return (
    <div className="w-full rounded-lg border border-card-border bg-card-bg p-5">
      {/* Header */}
      <div
        className="flex cursor-pointer items-center justify-between"
        onClick={() => !comparing && setExpanded(!expanded)}
      >
        <div>
          <span className="text-lg font-semibold text-green-primary">
            {symbol}
          </span>
          <h2 className="text-xl font-medium text-foreground">
            {companyName}
          </h2>
        </div>
        {!comparing && (
          <span className="text-2xl text-text-muted">
            {expanded ? "−" : "+"}
          </span>
        )}
      </div>

      {/* Collapsed view - core metrics */}
      <div className="mt-4 grid grid-cols-3 gap-4">
        <div>
          <p className="text-sm text-text-muted">Market Cap</p>
          <p className="text-lg font-medium">{formatCurrency(marketCap)}</p>
        </div>
        <div>
          <p className="text-sm text-text-muted">Revenue (TTM)</p>
          <p className="text-lg font-medium">{formatCurrency(revenueTTM)}</p>
        </div>
        <div>
          <p className="text-sm text-text-muted">Earnings (TTM)</p>
          <p className="text-lg font-medium">{formatCurrency(earningsTTM)}</p>
        </div>
      </div>

      {/* Expanded view - all metrics */}
      {expanded && !comparing && (
        <>
          <div className="mt-4 grid grid-cols-2 gap-4 border-t border-card-border pt-4 sm:grid-cols-5">
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

          <div className="mt-4 border-t border-card-border pt-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setComparing(true);
              }}
              className="rounded-lg bg-green-primary px-4 py-2 font-medium text-black transition-colors hover:bg-green-light"
            >
              Compare
            </button>
          </div>
        </>
      )}

      {/* Compare mode */}
      {comparing && (
        <div className="mt-4 border-t border-card-border pt-4">
          {!compareCompany ? (
            <>
              <p className="mb-3 text-sm text-text-muted">
                Enter a ticker to compare with {symbol}
              </p>
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
                  className="rounded-lg bg-green-primary px-4 py-2 font-medium text-black transition-colors hover:bg-green-light disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={(e) => e.stopPropagation()}
                >
                  {compareLoading ? "..." : "Go"}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCloseCompare();
                  }}
                  className="rounded-lg border border-card-border px-4 py-2 text-text-muted transition-colors hover:border-foreground hover:text-foreground"
                >
                  Cancel
                </button>
              </form>
              {compareError && (
                <p className="mt-2 text-sm text-red-400">{compareError}</p>
              )}
            </>
          ) : (
            <>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCompareCompany(null);
                      setCompareSymbol("");
                    }}
                    className="rounded-lg border border-card-border px-3 py-1 text-sm text-text-muted transition-colors hover:border-foreground hover:text-foreground"
                  >
                    Compare New Company
                  </button>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCloseCompare();
                  }}
                  className="text-sm text-text-muted hover:text-foreground"
                >
                  Close
                </button>
              </div>
              <ComparisonChart symbol1={symbol} symbol2={compareCompany} />
            </>
          )}
        </div>
      )}
    </div>
  );
}
