"use client";

import { useState } from "react";
import CompanyCard from "@/components/CompanyCard";
import type { CompanyDisplayData } from "@/lib/fmp";

export default function Home() {
  const [ticker, setTicker] = useState("");
  const [company, setCompany] = useState<CompanyDisplayData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!ticker.trim()) return;

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(ticker.trim())}`
      );
      if (!response.ok) {
        throw new Error("Failed to search");
      }
      const data = await response.json();
      setCompany(data);
      if (!data) {
        setError("Ticker not found");
      }
    } catch {
      setError("Something went wrong");
      setCompany(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="mx-auto max-w-2xl px-4 py-16">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-[var(--green-primary)]">
            Compare
          </h1>
          <p className="mt-2 text-[var(--text-muted)]">
            See how companies stack up
          </p>
        </header>

        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-3">
            <input
              type="text"
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              placeholder="Search for a ticker"
              className="flex-1 rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] px-4 py-3 text-[var(--foreground)] placeholder:text-[var(--text-muted)] focus:border-[var(--green-primary)]"
            />
            <button
              type="submit"
              disabled={loading || !ticker.trim()}
              className="rounded-lg bg-[var(--green-primary)] px-6 py-3 font-medium text-black transition-colors hover:bg-[var(--green-light)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "..." : "Search"}
            </button>
          </div>
        </form>

        <div className="space-y-4">
          {error && searched && (
            <p className="text-center text-[var(--text-muted)]">{error}</p>
          )}
          {company && (
            <CompanyCard
              symbol={company.symbol}
              companyName={company.companyName}
              marketCap={company.marketCap}
              revenueTTM={company.revenueTTM}
              earningsTTM={company.earningsTTM}
              beta={company.beta}
              operatingMargin={company.operatingMargin}
              peRatio={company.peRatio}
              fcfTTM={company.fcfTTM}
              debtToEquity={company.debtToEquity}
            />
          )}
        </div>
      </div>
    </div>
  );
}
