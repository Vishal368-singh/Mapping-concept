import React, { useEffect, useRef, useState } from "react";
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import Search from "@arcgis/core/widgets/Search";
import Zoom from "@arcgis/core/widgets/Zoom";
import "@arcgis/core/assets/esri/themes/light/main.css";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";

// import layer creators
import { createStatesLayer } from "./layers/statesLayer";
import { createDistrictsLayer } from "./layers/districtsLayer";
import { createWeatherLayer } from "./layers/weatherLayer";

export default function ArcGISMap() {
  const mapDivRef = useRef(null);
  const mapInstance = useRef(null);
  const viewInstance = useRef(null);
  const originalBasemap = useRef(null);
  const [layers, setLayers] = useState([]);

  useEffect(() => {
    if (!mapDivRef.current) return;

    // Base map
    mapInstance.current = new Map({
      basemap: "streets-navigation-vector",
    });
    originalBasemap.current = mapInstance.current.basemap;

    // View
    const initialExtent = { center: [78.9629, 20.5937], zoom: 5 };
    viewInstance.current = new MapView({
      container: mapDivRef.current,
      map: mapInstance.current,
      ...initialExtent,
    });

    // Add states & districts
    const statesLayer = createStatesLayer();
    const districtsLayer = createDistrictsLayer();
    mapInstance.current.addMany([statesLayer, districtsLayer]); //Add both the statesLayer and districtsLayer to the current map instance in one call. 

    // Add weather layer (async)
    (async () => {
      const weatherLayer = new GraphicsLayer({
        id: "weatherLayer",
        title: "Weather Data",
      });
      mapInstance.current.add(weatherLayer);

      await createWeatherLayer(weatherLayer, (batchGraphics) => {
        console.log("Batch loaded:", batchGraphics.length);
        // optional: you can update layer toggle panel here per batch
      });

      setLayers((prev) => [
        ...prev,
        { id: weatherLayer.id, title: weatherLayer.title, visible: true },
      ]);
    })();

    // Widgets
    viewInstance.current.ui.remove("zoom");
    viewInstance.current.ui.add(
      new Zoom({ view: viewInstance.current }),
      "bottom-right"
    );

    const searchWidget = new Search({
      view: viewInstance.current,
      includeDefaultSources: false,
      placeholder: "Search for a state",
      sources: [
        {
          layer: statesLayer,
          searchFields: ["NAME_1"],
          displayField: "NAME_1",
          name: "Indian States",
        },
      ],
    });
    viewInstance.current.ui.add(searchWidget, "top-right");

    // Load operational layers in panel
    viewInstance.current.when(() => {
      const operationalLayers = mapInstance.current.layers
        .map((layer) => ({
          id: layer.id,
          title: layer.title,
          visible: layer.visible,
        }))
        .toArray();

      setLayers(
        [
          ...operationalLayers,
          { id: "basemap", title: "Basemap", visible: true },
        ].reverse()
      );
    });

    return () => viewInstance.current?.destroy();
  }, []);

  const handleVisibilityChange = (id, visible) => {
    if (id === "basemap") {
      mapInstance.current.basemap = visible ? originalBasemap.current : null;
    } else {
      const layer = mapInstance.current.findLayerById(id);
      if (layer) layer.visible = visible;
    }
    setLayers((current) =>
      current.map((l) => (l.id === id ? { ...l, visible } : l))
    );
  };

  return (
    <>
      <div
        ref={mapDivRef}
        style={{ height: "100vh", width: "100%", position: "relative" }}
      />
      <div
        style={{
          position: "absolute",
          top: "110px",
          left: "15px",
          backgroundColor: "white",
          padding: "10px",
          borderRadius: "8px",
          boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
          zIndex: 10,
          fontFamily: "sans-serif",
          width: "150px",
        }}
      >
        <h4 style={{ margin: "0 0 10px 0" }}>Layers</h4>
        {layers.map((layer) => (
          <div
            key={layer.id}
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "5px",
            }}
          >
            <input
              type="checkbox"
              id={layer.id}
              checked={layer.visible}
              onChange={(e) =>
                handleVisibilityChange(layer.id, e.target.checked)
              }
              style={{ marginRight: "8px" }}
            />
            <label htmlFor={layer.id}>{layer.title}</label>
          </div>
        ))}
      </div>
    </>
  );
}
