// core/assets/buildImages.js
// 图片优化：生成 WebP/AVIF 多尺寸

import { readdir, mkdir } from 'node:fs/promises';
import { join, extname, basename } from 'node:path';
import sharp from 'sharp';
import { DIST_IMAGES, ROOT } from '../utils/paths.js';

const IMAGES_DIR = join(ROOT, 'images');
const SIZES = [480, 800, 1200];
const FORMAT_CONFIGS = [
  { ext: 'webp', quality: 75 },
  { ext: 'avif', quality: 55 },
];

/**
 * 处理所有图片
 */
export async function buildImages() {
  let files;
  try {
    files = await readdir(IMAGES_DIR);
  } catch {
    console.log('  Images: No source images directory');
    return 0;
  }

  const imageFiles = files.filter((f) => /\.(png|jpe?g|webp)$/i.test(f));
  if (imageFiles.length === 0) return 0;

  await mkdir(DIST_IMAGES, { recursive: true });

  let processed = 0;
  for (const file of imageFiles) {
    const inputPath = join(IMAGES_DIR, file);
    const baseName = basename(file, extname(file));

    // 生成多格式多尺寸
    for (const size of SIZES) {
      for (const fmt of FORMAT_CONFIGS) {
        const outputPath = join(DIST_IMAGES, `${baseName}-${size}.${fmt.ext}`);
        try {
          await sharp(inputPath)
            .resize(size, undefined, { withoutEnlargement: true })
            [fmt.ext]({ quality: fmt.quality })
            .toFile(outputPath);
        } catch (err) {
          console.warn(`  Image error [${file} @${size} ${fmt.ext}]: ${err.message}`);
        }
      }
    }
    processed++;
  }

  console.log(`  Images: ${processed} optimized → dist/assets/images/`);
  return processed;
}
