import { Card } from "@/components/ui/card";
import ReactWordcloud from "react-wordcloud";

interface WordCloudWord {
  text: string;
  value: number;
}

interface WordCloudData {
  keywords?: Array<{
    word?: string;
    text?: string;
    frequency?: number;
    count?: number;
    value?: number;
  }>;
  industry?: string;
}

interface WordCloudProps {
  data?: WordCloudData | Array<{
    word?: string;
    text?: string;
    frequency?: number;
    count?: number;
    value?: number;
  }>;
}

export function WordCloud({ data }: WordCloudProps) {
  // Normalize input
  let keywords: Array<any> = [];
  let industry = "";

  if (Array.isArray(data)) {
    keywords = data;
  } else if (data && typeof data === "object") {
    keywords = (data as WordCloudData).keywords || [];
    industry = (data as WordCloudData).industry || "";
  }

  // Convert to react-wordcloud format
  const words: WordCloudWord[] = keywords
    .map((item) => ({
      text: item.word || item.text || "",
      value: item.frequency ?? item.count ?? item.value ?? 0,
    }))
    .filter((item) => item.text && item.value > 0);

  if (words.length === 0) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        No keywords found for this media type.
      </div>
    );
  }

  const options = {
    rotations: 2,
    rotationAngles: [-90, 0] as [number, number],
    fontSizes: [15, 50] as [number, number],
    fontWeights: ["500", "700"],
    scale: "sqrt" as const,
    spiral: "archimedean" as const,
    transitionDuration: 1000,
    fontFamily: "Raleway",
    padding: 5,
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">
        Trending Keywords{industry ? ` in ${industry} Sector` : ""}
      </h3>
      <div style={{ height: 400, width: "100%", padding: "10px" }}>
        <ReactWordcloud words={words} options={options} />
      </div>
    </Card>
  );
}
