// backend/services/aiService.js — RAG 问答服务
import { searchSimilar } from '../repositories/aiRepository.js';

const OPENAI_KEY = process.env.OPENAI_API_KEY || '';
const BASE_URL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';

function splitChunks(text, maxLen = 800) {
  const chunks = [];
  const paragraphs = text.split(/\n\n+/);
  let current = '';
  for (const p of paragraphs) {
    if (current.length + p.length > maxLen && current) {
      chunks.push(current.trim());
      current = p;
    } else {
      current += (current ? '\n\n' : '') + p;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

export async function indexPostForAi(db, postId, title, content) {
  const chunks = splitChunks(content);
  for (const chunk of chunks) {
    const emb = await generateEmbedding(chunk);
    const json = emb ? JSON.stringify(emb) : null;
    db.prepare('INSERT INTO ai_documents (post_id, chunk_text, embedding) VALUES (?, ?, ?)').run(postId, chunk, json);
  }
}

export async function chatWithContext(db, message) {
  if (!OPENAI_KEY) return { answer: 'AI 未配置。请设置 OPENAI_API_KEY 环境变量。', chunks: 0 };

  const emb = await generateEmbedding(message);
  if (!emb) return { answer: 'Embedding 生成失败。', chunks: 0 };

  const chunks = searchSimilar(db, emb, 3);
  const context = chunks.map(c => c.chunk_text).join('\n\n---\n\n');

  const prompt = `根据以下博客内容回答问题。如果内容中没有答案，请如实说明。

博客内容：
${context}

问题：${message}

回答：`;

  const answer = await callLLM(prompt);
  return { answer, chunks: chunks.length };
}

async function generateEmbedding(text) {
  if (!OPENAI_KEY) return null;
  try {
    const res = await fetch(`${BASE_URL}/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_KEY}` },
      body: JSON.stringify({ model: 'text-embedding-3-small', input: text }),
    });
    const data = await res.json();
    return data.data?.[0]?.embedding || null;
  } catch { return null; }
}

async function callLLM(prompt) {
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_KEY}` },
    body: JSON.stringify({ model: process.env.OPENAI_MODEL || 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], max_tokens: 500, temperature: 0.3 }),
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '无法生成回答。';
}
