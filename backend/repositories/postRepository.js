// backend/repositories/postRepository.js
export function findAll(db, { status, limit = 50, offset = 0 } = {}) {
  let sql = 'SELECT * FROM posts';
  const params = [];
  if (status) { sql += ' WHERE status = ?'; params.push(status); }
  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);
  return db.prepare(sql).all(...params);
}

export function findById(db, id) {
  return db.prepare('SELECT * FROM posts WHERE id = ?').get(id);
}

export function findBySlug(db, slug) {
  return db.prepare('SELECT * FROM posts WHERE slug = ?').get(slug);
}

export function create(db, { title, slug, content_md, excerpt, status }) {
  return db.prepare(`
    INSERT INTO posts (title, slug, content_md, excerpt, status)
    VALUES (?, ?, ?, ?, ?)
  `).run(title, slug, content_md || '', excerpt || '', status || 'draft');
}

export function update(db, id, fields) {
  const keys = Object.keys(fields);
  if (keys.length === 0) return null;
  const sets = keys.map((k) => `${k} = ?`).join(', ');
  const values = keys.map((k) => fields[k]);
  values.push(id);
  return db.prepare(`UPDATE posts SET ${sets}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(...values);
}

export function remove(db, id) {
  return db.prepare('DELETE FROM posts WHERE id = ?').run(id);
}
