// core/assets/cleanDist.js
// 清空构建输出目录

import { rm, mkdir } from 'node:fs/promises';
import { DIST_DIR, DIST_POSTS, DIST_ARCHIVE, DIST_ABOUT, DIST_ASSETS, DIST_IMAGES } from '../utils/paths.js';

/**
 * 清空并重建 dist 目录结构
 */
export async function cleanDist() {
  await rm(DIST_DIR, { recursive: true, force: true });
  await mkdir(DIST_DIR, { recursive: true });
  await mkdir(DIST_POSTS, { recursive: true });
  await mkdir(DIST_ARCHIVE, { recursive: true });
  await mkdir(DIST_ABOUT, { recursive: true });
  await mkdir(DIST_ASSETS, { recursive: true });
  await mkdir(DIST_IMAGES, { recursive: true });
}
