// @remove-file-on-eject
/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

const babelJest = require('babel-jest');

module.exports = babelJest.createTransformer({
  presets: [require.resolve('babel-preset-react-app')],
  babelrc: false,
  configFile: false,
  // With the added support for svg-sprites using the resource query '?sprite', this
  // plugin is needed to remove the query for imports during tests.
  // Adding the second plugin so tests don't break if some package decides to use raw-loader
  plugins: [
    'babel-plugin-import-remove-resource-query',
    ['strip-requirejs-plugin-prefix', { plugin: 'raw-loader' }],
  ],
});
