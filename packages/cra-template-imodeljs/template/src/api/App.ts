import { ClientRequestContext, Config } from "@bentley/bentleyjs-core";
import { BrowserAuthorizationCallbackHandler, BrowserAuthorizationClient, BrowserAuthorizationClientConfiguration } from "@bentley/frontend-authorization-client";
import { BentleyCloudRpcManager, BentleyCloudRpcParams } from "@bentley/imodeljs-common";
import { FrontendRequestContext, IModelApp } from "@bentley/imodeljs-frontend";
import { UrlDiscoveryClient } from "@bentley/itwin-client";
import { UiComponents } from "@bentley/ui-components";
import { IModelReadRpcInterface, IModelTileRpcInterface, RpcInterfaceDefinition } from "@bentley/imodeljs-common";

/**
 * Returns a list of RPCs supported by this application
 */
export function getSupportedRpcs(): RpcInterfaceDefinition[] {
  return [
    IModelReadRpcInterface,
    IModelTileRpcInterface,
  ];
}

// Boiler plate code
export class iModeljsApp {

  public static get oidcClient() { return IModelApp.authorizationClient as BrowserAuthorizationClient; }

  public static async startup() {
    await IModelApp.startup({ applicationVersion: "1.0.0" });

    // initialize OIDC
      await iModeljsApp.initializeOidc();

    // contains various initialization promises which need
    // to be fulfilled before the app is ready
    const initPromises = new Array<Promise<any>>();

    // initialize RPC communication
      initPromises.push(iModeljsApp.initializeRpc());

    // initialize UiComponents
    initPromises.push(UiComponents.initialize(IModelApp.i18n));

    // the app is ready when all initialization promises are fulfilled
    await Promise.all(initPromises);
  }

  private static async initializeRpc(): Promise<void> {
    let rpcParams = await this.getConnectionInfo();
    const rpcInterfaces = getSupportedRpcs();    
    if (!rpcParams) {
       throw new Error(`Error in setting GeneralPurpose backend`);
    }
    BentleyCloudRpcManager.initializeClient(rpcParams, rpcInterfaces);
  }

  private static async initializeOidc() {
    const clientId = Config.App.getString("imjs_browser_test_client_id");
    const redirectUri = Config.App.getString("imjs_browser_test_redirect_uri");
    const scope = Config.App.getString("imjs_browser_test_scope");
    const responseType = "code";
    const oidcConfig: BrowserAuthorizationClientConfiguration = { clientId, redirectUri, scope, responseType };

    await BrowserAuthorizationCallbackHandler.handleSigninCallback(oidcConfig.redirectUri);
    IModelApp.authorizationClient = new BrowserAuthorizationClient(oidcConfig);

    try {
        await iModeljsApp.oidcClient.signInSilent(new ClientRequestContext());
    } catch (err) { }
  }

  private static async getConnectionInfo(): Promise<BentleyCloudRpcParams | undefined> {    
     const urlClient = new UrlDiscoveryClient();
     const requestContext = new FrontendRequestContext();
     const orchestratorUrl = await urlClient.discoverUrl(requestContext, "iModelJsOrchestrator.K8S", undefined);
     return { info: { title: "general-purpose-imodeljs-backend", version: "v2.0" }, uriPrefix: orchestratorUrl };
  }
}
