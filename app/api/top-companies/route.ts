import { NextResponse } from "next/server";
import { getFullCompanyData, type CompanyData } from "@/lib/fmp";
import { COMPANY_LISTS } from "@/lib/company-lists";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sector = searchParams.get("sector") || "all";
  const symbols = COMPANY_LISTS[sector];
  if (!symbols) return NextResponse.json({ error: "Unknown sector" }, { status: 400 });

  try {
    const results = await Promise.all(symbols.map(async (symbol) => {
      try {
        return await getFullCompanyData(symbol);
      } catch (error) {
        console.error(`Failed to load ${symbol}:`, error);
        return null;
      }
    }));
    const companies = results.filter((item): item is CompanyData => item !== null);
    if (companies.length === 0) {
      return NextResponse.json({ error: "Company data temporarily unavailable" }, { status: 503 });
    }
    // Rank only within the curated selection.
    companies.sort((a, b) => b.marketCap - a.marketCap);
    return NextResponse.json(companies, {
      headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600" },
    });
  } catch (error) {
    console.error("Error fetching selected companies:", error);
    return NextResponse.json({ error: "Failed to fetch selected companies" }, { status: 500 });
  }
}
