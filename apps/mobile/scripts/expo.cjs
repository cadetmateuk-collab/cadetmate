const { spawn } = require('child_process');
const path = require('path');

const appRoot = path.join(__dirname, '..');
const localModules = path.join(appRoot, 'node_modules');
process.env.NODE_PATH = [localModules, process.env.NODE_PATH].filter(Boolean).join(path.delimiter);

const cli = require.resolve('expo/bin/cli', { paths: [appRoot] });
const child = spawn(process.execPath, [cli, ...process.argv.slice(2)], {
  cwd: appRoot,
  env: process.env,
  stdio: 'inherit',
});

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 0);
});
