// core/assets/buildCss.js
// 合并 + 压缩 site/styles/*.css → dist/assets/*.css

import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { transform } from 'lightningcss';
import { STYLES_DIR, DIST_ASSETS } from '../utils/paths.js';

/**
 * 构建 CSS：把 site/styles/ 下的所有 CSS 文件原样复制到 dist/assets/
 * 并用 Lightning CSS 压缩
 * 保持独立文件，让浏览器可以并行下载
 */
export async function buildCss() {
  let files;
  try {
    files = await readdir(STYLES_DIR);
  } catch {
    console.warn('  CSS: No styles directory found');
    return;
  }

  const cssFiles = files.filter((f) => extname(f) === '.css');

  for (const file of cssFiles) {
    const inputPath = join(STYLES_DIR, file);
    const raw = await readFile(inputPath, 'utf-8');

    // Lightning CSS 压缩
    const { code } = transform({
      filename: file,
      code: Buffer.from(raw),
      minify: true,
      targets: {
        chrome: 100 << 16,
        safari: (16 << 16) | (4 << 8),
      },
    });

    const outputPath = join(DIST_ASSETS, file);
    await writeFile(outputPath, code);
  }

  console.log(`  CSS: ${cssFiles.length} files → dist/assets/`);
}
