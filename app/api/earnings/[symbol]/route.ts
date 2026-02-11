import { NextResponse } from "next/server";
import { getNextEarnings } from "@/lib/fmp";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params;

    const data = await getNextEarnings(symbol);

    if (!data) {
      return NextResponse.json(
        { error: "Earnings data not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching earnings data:", error);
    const errorMessage = error instanceof Error ? error.message : "";
    if (errorMessage.includes("429")) {
      return NextResponse.json(
        { error: "rate_limit" },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { error: "Failed to fetch earnings data" },
      { status: 500 }
    );
  }
}
