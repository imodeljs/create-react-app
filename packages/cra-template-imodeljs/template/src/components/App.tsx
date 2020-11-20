import { Config, Id64, Id64String, OpenMode } from "@bentley/bentleyjs-core";
import { ContextRegistryClient, Project } from "@bentley/context-registry-client";
import "@bentley/icons-generic-webfont/dist/bentley-icons-generic-webfont.css";
import { IModelQuery } from "@bentley/imodelhub-client";
import { AuthorizedFrontendRequestContext, DrawingViewState, FrontendRequestContext, IModelApp, IModelConnection, RemoteBriefcaseConnection, SpatialViewState } from "@bentley/imodeljs-frontend";
import { SignIn, ViewportComponent } from "@bentley/ui-components";
import { Button, ButtonSize, ButtonType, Spinner, SpinnerSize } from "@bentley/ui-core";
import React, { useState, useEffect } from "react";
import { Api } from "../api";
import "./App.css";
import Toolbar from "./Toolbar";

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

  /** The component's render method */
  let ui: React.ReactNode;

  if (appState.user.isLoading || window.location.href.includes(_signInRedirectUri())) {
    // if user is currently being loaded, just tell that
    ui = `signing-in...`;
  } else if (!appState.user.isAuthorized) {
    // if user doesn't have and access token, show sign in page
    ui = (<SignIn onSignIn={_onStartSignin} />);
  } else if (!appState.imodel || !appState.viewDefinitionId) {
    // if we don't have an imodel / view definition id - render a button that initiates imodel open
    ui = (<OpenIModelButton onIModelSelected={_onIModelSelected} />);
  } else {
    // if we do have an imodel and view definition id - render imodel components
    ui = (<IModelComponents imodel={appState.imodel} viewDefinitionId={appState.viewDefinitionId} />);
  }

  // render the app
  return (
    <div className="app">
      {ui}
    </div>
  );
}

/** React props for [[OpenIModelButton]] component */
interface OpenIModelButtonProps {
  onIModelSelected: (imodel: IModelConnection | undefined) => void;
}

/** Renders a button that opens an iModel identified in configuration */
function OpenIModelButton(props: OpenIModelButtonProps) {
  const [loadingState, setLoadingState] = useState({ isLoading: false });

  /** Finds project and imodel ids using their names */
  const getIModelInfo = async (): Promise<{ projectId: string, imodelId: string }> => {
    const imodelName = Config.App.get("imjs_test_imodel");
    const projectName = Config.App.get("imjs_test_project", imodelName);

    const requestContext: AuthorizedFrontendRequestContext = await AuthorizedFrontendRequestContext.create();

    const connectClient = new ContextRegistryClient();
    let project: Project;
    try {
      const projects: Project[] = await connectClient.getInvitedProjects(requestContext, { $filter: `Name+eq+'${projectName}'` });
      project = projects[0];
    } catch (e) {
      throw new Error(`Project with name "${projectName}" does not exist`);
    }

    const imodelQuery = new IModelQuery();
    imodelQuery.byName(imodelName);
    const imodels = await IModelApp.iModelClient.iModels.get(requestContext, project.wsgId, imodelQuery);
    if (imodels.length === 0)
      throw new Error(`iModel with name "${imodelName}" does not exist in project "${projectName}"`);
    return { projectId: project.wsgId, imodelId: imodels[0].wsgId };
  }

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
      const info = await getIModelInfo();
      imodel = await RemoteBriefcaseConnection.open(info.projectId, info.imodelId, OpenMode.Readonly);
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

/** React props for [[IModelComponents]] component */
interface IModelComponentsProps {
  imodel: IModelConnection;
  viewDefinitionId: Id64String;
}

/** Renders a viewport */
function IModelComponents(props: IModelComponentsProps) {
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

export default App;
