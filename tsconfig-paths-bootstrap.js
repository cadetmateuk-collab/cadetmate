const tsConfigPaths = require('tsconfig-paths');
const tsConfig = require('./tsconfig.server.json');

tsConfigPaths.register({
  baseUrl: tsConfig.compilerOptions.baseUrl || '.',
  paths: tsConfig.compilerOptions.paths || {},
});
```

**Then add `.server-out` to your `.gitignore`:**
```
.server-out