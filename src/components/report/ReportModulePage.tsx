// components/report-modules/ReportModulePage.tsx
import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { ExecutiveSummary } from "@/components/report-modules/ExecutiveSummary";
import { MediaSummary } from "@/components/report-modules/MediaSummary";
import { SentimentTrend } from "@/components/report-modules/SentimentTrend";
import { ReputationalRisks } from "@/components/report-modules/ReputationalRisks";
import { ReputationalOpportunities } from "@/components/report-modules/ReputationalOpportunities";
import { IssueImpact } from "@/components/report-modules/IssueImpact";
import { TopSources } from "@/components/report-modules/TopSources";
import { VolumeAndSentiment } from "@/components/report-modules/VolumeAndSentiment";
import { WordCloud } from "@/components/report-modules/WordCloud";
import { KPIPerformance } from "@/components/report-modules/KPIPerformance";
import { TopJournalists } from "@/components/report-modules/TopJournalists";
import { SectorRanking } from "@/components/report-modules/SectorRanking";
import { SectorialCompetitor } from "@/components/report-modules/SectorialCompetitor";
import { moduleLabels, mediaTypeLabels } from "@/utils/reportConstants";
import type { Report } from "@/hooks/useReportData";
import type {
  SentimentPoint,
  SentimentAnnotation,
  SentimentLike,
} from "../../types/sentiment";
import {
  toSentimentPoint,
  normalizeAnnotations,
} from "../../utils/sentimentTrendUtils";
import type { ComponentProps } from "react";

/* -------------------------------------------------------
   Reuse each component's data prop types
--------------------------------------------------------*/
type ExecutiveSummaryData = ComponentProps<typeof ExecutiveSummary>["data"];
type MediaSummaryData = ComponentProps<typeof MediaSummary>["data"];
type TopSourcesData = ComponentProps<typeof TopSources>["data"];
type TopJournalistsData = ComponentProps<typeof TopJournalists>["data"];
type VolumeAndSentimentData = ComponentProps<typeof VolumeAndSentiment>["data"];
type WordCloudData = ComponentProps<typeof WordCloud>["data"];
type KPIPerformanceData = ComponentProps<typeof KPIPerformance>["data"];
type SectorRankingData = ComponentProps<typeof SectorRanking>["data"];
type SectorialCompetitorData = ComponentProps<typeof SectorialCompetitor>["data"];
type IssueImpactData = ComponentProps<typeof IssueImpact>["data"];
type ReputationalRisksData = ComponentProps<typeof ReputationalRisks>["data"];
type ReputationalOpportunitiesData = ComponentProps<
  typeof ReputationalOpportunities
>["data"];

/* -------------------------------------------------------
   Constrained keys so TS can type index access
--------------------------------------------------------*/
type MediaKey = "articles" | "printmedia" | "broadcast" | "posts";

type ModuleName =
  | "executiveSummary"
  | "mediaSummary"
  | "sentimentTrend"
  | "topSources"
  | "topJournalists"
  | "volumeAndSentiment"
  | "wordCloud"
  | "kpiPerformance"
  | "sectorRanking"
  | "sectorialCompetitor"
  | "issueImpact"
  | "reputationalRisks"
  | "reputationalOpportunities";

/* -------------------------------------------------------
   Strongly-typed data buckets
--------------------------------------------------------*/
interface MediaBucket {
  sentimentTrend?: SentimentPoint[];
  sentimentTrendAnnotations?: SentimentAnnotation[];

  mediaSummary?: MediaSummaryData;
  topSources?: TopSourcesData;
  topJournalists?: TopJournalistsData;
  volumeAndSentiment?: VolumeAndSentimentData;
  wordCloud?: WordCloudData;
  kpiPerformance?: KPIPerformanceData;
  sectorRanking?: SectorRankingData;
  sectorialCompetitor?: SectorialCompetitorData;
  issueImpact?: IssueImpactData;
  reputationalRisks?: ReputationalRisksData;
  reputationalOpportunities?: ReputationalOpportunitiesData;
}

interface ReportWithMedia extends Report {
  executiveSummary?: ExecutiveSummaryData;

  articles?: MediaBucket;
  printmedia?: MediaBucket;
  broadcast?: MediaBucket;
  posts?: MediaBucket;

  // Optional global fallbacks (root)
  sentimentTrend?: SentimentPoint[];
  sentimentTrendAnnotations?: SentimentAnnotation[];
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

type ReportModulePageProps = {
  mediaType: MediaKey;
  moduleName: ModuleName;
  reportData: Report;
};

export const ReportModulePage = ({
  mediaType,
  moduleName,
  reportData,
}: ReportModulePageProps) => {
  const displayMediaType = mediaTypeLabels[mediaType] || mediaType;
  const displayModule = moduleLabels[moduleName] || moduleName;

  // Prefer formData if present
  const formDataUnknown = (reportData as { formData?: unknown }).formData;
  const formData = isObject(formDataUnknown)
    ? (formDataUnknown as Record<string, unknown>)
    : undefined;

  const dataSource = {
    ...(reportData as ReportWithMedia),
    ...(formData ?? {}),
  } as ReportWithMedia;

  // after computing dataSource
  const aliasMap: Record<
    MediaKey | "printMedia" | "social" | "online",
    MediaKey
  > = {
    printMedia: "printmedia",
    social: "posts",
    online: "articles",
    articles: "articles",
    printmedia: "printmedia",
    broadcast: "broadcast",
    posts: "posts",
  };
  const resolvedMediaType: MediaKey = aliasMap[mediaType];

  // Typed access to the media bucket
  type BucketsOnly = Pick<ReportWithMedia, MediaKey>;
  const mediaBucket: BucketsOnly[typeof resolvedMediaType] =
    dataSource[resolvedMediaType];

  /* -----------------------------
     Sentiment Trend (typed)
  ------------------------------*/
  const isSentimentTrend = moduleName === "sentimentTrend";

  const seriesRaw: SentimentLike[] = isSentimentTrend
    ? (mediaBucket?.sentimentTrend as SentimentLike[] | undefined) ??
      (dataSource.sentimentTrend as SentimentLike[] | undefined) ??
      []
    : [];

  const annotationsRaw: Partial<SentimentAnnotation>[] = isSentimentTrend
    ? (mediaBucket?.sentimentTrendAnnotations as
        | Partial<SentimentAnnotation>[]
        | undefined) ??
      (dataSource.sentimentTrendAnnotations as
        | Partial<SentimentAnnotation>[]
        | undefined) ??
      []
    : [];

  const sentimentData: SentimentPoint[] = seriesRaw.map(toSentimentPoint);
  const sentimentAnnotations: SentimentAnnotation[] =
    normalizeAnnotations(annotationsRaw);

  /* -----------------------------
     Render per module (typed)
  ------------------------------*/
  console.debug("[Module Debug]", {
    mediaType,
    moduleName,
    hasFormData: !!formData,
    mediaKeys: Object.keys(dataSource || {}),
    hasBucket: !!mediaBucket,
    bucketKeys: mediaBucket ? Object.keys(mediaBucket) : [],
    sampleSentiment:
      mediaBucket?.sentimentTrend?.[0] ?? dataSource.sentimentTrend?.[0],
  });

  const renderModuleComponent = () => {
    switch (moduleName) {
      case "executiveSummary": {
        const data = dataSource.executiveSummary;
        return <ExecutiveSummary data={data} />;
      }

      case "sentimentTrend":
        return (
          <SentimentTrend
            data={sentimentData}
            annotations={sentimentAnnotations}
          />
        );

      case "mediaSummary": {
        const data = mediaBucket?.mediaSummary;
        return <MediaSummary data={data} />;
      }

      case "topSources": {
        const data = mediaBucket?.topSources;
        return <TopSources data={data} />;
      }

      case "topJournalists": {
        const data = mediaBucket?.topJournalists;
        return <TopJournalists data={data} />;
      }

      case "volumeAndSentiment": {
        const data = mediaBucket?.volumeAndSentiment;
        return <VolumeAndSentiment data={data} />;
      }

      case "wordCloud": {
        const data = mediaBucket?.wordCloud;
        return <WordCloud data={data} />;
      }

      case "kpiPerformance": {
        const data = mediaBucket?.kpiPerformance;
        return <KPIPerformance data={data} />;
      }

      case "sectorRanking": {
        const data = mediaBucket?.sectorRanking;
        return <SectorRanking data={data} />;
      }

      case "sectorialCompetitor": {
        const data = mediaBucket?.sectorialCompetitor;
        return <SectorialCompetitor data={data} />;
      }

      case "issueImpact": {
        const data = mediaBucket?.issueImpact;
        return <IssueImpact data={data} />;
      }

      case "reputationalRisks": {
        const data = mediaBucket?.reputationalRisks;
        return <ReputationalRisks data={data} />;
      }

      case "reputationalOpportunities": {
        const data = mediaBucket?.reputationalOpportunities;
        return <ReputationalOpportunities data={data} />;
      }
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

        {renderModuleComponent() ?? (
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
        )}
      </CardContent>
    </Card>
  );
};
