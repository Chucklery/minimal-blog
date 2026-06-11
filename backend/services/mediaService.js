// backend/services/mediaService.js
import { join, extname, dirname } from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import * as mediaRepo from '../repositories/mediaRepository.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = join(__dirname, '..', '..', 'uploads');

const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif'];

export function listMedia(db) {
  return mediaRepo.findAll(db);
}

export function getMedia(db, id) {
  return mediaRepo.findById(db, id);
}

export async function uploadMedia(db, file) {
  const buf = await file.toBuffer();
  const isImage = IMAGE_TYPES.some(t => file.mimetype.startsWith(t)) || /\.(png|jpe?g|webp|gif|avif)$/i.test(file.filename);

  const now = new Date();
  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const dir = join(UPLOADS_DIR, 'images', year, month);
  mkdirSync(dir, { recursive: true });

  let relativePath, mime, size = buf.length, width = 0, height = 0;

  if (isImage) {
    const name = `${Date.now()}.webp`;
    const outPath = join(dir, name);
    await sharp(buf).resize(1600, undefined, { withoutEnlargement: true }).webp({ quality: 80 }).toFile(outPath);
    const meta = await sharp(outPath).metadata();
    relativePath = `/uploads/images/${year}/${month}/${name}`;
    mime = 'image/webp';
    size = meta.size || size;
    width = meta.width || 0;
    height = meta.height || 0;
  } else {
    const ext = extname(file.filename) || '.bin';
    const name = `${Date.now()}${ext}`;
    const outPath = join(dir, name);
    writeFileSync(outPath, buf);
    relativePath = `/uploads/images/${year}/${month}/${name}`;
    mime = file.mimetype || 'application/octet-stream';
  }

  mediaRepo.create(db, { filename: file.filename, filepath: relativePath, mime_type: mime, size, width, height });
  return { filepath: relativePath };
}

export function deleteMedia(db, id) {
  mediaRepo.remove(db, id);
}
