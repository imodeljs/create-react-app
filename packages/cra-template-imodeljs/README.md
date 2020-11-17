# cra-template-imodeljs

This is a [Create React App](https://github.com/facebook/create-react-app) template for an iModel.js sample application.

It demonstrates the minimum setup for opening an iModel and viewing its graphics in a viewport with basic viewing tools. 

* _Viewport_: Renders geometric data onto an HTMLCanvasElement.
* _Toolbar_: Includes basic viewport tools in top-right corner of viewport (select, fit, rotate, pan, zoom).

This app serves as a guide on how you can embed one or more of these components into your own application.
See http://imodeljs.org for comprehensive documentation on the iModel.js API and the various constructs used in this sample.

To use this template, add `--template @bentley/cra-template-imodeljs` when creating a new app. You should also use the @bentley/react-scripts scripts version to compile your application.

For example:

```sh
npx create-react-app my-app-name --template @bentley/cra-template-imodeljs --scripts-version @bentley/react-scripts

# or

yarn create react-app my-app-name --template @bentley/cra-template-imodeljs --scripts-version @bentley/react-scripts
```

For more information, please refer to:

- [Getting Started](https://create-react-app.dev/docs/getting-started) – How to create a new app.
- [User Guide](https://create-react-app.dev) – How to develop apps bootstrapped with Create React App.


## Purpose

The purpose of this sample application is to demonstrate the following:

* [Dependencies](./package.json) required for iModel.js-based frontend applications.
* [Scripts](./package.json) recommended to build and run iModel.js-based applications.
* How to set up a simple [frontend for web](./src/frontend/api/iModeljsApp.ts).
* How to obtain an [access token](https://www.imodeljs.org/learning/common/accesstoken/) used to access iModelHub and other services.
* How to [consume](./src/frontend/components/App.tsx) iModel.js React components.
* How to [setup a viewport](./src/frontend/components/App.tsx#L106).
* How to include
  [tools](./src/frontend/components/Toolbar.tsx) in a
  [viewport](./src/frontend/components/App.tsx#L205).

## Contributing

[Contributing to iModel.js](https://github.com/imodeljs/imodeljs/blob/master/CONTRIBUTING.md)

