import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface TopJournalistsProps {
  data?: Array<{
    name: string;
    outlet: string;
    articles: number;
    sentiment: number;
  }>;
}

export function TopJournalists({ data }: TopJournalistsProps) {
  const journalists = data || [
    { name: "Sarah Johnson", outlet: "Daily News", articles: 12, sentiment: 75 },
    { name: "Michael Chen", outlet: "Business Weekly", articles: 9, sentiment: 68 },
    { name: "Emma Davis", outlet: "Tech Today", articles: 8, sentiment: 82 },
    { name: "James Wilson", outlet: "National Post", articles: 7, sentiment: 71 },
    { name: "Lisa Anderson", outlet: "The Chronicle", articles: 6, sentiment: 79 },
  ];

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
