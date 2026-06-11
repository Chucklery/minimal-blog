// core/template/renderLayout.js
// 统一页面骨架 — 所有页面共享的外壳
import { escapeAttr } from '../utils/escapeHtml.js';
import { renderMeta } from './renderMeta.js';

/**
 * 生成完整的 HTML 页面
 * @param {Object} opts
 * @param {Object} opts.site   - site.config
 * @param {string} opts.page   - 'home' | 'post' | 'archive' | 'about'
 * @param {string} opts.title
 * @param {string} opts.description
 * @param {string} opts.bodyContent  - 渲染好的 <main> 内容
 * @param {string} [opts.canonicalUrl]
 * @param {string} [opts.ogImage]
 * @param {string} [opts.publishedDate]
 * @param {boolean} [opts.showProgress] - 是否显示阅读进度条
 * @param {string} [opts.tocHtml] - 文章页 TOC
 * @returns {string}
 */
export function renderLayout({
  site,
  page,
  title,
  description,
  bodyContent,
  canonicalUrl,
  ogImage,
  publishedDate,
  showProgress = false,
  hideHeader = false,
  tocHtml = '',
}) {
  const fullTitle = page === 'home' ? site.title : `${title} — ${site.title}`;
  const ogType = page === 'post' ? 'article' : 'website';

  const meta = renderMeta({
    title: fullTitle,
    description,
    canonicalUrl,
    ogImage,
    ogType,
    publishedDate,
  });

  const bp = site.basePath || '';
  const currentYear = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="${site.language || 'zh-CN'}" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
${meta}
  <link rel="stylesheet" href="${bp}/assets/reset.css">
  <link rel="stylesheet" href="${bp}/assets/tokens.css">
  <link rel="stylesheet" href="${bp}/assets/base.css">
  <link rel="stylesheet" href="${bp}/assets/layout.css">
  <link rel="stylesheet" href="${bp}/assets/prose.css">
  <link rel="stylesheet" href="${bp}/assets/components.css">
  <link rel="icon" href="${bp}/favicon.svg" type="image/svg+xml">
  <link rel="alternate" type="application/rss+xml" title="${escapeAttr(site.title)} RSS" href="${bp}/rss.xml">
  <script>
    (function() {
      var theme = localStorage.getItem('theme');
      if (!theme) theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', theme);
    })();
  </script>
</head>
<body class="page-${page}">
  ${showProgress ? '<div class="progress" data-progress></div>' : ''}

  ${hideHeader ? '' : `
  <header class="site-header">
    <div class="header-inner">
      <a href="${bp}/" class="site-name">${escapeHtml(site.title)}</a>
      <nav class="site-nav">
        <a href="${bp}/">Posts</a>
        <a href="${bp}/archive/">Archive</a>
        <a href="${bp}/search/">Search</a>
        <a href="${bp}/about/">About</a>
        <button class="theme-toggle" data-theme-toggle aria-label="Toggle theme">
          <span class="theme-icon-light">☽</span>
          <span class="theme-icon-dark">☀</span>
        </button>
      </nav>
    </div>
  </header>`}

  ${bodyContent}

  <footer class="site-footer">
    <div class="footer-inner">
      <div class="footer-links">
        <a href="${bp}/rss.xml">RSS Feed</a>
        <a href="https://github.com" target="_blank" rel="noopener">GitHub</a>
        ${site.author?.url ? `<a href="${escapeAttr(site.author.url)}">About</a>` : ''}
      </div>
      <div class="footer-meta">
        © ${currentYear} ${escapeHtml(site.author?.name || site.title)} · <a href="${bp}/sitemap.xml">Sitemap</a>
      </div>
    </div>
  </footer>

  <script src="${bp}/assets/main.js" type="module" defer></script>
  <script src="${bp}/assets/viewCounter.js" type="module"></script>
  <script>
    // Auto-reload: poll version.json every 30s, reload if new build detected
    (function(){var v=0;setInterval(function(){fetch('${bp}/version.json?t='+Date.now()).then(function(r){return r.json()}).then(function(d){if(!v)v=d.ts;else if(d.ts!==v){v=d.ts;location.reload()}}).catch(function(){})},30000)})();
  </script>
</body>
</html>`;
}

// 局部转义（模板内使用）
function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
