// backend/repositories/mediaRepository.js
export function findAll(db, { limit = 50, offset = 0 } = {}) {
  return db.prepare('SELECT * FROM media ORDER BY created_at DESC LIMIT ? OFFSET ?').all(limit, offset);
}

export function findById(db, id) {
  return db.prepare('SELECT * FROM media WHERE id = ?').get(id);
}

export function create(db, { filename, filepath, mime_type, size, width, height }) {
  return db.prepare(
    'INSERT INTO media (filename, filepath, mime_type, size, width, height) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(filename, filepath, mime_type, size || 0, width || 0, height || 0);
}

export function remove(db, id) {
  return db.prepare('DELETE FROM media WHERE id = ?').run(id);
}
