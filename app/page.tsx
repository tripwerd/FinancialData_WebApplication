"use client";

import { useState, useEffect } from "react";
import CompanyCard from "@/components/CompanyCard";
import LimitedCompanyCard from "@/components/LimitedCompanyCard";
import type { CompanyData, CompanyDisplayData } from "@/lib/fmp";

type SectorKey =
  | "all"
  | "technology"
  | "financialServices"
  | "foodBeverage"
  | "manufacturing"
  | "transportation"
  | "consumerProducts"
  | "mediaCommunications"
  | "utilitiesEnergy"
  | "realEstateInfrastructure"
  | "healthcareLifeSciences"
  | "naturalResources"
  | "businessServices";

interface SectorConfig {
  label: string;
  industries: string[] | null; // null means no filter (all)
  limit: number;
}

const SECTORS: Record<SectorKey, SectorConfig> = {
  all: {
    label: "All",
    industries: null,
    limit: 25,
  },
  technology: {
    label: "Technology",
    industries: [
      "Computer Hardware",
      "Electronic Gaming & Multimedia",
      "Information Technology Services",
      "Internet Content & Information",
      "Semiconductors",
      "Software - Application",
      "Software - Infrastructure",
      "Software - Services",
      "Technology Distributors",
    ],
    limit: 10,
  },
  financialServices: {
    label: "Financial Services",
    industries: [
      "Asset Management",
      "Asset Management - Bonds",
      "Asset Management - Cryptocurrency",
      "Asset Management - Global",
      "Asset Management - Income",
      "Asset Management - Leveraged",
      "Banks",
      "Banks - Diversified",
      "Banks - Regional",
      "Financial - Capital Markets",
      "Financial - Conglomerates",
      "Financial - Credit Services",
      "Financial - Data & Stock Exchanges",
      "Financial - Diversified",
      "Financial - Mortgages",
      "Insurance - Brokers",
      "Insurance - Diversified",
      "Insurance - Life",
      "Insurance - Property & Casualty",
      "Insurance - Reinsurance",
      "Insurance - Specialty",
      "Investment - Banking & Investment Services",
    ],
    limit: 10,
  },
  foodBeverage: {
    label: "Food & Beverage",
    industries: [
      "Beverages - Alcoholic",
      "Beverages - Non-Alcoholic",
      "Beverages - Wineries & Distilleries",
      "Food Confectioners",
      "Grocery Stores",
      "Restaurants",
    ],
    limit: 10,
  },
  manufacturing: {
    label: "Manufacturing",
    industries: [
      "Aerospace & Defense",
      "Agricultural - Commodities/Milling",
      "Agricultural - Machinery",
      "Agricultural Farm Products",
      "Agricultural Inputs",
      "Business Equipment & Supplies",
      "Construction",
      "Construction Materials",
      "Electrical Equipment & Parts",
      "Engineering & Construction",
      "Hardware, Equipment & Parts",
      "Industrial - Capital Goods",
      "Industrial - Distribution",
      "Industrial - Infrastructure Operations",
      "Industrial - Machinery",
      "Industrial - Pollution & Treatment Controls",
      "Industrial - Specialties",
      "Industrial Materials",
      "Manufacturing - Metal Fabrication",
      "Manufacturing - Miscellaneous",
      "Manufacturing - Textiles",
      "Manufacturing - Tools & Accessories",
    ],
    limit: 10,
  },
  transportation: {
    label: "Travel & Transportation",
    industries: [
      "Airlines, Airports & Air Services",
      "Auto - Dealerships",
      "Auto - Manufacturers",
      "Auto - Parts",
      "Auto - Recreational Vehicles",
      "General Transportation",
      "Integrated Freight & Logistics",
      "Marine Shipping",
      "Railroads",
      "Travel Lodging",
      "Travel Services",
      "Trucking",
    ],
    limit: 10,
  },
  consumerProducts: {
    label: "Consumer Products",
    industries: [
      "Apparel - Footwear & Accessories",
      "Apparel - Manufacturers",
      "Apparel - Retail",
      "Department Stores",
      "Discount Stores",
      "Home Improvement",
      "Household & Personal Products",
      "Leisure",
      "Luxury Goods",
      "Packaged Foods",
      "Personal Products & Services",
      "Specialty Retail",
      "Tobacco",
      "Gambling, Resorts & Casinos",
    ],
    limit: 10,
  },
  mediaCommunications: {
    label: "Media & Communications",
    industries: [
      "Advertising Agencies",
      "Broadcasting",
      "Communication Equipment",
      "Entertainment",
      "Media & Entertainment",
      "Publishing",
      "Telecommunications Services",
    ],
    limit: 10,
  },
  utilitiesEnergy: {
    label: "Utilities & Energy Infrastructure",
    industries: [
      "Diversified Utilities",
      "General Utilities",
      "Independent Power Producers",
      "Oil & Gas Drilling",
      "Oil & Gas Energy",
      "Oil & Gas Equipment & Services",
      "Oil & Gas Exploration & Production",
      "Oil & Gas Integrated",
      "Oil & Gas Midstream",
      "Oil & Gas Refining & Marketing",
      "Regulated Electric",
      "Regulated Gas",
      "Regulated Water",
      "Renewable Utilities",
      "Solar",
    ],
    limit: 10,
  },
  realEstateInfrastructure: {
    label: "Real Estate & Infrastructure",
    industries: [
      "Real Estate - Development",
      "Real Estate - Diversified",
      "Real Estate - General",
      "Real Estate - Services",
      "REIT - Diversified",
      "REIT - Healthcare Facilities",
      "REIT - Hotel & Motel",
      "REIT - Industrial",
      "REIT - Mortgage",
      "REIT - Office",
      "REIT - Residential",
      "REIT - Retail",
      "REIT - Specialty",
      "Rental & Leasing Services",
      "Residential Construction",
    ],
    limit: 10,
  },
  healthcareLifeSciences: {
    label: "Healthcare & Life Sciences",
    industries: [
      "Biotechnology",
      "Drug Manufacturers - General",
      "Drug Manufacturers - Specialty & Generic",
      "Medical - Care Facilities",
      "Medical - Devices",
      "Medical - Diagnostics & Research",
      "Medical - Distribution",
      "Medical - Equipment & Services",
      "Medical - Healthcare Information Services",
      "Medical - Healthcare Plans",
      "Medical - Instruments & Supplies",
      "Medical - Pharmaceuticals",
      "Medical - Specialties",
    ],
    limit: 10,
  },
  naturalResources: {
    label: "Natural Resources",
    industries: [
      "Aluminum",
      "Chemicals",
      "Chemicals - Specialty",
      "Coal",
      "Copper",
      "Gold",
      "Other Precious Metals",
      "Paper, Lumber & Forest Products",
      "Silver",
      "Steel",
      "Uranium",
    ],
    limit: 10,
  },
  businessServices: {
    label: "Business & Professional Services",
    industries: [
      "Conglomerates",
      "Consulting Services",
      "Education & Training Services",
      "Environmental Services",
      "Security & Protection Services",
      "Specialty Business Services",
      "Staffing & Employment Services",
      "Waste Management",
      "Shell Companies",
    ],
    limit: 10,
  },
};

export default function Home() {
  const [ticker, setTicker] = useState("");
  const [searchedCompany, setSearchedCompany] = useState<CompanyData | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const [selectedSector, setSelectedSector] = useState<SectorKey>("all");
  const [companies, setCompanies] = useState<CompanyData[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [loadedSectors, setLoadedSectors] = useState<Set<SectorKey>>(new Set());
  const [sectorCompanies, setSectorCompanies] = useState<Record<SectorKey, CompanyData[]>>({
    all: [],
    technology: [],
    financialServices: [],
    foodBeverage: [],
    manufacturing: [],
    transportation: [],
    consumerProducts: [],
    mediaCommunications: [],
    utilitiesEnergy: [],
    realEstateInfrastructure: [],
    healthcareLifeSciences: [],
    naturalResources: [],
    businessServices: [],
  });

  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    async function fetchSectorCompanies() {
      // Skip if already loaded with full data
      if (loadedSectors.has(selectedSector)) {
        setCompanies(sectorCompanies[selectedSector]);
        return;
      }

      setLoadingCompanies(true);

      try {
        const config = SECTORS[selectedSector];
        const params = new URLSearchParams();
        params.set("limit", config.limit.toString());
        if (config.industries) {
          params.set("industries", config.industries.join(","));
        }

        // Phase 1: Fetch quick data (screener only) for immediate display
        const quickParams = new URLSearchParams(params);
        quickParams.set("quick", "true");
        const quickResponse = await fetch(`/api/top-companies?${quickParams.toString()}`);

        if (quickResponse.status === 429) {
          setSearchError("We've temporarily hit our API usage limit. Please try again later - this helps us keep the app free.");
          setLoadingCompanies(false);
          return;
        }

        if (quickResponse.ok) {
          const quickData = await quickResponse.json();
          setCompanies(quickData);
        }

        // Phase 2: Fetch full data in background
        const fullResponse = await fetch(`/api/top-companies?${params.toString()}`);

        if (fullResponse.status === 429) {
          setSearchError("We've temporarily hit our API usage limit. Please try again later - this helps us keep the app free.");
          setLoadingCompanies(false);
          return;
        }

        if (!fullResponse.ok) {
          throw new Error("Failed to fetch companies");
        }

        const fullData = await fullResponse.json();

        // Cache the full results
        setSectorCompanies(prev => ({ ...prev, [selectedSector]: fullData }));
        setLoadedSectors(prev => new Set(prev).add(selectedSector));
        setCompanies(fullData);
      } catch (error) {
        console.error("Error fetching companies:", error);
      } finally {
        setLoadingCompanies(false);
      }
    }

    fetchSectorCompanies();
  }, [selectedSector, loadedSectors, sectorCompanies]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!ticker.trim()) return;

    setSearchLoading(true);
    setSearchError(null);
    setSearched(true);

    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(ticker.trim())}`
      );
      if (response.status === 429) {
        setSearchError("We've temporarily hit our API usage limit. Please try again later - this helps us keep the app free.");
        return;
      }
      if (!response.ok) {
        throw new Error("Failed to search");
      }
      const data = await response.json();
      setSearchedCompany(data);
      if (!data) {
        setSearchError("Ticker not found");
      }
    } catch {
      setSearchError("Something went wrong");
      setSearchedCompany(null);
    } finally {
      setSearchLoading(false);
    }
  }

  function clearSearch() {
    setTicker("");
    setSearchedCompany(null);
    setSearched(false);
    setSearchError(null);
  }

  // Get full companies for suggested tickers (already sorted by market cap from API)
  const fullCompanies = companies.filter((c): c is CompanyDisplayData => !c.isLimited);

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar menu */}
      <div
        className={`fixed left-0 top-0 z-50 h-full w-64 transform border-r border-card-border bg-card-bg transition-transform duration-300 ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-card-border p-4">
          <span className="text-lg font-semibold text-green-primary">Yardstick</span>
          <button
            onClick={() => setMenuOpen(false)}
            className="cursor-pointer text-text-muted hover:text-foreground"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18"/>
              <path d="m6 6 12 12"/>
            </svg>
          </button>
        </div>
        <nav className="p-4">
          <a href="/" className="block cursor-pointer rounded-lg px-4 py-3 text-foreground hover:bg-background">
            Home
          </a>
          <a href="/about" className="block cursor-pointer rounded-lg px-4 py-3 text-foreground hover:bg-background">
            About
          </a>
          <a href="/support" className="block cursor-pointer rounded-lg px-4 py-3 text-foreground hover:bg-background">
            Support
          </a>
        </nav>
      </div>

      {/* Overlay when menu is open */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Menu toggle button */}
      <button
        onClick={() => setMenuOpen(true)}
        className="fixed left-4 top-4 z-30 cursor-pointer rounded-lg border border-card-border bg-card-bg p-2 text-text-muted hover:border-foreground hover:text-foreground"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="4" x2="20" y1="6" y2="6"/>
          <line x1="4" x2="20" y1="12" y2="12"/>
          <line x1="4" x2="20" y1="18" y2="18"/>
        </svg>
      </button>

      <div className="mx-auto max-w-2xl px-4 py-16">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-green-primary">
            Yardstick
          </h1>
          <p className="mt-2 text-text-muted">
            Measure companies with ease
          </p>
        </header>

        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-3">
            <input
              type="text"
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              placeholder="Search for a ticker"
              className="flex-1 rounded-lg border border-card-border bg-card-bg px-4 py-3 text-foreground placeholder:text-text-muted focus:border-green-primary"
            />
            <button
              type="submit"
              disabled={searchLoading || !ticker.trim()}
              className="cursor-pointer rounded-lg bg-green-primary px-6 py-3 font-medium text-black transition-colors hover:bg-green-light disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {searchLoading ? "..." : "Search"}
            </button>
          </div>
        </form>

        {/* Search result */}
        {searched && (
          <div className="mb-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-medium text-foreground">Search Result</h2>
              <button
                onClick={clearSearch}
                className="cursor-pointer text-sm text-text-muted hover:text-foreground"
              >
                Clear
              </button>
            </div>
            {searchError && (
              <p className="text-center text-text-muted">{searchError}</p>
            )}
            {searchedCompany && searchedCompany.isLimited && (
              <LimitedCompanyCard
                symbol={searchedCompany.symbol}
                companyName={searchedCompany.companyName}
                marketCap={searchedCompany.marketCap}
                beta={searchedCompany.beta}
              />
            )}
            {searchedCompany && !searchedCompany.isLimited && (
              <CompanyCard
                symbol={searchedCompany.symbol}
                companyName={searchedCompany.companyName}
                marketCap={searchedCompany.marketCap}
                revenueTTM={searchedCompany.revenueTTM}
                earningsTTM={searchedCompany.earningsTTM}
                beta={searchedCompany.beta}
                operatingMargin={searchedCompany.operatingMargin}
                peRatio={searchedCompany.peRatio}
                fcfTTM={searchedCompany.fcfTTM}
                debtToEquity={searchedCompany.debtToEquity}
              />
            )}
          </div>
        )}

        {/* Sector chips and company list - hidden when search is active */}
        {!searched && (
          <>
            <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {(Object.keys(SECTORS) as SectorKey[]).map((key) => (
                <button
                  key={key}
                  onClick={() => setSelectedSector(key)}
                  className={`cursor-pointer whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors shrink-0 ${
                    selectedSector === key
                      ? "bg-green-primary text-black"
                      : "border border-card-border text-text-muted hover:border-foreground hover:text-foreground"
                  }`}
                >
                  {SECTORS[key].label}
                </button>
              ))}
              {loadingCompanies && (
                <span className="ml-2 shrink-0 text-sm text-text-muted">Loading...</span>
              )}
            </div>

            {/* Company list */}
            <div className="space-y-4">
              {companies.map((company) => (
                company.isLimited ? (
                  <LimitedCompanyCard
                    key={company.symbol}
                    symbol={company.symbol}
                    companyName={company.companyName}
                    marketCap={company.marketCap}
                    beta={company.beta}
                  />
                ) : (
                  <CompanyCard
                    key={company.symbol}
                    symbol={company.symbol}
                    companyName={company.companyName}
                    marketCap={company.marketCap}
                    revenueTTM={company.revenueTTM}
                    earningsTTM={company.earningsTTM}
                    beta={company.beta}
                    operatingMargin={company.operatingMargin}
                    peRatio={company.peRatio}
                    fcfTTM={company.fcfTTM}
                    debtToEquity={company.debtToEquity}
                    suggestedTickers={fullCompanies
                      .filter(c => c.symbol !== company.symbol)
                      .slice(0, 5)
                      .map(c => c.symbol)}
                  />
                )
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
