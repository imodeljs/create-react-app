import * as React from "react";
import * as ReactDOM from "react-dom";
import { Logger, LogLevel } from "@bentley/bentleyjs-core";
import { iModeljsApp } from "./api/App";
import App from "./components/App";
import "./index.css";

// Setup logging immediately to pick up any logging during iModeljsApp.startup()
Logger.initializeToConsole();
Logger.setLevelDefault(LogLevel.Warning); // Set all logging to a default of Warning
Logger.setLevel("iModeljs-app", LogLevel.Info); // Override the above default and set only App level logging to Info.

(async () => {  // eslint-disable-line @typescript-eslint/no-floating-promises
  // initialize the application
  await iModeljsApp.startup();

  // when initialization is complete, render
  ReactDOM.render(
    <App />,
    document.getElementById("root") as HTMLElement,
  );
})();
