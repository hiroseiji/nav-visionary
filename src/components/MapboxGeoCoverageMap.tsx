import { useEffect, useRef } from "react";
import type React from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

interface MapboxGeoCoverageMapProps {
  countryCounts: Record<string, number>; // e.g. { Botswana: 12, "United States": 5 }
  showTitle?: boolean;
  containerStyle?: React.CSSProperties;
}

const MAPBOX_TOKEN =
  "pk.eyJ1IjoiaGlyb3NlaWppIiwiYSI6ImNrc2g3cHZyZzFyeTUyb29kZm50YnY0emEifQ.fSfjCD8-glLbfjMhOiKKIA";

const MapboxGeoCoverageMap = ({
  countryCounts,
  showTitle = true,
  containerStyle = {},
}: MapboxGeoCoverageMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current || !MAPBOX_TOKEN) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    // init once
    if (!mapRef.current) {
      const map = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/light-v11",
        projection: { name: "globe" },
        zoom: 1.5,
        center: [20, 0],
      });
      mapRef.current = map;

      map.addControl(new mapboxgl.NavigationControl(), "top-right");

      map.on("load", () => {
        // base fills
        map.addLayer({
          id: "country-fills",
          type: "fill",
          source: {
            type: "vector",
            url: "mapbox://mapbox.country-boundaries-v1",
          },
          "source-layer": "country_boundaries",
          paint: {
            "fill-color": "hsl(0, 0%, 95%)",
            "fill-opacity": 0.1,
          },
        });

        // borders
        map.addLayer({
          id: "country-borders",
          type: "line",
          source: {
            type: "vector",
            url: "mapbox://mapbox.country-boundaries-v1",
          },
          "source-layer": "country_boundaries",
          paint: {
            "line-color": "hsl(0, 0%, 80%)",
            "line-width": 0.7,
          },
        });

        // hover tooltip using name_en / name directly
        map.on("mousemove", "country-fills", (e) => {
          if (!e.features?.length) return;
          const feature = e.features[0];
          const props = feature.properties as
            | { name_en?: string; name?: string }
            | undefined;

          const countryName = (props?.name_en || props?.name || "").toString();
          const mentions = countryCounts[countryName] ?? 0;

          map.getCanvas().style.cursor = "pointer";

          // clear old popups
          document
            .querySelectorAll(".mapboxgl-popup")
            .forEach((p) => p.remove());

          if (countryName && mentions > 0) {
            new mapboxgl.Popup({ closeButton: false })
              .setLngLat(e.lngLat)
              .setHTML(
                `<strong>${countryName}</strong><br/>${mentions} mention${
                  mentions !== 1 ? "s" : ""
                }`
              )
              .addTo(map);
          }
        });

        map.on("mouseleave", "country-fills", () => {
          map.getCanvas().style.cursor = "";
          document
            .querySelectorAll(".mapboxgl-popup")
            .forEach((p) => p.remove());
        });

        updateChoropleth(); // initial
      });
    } else {
      const map = mapRef.current;
      if (map.isStyleLoaded()) {
        updateChoropleth();
      } else {
        map.once("load", updateChoropleth);
      }
    }

    function updateChoropleth() {
      const map = mapRef.current;
      if (!map || !map.getLayer("country-fills")) return;

      const entries = Object.entries(countryCounts || {}).filter(([_, count]) => count > 0);
      
      // If no data, just use default colors
      if (entries.length === 0) {
        map.setPaintProperty("country-fills", "fill-color", "hsl(0, 0%, 95%)");
        map.setPaintProperty("country-fills", "fill-opacity", 0.08);
        return;
      }

      const values = entries.map(([_, count]) => count);
      const maxCount = Math.max(...values);

      // Build Mapbox expression for choropleth
      const colorExpr: mapboxgl.Expression = ["case"];
      const opacityExpr: mapboxgl.Expression = ["case"];

      entries.forEach(([name, count]) => {
        const intensity = maxCount > 0 ? count / maxCount : 0;
        const color = `hsl(0, 85%, ${100 - intensity * 50}%)`;
        const opacity = 0.2 + intensity * 0.8;

        // Match by country name in vector tiles (name_en property)
        colorExpr.push(["==", ["get", "name_en"], name], color);
        opacityExpr.push(["==", ["get", "name_en"], name], opacity);
      });

      // defaults
      colorExpr.push("hsl(0, 0%, 95%)");
      opacityExpr.push(0.08);

      map.setPaintProperty("country-fills", "fill-color", colorExpr);
      map.setPaintProperty("country-fills", "fill-opacity", opacityExpr);
    }

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [countryCounts]);

  return (
    <div className="w-full h-full" style={containerStyle}>
      {showTitle && (
        <h3 className="text-lg font-semibold mb-4">Geographic Coverage</h3>
      )}
      {/* parent (CardContent) sets height; this div stretches to fill */}
      <div ref={mapContainer} className="w-full h-full rounded-lg shadow-lg" />
      <div className="mt-4 flex items-center justify-center gap-6 flex-wrap">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-4 rounded"
            style={{ background: "hsl(0, 85%, 75%)" }}
          />
          <span className="text-sm text-muted-foreground">Low</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-4 rounded"
            style={{ background: "hsl(0, 85%, 50%)" }}
          />
          <span className="text-sm text-muted-foreground">High</span>
        </div>
        <span className="text-sm font-semibold text-muted-foreground">
          Mentions
        </span>
      </div>
    </div>
  );
};

export default MapboxGeoCoverageMap;
