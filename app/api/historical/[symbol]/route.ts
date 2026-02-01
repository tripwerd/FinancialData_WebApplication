import { NextResponse } from "next/server";
import { getEstimatedHistoricalMarketCap, getExactHistoricalMarketCap } from "@/lib/fmp";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params;
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode") || "estimated";

    const data = mode === "exact"
      ? await getExactHistoricalMarketCap(symbol)
      : await getEstimatedHistoricalMarketCap(symbol, 10);

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: "Historical data not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching historical data:", error);
    return NextResponse.json(
      { error: "Failed to fetch historical data" },
      { status: 500 }
    );
  }
}
