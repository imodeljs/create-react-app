import React, { useState } from "react";
import "@bentley/icons-generic-webfont/dist/bentley-icons-generic-webfont.css";
import { Config, OpenMode } from "@bentley/bentleyjs-core";
import { Button, ButtonSize, ButtonType, Spinner, SpinnerSize } from "@bentley/ui-core";
import { Api } from "../api";
import { FrontendRequestContext, IModelConnection, RemoteBriefcaseConnection } from "@bentley/imodeljs-frontend";

/** React props for [[IModelButtonComponent]] component */
interface IModelButtonProps {
  onIModelSelected: (imodel: IModelConnection | undefined) => void;
}

/** Renders a button that opens an iModel identified in configuration */
export default function IModelButtonComponent(props: IModelButtonProps) {
  const [loadingState, setLoadingState] = useState({ isLoading: false });  

  /** Handle iModel open event */
  const onIModelSelected = async (imodel: IModelConnection | undefined) => {
    props.onIModelSelected(imodel);
    setLoadingState({ isLoading: false });
  }

  const _onClickOpen = async () => {
    setLoadingState({ isLoading: true });
    let imodel: IModelConnection | undefined;
    try {
      // attempt to open the imodel
      const imodelId = Config.App.get("imjs_test_imodel");
      const projectId = Config.App.get("imjs_test_project");

      imodel = await RemoteBriefcaseConnection.open(projectId, imodelId, OpenMode.Readonly);
      console.log(`App.tsx : _onClickOpen - iModel Id is: ${imodelId}`);
    } catch (e) {
      alert(e.message);
    }
    await onIModelSelected(imodel);
  }

  const _onClickSignOut = async () => {
    if (Api.oidcClient)
      Api.oidcClient.signOut(new FrontendRequestContext());  // eslint-disable-line @typescript-eslint/no-floating-promises
  }

  return (
    <div>
      <div>
        <Button size={ButtonSize.Large} buttonType={ButtonType.Primary} className="button-open-imodel" onClick={_onClickOpen}>
          <span>Open iModel</span>
          {loadingState.isLoading ? <span style={{ marginLeft: "8px" }}><Spinner size={SpinnerSize.Small} /></span> : undefined}
        </Button>
      </div>
      <div>
        <Button size={ButtonSize.Large} buttonType={ButtonType.Primary} className="button-signout" onClick={_onClickSignOut}>
          <span>Sign Out</span>
        </Button>
      </div>
    </div>
  );
}
