import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

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
    positive?: number;
    negative?: number;
    neutral?: number;
    mixed?: number;
  }>;
}

interface SentimentCircleProps {
  count: number;
  type: "positive" | "negative" | "neutral" | "mixed";
}

function SentimentCircle({ count, type }: SentimentCircleProps) {
  const colors = {
    positive: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500",
    negative: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500",
    neutral: "bg-orange-400/10 text-orange-700 dark:text-orange-400 border-orange-400",
    mixed: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center w-8 h-8 rounded-full border text-sm font-medium",
        colors[type]
      )}
    >
      {count}
    </div>
  );
}

export function TopJournalists({ data }: TopJournalistsProps) {
  // Normalize input: accept array directly, or object with common array keys
  let dataArray: Array<any> = [];
  if (Array.isArray(data)) {
    dataArray = data;
  } else if (data && typeof data === "object") {
    const candidates = [
      (data as any).items,
      (data as any).data,
      (data as any).journalists,
      (data as any).list,
    ];
    dataArray = candidates.find((c) => Array.isArray(c)) || [];
  }

  const journalists = dataArray
    .map((item) => ({
      name: item.name || item.journalist || "Unknown",
      outlet: item.outlet || item.source || "Unknown",
      articles: item.articles ?? item.count ?? item.volume ?? 0,
      positive: item.positive ?? 0,
      neutral: item.neutral ?? 0,
      negative: item.negative ?? 0,
      mixed: item.mixed ?? 0,
    }))
    .slice(0, 10); // Top 10 journalists

  if (journalists.length === 0) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        No journalist data available
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40%]">Name</TableHead>
            <TableHead className="text-center">Total Articles</TableHead>
            <TableHead className="text-center">Positive</TableHead>
            <TableHead className="text-center">Neutral</TableHead>
            <TableHead className="text-center">Negative</TableHead>
            <TableHead className="text-center">Mixed</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {journalists.map((journalist, idx) => (
            <TableRow key={idx}>
              <TableCell>
                <div>
                  <div className="font-medium">{journalist.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {journalist.outlet}
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-center font-medium">
                {journalist.articles}
              </TableCell>
              <TableCell className="text-center">
                <SentimentCircle count={journalist.positive} type="positive" />
              </TableCell>
              <TableCell className="text-center">
                <SentimentCircle count={journalist.neutral} type="neutral" />
              </TableCell>
              <TableCell className="text-center">
                <SentimentCircle count={journalist.negative} type="negative" />
              </TableCell>
              <TableCell className="text-center">
                <SentimentCircle count={journalist.mixed} type="mixed" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
