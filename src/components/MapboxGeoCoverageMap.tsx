import { useState, useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card } from "./ui/card";

interface MapboxGeoCoverageMapProps {
  countryCounts: Record<string, number>;
  showTitle?: boolean;
  containerStyle?: React.CSSProperties;
}

// ISO 3166-1 alpha-3 country codes mapping
const countryNameToISO: Record<string, string> = {
  "United States of America": "USA",
  "United Kingdom": "GBR",
  "France": "FRA",
  "Germany": "DEU",
  "Italy": "ITA",
  "Spain": "ESP",
  "Canada": "CAN",
  "Australia": "AUS",
  "Brazil": "BRA",
  "China": "CHN",
  "India": "IND",
  "Japan": "JPN",
  "Russia": "RUS",
  "South Africa": "ZAF",
  "Mexico": "MEX",
  "Argentina": "ARG",
  "Netherlands": "NLD",
  "Belgium": "BEL",
  "Switzerland": "CHE",
  "Sweden": "SWE",
  "Norway": "NOR",
  "Denmark": "DNK",
  "Finland": "FIN",
  "Poland": "POL",
  "Greece": "GRC",
  "Portugal": "PRT",
  "Turkey": "TUR",
  "Egypt": "EGY",
  "Nigeria": "NGA",
  "Kenya": "KEN",
  "South Korea": "KOR",
  "Thailand": "THA",
  "Vietnam": "VNM",
  "Indonesia": "IDN",
  "Malaysia": "MYS",
  "Singapore": "SGP",
  "Philippines": "PHL",
  "New Zealand": "NZL",
  "Chile": "CHL",
  "Colombia": "COL",
  "Peru": "PER",
  "Venezuela": "VEN",
  "Ukraine": "UKR",
  "Austria": "AUT",
  "Czech Republic": "CZE",
  "Hungary": "HUN",
  "Romania": "ROU",
  "Ireland": "IRL",
  "Israel": "ISR",
  "Saudi Arabia": "SAU",
  "United Arab Emirates": "ARE",
};

// Replace this with your actual Mapbox public token
const MAPBOX_TOKEN =
  "pk.eyJ1IjoiaGlyb3NlaWppIiwiYSI6ImNrc2g3cHZyZzFyeTUyb29kZm50YnY0emEifQ.fSfjCD8-glLbfjMhOiKKIA";

const MapboxGeoCoverageMap = ({
  countryCounts,
  showTitle = true,
  containerStyle = {},
}: MapboxGeoCoverageMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (
      !mapContainer.current ||
      !MAPBOX_TOKEN ||
      MAPBOX_TOKEN ===
        "pk.eyJ1IjoiaGlyb3NlaWppIiwiYSI6ImNrc2g3cHZyZzFyeTUyb29kZm50YnY0emEifQ.fSfjCD8-glLbfjMhOiKKIA"
    )
      return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      projection: { name: "globe" },
      zoom: 1.5,
      center: [20, 20],
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    map.current.on("load", () => {
      if (!map.current) return;

      // Get max count for color scaling
      const maxCount = Math.max(0, ...Object.values(countryCounts || {}));

      // Create expressions for color and opacity based on country counts
      const colorExpressionParts: unknown[] = ["case"];
      const opacityExpressionParts: unknown[] = ["case"];

      Object.entries(countryCounts).forEach(([countryName, count]) => {
        const isoCode = countryNameToISO[countryName];
        if (isoCode) {
          const intensity = maxCount > 0 ? count / maxCount : 0;
          colorExpressionParts.push(["==", ["get", "ADM0_A3"], isoCode]);
          colorExpressionParts.push(`hsl(0, 85%, ${100 - intensity * 50}%)`);
          opacityExpressionParts.push(["==", ["get", "ADM0_A3"], isoCode]);
          opacityExpressionParts.push(0.3 + intensity * 0.7);
        }
      });

      colorExpressionParts.push("hsl(0, 0%, 95%)");
      opacityExpressionParts.push(0.1);

      const colorExpression = colorExpressionParts as mapboxgl.Expression;
      const opacityExpression = opacityExpressionParts as mapboxgl.Expression;

      map.current.addLayer({
        id: "country-fills",
        type: "fill",
        source: {
          type: "vector",
          url: "mapbox://mapbox.country-boundaries-v1",
        },
        "source-layer": "country_boundaries",
        paint: {
          "fill-color": colorExpression,
          "fill-opacity": opacityExpression,
        },
      });

      map.current.addLayer({
        id: "country-borders",
        type: "line",
        source: {
          type: "vector",
          url: "mapbox://mapbox.country-boundaries-v1",
        },
        "source-layer": "country_boundaries",
        paint: {
          "line-color": "hsl(0, 0%, 70%)",
          "line-width": 1,
        },
      });

      // Add tooltips on hover
      map.current.on("mousemove", "country-fills", (e) => {
        if (!map.current || !e.features || e.features.length === 0) return;

        map.current.getCanvas().style.cursor = "pointer";

        const feature = e.features[0];
        const isoCode = feature.properties?.ADM0_A3;
        
        // Find country name from ISO code
        const countryName = Object.entries(countryNameToISO).find(
          ([_, code]) => code === isoCode
        )?.[0];

        if (countryName && countryCounts[countryName]) {
          const mentions = countryCounts[countryName];
          new mapboxgl.Popup({ closeButton: false })
            .setLngLat(e.lngLat)
            .setHTML(`<strong>${countryName}</strong><br/>${mentions} mentions`)
            .addTo(map.current);
        }
      });

      map.current.on("mouseleave", "country-fills", () => {
        if (!map.current) return;
        map.current.getCanvas().style.cursor = "";
        const popups = document.getElementsByClassName("mapboxgl-popup");
        if (popups.length) {
          popups[0].remove();
        }
      });
    });

    return () => {
      map.current?.remove();
    };
  }, [countryCounts]);

  return (
    <div style={{ ...containerStyle }} className="w-full">
      {showTitle && <h3 className="text-lg font-semibold mb-4">Geographic Coverage</h3>}
      <div
        ref={mapContainer}
        style={{ width: "100%", height: "500px" }}
        className="rounded-lg shadow-lg"
      />
      <div className="mt-4 flex items-center justify-center gap-6 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-8 h-4 rounded" style={{ background: "hsl(0, 85%, 75%)" }} />
          <span className="text-sm text-muted-foreground">Low</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-4 rounded" style={{ background: "hsl(0, 85%, 50%)" }} />
          <span className="text-sm text-muted-foreground">High</span>
        </div>
        <span className="text-sm font-semibold text-muted-foreground">Mentions</span>
      </div>
    </div>
  );
};

export default MapboxGeoCoverageMap;
