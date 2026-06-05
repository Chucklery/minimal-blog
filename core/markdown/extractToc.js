// core/markdown/extractToc.js
// 从 HTML 中提取标题，生成 TOC（Table of Contents）

/**
 * @typedef {Object} TocItem
 * @property {string} id
 * @property {string} text
 * @property {number} level - 2 或 3
 * @property {TocItem[]} [children]
 */

/**
 * 从已渲染 HTML 中提取 h2/h3 目录
 * @param {string} html - 已渲染的 HTML
 * @returns {TocItem[]}
 */
export function extractToc(html) {
  const headings = [];
  // 匹配所有 h2/h3 标签
  const regex = /<h([23])\s[^>]*?id="([^"]*)"[^>]*>(.*?)<\/h[23]>/gi;

  let match;
  while ((match = regex.exec(html)) !== null) {
    const level = parseInt(match[1], 10);
    const id = match[2];
    // 去掉 HTML 标签，只保留文字
    const text = match[3].replace(/<[^>]+>/g, '').trim();
    headings.push({ level, id, text });
  }

  return headings;
}

/**
 * 将扁平标题列表转成树形（h3 挂到最近的 h2 下）
 * @param {{level: number, id: string, text: string}[]} headings
 * @returns {TocItem[]}
 */
export function buildTocTree(headings) {
  const tree = [];
  let currentH2 = null;

  for (const h of headings) {
    const item = {
      id: h.id,
      text: h.text,
      level: h.level,
    };

    if (h.level === 2) {
      item.children = [];
      tree.push(item);
      currentH2 = item;
    } else if (h.level === 3 && currentH2) {
      currentH2.children.push(item);
    } else {
      // h3 没有上层 h2，作为顶级
      tree.push(item);
    }
  }

  return tree;
}

/**
 * 渲染 TOC HTML
 * @param {TocItem[]} toc
 * @returns {string}
 */
export function renderTocHtml(toc) {
  if (!toc || toc.length === 0) return '';

  const renderItems = (items) =>
    items
      .map(
        (item) => `
      <li class="toc-item toc-level-h${item.level}">
        <a href="#${item.id}">${item.text}</a>
        ${item.children && item.children.length > 0 ? `<ul>${renderItems(item.children)}</ul>` : ''}
      </li>`
      )
      .join('');

  return `<nav class="toc" data-toc><ul>${renderItems(toc)}</ul></nav>`;
}
