const tsConfigPaths = require('tsconfig-paths');
const path = require('path');

const tsConfig = require('./tsconfig.server.json');

tsConfigPaths.register({
  baseUrl: path.join(__dirname, tsConfig.compilerOptions.baseUrl || '.'),
  paths: tsConfig.compilerOptions.paths || {},
});