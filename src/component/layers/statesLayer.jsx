import GeoJSONLayer from "@arcgis/core/layers/GeoJSONLayer";

export function createStatesLayer() {
  return new GeoJSONLayer({
    id: "statesLayer",
    title: "Indian States",
    url: "https://raw.githubusercontent.com/Subhash9325/GeoJson-Data-of-Indian-States/master/Indian_States",
    popupTemplate: { title: "{NAME_1}", content: "State Boundary" },
    renderer: {
      type: "simple",
      symbol: {
        type: "simple-fill",
        color: [51, 133, 255, 0.3],
        outline: { color: "#003366", width: 1.5 },
      },
    },
  });
}
