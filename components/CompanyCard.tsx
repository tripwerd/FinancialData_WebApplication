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
  return (
    <div className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] p-5">
      <div className="mb-4">
        <span className="text-lg font-semibold text-[var(--green-primary)]">
          {symbol}
        </span>
        <h2 className="text-xl font-medium text-[var(--foreground)]">
          {companyName}
        </h2>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <p className="text-sm text-[var(--text-muted)]">Market Cap</p>
          <p className="text-lg font-medium">{formatCurrency(marketCap)}</p>
        </div>
        <div>
          <p className="text-sm text-[var(--text-muted)]">Revenue (TTM)</p>
          <p className="text-lg font-medium">{formatCurrency(revenueTTM)}</p>
        </div>
        <div>
          <p className="text-sm text-[var(--text-muted)]">Earnings (TTM)</p>
          <p className="text-lg font-medium">{formatCurrency(earningsTTM)}</p>
        </div>
        <div>
          <p className="text-sm text-[var(--text-muted)]">FCF (TTM)</p>
          <p className="text-lg font-medium">{formatCurrency(fcfTTM)}</p>
        </div>
        <div>
          <p className="text-sm text-[var(--text-muted)]">Operating Margin</p>
          <p className="text-lg font-medium">{formatPercent(operatingMargin)}</p>
        </div>
        <div>
          <p className="text-sm text-[var(--text-muted)]">P/E Ratio</p>
          <p className="text-lg font-medium">{formatNumber(peRatio)}</p>
        </div>
        <div>
          <p className="text-sm text-[var(--text-muted)]">Beta</p>
          <p className="text-lg font-medium">{formatNumber(beta)}</p>
        </div>
        <div>
          <p className="text-sm text-[var(--text-muted)]">Debt/Equity</p>
          <p className="text-lg font-medium">{formatNumber(debtToEquity)}</p>
        </div>
      </div>
    </div>
  );
}
