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
      // to ensure the search links the city point to its district polygon.
      { name: "Ballia", lat: 25.788763, lon: 84.245925, districtName: "Ballia District" },
      { name: "Varanasi", lat: 25.3176, lon: 82.9739, districtName: "Varanasi District" },
      { name: "Lucknow", lat: 26.8467, lon: 80.9462, districtName: "Lucknow District" },
      { name: "Patna", lat: 25.5941, lon: 85.1376, districtName: "Patna District" },
      { name: "Delhi", lat: 28.7041, lon: 77.1025, districtName: "Delhi District" },
      { name: "Mumbai", lat: 19.0760, lon: 72.8777, districtName: "Mumbai District" },
      { name: "Kolkata", lat: 22.5726, lon: 88.3639, districtName: "Kolkata District" },
      { name: "Bengaluru", lat: 12.9716, lon: 77.5946, districtName: "Bengaluru Urban" },
      { name: "Chennai", lat: 13.0827, lon: 80.2707, districtName: "Chennai District" },
      { name: "Hyderabad", lat: 17.3850, lon: 78.4867, districtName: "Hyderabad District" },
      { name: "Ahmedabad", lat: 23.0225, lon: 72.5714, districtName: "Ahmedabad District" },
      { name: "Pune", lat: 18.5204, lon: 73.8567, districtName: "Pune District" },
      { name: "Jaipur", lat: 26.9124, lon: 75.7873, districtName: "Jaipur District" },
      { name: "Bhopal", lat: 23.2599, lon: 77.4126, districtName: "Bhopal District" },
      { name: "Chandigarh", lat: 30.7333, lon: 76.7794, districtName: "Chandigarh District" }
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