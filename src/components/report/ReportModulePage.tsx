import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { ExecutiveSummary } from "@/components/report-modules/ExecutiveSummary";
import { MediaSummary } from "@/components/report-modules/MediaSummary";
import {
  SentimentTrend,
  SentimentPoint,
  SentimentAnnotation,
} from "@/components/report-modules/SentimentTrend";
import { ReputationalRisks } from "@/components/report-modules/ReputationalRisks";
import { ReputationalOpportunities } from "@/components/report-modules/ReputationalOpportunities";
import { IssueImpact } from "@/components/report-modules/IssueImpact";
import { TopSources } from "@/components/report-modules/TopSources";
import { VolumeAndSentiment } from "@/components/report-modules/VolumeAndSentiment";
import { WordCloud } from "@/components/report-modules/WordCloud";
import { KPIPerformance } from "@/components/report-modules/KPIPerformance";
import { TopJournalists } from "@/components/report-modules/TopJournalists";
import { SectorRanking } from "@/components/report-modules/SectorRanking";
import { moduleLabels, mediaTypeLabels } from "@/utils/reportConstants";
import type { Report } from "@/hooks/useReportData";

/* -------------------------------------------------------
   Types to avoid `any` when indexing by dynamic mediaType
--------------------------------------------------------*/

interface MediaBucket {
  sentimentTrend?: SentimentPoint[];
  sentimentTrendAnnotations?: SentimentAnnotation[];
}

interface ReportWithMedia extends Report {
  articles?: MediaBucket;
  printmedia?: MediaBucket;
  broadcast?: MediaBucket;
  posts?: MediaBucket;

  // Optional global fallbacks (if you keep these at root)
  sentimentTrend?: SentimentPoint[];
  sentimentTrendAnnotations?: SentimentAnnotation[];
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isMediaBucket(value: unknown): value is MediaBucket {
  if (!isObject(value)) return false;
  // loose guard: if it’s an object, we’ll read optional typed fields safely
  return true;
}

type SentimentLike = Partial<SentimentPoint> & {
  date?: string;
  volume?: number; // when per-class volumes aren’t provided
};

function toSentimentPoint(row: SentimentLike): SentimentPoint {
  const date = String(row.date ?? "");
  const sentiment = Number(row.sentiment ?? 0);
  const rolling = Number(row.rolling ?? 0);
  const industryTrend =
    row.industryTrend === undefined || row.industryTrend === null
      ? undefined
      : Number(row.industryTrend);

  // If backend already provides class volumes, use them:
  const hasClassVolumes =
    row.positive !== undefined ||
    row.negative !== undefined ||
    row.neutral !== undefined ||
    row.mixed !== undefined;

  if (hasClassVolumes) {
    return {
      date,
      sentiment,
      rolling,
      industryTrend,
      positive: Number(row.positive ?? 0),
      negative: Number(row.negative ?? 0),
      neutral: Number(row.neutral ?? 0),
      mixed: row.mixed === undefined ? undefined : Number(row.mixed),
    };
  }

  // Otherwise, derive them from a single `volume` using sentiment sign:
  const vol = Number(row.volume ?? 0);
  let positive = 0;
  let negative = 0;
  let neutral = 0;
  if (sentiment > 5) positive = vol;
  else if (sentiment < -5) negative = vol;
  else neutral = vol;

  return {
    date,
    sentiment,
    rolling,
    industryTrend,
    positive,
    negative,
    neutral,
    mixed: row.mixed === undefined ? undefined : Number(row.mixed),
  };
}

/* -------------------------------------------------------
   Component
--------------------------------------------------------*/

interface ReportModulePageProps {
  mediaType: string;
  moduleName: string;
  reportData: Report; // provided by ReportResults.tsx
}

export const ReportModulePage = ({
  mediaType,
  moduleName,
  reportData,
}: ReportModulePageProps) => {
  const displayMediaType = mediaTypeLabels[mediaType] || mediaType;
  const displayModule = moduleLabels[moduleName] || moduleName;

  // --- Extract data from formData if it exists ---
  const formData = (reportData as any)?.formData;
  const dataSource = formData || reportData;

  // --- Typed shortcuts ---
  const r = dataSource as ReportWithMedia;
  const bucketUnknown = dataSource as unknown as { [key: string]: unknown };
  const bucket = bucketUnknown[mediaType];

  const mediaBucket: MediaBucket | undefined =
    typeof bucket === "object" && bucket !== null
      ? (bucket as MediaBucket)
      : undefined;

  // --- Sentiment Trend Fix (JS-style fallback logic) ---
  const isSentimentTrend = moduleName === "sentimentTrend";

  // Debug: Log what we have
  console.log("SentimentTrend Debug:", {
    moduleName,
    mediaType,
    hasFormData: !!formData,
    formDataKeys: formData ? Object.keys(formData) : [],
    hasSentimentTrendInRoot: !!r.sentimentTrend,
    hasMediaBucket: !!mediaBucket,
    reportDataKeys: Object.keys(reportData),
    mediaBucketKeys: mediaBucket ? Object.keys(mediaBucket) : [],
    sentimentTrendLength: r.sentimentTrend?.length,
  });

  // Use the same data pattern as your JS version
  const seriesRaw: SentimentLike[] = isSentimentTrend
    ? r.sentimentTrend ?? []
    : (mediaBucket?.[moduleName] as SentimentLike[]) ?? [];

  const annotationsRaw: SentimentAnnotation[] = isSentimentTrend
    ? r.sentimentTrendAnnotations ?? []
    : (mediaBucket?.[`${moduleName}Annotations`] as SentimentAnnotation[]) ??
      [];

  // --- Data normalization ---
  const sentimentData: SentimentPoint[] = (seriesRaw || []).map(
    toSentimentPoint
  );

  const sentimentAnnotations: SentimentAnnotation[] = (
    annotationsRaw || []
  ).map((a) => ({
    date: String(a.date ?? ""),
    type: String(a.type ?? ""),
    category: String(a.category ?? ""),
    summary: String(a.summary ?? ""),
  }));

  // --- Debug output ---
  console.log("📈 Sentiment Data:", {
    sentimentDataLength: sentimentData.length,
    annotationsLength: sentimentAnnotations.length,
    firstDataPoint: sentimentData[0],
  });

  const renderModuleComponent = () => {
    switch (moduleName) {
      case "executiveSummary":
        return <ExecutiveSummary />;

      case "mediaSummary":
        return <MediaSummary />;

      case "sentimentTrend":
        return (
          <SentimentTrend
            data={sentimentData}
            annotations={sentimentAnnotations}
          />
        );

      case "reputationalRisks":
        return <ReputationalRisks />;

      case "reputationalOpportunities":
        return <ReputationalOpportunities />;

      case "issueImpact":
        return <IssueImpact />;

      case "topSources":
        return <TopSources />;

      case "volumeAndSentiment":
        return <VolumeAndSentiment />;

      case "wordCloud":
        return <WordCloud />;

      case "kpiPerformance":
        return <KPIPerformance />;

      case "topJournalists":
        return <TopJournalists />;

      case "sectorRanking":
        return <SectorRanking />;

      default:
        return (
          <div className="bg-muted/30 rounded-lg p-8 min-h-[400px] flex items-center justify-center">
            <div className="text-center space-y-4">
              <FileText className="h-16 w-16 mx-auto text-muted-foreground" />
              <p className="text-lg text-muted-foreground">
                Module content will be displayed here
              </p>
              <p className="text-sm text-muted-foreground">
                This section would show {displayModule} data for{" "}
                {displayMediaType}
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <Card className="min-h-[85vh]">
      <CardContent className="p-8">
        <div className="mb-8">
          <p className="text-sm text-muted-foreground mb-2">
            {displayMediaType}
          </p>
          <h2 className="text-4xl font-bold text-foreground">
            {displayModule}
          </h2>
        </div>

        {renderModuleComponent()}
      </CardContent>
    </Card>
  );
};
