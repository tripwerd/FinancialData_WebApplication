import type { CompanyDisplayData } from "./fmp";

export async function searchTicker(
  ticker: string
): Promise<CompanyDisplayData | null> {
  const response = await fetch(`/api/search?q=${encodeURIComponent(ticker)}`);
  if (!response.ok) {
    throw new Error("Failed to search for ticker");
  }
  return response.json();
}
