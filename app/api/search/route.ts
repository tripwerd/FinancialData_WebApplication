import { NextResponse } from "next/server";
import { getFullCompanyData } from "@/lib/fmp";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get("q");

    if (!ticker || ticker.length < 1) {
      return NextResponse.json(null);
    }

    // Exact ticker search - fetch the company directly
    const company = await getFullCompanyData(ticker.toUpperCase());

    if (!company) {
      return NextResponse.json(null);
    }

    return NextResponse.json(company);
  } catch (error) {
    console.error("Error searching for ticker:", error);
    const errorMessage = error instanceof Error ? error.message : "";
    if (errorMessage.includes("429")) {
      return NextResponse.json(
        { error: "rate_limit" },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { error: "Failed to search for ticker" },
      { status: 500 }
    );
  }
}
