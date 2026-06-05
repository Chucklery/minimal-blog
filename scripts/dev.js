// scripts/dev.js
// 开发模式：chokidar 监听文件变化 → 自动重新构建

import { watch } from 'chokidar';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { ROOT } from '../core/utils/paths.js';
import { join } from 'node:path';

const execAsync = promisify(exec);

let building = false;
let pending = false;

async function rebuild() {
  if (building) {
    pending = true;
    return;
  }

  building = true;
  console.clear();
  console.log('🔨 Rebuilding...\n');

  try {
    const { stderr } = await execAsync('node scripts/build.js', { cwd: ROOT });
    if (stderr) console.error(stderr);
  } catch (err) {
    console.error('Build failed:', err.message);
  }

  building = false;

  if (pending) {
    pending = false;
    rebuild();
  }
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

// 首次构建
rebuild();
