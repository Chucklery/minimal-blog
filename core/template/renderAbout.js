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
  const bp = site.basePath || '';

  return `
<main class="about" id="main-content">
  <article class="about-article">
    <header class="about-header">
      <h1>About</h1>
    </header>
    <div class="prose">
      ${htmlBody}
    </div>
    <a class="about-profile-link" href="${bp}/about/profile/" data-prefetch>
      <img src="${bp}/images/about-portrait.jpg" width="1179" height="1187" alt="Chuckle 的个人肖像" loading="lazy">
      <span class="about-profile-copy">
        <span class="about-profile-label">More about me</span>
        <strong>认识屏幕背后的我</strong>
        <span>从技术、产品到持续写作，进入一页更完整的自我介绍。</span>
      </span>
      <span class="about-profile-arrow" aria-hidden="true">↗</span>
    </a>
  </article>
</main>`;
}
