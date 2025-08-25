import React, { useEffect, useRef } from "react";
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Graphic from "@arcgis/core/Graphic";
import GeoJSONLayer from "@arcgis/core/layers/GeoJSONLayer";
import locIcon from "../assets/loc.png";

export default function ArcGISMap() {
  const mapRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // 1. Create map
    const map = new Map({
      basemap: "streets-navigation-vector",
    });

    // 2. Create view
    const view = new MapView({
      container: mapRef.current,
      map,
      center: [84.245925, 25.788763], // Ballia center
      zoom: 9,
    });

    // 3. Add Ballia GeoJSON (true boundary)
    const geojsonUrl =
      "https://raw.githubusercontent.com/datameet/maps/master/Districts/UttarPradesh/Ballia.geojson";

    const geojsonLayer = new GeoJSONLayer({
      url: geojsonUrl,
      renderer: {
        type: "simple",
        symbol: {
          type: "simple-fill",
          color: [50, 150, 50, 0.3], // green fill
          outline: null,
        },
      },
      popupTemplate: {
        title: "{DISTRICT}",
        content: "Boundary of Ballia district",
      },
    });
    map.add(geojsonLayer);

    // 4. Graphics Layer
    const graphicsLayer = new GraphicsLayer();
    map.add(graphicsLayer);

    // ✅ Add Point
    const pointGraphic = new Graphic({
      geometry: {
        type: "point",
        longitude: 84.245925,
        latitude: 25.788763,
      },
      symbol: {
        type: "picture-marker", // <-- use picture-marker
        url: locIcon, // relative path to your image
        width: "24px", // size of marker
        height: "24px",
      },
      attributes: {
        name: "Ballia Center",
        description: "Approximate center point",
      },
      popupTemplate: { title: "{name}", content: "{description}" },
    });
    graphicsLayer.add(pointGraphic);

    // ✅ Add Polyline
    const polylineGraphic = new Graphic({
      geometry: {
        type: "polyline",
        paths: [
          [84.1, 25.7],
          [84.25, 25.8],
          [84.4, 25.9],
        ],
      },
      symbol: { type: "simple-line", color: "red", width: 2 },
    });
    graphicsLayer.add(polylineGraphic);

    // ✅ Add Polygon
    const polygonGraphic = new Graphic({
      geometry: {
        type: "polygon",
        rings: [
          [83.63, 25.55],
          [83.7, 25.6],
          [83.8, 25.7],
          [83.9, 25.83],
          [84.1, 25.9],
          [84.2, 25.95],
          [84.35, 26.05],
          [84.5, 26.05],
          [84.6, 25.95],
          [84.6, 25.7],
          [84.5, 25.55],
          [83.63, 25.55],
        ],
      },
      symbol: {
        type: "simple-fill",
        color: [50, 100, 200, 0.3],
        outline: { color: "#000000", width: 2 },
      },
    });
    graphicsLayer.add(polygonGraphic);

    // Cleanup on unmount
    return () => view.destroy();
  }, []);

  return (
    <div
      ref={mapRef}
      style={{ height: "100vh", width: "100%", border: "2px solid #333" }}
    ></div>
  );
}
