export interface CompanyProfile {
  symbol: string;
  companyName: string;
  marketCap: number;
  beta: number;
  sector: string;
  industry: string;
  description: string;
  exchange: string;
  currency: string;
  price: number;
  changes: number;
  image: string;
}

export interface IncomeStatement {
  date: string;
  symbol: string;
  revenue: number;
  netIncome: number;
  grossProfit: number;
  operatingIncome: number;
  eps: number;
  ebitda: number;
}

export interface KeyMetrics {
  symbol: string;
  date: string;
  fiscalYear: string;
  period: string;
  marketCap: number;
  enterpriseValue: number;
  evToSales: number;
  evToEBITDA: number;
  currentRatio: number;
  returnOnAssets: number;
  returnOnEquity: number;
  returnOnInvestedCapital: number;
  netDebtToEBITDA: number;
}

export interface CompanyData {
  profile: CompanyProfile;
  incomeStatements: IncomeStatement[];
  metrics: KeyMetrics | null;
}

export interface SearchResult {
  symbol: string;
  name: string;
  currency: string;
  exchange: string;
  exchangeFullName: string;
}
