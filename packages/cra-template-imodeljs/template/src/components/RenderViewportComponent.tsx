import React from "react";
import "@bentley/icons-generic-webfont/dist/bentley-icons-generic-webfont.css";
import { Id64String } from "@bentley/bentleyjs-core";
import { IModelConnection } from "@bentley/imodeljs-frontend";
import { ViewportComponent } from "@bentley/ui-components";
import Toolbar from "./Toolbar";

/** React props for [[IModelComponents]] component */
interface IModelComponentsProps {
  imodel: IModelConnection;
  viewDefinitionId: Id64String;
}

/** Renders a viewport */
export default function RenderViewportComponent(props: IModelComponentsProps) {
  return (
    <>
      <ViewportComponent
        style={{ height: "100vh" }}
        imodel={props.imodel}
        viewDefinitionId={props.viewDefinitionId} />
      <Toolbar />
    </>
  );
}
