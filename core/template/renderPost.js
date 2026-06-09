// core/template/renderPost.js
// 文章页模板

import { formatDate } from '../utils/dates.js';
import { escapeAttr } from '../utils/escapeHtml.js';

export function renderPost({ post, htmlBody, tocHtml = '', prevPost, nextPost, site }) {
  const bp = site.basePath || '';
  const hasToc = tocHtml && tocHtml.length > 0;
  const tagHtml = post.tags && post.tags.length > 0
    ? post.tags.map((t) => `<span class="post-tag">#${escapeHtml(t)}</span>`).join(' ')
    : '';

  return `
<div class="post-cover">
  <div class="post-cover-inner">
    <a href="${bp}/" class="post-back-cover"><svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="48" height="48">
<path d="M0 0 C5.59588314 -0.28944223 9.18669255 -0.20887163 14 3 C18.08504833 7.14025169 20.17225243 10.36009129 20.4375 16.1875 C20.39027829 21.32792079 19.35276747 23.92253467 15.8984375 27.66015625 C10.68263726 31.3412663 5.23532157 31.2596342 -0.875 31.125 C-2.050625 31.11146484 -2.050625 31.11146484 -3.25 31.09765625 C-5.16680055 31.07428063 -7.08344191 31.03841653 -9 31 C-8.67 31.66 -8.34 32.32 -8 33 C-7.960008 34.99960012 -7.95653201 37.00047242 -8 39 C-10.15234375 39.73046875 -10.15234375 39.73046875 -13 40 C-15.75390625 38.48828125 -15.75390625 38.48828125 -18.5625 36.3125 C-19.49191406 35.60738281 -20.42132813 34.90226562 -21.37890625 34.17578125 C-22.24386719 33.45777344 -23.10882813 32.73976562 -24 32 C-25.15822266 31.06220703 -25.15822266 31.06220703 -26.33984375 30.10546875 C-28 28 -28 28 -28.60546875 25.14453125 C-27.75233183 20.71372336 -25.52499256 18.71168702 -22.3125 15.6875 C-21.78205078 15.15060547 -21.25160156 14.61371094 -20.70507812 14.06054688 C-17.66933787 11.10675298 -15.43280536 9.16772777 -11 9 C-9.03177114 10.96822886 -9.33751619 14.34808709 -9 17 C-7.06318839 17.08107583 -5.1254066 17.13922475 -3.1875 17.1875 C-2.10855469 17.22230469 -1.02960937 17.25710937 0.08203125 17.29296875 C2.97912805 17.24218593 2.97912805 17.24218593 4.875 15.6875 C6.55634713 13.1654793 6.19651668 10.94775013 6 8 C3.69 6.68 1.38 5.36 -1 4 C-0.67 2.68 -0.34 1.36 0 0 Z M1 2 C1.99 2.66 2.98 3.32 4 4 C6.75 6.1875 6.75 6.1875 9 9 C9 12.62761169 8.79195782 14.92005751 6.625 17.875 C3.51915019 20.02520372 0.71496112 20.13598485 -2.9375 20.125 C-4.21947266 20.12886719 -4.21947266 20.12886719 -5.52734375 20.1328125 C-7.82680852 20.00930254 -9.79640348 19.64420687 -12 19 C-12.33 17.02 -12.66 15.04 -13 13 C-17.89132699 16.26088466 -21.42270128 19.33867137 -25 24 C-23.48081731 27.85438351 -21.17304038 29.73605496 -17.9375 32.25 C-16.58978516 33.30960938 -16.58978516 33.30960938 -15.21484375 34.390625 C-13.32147172 36.09797205 -13.32147172 36.09797205 -12 36 C-11.67 33.69 -11.34 31.38 -11 29 C-9.865625 28.96261719 -8.73125 28.92523438 -7.5625 28.88671875 C5.09491273 28.845643 5.09491273 28.845643 15.9375 23.1875 C17.66069145 19.6397529 18.60687087 16.86011308 17.33984375 12.9765625 C15.33852169 8.61740757 13.26105513 5.42105405 9 3 C6.29749655 2.4111864 3.77499385 2.18813518 1 2 Z " fill="#000000" transform="translate(28,4)"/>
</svg></a>
    <h1 class="post-cover-title">${escapeHtml(post.title)}</h1>
    <div class="post-cover-meta">
      <span>Published</span>
      <time datetime="${post.date.toISOString().split('T')[0]}">${formatDate(post.date, 'short')}</time>
      ${post.readingTime ? `<span>· ${post.readingTime} min read</span>` : ''}
    </div>
    ${tagHtml ? `<div class="post-cover-tags">${tagHtml}</div>` : ''}
  </div>
</div>

<main class="post">
  <article class="post-article ${hasToc ? 'post-article--with-toc' : ''}">
    <div class="prose">
      ${htmlBody}
    </div>

    <footer class="post-footer">
      <nav class="post-nav">
        ${prevPost
          ? `<a href="${bp}/posts/${escapeAttr(prevPost.slug)}.html" class="post-nav-prev"> ← ${escapeHtml(prevPost.title)}</a>`
          : '<span></span>'}
        ${nextPost
          ? `<a href="${bp}/posts/${escapeAttr(nextPost.slug)}.html" class="post-nav-next"> → ${escapeHtml(nextPost.title)}</a>`
          : '<span></span>'}
      </nav>
    </footer>
  </article>

  ${hasToc ? `
  <aside class="post-toc">
    <div class="toc-sticky">${tocHtml}</div>
  </aside>` : ''}
</main>`;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
