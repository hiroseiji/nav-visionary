import { Card, CardContent } from "@/components/ui/card";
import { BsBarChartFill, BsMegaphone } from "react-icons/bs";
import {
  FaGlobeAfrica,
  FaQuoteLeft,
} from "react-icons/fa";
import { IoCalendarNumberSharp } from "react-icons/io5";
import { moduleLabels } from "@/utils/reportConstants";
import { Report } from "@/hooks/useReportData"; 

/* ====== Types (no 'any') ====== */
type Totals = { volume?: number; reach?: number; ave?: number };
type MediaSummary = {
  volume?: number;
  reach?: number;
  ave?: number;
  totals?: Totals;
};

type ReportIndexable = Record<string, unknown>;

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;

const toNum = (v: unknown): number =>
  typeof v === "number" ? v : Number(v ?? 0) || 0;

/** Accepts either a mediaSummary-like object, or a { totals: {...} } holder. */
const readSummaryLike = (node: unknown): Totals | undefined => {
  if (!isObject(node)) return;
  const maybeTotals = node["totals" as keyof typeof node];
  if (isObject(maybeTotals)) {
    return {
      volume: toNum((maybeTotals as Record<string, unknown>).volume),
      reach: toNum((maybeTotals as Record<string, unknown>).reach),
      ave: toNum((maybeTotals as Record<string, unknown>).ave),
    };
  }
  return {
    volume: toNum((node as Record<string, unknown>).volume),
    reach: toNum((node as Record<string, unknown>).reach),
    ave: toNum((node as Record<string, unknown>).ave),
  };
};

/** Deep-scan for ANY mediaSummary, mirroring the old JS:
 *  - counts top-level report.mediaSummary
 *  - counts each bucket's *.mediaSummary
 *  - supports both shapes: direct fields or nested .totals
 *  - avoids double-counting by not descending into mediaSummary after adding
 */
const sumTotalsFromReport = (root: unknown): Totals => {
  let volume = 0, reach = 0, ave = 0;

  const add = (t?: Totals) => {
    if (!t) return;
    volume += toNum(t.volume);
    reach  += toNum(t.reach);
    ave    += toNum(t.ave);
  };

  const visit = (node: unknown) => {
    if (!isObject(node)) return;

    // If this object itself looks like a summary holder, add it
    if ("totals" in node || "volume" in node || "reach" in node || "ave" in node) {
      add(readSummaryLike(node));
    }

    // If it has a mediaSummary child, add that and DO NOT descend into it again
    if ("mediaSummary" in node) {
      const ms = (node as Record<string, unknown>).mediaSummary;
      add(readSummaryLike(ms));
    }

    // Recurse into children EXCEPT the mediaSummary child (to avoid double counting)
    for (const [k, v] of Object.entries(node)) {
      if (k === "mediaSummary") continue;
      visit(v);
    }
  };

  visit(root);
  return { volume, reach, ave };
};

interface MediaBucket {
  mediaSummary?: MediaSummary;
}
interface ReportLike {
  mediaSummary?: MediaSummary;
  articles?: MediaBucket;
  printmedia?: MediaBucket;
  broadcast?: MediaBucket;
  posts?: MediaBucket;

  languages?: string[];
  filters?: {
    languages?: string[];
    startDate?: string | Date;
    endDate?: string | Date;
    region?: string;
  };
  formData?: {
    languages?: string[];
    startDate?: string | Date;
    endDate?: string | Date;
  };
  dateRange?: { start?: string | Date; end?: string | Date };
  period?: { start?: string | Date; end?: string | Date };

  scope?: string[];
  region?: string;
}

type ModulesData = Record<string, Record<string, unknown>>;

interface ReportContentsPageProps {
  reportData: Report & ReportLike; // extend your Report with the flexible shape
  modulesData: ModulesData;
  mediaTypes: string[];
  onNavigateToPage?: (pageNumber: number) => void;
}

/* ====== Component ====== */
export const ReportContentsPage = ({ reportData, modulesData, mediaTypes, onNavigateToPage }: ReportContentsPageProps) => {
  /* ---- Languages & date range (typed) ---- */
  const summarizeLanguagesFromReport = (r: ReportLike): string => {
    const arr =
      (Array.isArray(r.languages) && r.languages) ||
      (Array.isArray(r.filters?.languages) && r.filters?.languages) ||
      (Array.isArray(r.formData?.languages) && r.formData?.languages) ||
      [];
    if (!arr.length) return "English";
    if (arr.length <= 3) return arr.join(", ");
    return `${arr.slice(0, 2).join(", ")} +${arr.length - 2} more`;
  };

  type Dateish = string | Date | undefined;
  const resolveDateRangeFromReport = (r: {
    startDate?: Dateish;
    endDate?: Dateish;
    filters?: { startDate?: Dateish; endDate?: Dateish };
    formData?: { startDate?: Dateish; endDate?: Dateish };
    dateRange?: { start?: Dateish; end?: Dateish };
    period?: { start?: Dateish; end?: Dateish };
  }): { start?: Date; end?: Date } => {
    const picks: Array<() => { start?: Dateish; end?: Dateish }> = [
      () => ({ start: r.startDate, end: r.endDate }),
      () => ({ start: r.filters?.startDate, end: r.filters?.endDate }),
      () => ({ start: r.formData?.startDate, end: r.formData?.endDate }),
      () => ({ start: r.dateRange?.start, end: r.dateRange?.end }),
      () => ({ start: r.period?.start, end: r.period?.end }),
    ];
    for (const pick of picks) {
      const { start, end } = pick();
      if (start || end) {
        return { start: start ? new Date(start) : undefined, end: end ? new Date(end) : undefined };
      }
    }
    return {};
  };

  const formatTimePeriodSmart = (start?: Date, end?: Date): string => {
    if (!start && !end) return "-";
    if (start && end) {
      const sameMonth =
        start.getFullYear() === end.getFullYear() &&
        start.getMonth() === end.getMonth();
      if (sameMonth) {
        return start.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      }
      const s = start.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
      const e = end.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
      return `${s} – ${e}`;
    }
    if (start) {
      const s = start.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
      return `From ${s}`;
    }
    const e = (end as Date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    return `Until ${e}`;
  };

  /* ---- Country aliases + region/continent logic (typed) ---- */
  const ALIASES: Record<string, string> = {
    "ivory coast": "Côte d’Ivoire",
    "cote d'ivoire": "Côte d’Ivoire",
    swaziland: "Eswatini",
    drc: "DR Congo",
    "democratic republic of the congo": "DR Congo",
    "republic of the congo": "Congo",
    "u.s.": "United States",
    usa: "United States",
    uk: "United Kingdom",
    uae: "United Arab Emirates",
  };
  const normalizeCountry = (name: string = ""): string => {
    const n = String(name).trim();
    const key = n.toLowerCase();
    return ALIASES[key] || n;
  };

  const REGION_GROUPS: Record<string, Set<string>> = {
    "Southern Africa": new Set([
      "Botswana","South Africa","Namibia","Lesotho","Eswatini",
      "Zimbabwe","Zambia","Malawi","Mozambique","Angola",
    ]),
    "East Africa": new Set([
      "Kenya","Tanzania","Uganda","Rwanda","Burundi","Ethiopia","Eritrea",
      "Somalia","Djibouti","South Sudan","Sudan",
    ]),
    "West Africa": new Set([
      "Nigeria","Ghana","Côte d’Ivoire","Senegal","Sierra Leone","Liberia","Gambia",
      "Guinea","Guinea-Bissau","Benin","Togo","Niger","Burkina Faso","Cape Verde","Cabo Verde",
      "Mali","Mauritania",
    ]),
    "Central Africa": new Set([
      "Cameroon","Central African Republic","Chad","DR Congo","Congo","Equatorial Guinea",
      "Gabon","Sao Tome and Principe","Angola",
    ]),
    "North Africa": new Set([
      "Egypt","Libya","Tunisia","Algeria","Morocco","Western Sahara","Sudan","Mauritania",
    ]),
    "Middle East": new Set([
      "Saudi Arabia","United Arab Emirates","Qatar","Oman","Bahrain","Kuwait",
      "Yemen","Jordan","Lebanon","Syria","Iraq","Israel","Palestine","State of Palestine",
    ]),
    Europe: new Set([
      "United Kingdom","Ireland","France","Germany","Spain","Portugal","Italy","Netherlands","Belgium",
      "Poland","Sweden","Norway","Denmark","Finland","Austria","Switzerland","Greece","Czechia",
      "Czech Republic","Hungary","Romania","Bulgaria","Serbia","Croatia","Slovenia","Slovakia",
      "Bosnia and Herzegovina","North Macedonia","Albania","Ukraine","Belarus","Moldova","Iceland",
      "Estonia","Latvia","Lithuania","Luxembourg","Monaco","Andorra","San Marino","Liechtenstein",
      "Vatican City","Malta","Montenegro","Kosovo","Turkey","Russia",
    ]),
    "North America": new Set(["United States","Canada","Mexico"]),
    "South America": new Set([
      "Brazil","Argentina","Chile","Peru","Colombia","Uruguay","Paraguay","Ecuador","Bolivia",
      "Venezuela","Guyana","Suriname","French Guiana",
    ]),
    Oceania: new Set([
      "Australia","New Zealand","Fiji","Papua New Guinea","Samoa","Tonga","Solomon Islands",
      "Vanuatu","Micronesia","Kiribati","Palau","Nauru","Tuvalu",
    ]),
    Asia: new Set([
      "China","India","Japan","South Korea","North Korea","Indonesia","Malaysia","Singapore","Thailand",
      "Philippines","Vietnam","Cambodia","Laos","Myanmar","Bhutan","Nepal","Sri Lanka","Bangladesh",
      "Pakistan","Afghanistan","Mongolia","Taiwan","Brunei","Timor-Leste","Maldives",
      "Saudi Arabia","United Arab Emirates","Qatar","Oman","Bahrain","Kuwait",
      "Yemen","Jordan","Lebanon","Syria","Iraq","Israel","Palestine","State of Palestine",
      "Turkey","Russia",
    ]),
    Africa: new Set(), // union below
  };
  ["Southern Africa","East Africa","West Africa","Central Africa","North Africa"].forEach((r) => {
    REGION_GROUPS[r].forEach((c) => REGION_GROUPS["Africa"].add(c));
  });
  const CONTINENTS: Record<string, Set<string>> = {
    Africa: REGION_GROUPS["Africa"],
    Europe: REGION_GROUPS["Europe"],
    Asia: REGION_GROUPS["Asia"],
    "North America": REGION_GROUPS["North America"],
    "South America": REGION_GROUPS["South America"],
    Oceania: REGION_GROUPS["Oceania"],
  };

  function summarizeCountriesToRegion(countries: string[] = [], regionFallback?: string): string {
    if (String(regionFallback || "").toLowerCase() === "global") return "Global";
    const list: string[] = [];
    const seen = new Set<string>();
    (Array.isArray(countries) ? countries : []).forEach((c) => {
      const n = normalizeCountry(c);
      if (n && !seen.has(n)) { seen.add(n); list.push(n); }
    });
    if (list.length === 0) return regionFallback || "Global";
    if (list.length === 1) return list[0];

    const continentsHit = new Set<string>();
    list.forEach((c) => {
      for (const [cont, set] of Object.entries(CONTINENTS)) {
        if (set.has(c)) { continentsHit.add(cont); break; }
      }
    });

    if (continentsHit.size >= 3) return "Global";
    if (list.length <= 4) return list.join(", ");

    const singleRegion = Object.entries(REGION_GROUPS)
      .filter(([name]) => name !== "Africa")
      .find(([, set]) => list.every((c) => set.has(c)));
    if (singleRegion) return singleRegion[0];

    if (continentsHit.size === 1) return [...continentsHit][0];

    const groupHits = Object.entries(REGION_GROUPS)
      .map(([name, set]) => ({ name, count: list.filter((c) => set.has(c)).length }))
      .filter((x) => x.count > 0)
      .sort((a, b) => b.count - a.count);

    if (groupHits.length > 0) {
      const top = groupHits.slice(0, 2).map((g) => g.name);
      const extras = groupHits.length - top.length;
      return extras > 0 ? `${top.join(" + ")} + ${extras} more` : top.join(" + ");
    }

    const extra = list.length - 3;
    return extra > 0 ? `${list.slice(0, 3).join(", ")} + ${extra} more` : list.join(", ");
  }

  /* ---- Derive metrics (typed) ---- */
  const totals = sumTotalsFromReport(reportData);
  const fmtInt = (n?: number | null) =>
    typeof n === "number" && isFinite(n) ? Math.round(n).toLocaleString("en-ZA") : "0";

  const regionText = summarizeCountriesToRegion(
    Array.isArray(reportData.scope) ? reportData.scope : [],
    reportData.region || reportData.filters?.region
  );
  const languageText = summarizeLanguagesFromReport(reportData);
  const { start, end } = resolveDateRangeFromReport(reportData);
  const timePeriodText = formatTimePeriodSmart(start, end);

  /* ---- Ordered module pages & page index (cover=1, contents=2) ---- */
  const execPages: Array<{ mediaType: string; module: string }> = [];
  const otherPages: Array<{ mediaType: string; module: string }> = [];

  mediaTypes.forEach((mediaType) => {
    const mods = Object.keys(modulesData[mediaType] || {});
    mods.forEach((m) => {
      const entry = { mediaType, module: m };
      if (m === "executiveSummary") execPages.push(entry);
      else otherPages.push(entry);
    });
  });

  const orderedModules: Array<{ mediaType: string; module: string }> = [...execPages, ...otherPages];

  const MODULE_START_PAGE = 3;
  const pageIndexByKey = new Map<string, number>();
  orderedModules.forEach((p, i) => {
    pageIndexByKey.set(`${p.mediaType}:${p.module}`, MODULE_START_PAGE + i);
  });

  const firstExec = orderedModules.find((p) => p.module === "executiveSummary");
  const execPageNumber = firstExec ? pageIndexByKey.get(`${firstExec.mediaType}:${firstExec.module}`) : undefined;

  const groupedByMedia: Record<string, Array<{ mediaType: string; module: string; page: number }>> = {};
  mediaTypes.forEach((mt) => {
    const mods = Object.keys(modulesData[mt] || {});
    const rows = mods
      .filter((m) => m !== "executiveSummary")
      .map((m) => ({ mediaType: mt, module: m, page: pageIndexByKey.get(`${mt}:${m}`) || 0 }))
      .filter((x) => x.page > 0)
      .sort((a, b) =>
        (moduleLabels[a.module] || a.module).localeCompare(moduleLabels[b.module] || b.module)
      );
    if (rows.length) groupedByMedia[mt] = rows;
  });

  const mediaTypeLabels: Record<string, string> = {
    posts: "Social Media",
    articles: "Online Media",
    broadcast: "Broadcast Media",
    printmedia: "Print Media",
  };

  const ContentsRow = ({ label, page }: { label: string; page: number | string }) => {
    const pageNum = typeof page === 'number' ? page : parseInt(String(page), 10);
    const handleClick = () => {
      if (onNavigateToPage && !isNaN(pageNum)) {
        onNavigateToPage(pageNum);
      }
    };

    return (
      <li 
        className="flex items-center gap-2 py-2 px-2 rounded hover:bg-accent/50 cursor-pointer transition-colors"
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        <span className="font-medium truncate">{label}</span>
        <span className="flex-1 border-b border-dotted border-muted-foreground/50 mx-2" />
        <span className="text-sm text-muted-foreground tabular-nums">{page}</span>
      </li>
    );
  };

  const mediaOrder = ["articles", "printmedia", "broadcast", "posts"];

  return (
    <Card className="min-h-[85vh]">
      <CardContent className="p-8">
        <h2 className="text-3xl font-bold mb-8 text-foreground">
          Report Data & Contents
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Left: Metrics */}
          <Card className="border-2">
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between py-4 border-b">
                <div className="flex items-center gap-3">
                  <BsBarChartFill className="h-6 w-6 text-primary" />
                  <span className="font-semibold">Volume</span>
                </div>
                <span className="text-lg font-bold">
                  {fmtInt(totals?.volume)}
                </span>
              </div>

              <div className="flex items-center justify-between py-4 border-b">
                <div className="flex items-center gap-3">
                  <FaGlobeAfrica className="h-6 w-6 text-primary" />
                  <span className="font-semibold">Regions</span>
                </div>
                <span className="text-lg font-bold">{regionText}</span>
              </div>

              <div className="flex items-center justify-between py-4 border-b">
                <div className="flex items-center gap-3">
                  <BsMegaphone className="h-6 w-6 text-primary" />
                  <span className="font-semibold">Reach</span>
                </div>
                <span className="text-lg font-bold">
                  {fmtInt(totals?.reach)}
                </span>
              </div>

              <div className="flex items-center justify-between py-4 border-b">
                <div className="flex items-center gap-3">
                  <FaQuoteLeft className="h-6 w-6 text-primary" />
                  <span className="font-semibold">Language</span>
                </div>
                <span className="text-lg font-bold">{languageText}</span>
              </div>

              <div className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <IoCalendarNumberSharp className="h-6 w-6 text-primary" />
                  <span className="font-semibold">Time Period</span>
                </div>
                <span className="text-lg font-bold">{timePeriodText}</span>
              </div>
            </CardContent>
          </Card>

          {/* Right: Contents */}
          <Card className="border-2">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold mb-6">Contents</h3>
              <ol className="space-y-3">
                {execPageNumber && (
                  <ContentsRow
                    label="Executive Summary"
                    page={execPageNumber}
                  />
                )}

                {mediaOrder
                  .filter((mt) => groupedByMedia[mt]?.length)
                  .map((mt) => (
                    <li key={mt} className="space-y-2">
                      <div className="text-sm uppercase tracking-wide text-muted-foreground">
                        {mediaTypeLabels[mt] || mt}
                      </div>
                      <ul className="space-y-1">
                        {groupedByMedia[mt].map((row) => (
                          <ContentsRow
                            key={`${row.mediaType}:${row.module}`}
                            label={moduleLabels[row.module] || row.module}
                            page={row.page}
                          />
                        ))}
                      </ul>
                    </li>
                  ))}
              </ol>

              <p className="text-xs text-muted-foreground italic mt-6">
                *Volume refers to mentions across selected sources, regions and
                time period.
              </p>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
};
