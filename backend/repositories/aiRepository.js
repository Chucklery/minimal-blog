// backend/repositories/aiRepository.js — AI 向量检索

export function searchSimilar(db, queryEmbedding, topK = 3) {
  const docs = db.prepare('SELECT chunk_text, embedding FROM ai_documents WHERE embedding IS NOT NULL').all();
  const scored = docs.map(d => {
    const emb = JSON.parse(d.embedding);
    return { chunk_text: d.chunk_text, score: cosine(queryEmbedding, emb) };
  }).filter(d => d.score > 0.5).sort((a, b) => b.score - a.score).slice(0, topK);
  return scored;
}

function cosine(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}
