import React, { useEffect, useRef } from "react";
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Graphic from "@arcgis/core/Graphic";
import GeoJSONLayer from "@arcgis/core/layers/GeoJSONLayer";
import Search from "@arcgis/core/widgets/Search";
import Zoom from "@arcgis/core/widgets/Zoom";
import "@arcgis/core/assets/esri/themes/light/main.css";

// NOTE: loc.png and districts.geojson MUST be in the 'public' folder.

export default function ArcGISMap() {
  const mapRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current) return;
    let view;

    const map = new Map({
      basemap: "streets-navigation-vector",
    });

    view = new MapView({
      container: mapRef.current,
      map,
      center: [84.5, 25.7],
      zoom: 6,
    });

    const geojsonLayer = new GeoJSONLayer({
      url: "/districts.geojson",
      renderer: {
        type: "simple",
        symbol: {
          type: "simple-fill",
          color: [50, 150, 50, 0.3],
          outline: { color: "#333", width: 2 },
        },
      },
      popupTemplate: {
        title: "{DISTRICT}",
        content: "District boundary",
      },
    });
    map.add(geojsonLayer);

    const graphicsLayer = new GraphicsLayer({
      fields: [{ name: "name", alias: "Name", type: "string" }],
    });
    map.add(graphicsLayer);

    const cities = [
      { name: "Ballia", lat: 25.788763, lon: 84.245925 },
      { name: "Varanasi", lat: 25.3176, lon: 82.9739 },
      { name: "Lucknow", lat: 26.8467, lon: 80.9462 },
      { name: "Patna", lat: 25.5941, lon: 85.1376 },
      { name: "Delhi", lat: 28.7041, lon: 77.1025 },
    ];
    
    let balliaGraphic = null;
    
    cities.forEach((city) => {
      const cityGraphic = new Graphic({
        geometry: {
          type: "point",
          latitude: city.lat,
          longitude: city.lon,
        },
        symbol: {
          type: "picture-marker",
          url: "/loc.png",
          width: "24px",
          height: "24px",
        },
        attributes: { name: city.name },
        popupTemplate: { title: "{name}" },
      });
      graphicsLayer.add(cityGraphic);

      if (city.name === "Ballia") {
        balliaGraphic = cityGraphic;
      }
    });

    view.ui.remove("zoom");
    const zoomWidget = new Zoom({ view });
    view.ui.add(zoomWidget, "bottom-right");

    const searchWidget = new Search({
      view,
      includeDefaultSources: false,
      placeholder: "Search cities or districts",
      groupingEnabled: false,
      sources: [
        {
          layer: graphicsLayer,
          searchFields: ["name"],
          displayField: "name",
          name: "Cities",
        },
        {
          layer: geojsonLayer,
          searchFields: ["DISTRICT"],
          displayField: "DISTRICT",
          name: "Districts",
        },
      ],
    });
    view.ui.add(searchWidget, "top-right");

    view.when(() => {
      if (balliaGraphic) {
        graphicsLayer.definitionExpression = `name = 'Ballia'`;
        geojsonLayer.definitionExpression = `1=0`;
        view.goTo(balliaGraphic);
      }
    });

    searchWidget.on("search-start", () => {
      graphicsLayer.definitionExpression = null;
      geojsonLayer.definitionExpression = null;
    });

    searchWidget.on("select-result", (event) => {
      const { feature, source } = event.result;
      
      if (source.name === "Cities") {
        const cityName = feature.attributes.name;
        graphicsLayer.definitionExpression = `name = '${cityName}'`;
        // ** THE FIX IS HERE: Keep polygons visible when a city is selected **
        geojsonLayer.definitionExpression = null; 
      } 
      else if (source.name === "Districts") {
        const districtName = feature.attributes.DISTRICT;
        graphicsLayer.definitionExpression = `1=0`;
        geojsonLayer.definitionExpression = `DISTRICT = '${districtName}'`;
      }
    });

    return () => {
      if (view) {
        view.destroy();
      }
    };
  }, []);

  return (
    <div
      ref={mapRef}
      className="arcgis-map-container"
      style={{ height: "100vh", width: "100%", position: "relative" }}
    />
  );
}