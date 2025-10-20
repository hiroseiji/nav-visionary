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
import { moduleLabels, mediaTypeLabels } from "@/utils/reportConstants";
import type { Report } from "@/hooks/useReportData";
import type {
  SentimentPoint,
  SentimentAnnotation,
  SentimentLike,
} from "../../types/sentimentTrend";
import {
  toSentimentPoint,
  normalizeAnnotations,
} from "../../utils/sentimentTrendUtils";

/* -------------------------------------------------------
   Types to avoid `any` when indexing by dynamic mediaType
--------------------------------------------------------*/
interface MediaBucket {
  sentimentTrend?: SentimentPoint[];
  sentimentTrendAnnotations?: SentimentAnnotation[];
  mediaSummary?: unknown;
  topSources?: unknown;
  topJournalists?: unknown;
  volumeAndSentiment?: unknown;
  wordCloud?: unknown;
  kpiPerformance?: unknown;
  sectorRanking?: unknown;
  issueImpact?: unknown;
  reputationalRisks?: unknown;
  reputationalOpportunities?: unknown;
}
interface ReportWithMedia extends Report {
  executiveSummary?: unknown;
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

type ReportModulePageProps = {
  mediaType: string;
  moduleName: string;
  reportData: Report;
};

export const ReportModulePage = ({
  mediaType,
  moduleName,
  reportData,
}: ReportModulePageProps) => {
  const displayMediaType = mediaTypeLabels[mediaType] || mediaType;
  const displayModule = moduleLabels[moduleName] || moduleName;

  // Extract data from formData if it exists (keeps your original fallback path)
  const formDataUnknown = (reportData as { formData?: unknown }).formData;
  const formData = isObject(formDataUnknown)
    ? (formDataUnknown as Record<string, unknown>)
    : undefined;
  const dataSource = formData ?? reportData;

  const r = dataSource as ReportWithMedia;
  const bucketUnknown = dataSource as unknown as { [key: string]: unknown };
  const bucket = bucketUnknown[mediaType];

  const mediaBucket: MediaBucket | undefined =
    typeof bucket === "object" && bucket !== null
      ? (bucket as MediaBucket)
      : undefined;

  const isSentimentTrend = moduleName === "sentimentTrend";

  // Keep your robust fallback extraction
  const seriesRaw: SentimentLike[] = isSentimentTrend
    ? (mediaBucket?.sentimentTrend as SentimentLike[]) ??
      (r.sentimentTrend as unknown as SentimentLike[]) ??
      []
    : (mediaBucket?.[moduleName as keyof MediaBucket] as SentimentLike[]) ?? [];

  const annotationsRaw: Partial<SentimentAnnotation>[] = isSentimentTrend
    ? (mediaBucket?.sentimentTrendAnnotations as SentimentAnnotation[]) ??
      (r.sentimentTrendAnnotations as SentimentAnnotation[]) ??
      []
    : (mediaBucket?.[
        `${moduleName}Annotations` as keyof MediaBucket
      ] as SentimentAnnotation[]) ?? [];

  // Normalize to strong types using the shared utils
  const sentimentData: SentimentPoint[] = (seriesRaw || []).map(
    toSentimentPoint
  );
  const sentimentAnnotations: SentimentAnnotation[] =
    normalizeAnnotations(annotationsRaw);

  // (Your existing console debug can remain if you like)
  // console.log(" Sentiment Data:", { sentimentDataLength: sentimentData.length, ... });

  // Extract module-specific data
  const moduleDataRaw = isSentimentTrend
    ? null // already handled above
    : (mediaBucket?.[moduleName as keyof MediaBucket] as unknown) ??
      (r[moduleName as keyof ReportWithMedia] as unknown);

  // Normalize to array if needed
  const moduleData = Array.isArray(moduleDataRaw)
    ? moduleDataRaw
    : moduleDataRaw
    ? [moduleDataRaw]
    : [];

  const renderModuleComponent = () => {
    switch (moduleName) {
      case "executiveSummary":
        return <ExecutiveSummary data={(reportData as unknown as ReportWithMedia).executiveSummary} />;
      
      case "sentimentTrend":
        return (
          <SentimentTrend
            data={sentimentData}
            annotations={sentimentAnnotations}
          />
        );
      
      case "mediaSummary":
        const summary = mediaBucket?.mediaSummary as any;
        return <MediaSummary data={summary} />;
      
      case "topSources":
        const sources = (mediaBucket?.topSources || moduleData) as any;
        return <TopSources data={sources} />;
      
      case "topJournalists":
        const journalists = (mediaBucket?.topJournalists || moduleData) as any;
        return <TopJournalists data={journalists} />;
      
      case "volumeAndSentiment":
        const volumeData = (mediaBucket?.volumeAndSentiment || moduleData) as any;
        return <VolumeAndSentiment data={volumeData} />;
      
      case "wordCloud":
        const words = (mediaBucket?.wordCloud || moduleData) as any;
        return <WordCloud data={words} />;
      
      case "kpiPerformance":
        const kpiData = (mediaBucket?.kpiPerformance || moduleData) as any;
        return <KPIPerformance data={kpiData} />;
      
      case "sectorRanking":
        const rankings = (mediaBucket?.sectorRanking || moduleData) as any;
        return <SectorRanking data={rankings} />;
      
      case "issueImpact":
        const issueData = mediaBucket?.issueImpact as any;
        return <IssueImpact data={issueData} />;
      
      case "reputationalRisks":
        return <ReputationalRisks data={moduleData as any} />;
      
      case "reputationalOpportunities":
        return <ReputationalOpportunities data={moduleData as any} />;

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
