"use client";

import { useState } from "react";

interface LimitedCompanyCardProps {
  symbol: string;
  companyName: string;
  marketCap: number;
  beta: number;
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

export default function LimitedCompanyCard({
  symbol,
  companyName,
  marketCap,
  beta,
}: LimitedCompanyCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="w-full rounded-lg border border-card-border bg-card-bg p-5">
      {/* Header */}
      <div
        className="flex cursor-pointer items-center justify-between"
        onClick={() => setExpanded(!expanded)}
      >
        <div>
          <span className="text-lg font-semibold text-green-primary">
            {symbol}
          </span>
          <h2 className="text-xl font-medium text-foreground">
            {companyName}
          </h2>
        </div>
        <span className="text-2xl text-text-muted">
          {expanded ? "−" : "+"}
        </span>
      </div>

      {/* Collapsed view - core metrics */}
      <div className="mt-4 grid grid-cols-3 gap-4">
        <div>
          <p className="text-sm text-text-muted">Market Cap</p>
          <p className="text-lg font-medium">{formatCurrency(marketCap)}</p>
        </div>
        <div>
          <p className="text-sm text-text-muted">Revenue (TTM)</p>
          <p className="text-lg font-medium text-text-muted">N/A</p>
        </div>
        <div>
          <p className="text-sm text-text-muted">Earnings (TTM)</p>
          <p className="text-lg font-medium text-text-muted">N/A</p>
        </div>
      </div>

      {/* Expanded view - limited message */}
      {expanded && (
        <div className="mt-4 border-t border-card-border pt-4">
          <p className="text-text-muted">
            Additional data on this company is not available.
          </p>
        </div>
      )}
    </div>
  );
}
