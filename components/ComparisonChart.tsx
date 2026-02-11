"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface ComparisonChartProps {
  symbol1: string;
  symbol2?: string;
}

interface HistoricalData {
  symbol: string;
  date: string;
  marketCap: number;
}

interface HistoricalFinancials {
  symbol: string;
  date: string;
  revenue: number;
  netIncome: number;
}

interface ChartData {
  date: string;
  [key: string]: string | number;
}

type ChartMetric = "marketCap" | "revenue" | "earnings";
type TimeRange = "all" | "5year" | "1month";

// Chart data cache with LRU-style eviction
const CACHE_MAX_SIZE = 20;
type CacheKey = string;
type CacheValue = {
  marketCap: HistoricalData[];
  financials: HistoricalFinancials[];
};
const chartCache = new Map<CacheKey, CacheValue>();
const cacheOrder: CacheKey[] = [];

function getCachedData(symbol: string): CacheValue | undefined {
  return chartCache.get(symbol);
}

function setCachedData(symbol: string, data: CacheValue) {
  // If at max size, remove oldest entry
  if (chartCache.size >= CACHE_MAX_SIZE && !chartCache.has(symbol)) {
    const oldest = cacheOrder.shift();
    if (oldest) {
      chartCache.delete(oldest);
    }
  }

  // Update cache order (move to end if exists, or add)
  const existingIndex = cacheOrder.indexOf(symbol);
  if (existingIndex > -1) {
    cacheOrder.splice(existingIndex, 1);
  }
  cacheOrder.push(symbol);

  chartCache.set(symbol, data);
}

// Normalize date to calendar quarter (Q1=Jan-Mar, Q2=Apr-Jun, Q3=Jul-Sep, Q4=Oct-Dec)
function getCalendarQuarter(dateStr: string): string {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-11
  const quarter = Math.floor(month / 3) + 1;
  return `${year}-Q${quarter}`;
}

function formatValue(value: number): string {
  const absValue = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (absValue >= 1e12) {
    return `${sign}$${(absValue / 1e12).toFixed(1)}T`;
  }
  if (absValue >= 1e9) {
    return `${sign}$${(absValue / 1e9).toFixed(0)}B`;
  }
  return `${sign}$${(absValue / 1e6).toFixed(0)}M`;
}

export default function ComparisonChart({
  symbol1,
  symbol2,
}: ComparisonChartProps) {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metric, setMetric] = useState<ChartMetric>("marketCap");
  const [timeRange, setTimeRange] = useState<TimeRange>("5year");

  useEffect(() => {
    async function fetchDataForSymbol(sym: string): Promise<CacheValue> {
      // Check cache first
      const cached = getCachedData(sym);
      if (cached) {
        return cached;
      }

      // Fetch both market cap and financials data
      const [mcapRes, finRes] = await Promise.all([
        fetch(`/api/historical/${sym}`),
        fetch(`/api/historical-financials/${sym}`),
      ]);

      if (mcapRes.status === 429 || finRes.status === 429) {
        throw new Error("rate_limit");
      }

      const marketCap: HistoricalData[] = mcapRes.ok ? await mcapRes.json() : [];
      const financials: HistoricalFinancials[] = finRes.ok ? await finRes.json() : [];

      const data = { marketCap, financials };
      setCachedData(sym, data);
      return data;
    }

    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        // Fetch data for all symbols
        const symbols = symbol2 ? [symbol1, symbol2] : [symbol1];
        const results = await Promise.all(symbols.map(fetchDataForSymbol));

        const data1 = results[0];
        const data2 = results[1] || null;

        if (metric === "marketCap") {
          // Filter data by time range
          const now = new Date();
          let cutoffDate: Date;

          if (timeRange === "1month") {
            cutoffDate = new Date(now);
            cutoffDate.setMonth(cutoffDate.getMonth() - 1);
          } else if (timeRange === "5year") {
            cutoffDate = new Date(now);
            cutoffDate.setFullYear(cutoffDate.getFullYear() - 5);
          } else {
            // "all" - use earliest possible date
            cutoffDate = new Date("1900-01-01");
          }

          const filterByTimeRange = (data: HistoricalData[]) =>
            data.filter((d) => new Date(d.date) >= cutoffDate);

          const filtered1 = filterByTimeRange(data1.marketCap);
          const filtered2 = data2 ? filterByTimeRange(data2.marketCap) : [];

          const dateMap = new Map<string, ChartData>();

          filtered1.forEach((d) => {
            dateMap.set(d.date, {
              date: d.date,
              [symbol1]: d.marketCap,
            });
          });

          if (data2 && symbol2) {
            filtered2.forEach((d) => {
              const existing = dateMap.get(d.date);
              if (existing) {
                existing[symbol2] = d.marketCap;
              } else {
                dateMap.set(d.date, {
                  date: d.date,
                  [symbol2]: d.marketCap,
                });
              }
            });
          }

          // Show all data points (not just overlap) - each company shows from their data start
          const combined = Array.from(dateMap.values())
            .filter((d) => d[symbol1] || (symbol2 && d[symbol2]))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

          // Adjust sampling based on data volume
          let sampleRate: number;
          if (timeRange === "1month") {
            sampleRate = 1; // Show all points for 1 month (~22 points)
          } else if (timeRange === "5year") {
            sampleRate = 5; // Every 5th point (~250 points)
          } else {
            // "all" - adjust based on actual data size
            sampleRate = Math.max(1, Math.floor(combined.length / 500));
          }

          const sampled = combined.filter((_, i) => i % sampleRate === 0);

          setChartData(sampled);
        } else {
          // Use calendar quarters for matching (companies have different fiscal year ends)
          const quarterMap = new Map<string, ChartData>();
          const valueKey = metric === "revenue" ? "revenue" : "netIncome";

          data1.financials.forEach((d) => {
            const quarter = getCalendarQuarter(d.date);
            quarterMap.set(quarter, {
              date: quarter,
              [symbol1]: d[valueKey],
            });
          });

          if (data2 && symbol2) {
            data2.financials.forEach((d) => {
              const quarter = getCalendarQuarter(d.date);
              const existing = quarterMap.get(quarter);
              if (existing) {
                existing[symbol2] = d[valueKey];
              } else {
                quarterMap.set(quarter, {
                  date: quarter,
                  [symbol2]: d[valueKey],
                });
              }
            });
          }

          const combined = Array.from(quarterMap.values())
            .filter((d) => symbol2 ? (d[symbol1] !== undefined && d[symbol2] !== undefined) : d[symbol1] !== undefined)
            .sort((a, b) => a.date.localeCompare(b.date));

          setChartData(combined);
        }
      } catch (err) {
        if (err instanceof Error && err.message === "rate_limit") {
          setError("We've temporarily hit our API usage limit. Please try again later - this helps us keep the app free.");
        } else {
          setError("Failed to load chart data");
        }
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [symbol1, symbol2, metric, timeRange]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-text-muted">Loading chart...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-text-muted">No data available</p>
      </div>
    );
  }

  return (
    <div>
      {/* Metric toggle */}
      <div className="mb-3 flex items-center gap-3">
        <div className="flex rounded-lg border border-card-border overflow-hidden">
          <button
            onClick={() => setMetric("marketCap")}
            className={`cursor-pointer px-3 py-1 text-sm font-medium transition-colors ${
              metric === "marketCap"
                ? "bg-green-primary text-black"
                : "bg-card-bg text-text-muted hover:text-foreground"
            }`}
          >
            Market Cap
          </button>
          <button
            onClick={() => setMetric("revenue")}
            className={`cursor-pointer px-3 py-1 text-sm font-medium transition-colors ${
              metric === "revenue"
                ? "bg-green-primary text-black"
                : "bg-card-bg text-text-muted hover:text-foreground"
            }`}
          >
            Revenue
          </button>
          <button
            onClick={() => setMetric("earnings")}
            className={`cursor-pointer px-3 py-1 text-sm font-medium transition-colors ${
              metric === "earnings"
                ? "bg-green-primary text-black"
                : "bg-card-bg text-text-muted hover:text-foreground"
            }`}
          >
            Earnings
          </button>
        </div>
      </div>

      {/* Time range toggle - only for Market Cap */}
      {metric === "marketCap" && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-sm text-text-muted">Range:</span>
          <div className="flex rounded-lg border border-card-border overflow-hidden">
            <button
              onClick={() => setTimeRange("all")}
              className={`cursor-pointer px-2 py-1 text-xs font-medium transition-colors ${
                timeRange === "all"
                  ? "bg-green-primary text-black"
                  : "bg-card-bg text-text-muted hover:text-foreground"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setTimeRange("5year")}
              className={`cursor-pointer px-2 py-1 text-xs font-medium transition-colors ${
                timeRange === "5year"
                  ? "bg-green-primary text-black"
                  : "bg-card-bg text-text-muted hover:text-foreground"
              }`}
            >
              5Y
            </button>
            <button
              onClick={() => setTimeRange("1month")}
              className={`cursor-pointer px-2 py-1 text-xs font-medium transition-colors ${
                timeRange === "1month"
                  ? "bg-green-primary text-black"
                  : "bg-card-bg text-text-muted hover:text-foreground"
              }`}
            >
              1M
            </button>
          </div>
        </div>
      )}


      {/* Quarterly label for revenue/earnings */}
      {metric !== "marketCap" && (
        <div className="mb-4">
          <span className="text-sm text-text-muted">Quarterly data (~10 years)</span>
        </div>
      )}

      {/* Chart */}
      <div style={{ width: "100%", height: 320 }}>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={chartData}>
            <XAxis
              dataKey="date"
              stroke="#a3a3a3"
              tick={{ fill: "#a3a3a3", fontSize: 12 }}
              tickFormatter={(value) => {
                // Handle quarter format (e.g., "2025-Q4") or date format
                if (value.includes("-Q")) {
                  return value.replace("-", " ");
                }
                const date = new Date(value);
                return `${date.getMonth() + 1}/${date.getFullYear().toString().slice(2)}`;
              }}
              interval="preserveStartEnd"
              minTickGap={50}
            />
            <YAxis
              stroke="#a3a3a3"
              tick={{ fill: "#a3a3a3", fontSize: 12 }}
              tickFormatter={formatValue}
              width={70}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || payload.length === 0 || !label) return null;

                // Sort by value descending (highest first)
                const sortedPayload = [...payload].sort((a, b) => {
                  const valA = (a.value as number) || 0;
                  const valB = (b.value as number) || 0;
                  return valB - valA;
                });

                // Handle quarter format (e.g., "2025-Q4") or date format
                let formattedDate: string;
                if (typeof label === "string" && label.includes("-Q")) {
                  formattedDate = label.replace("-", " ");
                } else {
                  const date = new Date(label);
                  formattedDate = date.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  });
                }

                return (
                  <div
                    style={{
                      backgroundColor: "#171717",
                      border: "1px solid #262626",
                      borderRadius: "8px",
                      padding: "10px",
                    }}
                  >
                    <p style={{ color: "#e5e5e5", marginBottom: "5px" }}>{formattedDate}</p>
                    {sortedPayload.map((entry) => (
                      <p key={entry.dataKey} style={{ color: entry.color }}>
                        {entry.name}: {formatValue(entry.value as number)}
                      </p>
                    ))}
                  </div>
                );
              }}
            />
            <Legend wrapperStyle={{ color: "#e5e5e5" }} />
            <Line
              type="monotone"
              dataKey={symbol1}
              stroke="#22c55e"
              strokeWidth={2}
              dot={false}
            />
            {symbol2 && (
              <Line
                type="monotone"
                dataKey={symbol2}
                stroke="#60a5fa"
                strokeWidth={2}
                dot={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
