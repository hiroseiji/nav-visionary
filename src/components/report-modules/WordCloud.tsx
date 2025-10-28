import { Card } from "@/components/ui/card";
import Wordcloud from "@visx/wordcloud/lib/Wordcloud";
import { scaleLog } from "@visx/scale";
import { Text } from "@visx/text";

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

const colors = [
  "#FF6B6B", "#FF8C42", "#4ECDC4", "#45B7D1", "#96CEB4",
  "#FFEAA7", "#DDA15E", "#BC6C25", "#A8DADC", "#E63946",
  "#F4A261", "#2A9D8F", "#E76F51", "#8AC926", "#FF006E",
];

type KeywordItem = {
  word?: string;
  text?: string;
  frequency?: number;
  count?: number;
  value?: number;
};

export function WordCloud({ data }: WordCloudProps) {
  // Normalize input
  let keywords: KeywordItem[] = [];
  let industry = "";

  if (Array.isArray(data)) {
    keywords = data;
  } else if (data && typeof data === "object") {
    keywords = (data as WordCloudData).keywords || [];
    industry = (data as WordCloudData).industry || "";
  }

  // Convert to visx wordcloud format
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

  const fontScale = scaleLog({
    domain: [Math.min(...words.map((w) => w.value)), Math.max(...words.map((w) => w.value))],
    range: [15, 50],
  });

  const fontSizeSetter = (datum: WordCloudWord) => fontScale(datum.value);

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">
        Trending Keywords{industry ? ` in ${industry} Sector` : ""}
      </h3>
      <div style={{ height: 400, width: "100%" }}>
        <Wordcloud
          words={words}
          width={800}
          height={400}
          fontSize={fontSizeSetter}
          font="Raleway"
          padding={5}
          spiral="archimedean"
          rotate={() => (Math.random() > 0.5 ? 0 : -90)}
          random={() => 0.5}
        >
          {(cloudWords) =>
            cloudWords.map((w, i) => (
              <Text
                key={w.text}
                fill={colors[i % colors.length]}
                textAnchor="middle"
                transform={`translate(${w.x}, ${w.y}) rotate(${w.rotate})`}
                fontSize={w.size}
                fontFamily={w.font}
                fontWeight={600}
              >
                {w.text}
              </Text>
            ))
          }
        </Wordcloud>
      </div>
    </Card>
  );
}
