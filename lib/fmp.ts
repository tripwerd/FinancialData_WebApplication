import type { CompanyProfile, SearchResult } from "@/types/financial";

const BASE_URL = "https://financialmodelingprep.com/stable";

function getApiKey(): string {
  const key = process.env.FMP_API_KEY;
  if (!key) {
    throw new Error("FMP_API_KEY environment variable is not set");
  }
  return key;
}

export async function searchCompanies(query: string): Promise<SearchResult[]> {
  const response = await fetch(
    `${BASE_URL}/search-name?query=${encodeURIComponent(query)}&limit=10&apikey=${getApiKey()}`
  );

  if (!response.ok) {
    throw new Error(`FMP API error: ${response.status}`);
  }

  return response.json();
}

export async function getCompanyProfile(
  symbol: string
): Promise<CompanyProfile | null> {
  const response = await fetch(
    `${BASE_URL}/profile?symbol=${symbol.toUpperCase()}&apikey=${getApiKey()}`
  );

  if (!response.ok) {
    throw new Error(`FMP API error: ${response.status}`);
  }

  const data = await response.json();
  return data[0] || null;
}

interface RatiosTTM {
  symbol: string;
  operatingProfitMarginTTM: number;
  priceToEarningsRatioTTM: number;
  freeCashFlowPerShareTTM: number;
  revenuePerShareTTM: number;
  netIncomePerShareTTM: number;
  debtToEquityRatioTTM: number;
}

export async function getRatiosTTM(symbol: string): Promise<RatiosTTM | null> {
  const response = await fetch(
    `${BASE_URL}/ratios-ttm?symbol=${symbol.toUpperCase()}&apikey=${getApiKey()}`
  );

  if (!response.ok) {
    // Return null for 402 (payment required) - data not available on current tier
    if (response.status === 402) {
      return null;
    }
    throw new Error(`FMP API error: ${response.status}`);
  }

  const data = await response.json();
  return data[0] || null;
}

export interface CompanyDisplayData {
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
  isLimited?: false;
}

export interface LimitedCompanyData {
  symbol: string;
  companyName: string;
  marketCap: number;
  beta: number;
  isLimited: true;
}

export type CompanyData = CompanyDisplayData | LimitedCompanyData;

export async function getFullCompanyData(
  symbol: string
): Promise<CompanyData | null> {
  const [profile, ratios] = await Promise.all([
    getCompanyProfile(symbol),
    getRatiosTTM(symbol),
  ]);

  if (!profile) {
    return null;
  }

  // If ratios aren't available, return limited data
  if (!ratios) {
    return {
      symbol: profile.symbol,
      companyName: profile.companyName,
      marketCap: profile.marketCap,
      beta: profile.beta,
      isLimited: true,
    };
  }

  // Calculate shares outstanding from market cap and price
  const sharesOutstanding = profile.marketCap / profile.price;

  // Calculate absolute values from per-share data
  const revenueTTM = ratios.revenuePerShareTTM * sharesOutstanding;
  const earningsTTM = ratios.netIncomePerShareTTM * sharesOutstanding;
  const fcfTTM = ratios.freeCashFlowPerShareTTM * sharesOutstanding;

  return {
    symbol: profile.symbol,
    companyName: profile.companyName,
    marketCap: profile.marketCap,
    revenueTTM,
    earningsTTM,
    beta: profile.beta,
    operatingMargin: ratios.operatingProfitMarginTTM,
    peRatio: ratios.priceToEarningsRatioTTM || null,
    fcfTTM,
    debtToEquity: ratios.debtToEquityRatioTTM,
    isLimited: false,
  };
}

export interface HistoricalMarketCap {
  symbol: string;
  date: string;
  marketCap: number;
}

interface HistoricalPrice {
  date: string;
  close: number;
}

async function getHistoricalPrices(symbol: string): Promise<HistoricalPrice[]> {
  const response = await fetch(
    `${BASE_URL}/historical-price-eod/full?symbol=${symbol.toUpperCase()}&apikey=${getApiKey()}`
  );

  if (!response.ok) {
    throw new Error(`FMP API error: ${response.status}`);
  }

  const data = await response.json();
  return data || [];
}

// Get estimated historical market cap (10 years, calculated from price * shares)
export async function getEstimatedHistoricalMarketCap(
  symbol: string,
  years: number = 10
): Promise<HistoricalMarketCap[]> {
  // Fetch profile and historical prices in parallel
  const [profile, prices] = await Promise.all([
    getCompanyProfile(symbol),
    getHistoricalPrices(symbol),
  ]);

  if (!profile || prices.length === 0) {
    return [];
  }

  // Calculate shares outstanding from current market cap and price
  const sharesOutstanding = profile.marketCap / profile.price;

  // Filter to last N years
  const cutoffDate = new Date();
  cutoffDate.setFullYear(cutoffDate.getFullYear() - years);

  // Calculate historical market cap from price * shares
  return prices
    .filter((p) => new Date(p.date) >= cutoffDate)
    .map((p) => ({
      symbol: symbol.toUpperCase(),
      date: p.date,
      marketCap: p.close * sharesOutstanding,
    }));
}

// Get exact historical market cap (limited to ~3 months on free tier)
export async function getExactHistoricalMarketCap(
  symbol: string
): Promise<HistoricalMarketCap[]> {
  const response = await fetch(
    `${BASE_URL}/historical-market-capitalization?symbol=${symbol.toUpperCase()}&apikey=${getApiKey()}`
  );

  if (!response.ok) {
    if (response.status === 402) {
      return [];
    }
    throw new Error(`FMP API error: ${response.status}`);
  }

  const data: HistoricalMarketCap[] = await response.json();
  return data || [];
}

// Backwards compatibility
export async function getHistoricalMarketCap(
  symbol: string,
  years: number = 10
): Promise<HistoricalMarketCap[]> {
  return getEstimatedHistoricalMarketCap(symbol, years);
}
