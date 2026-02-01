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
  symbol2: string;
}

interface HistoricalData {
  symbol: string;
  date: string;
  marketCap: number;
}

interface ChartData {
  date: string;
  [key: string]: string | number;
}

function formatMarketCap(value: number): string {
  if (value >= 1e12) {
    return `$${(value / 1e12).toFixed(1)}T`;
  }
  if (value >= 1e9) {
    return `$${(value / 1e9).toFixed(0)}B`;
  }
  return `$${(value / 1e6).toFixed(0)}M`;
}

export default function ComparisonChart({
  symbol1,
  symbol2,
}: ComparisonChartProps) {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        const [res1, res2] = await Promise.all([
          fetch(`/api/historical/${symbol1}`),
          fetch(`/api/historical/${symbol2}`),
        ]);

        if (!res1.ok || !res2.ok) {
          throw new Error("Failed to fetch historical data");
        }

        const data1: HistoricalData[] = await res1.json();
        const data2: HistoricalData[] = await res2.json();

        // Create a map of dates to values
        const dateMap = new Map<string, ChartData>();

        // Add data from symbol1
        data1.forEach((d) => {
          dateMap.set(d.date, {
            date: d.date,
            [symbol1]: d.marketCap,
          });
        });

        // Add data from symbol2
        data2.forEach((d) => {
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

        // Convert to array and sort by date
        const combined = Array.from(dateMap.values())
          .filter((d) => d[symbol1] && d[symbol2]) // Only include dates with both values
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // Sample to reduce data points (every 5th day for smoother chart)
        const sampled = combined.filter((_, i) => i % 5 === 0);

        setChartData(sampled);
      } catch {
        setError("Failed to load chart data");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [symbol1, symbol2]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-[var(--text-muted)]">Loading chart...</p>
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
        <p className="text-[var(--text-muted)]">No data available</p>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: 320 }}>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={chartData}>
          <XAxis
            dataKey="date"
            stroke="#a3a3a3"
            tick={{ fill: "#a3a3a3", fontSize: 12 }}
            tickFormatter={(value) => {
              const date = new Date(value);
              return `${date.getMonth() + 1}/${date.getFullYear().toString().slice(2)}`;
            }}
            interval="preserveStartEnd"
            minTickGap={50}
          />
          <YAxis
            stroke="#a3a3a3"
            tick={{ fill: "#a3a3a3", fontSize: 12 }}
            tickFormatter={formatMarketCap}
            width={70}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#171717",
              border: "1px solid #262626",
              borderRadius: "8px",
            }}
            labelStyle={{ color: "#e5e5e5" }}
            formatter={(value) => [
              formatMarketCap(value as number),
              "",
            ]}
            labelFormatter={(label) => {
              const date = new Date(label);
              return date.toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              });
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
          <Line
            type="monotone"
            dataKey={symbol2}
            stroke="#60a5fa"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
