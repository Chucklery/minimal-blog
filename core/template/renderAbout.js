// core/template/renderAbout.js
// 关于页模板

import { escapeHtml } from '../utils/escapeHtml.js';

/**
 * 生成关于页主体内容
 * @param {Object} opts
 * @param {string} opts.htmlBody - 渲染后的 Markdown
 * @param {Object} opts.site
 * @returns {string}
 */
export function renderAbout({ htmlBody, site }) {
  return `
<main class="about">
  <article class="about-article">
    <header class="about-header">
      <h1>About</h1>
    </header>
    <div class="prose">
      ${htmlBody}
    </div>
  </article>
</main>`;
}
