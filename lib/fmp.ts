import type { CompanyProfile } from "@/types/financial";

const BASE_URL = "https://financialmodelingprep.com/stable";

// Cache identical upstream requests across visitors for one day.
const FMP_CACHE_SECONDS = 24 * 60 * 60;
function fmpFetch(url: string) {
  return fetch(url, { next: { revalidate: FMP_CACHE_SECONDS } });
}

function getApiKey(): string {
  const key = process.env.FMP_API_KEY;
  if (!key) {
    throw new Error("FMP_API_KEY environment variable is not set");
  }
  return key;
}

export async function getCompanyProfile(
  symbol: string
): Promise<CompanyProfile | null> {
  const response = await fmpFetch(
    `${BASE_URL}/profile?symbol=${encodeURIComponent(symbol.toUpperCase())}&apikey=${getApiKey()}`
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
  const response = await fmpFetch(
    `${BASE_URL}/ratios-ttm?symbol=${encodeURIComponent(symbol.toUpperCase())}&apikey=${getApiKey()}`
  );

  if (!response.ok) {
    // Return null for 402 (payment required) - data not available on current tier
    if (response.status === 402 || response.status === 403) {
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
  price: number;
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
  const profile = await getCompanyProfile(symbol);
  if (!profile) return null;
  // Basic limits ratios to a small symbol set. A denied request becomes profile-only data.
  const ratios = await getRatiosTTM(symbol);

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
    price: profile.price,
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

export async function getFullHistoricalMarketCap(
  symbol: string
): Promise<HistoricalMarketCap[]> {
  // Basic permits at most one month of exact market-cap history.
  const to = new Date();
  const from = new Date(to);
  from.setMonth(from.getMonth() - 1);
  const fromStr = from.toISOString().split("T")[0];
  const toStr = to.toISOString().split("T")[0];
  const response = await fmpFetch(
    `${BASE_URL}/historical-market-capitalization?symbol=${encodeURIComponent(symbol.toUpperCase())}&from=${fromStr}&to=${toStr}&apikey=${getApiKey()}`
  );
  if (response.status === 402 || response.status === 403) return [];
  if (!response.ok) throw new Error(`FMP API error: ${response.status}`);
  const data: HistoricalMarketCap[] = await response.json();
  return Array.isArray(data) ? data : [];
}

// Historical income statement data
export interface HistoricalFinancials {
  symbol: string;
  date: string;
  revenue: number;
  netIncome: number;
}

interface IncomeStatementRecord {
  date: string;
  symbol: string;
  revenue: number;
  netIncome: number;
}

export async function getHistoricalIncomeStatement(
  symbol: string,
  quarters: number = 5
): Promise<HistoricalFinancials[]> {
  const response = await fmpFetch(
    `${BASE_URL}/income-statement?symbol=${encodeURIComponent(symbol.toUpperCase())}&period=quarterly&limit=${quarters}&apikey=${getApiKey()}`
  );

  if (!response.ok) {
    if (response.status === 402 || response.status === 403) {
      return [];
    }
    throw new Error(`FMP API error: ${response.status}`);
  }

  const data: IncomeStatementRecord[] = await response.json();

  if (!data || data.length === 0) {
    return [];
  }

  return data.map((d) => ({
    symbol: d.symbol,
    date: d.date,
    revenue: d.revenue,
    netIncome: d.netIncome,
  }));
}

// Earnings data from FMP
export interface EarningsData {
  symbol: string;
  date: string;
  epsActual: number | null;
  epsEstimated: number | null;
  revenueActual: number | null;
  revenueEstimated: number | null;
}

export async function getNextEarnings(symbol: string): Promise<EarningsData | null> {
  const response = await fmpFetch(
    `${BASE_URL}/earnings?symbol=${encodeURIComponent(symbol.toUpperCase())}&limit=5&apikey=${getApiKey()}`
  );

  if (!response.ok) {
    if (response.status === 402 || response.status === 403) {
      return null;
    }
    throw new Error(`FMP API error: ${response.status}`);
  }

  const data: EarningsData[] = await response.json();
  if (!data || data.length === 0) {
    return null;
  }

  // Find the nearest upcoming earnings (where epsActual is null, closest future date)
  const now = new Date();
  const upcomingEntries = data
    .filter((d) => d.epsActual === null && new Date(d.date) >= now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  if (upcomingEntries.length === 0) return null;
  const upcoming = upcomingEntries[0];

  // If estimates aren't published yet for the upcoming quarter,
  // fill them in from the most recent quarter that has estimates
  if (upcoming.epsEstimated === null || upcoming.revenueEstimated === null) {
    const withEstimates = data.find((d) => d.epsEstimated !== null && d.revenueEstimated !== null);
    if (withEstimates) {
      return {
        ...upcoming,
        epsEstimated: upcoming.epsEstimated ?? withEstimates.epsEstimated,
        revenueEstimated: upcoming.revenueEstimated ?? withEstimates.revenueEstimated,
      };
    }
  }

  return upcoming;
}
