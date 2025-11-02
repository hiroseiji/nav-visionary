import { useState, useContext } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";
import { scaleLinear } from "d3-scale";
import { ThemeContext } from "./ThemeContext";
import { Plus, Minus } from "lucide-react";
import { Button } from "./ui/button";

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface GeoCoverageMapProps {
  countryCounts: Record<string, number>;
  showTitle?: boolean;
  containerStyle?: React.CSSProperties;
}

const GeoCoverageMap = ({
  countryCounts,
  showTitle = true,
  containerStyle = {},
}: GeoCoverageMapProps) => {
  const [tooltipContent, setTooltipContent] = useState("");
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const { theme } = useContext(ThemeContext);
  
  const maxCount = Math.max(0, ...Object.values(countryCounts || {}));
  const colorScale = scaleLinear<string>()
    .domain([0, maxCount])
    .range(["#f0f0f0", "#d80027"]);

  const [position, setPosition] = useState({ coordinates: [0, 0], zoom: 1 });

  function handleZoomIn() {
    if (position.zoom >= 4) return;
    setPosition((pos) => ({ ...pos, zoom: pos.zoom * 2 }));
  }

  function handleZoomOut() {
    if (position.zoom <= 1) return;
    setPosition((pos) => ({ ...pos, zoom: pos.zoom / 2 }));
  }

  function handleMoveEnd(position: any) {
    setPosition(position);
  }

  return (
    <div
      style={{
        width: "100%",
        height: "500px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "center",
        textAlign: "center",
        margin: "0 auto",
        ...containerStyle,
      }}
    >
      {showTitle && <h3 className="text-lg font-semibold mb-4">Geographic Coverage</h3>}
      <div style={{ width: "100%", height: "400px" }}>
        <ComposableMap
          projectionConfig={{ scale: 200 }}
          style={{ width: "100%", height: "100%" }}
        >
          <ZoomableGroup
            zoom={position.zoom}
            center={position.coordinates as [number, number]}
            onMoveEnd={handleMoveEnd}
            minZoom={1}
            maxZoom={8}
            translateExtent={[
              [-1000, -500],
              [1000, 500],
            ]}
          >
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const countryName = geo.properties.name;
                  const count = countryCounts[countryName] || 0;
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={colorScale(count)}
                      stroke="#cccaca"
                      onMouseEnter={(e) => {
                        const mentions = countryCounts[countryName] || 0;
                        setTooltipContent(`${countryName}: ${mentions} mentions`);
                        setTooltipPosition({ x: e.clientX, y: e.clientY });
                      }}
                      onMouseLeave={() => {
                        setTooltipContent("");
                      }}
                      style={{
                        default: { outline: "none" },
                        hover: { outline: "none", fill: "#ff6b6b" },
                        pressed: { outline: "none" },
                      }}
                    />
                  );
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginTop: "15px",
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
          <div key={i} style={{ textAlign: "center" }}>
            <div
              style={{
                background: colorScale(t * maxCount),
                width: "30px",
                height: "15px",
                marginBottom: "4px",
                borderRadius: "2px",
                border: "1px solid #ccc",
              }}
            />
            <small
              className="text-xs text-muted-foreground"
            >
              {(t * maxCount).toFixed(0)}
            </small>
          </div>
        ))}
        <span
          className="ml-2 text-sm font-semibold text-muted-foreground"
        >
          Mentions (Relative Scale)
        </span>
        <div style={{ marginLeft: "45px", display: "flex", gap: "8px" }}>
          <Button
            onClick={handleZoomIn}
            variant="outline"
            size="icon"
            className="h-8 w-8"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            onClick={handleZoomOut}
            variant="outline"
            size="icon"
            className="h-8 w-8"
          >
            <Minus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {tooltipContent && (
        <div
          className="fixed bg-popover text-popover-foreground px-3 py-2 rounded shadow-lg text-sm pointer-events-none z-50 whitespace-nowrap font-semibold"
          style={{
            top: tooltipPosition.y + 10,
            left: tooltipPosition.x + 10,
          }}
        >
          {tooltipContent}
        </div>
      )}
    </div>
  );
};

export default GeoCoverageMap;
