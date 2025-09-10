import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Graphic from "@arcgis/core/Graphic";
import Point from "@arcgis/core/geometry/Point";
import * as geometryEngine from "@arcgis/core/geometry/geometryEngine";

import citiesData from "../../../public/city.json";

const apiKey = "ac562378c1d24dd796351230250209";

async function fetchWeather(city) {
  const res = await fetch(
    `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${city.lat},${city.lng}&aqi=no`
  );
  const data = await res.json();
  return {
    ...city,
    temp: data.current?.temp_c ?? "N/A",
    condition: data.current?.condition?.text ?? "N/A",
  };
}

// Merge overlapping polygons into groups until no overlaps remain
function mergeAllOverlappingPolygons(polygonsArr) {
  let groups = polygonsArr.map((p) => ({
    cities: [p.city],
    polygon: p.polygon,
  }));

  let merged = true;
  while (merged) {
    merged = false;
    const newGroups = [];
    const used = new Array(groups.length).fill(false);

    for (let i = 0; i < groups.length; i++) {
      if (used[i]) continue;
      let current = groups[i].polygon;
      const cities = [...groups[i].cities];

      for (let j = i + 1; j < groups.length; j++) {
        if (used[j]) continue;
        if (geometryEngine.intersects(current, groups[j].polygon)) {
          current = geometryEngine.union([current, groups[j].polygon]);
          cities.push(...groups[j].cities);
          used[j] = true;
          merged = true;
        }
      }
      newGroups.push({ polygon: current, cities });
    }

    groups = newGroups;
  }

  // Convert to Graphics
  return groups.map(
    (g) =>
      new Graphic({
        geometry: g.polygon,
        symbol: {
          type: "simple-fill",
          color: [255, 0, 0, 0.3],
          outline: { color: [255, 0, 0, 0.8], width: 1 },
        },
        attributes: { cities: g.cities },
        popupTemplate: {
          title: "Affected Area",
          content: (feature) =>
            feature.graphic.attributes.cities
              .map(
                (c) =>
                  `${c.city}${c.admin_name ? `, ${c.admin_name}` : ""}: ${
                    c.temp
                  } °C, ${c.condition}`
              )
              .join("<br/>"),
        },
      })
  );
}

export async function createWeatherLayer(existingLayer) {
  const weatherLayer =
    existingLayer ||
    new GraphicsLayer({ id: "weatherLayer", title: "Weather Data" });
  weatherLayer.removeAll();

  const polygons = [];

  for (const city of citiesData) {
    const cityData = await fetchWeather(city);

    // Create point marker
    const pt = new Point({
      longitude: parseFloat(city.lng),
      latitude: parseFloat(city.lat),
    });
    const pointGraphic = new Graphic({
      geometry: pt,
      symbol: {
        type: "picture-marker",
        url: "/location.png",
        width: "24px",
        height: "24px",
      },
      attributes: cityData,
      popupTemplate: {
        title: cityData.city,
        content: `${cityData.temp} °C, ${cityData.condition}`,
      },
    });
    weatherLayer.add(pointGraphic);

    // Create 5 km buffer polygon
    const buffer = geometryEngine.geodesicBuffer(pt, 5, "kilometers");
    polygons.push({ polygon: buffer, city: cityData });
  }

  // Merge polygons recursively until no overlaps
  const mergedPolygons = mergeAllOverlappingPolygons(polygons);
  mergedPolygons.forEach((g) => weatherLayer.add(g));

  return weatherLayer;
}
