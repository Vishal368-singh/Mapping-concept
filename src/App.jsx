import "./App.css";
import ArcGISMap from "./component/Map";
import "@arcgis/core/assets/esri/themes/light/main.css";
function App() {
  return (
    <div className="app-container">
      <header className="header">
        <h1>Ballia District Map</h1>
      </header>
      <div className="map-container">
        <ArcGISMap />
      </div>
    </div>
  );
}

export default App;
