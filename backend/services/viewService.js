// backend/services/viewService.js
export function getViews(db, slug) {
  const row = db.prepare(`
    SELECT v.count FROM views v JOIN posts p ON p.id = v.post_id WHERE p.slug = ?
  `).get(slug);
  return row ? row.count : 0;
}

export function incrementView(db, slug) {
  // Ensure post exists
  let post = db.prepare('SELECT id FROM posts WHERE slug = ?').get(slug);
  if (!post) {
    db.prepare('INSERT OR IGNORE INTO posts (slug, title) VALUES (?, ?)').run(slug, slug);
    post = db.prepare('SELECT id FROM posts WHERE slug = ?').get(slug);
  }
  // Ensure views entry exists
  const v = db.prepare('SELECT id FROM views WHERE post_id = ?').get(post.id);
  if (!v) db.prepare('INSERT INTO views (post_id, count) VALUES (?, 0)').run(post.id);
  // Increment
  const result = db.prepare('UPDATE views SET count = count + 1 WHERE post_id = ? RETURNING count').get(post.id);
  return result ? result.count : 0;
}
