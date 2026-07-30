// core/markdown/renderMarkdown.js
// Markdown → HTML 渲染

import { createMarkdownRenderer } from './createMarkdownRenderer.js';

let renderer = null;

/**
 * 初始化渲染器（首次调用时创建）
 */
async function getRenderer() {
  if (!renderer) {
    renderer = await createMarkdownRenderer();
  }
  return renderer;
}

/**
 * 渲染 Markdown 为 HTML
 * @param {string} content - 原始 Markdown
 * @returns {Promise<string>} HTML 字符串
 */
export async function renderMarkdown(content) {
  const md = await getRenderer();
  const env = {};
  const tokens = md.parse(content, env);
  const usedIds = new Map();

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token.type !== 'heading_open' || !/^h[23]$/.test(token.tag)) continue;

    const headingText = tokens[index + 1]?.content || '';
    const baseId = slugifyHeading(headingText) || `section-${index + 1}`;
    const duplicateIndex = usedIds.get(baseId) || 0;
    const id = duplicateIndex === 0 ? baseId : `${baseId}-${duplicateIndex + 1}`;

    usedIds.set(baseId, duplicateIndex + 1);
    token.attrSet('id', id);
  }

  return md.renderer.render(tokens, md.options, env);
}

function slugifyHeading(text) {
  return text
    .normalize('NFKC')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\p{Letter}\p{Number}_-]/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
