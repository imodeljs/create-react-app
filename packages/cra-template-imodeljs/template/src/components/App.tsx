import { Config, Id64, Id64String } from "@bentley/bentleyjs-core";
import "@bentley/icons-generic-webfont/dist/bentley-icons-generic-webfont.css";
import { DrawingViewState, FrontendRequestContext, IModelConnection, SpatialViewState } from "@bentley/imodeljs-frontend";
import { SignIn } from "@bentley/ui-components";
import React, { useState, useEffect } from "react";
import { Api } from "../api";
import "./App.css";
import RenderViewportComponent from "./RenderViewportComponent";
import IModelButtonComponent from "./IModelButtonComponent";

/** React state of the App component */
export interface AppState {
  user: {
    isAuthorized: boolean;
    isLoading: boolean;
  };
  imodel?: IModelConnection;
  viewDefinitionId?: Id64String;
}

/** A component that renders the whole application UI */
const App = () => {
  const [appState, setAppState] = useState<AppState>({
    user: {
      isAuthorized: Api.oidcClient.isAuthorized,
      isLoading: false
    }
  });

  useEffect(() => {
    // Initialize authorization state, and add listener to changes
    Api.oidcClient.onUserStateChanged.addListener(_onUserStateChanged);
    return () => {
      // unsubscribe from user state changes
      Api.oidcClient.onUserStateChanged.removeListener(_onUserStateChanged);
    }
  }, []);

  const _onStartSignin = async () => {
    setAppState({
      user: {
        isAuthorized: appState.user.isAuthorized,
        isLoading: true
      }
    });
    Api.oidcClient.signIn(new FrontendRequestContext());  // eslint-disable-line @typescript-eslint/no-floating-promises
  }

  const _onUserStateChanged = () => {
    setAppState({
      user: {
        isAuthorized: Api.oidcClient.isAuthorized,
        isLoading: false
      }
    });
  }

  /** Pick the first available spatial view definition in the imodel */
  const getFirstViewDefinitionId = async (imodel: IModelConnection): Promise<Id64String> => {
    // Return default view definition (if any)
    const defaultViewId = await imodel.views.queryDefaultViewId();
    if (Id64.isValid(defaultViewId))
      return defaultViewId;

    // Return first spatial view definition (if any)
    const spatialViews: IModelConnection.ViewSpec[] = await imodel.views.getViewList({ from: SpatialViewState.classFullName });
    if (spatialViews.length > 0)
      return spatialViews[0].id;

    // Return first drawing view definition (if any)
    const drawingViews: IModelConnection.ViewSpec[] = await imodel.views.getViewList({ from: DrawingViewState.classFullName });
    if (drawingViews.length > 0)
      return drawingViews[0].id;

    throw new Error("No valid view definitions in imodel");
  }

  /** Handle iModel open event */
  const _onIModelSelected = async (imodel: IModelConnection | undefined) => {
    if (!imodel) {
      // reset the state when imodel is closed
      setAppState({
        user: appState.user,
        imodel: undefined,
        viewDefinitionId: undefined
      });
      return;
    }
    try {
      // attempt to get a view definition
      const viewDefinitionId = await getFirstViewDefinitionId(imodel);
      setAppState({
        user: appState.user,
        imodel: imodel,
        viewDefinitionId: viewDefinitionId
      });
    } catch (e) {
      // if failed, close the imodel and reset the state
      await imodel.close();
      setAppState({
        user: appState.user,
        imodel: undefined,
        viewDefinitionId: undefined
      });
      alert(e.message);
    }
  }

  const _signInRedirectUri = () => {
    const split = (Config.App.get("imjs_browser_test_redirect_uri") as string).split("://");
    return split[split.length - 1];
  }

  let ui: React.ReactNode;

  if (appState.user.isLoading || window.location.href.includes(_signInRedirectUri())) {
    // if user is currently being loaded, just tell that
    ui = `signing-in...`;
  } else if (!appState.user.isAuthorized) {
    // if user doesn't have and access token, show sign in page
    ui = (<SignIn onSignIn={_onStartSignin} />);
  } else if (!appState.imodel || !appState.viewDefinitionId) {
    // if we don't have an imodel / view definition id - render a button that initiates imodel open
    ui = (<IModelButtonComponent onIModelSelected={_onIModelSelected} />);
  } else {
    // if we do have an imodel and view definition id - render imodel components
    ui = (<RenderViewportComponent imodel={appState.imodel} viewDefinitionId={appState.viewDefinitionId} />);
  }

  // render the app
  return (
    <div className="app">
      {ui}
    </div>
  );
}

export default App;
