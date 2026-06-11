// backend/repositories/searchRepository.js

export function searchByKeyword(db, query) {
  try {
    return db.prepare(`
      SELECT p.slug, p.title, snippet(search_fts, 2, '<mark>', '</mark>', '…', 30) as snippet
      FROM search_fts JOIN posts p ON p.id = search_fts.rowid
      WHERE search_fts MATCH ? LIMIT 20
    `).all(query.split(/\s+/).map(w => w + '*').join(' ')).map(r => ({
      title: r.title, slug: r.slug, snippet: r.snippet || ''
    }));
  } catch {
    return db.prepare(`
      SELECT p.slug, p.title, si.content as snippet
      FROM search_index si JOIN posts p ON p.id = si.post_id
      WHERE si.content LIKE ? OR p.title LIKE ? LIMIT 20
    `).all(`%${query}%`, `%${query}%`).map(r => ({
      title: r.title, slug: r.slug, snippet: (r.snippet || '').substring(0, 200)
    }));
  }
}

export function indexPost(db, postId, content) {
  db.prepare('INSERT OR REPLACE INTO search_index (post_id, content) VALUES (?, ?)').run(postId, content);
  try {
    db.prepare('DELETE FROM search_fts WHERE rowid = ?').run(postId);
    db.prepare('INSERT INTO search_fts (rowid, title, content) VALUES (?, ?, ?)').run(postId, '', content);
  } catch { /* FTS5 may not exist yet */ }
}
