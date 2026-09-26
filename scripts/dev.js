// scripts/dev.js
// 开发模式：chokidar 监听文件变化 → 自动重新构建

import { watch } from 'chokidar';
import { exec, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import { ROOT } from '../core/utils/paths.js';
import { join } from 'node:path';

const execAsync = promisify(exec);

let building = false;
let pending = false;
let previewServer;

async function rebuild() {
  if (building) {
    pending = true;
    return;
  }

  building = true;
  console.log('🔨 Rebuilding...\n');

  try {
    const { stdout, stderr } = await execAsync('node scripts/build.js', { cwd: ROOT });
    if (stdout) process.stdout.write(stdout);
    if (stderr) console.error(stderr);
  } catch (err) {
    console.error('Build failed:', err.message);
  }

  building = false;

  if (pending) {
    pending = false;
    await rebuild();
  }
}

function startPreview() {
  const command = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
  previewServer = spawn(command, ['preview'], {
    cwd: ROOT,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  previewServer.on('error', (err) => console.error('Preview server failed to start:', err.message));
  previewServer.on('exit', (code) => {
    if (code && code !== 0) console.error(`Preview server exited with code ${code}`);
    previewServer = undefined;
  });
  console.log('🌐 Preview: http://localhost:8088');
}

function stopPreview() {
  previewServer?.kill();
  watcher.close();
}

// 监听 content, styles, scripts, templates
const watcher = watch(
  [
    join(ROOT, 'site/content/**/*.md'),
    join(ROOT, 'site/styles/**/*.css'),
    join(ROOT, 'site/scripts/**/*.js'),
    join(ROOT, 'site/public/**/*'),
    join(ROOT, 'core/**/*.js'),
    join(ROOT, 'images/**/*'),
  ],
  {
    ignoreInitial: true,
    awaitWriteFinish: { stabilityThreshold: 200, pollInterval: 100 },
  }
);

watcher.on('all', (event, filepath) => {
  const rel = filepath.replace(ROOT, '').replace(/\\/g, '/');
  console.log(`  [${event}] ${rel}`);
  rebuild();
});

console.log('👀 Watching for changes...');
console.log('   Press Ctrl+C to stop\n');

process.on('SIGINT', stopPreview);
process.on('SIGTERM', stopPreview);

// 首次构建
rebuild().then(startPreview);
