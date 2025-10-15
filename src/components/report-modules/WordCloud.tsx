import { Card } from "@/components/ui/card";

interface WordCloudProps {
  data?: Array<{
    word: string;
    frequency: number;
  }>;
}

export function WordCloud({ data }: WordCloudProps) {
  const words = data || [
    { word: "Innovation", frequency: 95 },
    { word: "Growth", frequency: 85 },
    { word: "Leadership", frequency: 75 },
    { word: "Community", frequency: 70 },
    { word: "Excellence", frequency: 65 },
    { word: "Service", frequency: 60 },
    { word: "Quality", frequency: 55 },
    { word: "Impact", frequency: 50 },
    { word: "Trust", frequency: 45 },
    { word: "Vision", frequency: 40 },
  ];

  const maxFreq = Math.max(...words.map(w => w.frequency));

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Key Terms</h3>
      <div className="flex flex-wrap gap-4 justify-center items-center min-h-[400px] p-8">
        {words.map((item, idx) => {
          const size = (item.frequency / maxFreq) * 3 + 1;
          return (
            <span
              key={idx}
              className="font-bold transition-colors hover:text-primary cursor-default"
              style={{
                fontSize: `${size}rem`,
                opacity: 0.5 + (item.frequency / maxFreq) * 0.5,
              }}
            >
              {item.word}
            </span>
          );
        })}
      </div>
    </Card>
  );
}
