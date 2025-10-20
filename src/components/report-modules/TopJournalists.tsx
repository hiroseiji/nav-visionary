import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface TopJournalistsProps {
  data?: Array<{
    name?: string;
    journalist?: string;
    outlet?: string;
    source?: string;
    articles?: number;
    count?: number;
    volume?: number;
    sentiment?: number;
    averageSentiment?: number;
  }>;
}

export function TopJournalists({ data }: TopJournalistsProps) {
  const journalists = (data || [])
    .map(item => ({
      name: item.name || item.journalist || "Unknown",
      outlet: item.outlet || item.source || "Unknown",
      articles: item.articles || item.count || item.volume || 0,
      sentiment: item.sentiment !== undefined ? item.sentiment : 
                 item.averageSentiment !== undefined ? Math.round(item.averageSentiment * 100) : 0
    }))
    .slice(0, 10); // Top 10 journalists

  if (journalists.length === 0) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        No journalist data available
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('');
  };

  return (
    <div className="space-y-4">
      {journalists.map((journalist, idx) => (
        <Card key={idx} className="p-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarFallback>{getInitials(journalist.name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h4 className="font-semibold">{journalist.name}</h4>
              <p className="text-sm text-muted-foreground">{journalist.outlet}</p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-2xl font-bold">{journalist.articles}</p>
              <p className="text-xs text-muted-foreground">articles</p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-2xl font-bold">{journalist.sentiment}%</p>
              <p className="text-xs text-muted-foreground">avg sentiment</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
