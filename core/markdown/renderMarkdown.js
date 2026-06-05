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
  return md.render(content);
}
