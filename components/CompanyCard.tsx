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
  suggestedTickers?: string[];
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
  suggestedTickers = [],
}: CompanyCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [advancedExpanded, setAdvancedExpanded] = useState(false);
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
            <p className="text-sm text-text-muted">Revenue (TTM)</p>
            <p className="text-lg font-medium">{formatCurrency(revenueTTM)}</p>
          </div>
          <div>
            <p className="text-sm text-text-muted">Earnings (TTM)</p>
            <p className="text-lg font-medium">{formatCurrency(earningsTTM)}</p>
          </div>
        </div>
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
  );
}
