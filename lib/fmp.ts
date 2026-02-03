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

// Get exact historical market cap with date range support
export async function getExactHistoricalMarketCap(
  symbol: string,
  years: number = 5
): Promise<HistoricalMarketCap[]> {
  const to = new Date();
  const from = new Date();
  from.setFullYear(from.getFullYear() - years);

  const fromStr = from.toISOString().split("T")[0];
  const toStr = to.toISOString().split("T")[0];

  const response = await fetch(
    `${BASE_URL}/historical-market-capitalization?symbol=${symbol.toUpperCase()}&from=${fromStr}&to=${toStr}&limit=5000&apikey=${getApiKey()}`
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
  quarters: number = 40
): Promise<HistoricalFinancials[]> {
  const response = await fetch(
    `${BASE_URL}/income-statement?symbol=${symbol.toUpperCase()}&period=quarterly&limit=${quarters}&apikey=${getApiKey()}`
  );

  if (!response.ok) {
    if (response.status === 402) {
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

// Screener result from FMP
export interface ScreenerResult {
  symbol: string;
  companyName: string;
  marketCap: number;
  sector: string;
  industry: string;
  beta: number;
  price: number;
  isEtf: boolean;
  isFund: boolean;
}

// Get top companies by market cap, optionally filtered by industries
export async function getTopCompaniesByMarketCap(
  limit: number = 50,
  industries?: string[]
): Promise<ScreenerResult[]> {
  let url = `${BASE_URL}/company-screener?sortBy=marketCap&sortOrder=desc&limit=${limit}&isEtf=false&isFund=false&apikey=${getApiKey()}`;

  if (industries && industries.length > 0) {
    const industriesParam = industries.map(i => encodeURIComponent(i)).join(",");
    url += `&industry=${industriesParam}`;
  }

  const response = await fetch(url);

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("429");
    }
    throw new Error(`FMP API error: ${response.status}`);
  }

  const data: ScreenerResult[] = await response.json();
  return data || [];
}
