import React from "react";
import "./styles.css";
import data from "./expected.json";
import Sankey from "./Sankey";

export default function App() {
  return (
    <div className="App">
      <Sankey
        title="Data Visualization"
        {...data}
        svgWidth={1050}
        svgHeight={400}
        nodeWidth={200}
        linkStrokeWidth={40}
      />
    </div>
  );
}
