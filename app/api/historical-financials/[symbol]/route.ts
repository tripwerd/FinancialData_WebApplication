import { NextResponse } from "next/server";
import { getHistoricalIncomeStatement } from "@/lib/fmp";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params;

    const data = await getHistoricalIncomeStatement(symbol);

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: "Historical data not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching historical financials:", error);
    const errorMessage = error instanceof Error ? error.message : "";
    if (errorMessage.includes("429")) {
      return NextResponse.json(
        { error: "rate_limit" },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { error: "Failed to fetch historical data" },
      { status: 500 }
    );
  }
}
