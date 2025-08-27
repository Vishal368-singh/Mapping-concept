import React, { useEffect, useRef, useState } from "react";
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import GeoJSONLayer from "@arcgis/core/layers/GeoJSONLayer";
import Search from "@arcgis/core/widgets/Search";
import Zoom from "@arcgis/core/widgets/Zoom";
import "@arcgis/core/assets/esri/themes/light/main.css";

export default function ArcGISMap() {
  const mapDivRef = useRef(null);
  const mapInstance = useRef(null);
  const viewInstance = useRef(null);
  const originalBasemap = useRef(null);
  const [layers, setLayers] = useState([]);

  useEffect(() => {
    if (!mapDivRef.current) return;

    mapInstance.current = new Map({
      basemap: "streets-navigation-vector",
    });
    originalBasemap.current = mapInstance.current.basemap;

    const initialExtent = {
      center: [78.9629, 20.5937], // Centered on India
      zoom: 5,
    };

    viewInstance.current = new MapView({
      container: mapDivRef.current,
      map: mapInstance.current,
      ...initialExtent,
    });

    const statesLayer = new GeoJSONLayer({
      title: "Indian States",
      // Make sure this URL points to your new GeoJSON data
      url: "https://raw.githubusercontent.com/Subhash9325/GeoJson-Data-of-Indian-States/master/Indian_States",
      // CHANGED: Use the correct field "NAME_1" for the popup title
      popupTemplate: {
        title: "{NAME_1}",
        content: "State Boundary",
      },
      renderer: {
        type: "simple",
        symbol: {
          type: "simple-fill",
          color: [51, 133, 255, 0.3],
          outline: { color: "#003366", width: 1.5 },
        },
      },
    });
    mapInstance.current.add(statesLayer);

    // This layer is optional if you only want to show states
    const districtsLayer = new GeoJSONLayer({
      title: "Districts",
      url: "/districts.geojson", // Assumes you have this file locally
      visible: false,
      popupTemplate: { title: "{DISTRICT}", content: "District boundary" },
    });
    mapInstance.current.add(districtsLayer);

    viewInstance.current.ui.remove("zoom");
    const zoomWidget = new Zoom({ view: viewInstance.current });
    viewInstance.current.ui.add(zoomWidget, "bottom-right");

    const searchWidget = new Search({
      view: viewInstance.current,
      includeDefaultSources: false,
      placeholder: "Search for a state",
      popupEnabled: true,
      sources: [
        {
          layer: statesLayer,
          // CHANGED: Use the correct field "NAME_1" for searching and display
          searchFields: ["NAME_1"],
          displayField: "NAME_1",
          name: "Indian States",
        },
        // You can add the districts layer back here if you need to search it too
      ],
    });
    viewInstance.current.ui.add(searchWidget, "top-right");

    viewInstance.current.when(() => {
      const operationalLayers = mapInstance.current.layers
        .map((layer) => ({
          id: layer.id,
          title: layer.title,
          visible: layer.visible,
        }))
        .toArray();
      const basemapLayer = {
        id: "basemap",
        title: originalBasemap.current.title || "Basemap",
        visible: !!mapInstance.current.basemap,
      };
      setLayers([...operationalLayers, basemapLayer].reverse());
    });

    // --- Search Event Logic for Highlighting (no changes needed here) ---

    searchWidget.on("search-start", () => {
      statesLayer.definitionExpression = null;
      districtsLayer.definitionExpression = null;
    });

    searchWidget.on("select-result", (event) => {
      const { feature } = event.result;
      if (!feature) return;

      const selectedLayer = feature.layer;
      const objectIdField = selectedLayer.objectIdField;
      const objectId = feature.attributes[objectIdField];

      selectedLayer.definitionExpression = `${objectIdField} = ${objectId}`;
      selectedLayer.visible = true;

      viewInstance.current.goTo(feature.geometry.extent.expand(1.5));

      viewInstance.current.popup.open({
        features: [feature],
        location: feature.geometry.centroid,
      });
    });

    searchWidget.on("search-clear", () => {
      statesLayer.definitionExpression = null;
      districtsLayer.definitionExpression = null;
      viewInstance.current.popup.close();
      viewInstance.current.goTo(initialExtent);
    });

    return () => {
      if (viewInstance.current) viewInstance.current.destroy();
    };
  }, []);

  const handleVisibilityChange = (id, visible) => {
    if (id === "basemap") {
      mapInstance.current.basemap = visible ? originalBasemap.current : null;
    } else {
      const layer = mapInstance.current.findLayerById(id);
      if (layer) layer.visible = visible;
    }
    setLayers((currentLayers) =>
      currentLayers.map((l) => (l.id === id ? { ...l, visible } : l))
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
