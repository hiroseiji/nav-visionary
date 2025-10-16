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

interface ReportModulePageProps {
  mediaType: string;
  moduleName: string;
}

export const ReportModulePage = ({ mediaType, moduleName }: ReportModulePageProps) => {
  const displayMediaType = mediaTypeLabels[mediaType] || mediaType;
  const displayModule = moduleLabels[moduleName] || moduleName;

  const renderModuleComponent = () => {
    switch (moduleName) {
      case "executiveSummary":
        return <ExecutiveSummary />;
      case "mediaSummary":
        return <MediaSummary />;
      case "sentimentTrend":
        return <SentimentTrend />;
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
                This section would show {displayModule} data for {displayMediaType}
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
          <p className="text-sm text-muted-foreground mb-2">{displayMediaType}</p>
          <h2 className="text-4xl font-bold text-foreground">{displayModule}</h2>
        </div>

        {renderModuleComponent()}
      </CardContent>
    </Card>
  );
};
