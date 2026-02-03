import { NextResponse } from "next/server";
import { getTopCompaniesByMarketCap, getFullCompanyData, type CompanyData, type LimitedCompanyData } from "@/lib/fmp";

// Tickers to exclude from screener results
const EXCLUDED_TICKERS = new Set(["HONIV", "GOOGL"]);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    const industriesParam = searchParams.get("industries");
    const quickMode = searchParams.get("quick") === "true";

    const limit = limitParam ? parseInt(limitParam, 10) : 50;
    const industries = industriesParam ? industriesParam.split(",") : undefined;

    // Step 1: Get top companies from screener (request extra to account for exclusions)
    const screenerResults = await getTopCompaniesByMarketCap(limit + EXCLUDED_TICKERS.size, industries);

    // Filter out excluded tickers
    const filteredResults = screenerResults
      .filter(r => !EXCLUDED_TICKERS.has(r.symbol))
      .slice(0, limit);

    if (filteredResults.length === 0) {
      return NextResponse.json([]);
    }

    // Quick mode: return screener data immediately as limited company data
    if (quickMode) {
      const limitedCompanies: LimitedCompanyData[] = filteredResults.map(r => ({
        symbol: r.symbol,
        companyName: r.companyName,
        marketCap: r.marketCap,
        beta: r.beta,
        isLimited: true,
      }));
      return NextResponse.json(limitedCompanies);
    }

    // Step 2: Fetch full data for each company in parallel batches
    const batchSize = 10;
    const companies: CompanyData[] = [];

    for (let i = 0; i < filteredResults.length; i += batchSize) {
      const batch = filteredResults.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(async (result) => {
          try {
            return await getFullCompanyData(result.symbol);
          } catch {
            return null;
          }
        })
      );

      batchResults.forEach((data) => {
        if (data) {
          companies.push(data);
        }
      });
    }

    return NextResponse.json(companies);
  } catch (error) {
    console.error("Error fetching top companies:", error);
    const errorMessage = error instanceof Error ? error.message : "";
    if (errorMessage.includes("429")) {
      return NextResponse.json(
        { error: "rate_limit" },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { error: "Failed to fetch top companies" },
      { status: 500 }
    );
  }
}
