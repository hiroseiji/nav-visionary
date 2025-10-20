import { Card } from "@/components/ui/card";

interface MediaSummaryProps {
  data?: {
    volume?: number;
    ave?: number;
    reach?: number;
    totalMentions?: number;
  };
}

export function MediaSummary({ data }: MediaSummaryProps) {
  const volume = data?.volume || data?.totalMentions || 0;
  const ave = data?.ave || 0;
  const reach = data?.reach || 0;

  if (!data || (!volume && !ave && !reach)) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        No media summary data available
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-2">Volume</h3>
        <p className="text-3xl font-bold text-primary">{volume.toLocaleString()}</p>
        <p className="text-sm text-muted-foreground mt-1">Total Mentions</p>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-2">Total AVE</h3>
        <p className="text-3xl font-bold text-primary">BWP {ave.toLocaleString()}</p>
        <p className="text-sm text-muted-foreground mt-1">Advertising Value Equivalent</p>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-2">Total Reach</h3>
        <p className="text-3xl font-bold text-primary">{reach.toLocaleString()}</p>
        <p className="text-sm text-muted-foreground mt-1">Potential Audience</p>
      </Card>
    </div>
  );
}
