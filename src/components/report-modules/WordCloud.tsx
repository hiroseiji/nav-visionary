import { Card } from "@/components/ui/card";
import { useMemo } from "react";

interface WordCloudProps {
  data?: Array<{
    word: string;
    frequency: number;
  }>;
}

const colors = [
  "#FF6B6B", // red
  "#FF8C42", // orange
  "#4ECDC4", // teal
  "#45B7D1", // blue
  "#96CEB4", // green
  "#FFEAA7", // yellow
  "#DDA15E", // brown
  "#BC6C25", // dark orange
  "#A8DADC", // light blue
  "#E63946", // crimson
  "#F4A261", // light orange
  "#2A9D8F", // dark teal
  "#E76F51", // coral
  "#8AC926", // lime
  "#FF006E", // pink
];

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

  const positionedWords = useMemo(() => {
    const radius = 200;
    return words.map((item, idx) => {
      const angle = (idx / words.length) * Math.PI * 2;
      const distance = Math.random() * radius * 0.8;
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;
      const size = (item.frequency / maxFreq) * 2.5 + 0.8;
      const color = colors[idx % colors.length];
      
      return {
        ...item,
        x,
        y,
        size,
        color,
      };
    });
  }, [words, maxFreq]);

  return (
    <Card className="p-6 bg-muted/30">
      <h3 className="text-lg font-semibold mb-6 text-center">Trending Keywords</h3>
      <div className="relative w-full flex items-center justify-center" style={{ minHeight: "500px" }}>
        <div className="relative w-[450px] h-[450px] rounded-full bg-background/80 flex items-center justify-center">
          {positionedWords.map((item, idx) => (
            <span
              key={idx}
              className="absolute font-semibold cursor-default transition-transform hover:scale-110"
              style={{
                left: `calc(50% + ${item.x}px)`,
                top: `calc(50% + ${item.y}px)`,
                transform: "translate(-50%, -50%)",
                fontSize: `${item.size}rem`,
                color: item.color,
              }}
            >
              {item.word}
            </span>
          ))}
        </div>
      </div>
    </Card>
  );
}
