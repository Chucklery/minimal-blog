// 为首页和文章生成 1200×630 社交分享图

import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';
import { DIST_ASSETS, DIST_DIR, PUBLIC_DIR } from '../utils/paths.js';

const WIDTH = 1200;
const HEIGHT = 630;

export async function writeSocialImages({ posts }) {
  const source = join(PUBLIC_DIR, 'og', 'default.jpg');
  const defaultDir = join(DIST_DIR, 'og');
  const articleDir = join(DIST_ASSETS, 'og');

  await mkdir(defaultDir, { recursive: true });
  await mkdir(articleDir, { recursive: true });

  const background = await sharp(source)
    .resize(WIDTH, HEIGHT, { fit: 'cover' })
    .jpeg({ quality: 84, mozjpeg: true })
    .toBuffer();

  await sharp(background).toFile(join(defaultDir, 'default.jpg'));

  for (const post of posts) {
    const titleOverlay = createTitleOverlay(post.title);
    await sharp(background)
      .composite([{ input: Buffer.from(titleOverlay) }])
      .jpeg({ quality: 84, mozjpeg: true })
      .toFile(join(articleDir, `${post.slug}.jpg`));
  }

  console.log(`  Social images: ${posts.length + 1} files → dist/og, dist/assets/og`);
}

function createTitleOverlay(title) {
  const fontSize = title.length > 32 ? 50 : 58;
  const lines = wrapTitle(title, title.length > 32 ? 19 : 17).slice(0, 3);
  const tspans = lines
    .map(
      (line, index) =>
        `<tspan x="72" dy="${index === 0 ? 0 : Math.round(fontSize * 1.22)}">${escapeXml(line)}</tspan>`
    )
    .join('');

  return `<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <text x="72" y="230"
      fill="#171717"
      font-family="'Noto Sans CJK SC','Noto Sans SC','PingFang SC','Microsoft YaHei',sans-serif"
      font-size="${fontSize}"
      font-weight="700"
      letter-spacing="-1.2">${tspans}</text>
    <text x="72" y="552"
      fill="#6f6f6f"
      font-family="'Noto Sans CJK SC','Noto Sans SC','PingFang SC','Microsoft YaHei',sans-serif"
      font-size="22"
      font-weight="500">ARTICLE</text>
  </svg>`;
}

function wrapTitle(title, maxUnits) {
  const chars = Array.from(title);
  const lines = [];
  let line = '';
  let units = 0;

  for (const char of chars) {
    const charUnits = /[\u0000-\u00ff]/.test(char) ? 0.55 : 1;
    if (line && units + charUnits > maxUnits) {
      lines.push(line.trim());
      line = '';
      units = 0;
    }
    line += char;
    units += charUnits;
  }

  if (line.trim()) lines.push(line.trim());
  return lines;
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
