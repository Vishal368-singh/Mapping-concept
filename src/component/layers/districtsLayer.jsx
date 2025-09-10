import GeoJSONLayer from "@arcgis/core/layers/GeoJSONLayer";

export function createDistrictsLayer() {
  return new GeoJSONLayer({
    id: "districtsLayer",
    title: "Districts",
    url: "/districts.geojson",
    visible: false,
    popupTemplate: { title: "{DISTRICT}", content: "District boundary" },
  });
}
