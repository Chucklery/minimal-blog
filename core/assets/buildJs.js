// core/assets/buildJs.js
// 打包 + 压缩 site/scripts/*.js → dist/assets/

import { writeFile, readdir } from 'node:fs/promises';
import * as esbuild from 'esbuild';
import { SCRIPTS_DIR, DIST_ASSETS } from '../utils/paths.js';
import { join, extname } from 'node:path';

/**
 * 构建所有 JS 文件
 */
export async function buildJs() {
  let files;
  try {
    files = await readdir(SCRIPTS_DIR);
  } catch {
    console.warn('  JS: No scripts directory found');
    return;
  }

  const jsFiles = files.filter((f) => extname(f) === '.js');
  if (jsFiles.length === 0) return;

  for (const file of jsFiles) {
    try {
      const result = await esbuild.build({
        entryPoints: [join(SCRIPTS_DIR, file)],
        outfile: join(DIST_ASSETS, file),
        bundle: false,
        minify: true,
        format: 'esm',
        write: false,
      });

      const outFile = result.outputFiles[0];
      if (outFile) {
        await writeFile(join(DIST_ASSETS, file), outFile.text, 'utf-8');
      }
    } catch (err) {
      console.warn(`  JS: Skipped ${file} — ${err.message}`);
    }
  }

  console.log(`  JS: ${jsFiles.length} file(s) → dist/assets/`);
}

