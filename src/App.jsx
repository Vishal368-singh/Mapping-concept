import "./App.css";
import Map from "./component/Map";

function App() {
  return (
    <div className="app-container">
      <header className="header">
        <h1>Ballia District Map</h1>
      </header>
      <div className="map-container">
        <Map />
      </div>
    </div>
  );
}

export default App;
