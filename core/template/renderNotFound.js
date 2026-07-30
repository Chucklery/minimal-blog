// GitHub Pages 自定义 404 页面

import { escapeAttr, escapeHtml } from '../utils/escapeHtml.js';

export function renderNotFound({ posts, site }) {
  const bp = site.basePath || '';
  const recent = posts.slice(0, 3);

  return `
<main class="not-found" id="main-content">
  <p class="not-found-code">404</p>
  <h1>这里没有找到内容</h1>
  <p class="not-found-desc">链接可能已经改变，也可能从未存在。你可以搜索文章，或从最近内容继续阅读。</p>

  <form class="not-found-search" action="${bp}/search/" method="get">
    <label for="not-found-query">搜索文章</label>
    <div>
      <input id="not-found-query" name="q" type="search" placeholder="输入关键词…" autocomplete="off">
      <button type="submit">搜索</button>
    </div>
  </form>

  <section class="not-found-recent" aria-labelledby="recent-posts-title">
    <h2 id="recent-posts-title">最近文章</h2>
    <ul>
      ${recent
        .map(
          (post) =>
            `<li><a href="${bp}/posts/${escapeAttr(post.slug)}.html">${escapeHtml(post.title)}</a></li>`
        )
        .join('')}
    </ul>
  </section>

  <a class="not-found-home" href="${bp}/">← 返回首页</a>
</main>`;
}
