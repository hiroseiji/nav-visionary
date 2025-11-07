// analyticsUtils.ts

// --- Shared UI content types (frontend) ---
export type ContentTypeUI = "posts" | "articles" | "broadcast" | "printMedia";

// --- Base types used by charts ---

type OverTimePoint = {
  date?: string | Date;
  _id?: string | Date;
  count?: number;
  reach?: number;
  totalReach?: number;
  ave?: number;
  totalAve?: number;
  totalAVE?: number;
};

type Post = {
  date?: string | Date;
  createdAt?: string | Date;
  createdTime?: string | Date;
};

type Article = {
  publication_date?: string | Date;
  publicationDate?: string | Date;
  mentionDT?: string | Date;
};

type BroadcastArticle = {
  airDate?: string | Date;
  mentionDT?: string | Date;
};

type PrintArticle = {
  publication_date?: string | Date;
  publicationDate?: string | Date;
};

export type Dataset = {
  label: string;
  data: number[];
  backgroundColor: string;
  borderColor: string;
  borderRadius: number;
};

const GRADIENT_BLUES: ReadonlyArray<string> = [
  "rgb(173, 216, 230)",
  "rgb(100, 149, 237)",
  "rgb(70, 130, 180)",
  "rgb(0, 105, 148)",
  "rgb(0, 75, 115)",
];

const BORDER_BLUES: ReadonlyArray<string> = [
  "rgb(173, 216, 230)",
  "rgb(100, 149, 237)",
  "rgb(70, 130, 180)",
  "rgb(0, 105, 148)",
  "rgb(0, 75, 115)",
];

// --- Helpers ---

function toDate(input?: string | Date): Date | null {
  if (!input) return null;
  const d = input instanceof Date ? input : new Date(input);
  return Number.isNaN(d.getTime()) ? null : d;
}

function buildYearMonthCounts<T>(
  items: ReadonlyArray<T>,
  pickDate: (item: T) => Date | null,
  countForItem: (item: T) => number = () => 1
): Record<number, number[]> {
  const map: Record<number, number[]> = {};
  for (const it of items) {
    const d = pickDate(it);
    if (!d) continue;
    const year = d.getFullYear();
    const month = d.getMonth(); // 0-11
    if (!map[year]) map[year] = new Array(12).fill(0);
    map[year][month] += countForItem(it);
  }
  return map;
}

function yearMapToDatasets(
  yearMap: Record<number, number[]>,
  labelPrefix: string
): Dataset[] {
  const years = Object.keys(yearMap)
    .map((y) => Number(y))
    .filter((y) => !Number.isNaN(y))
    .sort((a, b) => a - b);

  return years.map((year, idx) => ({
    label: `${labelPrefix} in ${year}`,
    data: yearMap[year],
    backgroundColor: GRADIENT_BLUES[idx % GRADIENT_BLUES.length],
    borderColor:   BORDER_BLUES[idx % BORDER_BLUES.length],
    borderRadius: 5,
  }));
}

// --- Over Years bar chart ---
export function generateOverYearsBarData(
  contentType: ContentTypeUI,
  facebookPosts: ReadonlyArray<Post>,
  articles: ReadonlyArray<Article>,
  broadcastArticles: ReadonlyArray<BroadcastArticle>,
  broadcastOverTimeData: ReadonlyArray<OverTimePoint>,
  printArticles: ReadonlyArray<PrintArticle>,
  printOverTimeData: ReadonlyArray<OverTimePoint>
): Dataset[] {
  // Social Posts
  if (contentType === "posts") {
    const yearMap = buildYearMonthCounts(facebookPosts, (p) =>
      toDate(p.date ?? p.createdAt ?? p.createdTime)
    );
    return yearMapToDatasets(yearMap, "Posts");
  }

  // Online Articles
  if (contentType === "articles") {
    const yearMap = buildYearMonthCounts(articles, (a) =>
      toDate(a.publication_date ?? a.publicationDate ?? a.mentionDT)
    );
    return yearMapToDatasets(yearMap, "Articles");
  }

  // Broadcast - use overTimeData
  if (contentType === "broadcast") {
    const yearMap = buildYearMonthCounts(
      broadcastOverTimeData,
      (item) => toDate(item.date ?? item._id),
      (item) => item.count ?? 0
    );
    return yearMapToDatasets(yearMap, "Broadcast");
  }

  // Print Media - use overTimeData
  if (contentType === "printMedia") {
    const yearMap = buildYearMonthCounts(
      printOverTimeData,
      (item) => toDate(item.date ?? item._id),
      (item) => item.count ?? 0
    );
    return yearMapToDatasets(yearMap, "Print Media");
  }

  return [];
}

// --- Content Volume per Reach & AVE chart ---

type CleanedPoint = {
  date: Date;
  label: string;
  volume: number;
  reach: number | null;
  ave: number | null;
};

export const generateCountOverTimeChartData = (
  countOverTimeData: OverTimePoint[],
  _contentType: string,          // kept for signature parity if you need it later
  granularity: "day" | "week" | "month" | "year"
) => {
  if (!Array.isArray(countOverTimeData)) {
    return { labels: [], datasets: [] };
  }

  const cleaned: CleanedPoint[] = countOverTimeData
    .filter((item) => item?.date || item?._id)
    .map((item) => {
      const raw = (item.date ?? item._id) as string | Date;
      const d = raw instanceof Date ? raw : new Date(raw);

      let label: string;
      if (granularity === "month") {
        label = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
      } else if (granularity === "year") {
        label = d.getFullYear().toString();
      } else if (granularity === "week") {
        // Optional: you can format weeks differently; keeping simple:
        label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      } else {
        label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      }

      const aveFromTotal =
        typeof item.totalAve === "number"
          ? item.totalAve
          : typeof item.totalAVE === "number"
          ? item.totalAVE
          : undefined;

      return {
        date: d,
        label,
        volume: item.count ?? 0,
        reach:
          typeof item.reach === "number"
            ? item.reach
            : typeof item.totalReach === "number"
            ? item.totalReach
            : null,
        ave:
          typeof item.ave === "number"
            ? item.ave
            : typeof aveFromTotal === "number"
            ? aveFromTotal
            : null,
      };
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const labels = cleaned.map((i) => i.label);

  return {
    labels,
    datasets: [
      {
        type: "bar" as const,
        label: "Volume",
        data: cleaned.map((i) => i.volume),
        backgroundColor: "rgb(47, 162, 250)",
        borderColor: "rgb(47, 162, 250)",
        borderRadius: 4,
        yAxisID: "y1",
        barThickness: "flex" as const,
        maxBarThickness: 30,
      },
      {
        type: "bar" as const,
        label: "Reach",
        data: cleaned.map((i) => (i.reach ?? 0)),
        backgroundColor: "rgb(0, 58, 152)",
        borderColor: "rgb(0, 58, 152)",
        borderRadius: 4,
        yAxisID: "y2",
        barThickness: "flex" as const,
        maxBarThickness: 30,
      },
      {
        type: "bar" as const,
        label: "AVE",
        data: cleaned.map((i) => (i.ave ?? 0)),
        backgroundColor: "rgba(151, 154, 253, 1)",
        borderColor: "rgba(151, 154, 253, 1)",
        borderRadius: 4,
        yAxisID: "y2",
        barThickness: "flex" as const,
        maxBarThickness: 30,
      },
    ],
  };
};

// --- Top Journalist chart ---

type SentimentType = "Positive" | "Neutral" | "Negative" | "Mixed";

type JournalistStat = {
  journalist?: string;
  sentimentCounts?: Partial<Record<SentimentType, number>>;
};

type JournalistDataset = {
  label: SentimentType;
  data: number[];
  backgroundColor: string;
  borderColor: string;
  borderRadius: number;
};

export type JournalistChartData = {
  labels: string[];
  datasets: JournalistDataset[];
};

const SENTIMENTS: ReadonlyArray<SentimentType> = [
  "Positive",
  "Neutral",
  "Negative",
  "Mixed",
];

const COLORS: Record<SentimentType, string> = {
  Positive: "rgb(12, 217, 94)",
  Neutral: "rgb(255, 182, 55)",
  Negative: "rgb(255, 88, 76)",
  Mixed: "rgb(47, 162, 250)",
};

export function generateTopJournalistChartData(
  data: ReadonlyArray<JournalistStat> | undefined | null
): JournalistChartData {
  if (!data || data.length === 0) {
    return { labels: [], datasets: [] };
  }

  const labels = data.map((item) => {
    const j = (item.journalist ?? "").trim();
    return j === "" ? "Unknown" : j;
  });

  const datasets: JournalistDataset[] = SENTIMENTS.map((type) => ({
    label: type,
    data: data.map((item) => {
      const v = item.sentimentCounts?.[type];
      return typeof v === "number" && Number.isFinite(v) ? v : 0;
    }),
    backgroundColor: COLORS[type],
    borderColor: COLORS[type],
    borderRadius: 3,
  }));

  return { labels, datasets };
}
