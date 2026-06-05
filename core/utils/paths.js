// core/utils/paths.js
// 集中管理所有路径，避免硬编码

import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 项目根目录：core/utils/ → core/ → minimal-blog/
export const ROOT = resolve(__dirname, '..', '..');

// 站点目录
export const SITE_DIR = join(ROOT, 'site');
export const SITE_CONFIG = join(SITE_DIR, 'site.config.js');
export const CONTENT_DIR = join(SITE_DIR, 'content');
export const POSTS_DIR = join(CONTENT_DIR, 'posts');
export const PAGES_DIR = join(CONTENT_DIR, 'pages');
export const STYLES_DIR = join(SITE_DIR, 'styles');
export const SCRIPTS_DIR = join(SITE_DIR, 'scripts');
export const PUBLIC_DIR = join(SITE_DIR, 'public');

// 输出目录
export const DIST_DIR = join(ROOT, 'dist');
export const DIST_POSTS = join(DIST_DIR, 'posts');
export const DIST_ARCHIVE = join(DIST_DIR, 'archive');
export const DIST_ABOUT = join(DIST_DIR, 'about');
export const DIST_ASSETS = join(DIST_DIR, 'assets');
export const DIST_IMAGES = join(DIST_ASSETS, 'images');

// Nginx 配置
export const NGINX_DIR = join(ROOT, 'nginx');

// 获取基于 root 的相对路径
export function fromRoot(...segments) {
  return join(ROOT, ...segments);
}

// 获取 dist 下的路径
export function distPath(...segments) {
  return join(DIST_DIR, ...segments);
}
