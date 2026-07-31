// 多 Markdown 合并后的连续书籍阅读页

import { escapeAttr, escapeHtml } from '../utils/escapeHtml.js';

export function renderBook({ book, site }) {
  const bp = site.basePath || '';
  const chapterCount = book.chapters.length;
  const toc = renderBookToc(book);

  return `
<header class="book-cover">
  <div class="book-cover-inner">
    <a class="book-library-link" href="${bp}/books/">← 书架</a>
    <p class="book-eyebrow">BOOK · ${chapterCount} ${chapterCount === 1 ? 'CHAPTER' : 'CHAPTERS'}</p>
    <h1>${escapeHtml(book.title)}</h1>
    <p class="book-description">${escapeHtml(book.description)}</p>
    <div class="book-meta">
      ${book.author ? `<span>${escapeHtml(book.author)}</span>` : ''}
      ${book.readingTime ? `<span>约 ${book.readingTime} 分钟</span>` : ''}
    </div>
  </div>
</header>

<main
  class="book-reader"
  id="main-content"
  data-book-reader
  data-book-slug="${escapeAttr(book.slug)}"
  data-book-title="${escapeAttr(book.title)}"
>
  <article class="book-content">
    <details class="book-toc-mobile" data-book-toc-drawer>
      <summary>
        <span>章节目录</span>
        <span>${chapterCount} 章</span>
      </summary>
      ${toc}
    </details>

    <div class="book-resume" data-book-resume hidden>
      <div>
        <strong>继续上次阅读</strong>
        <span data-book-resume-label></span>
      </div>
      <button type="button" data-book-resume-button>继续阅读</button>
    </div>

    ${book.chapters.map((chapter, index) => renderChapter(chapter, book.chapters, index)).join('\n')}
  </article>

  <aside class="book-toc-sidebar" aria-label="书籍章节目录">
    <div class="book-toc-sticky">
      <p class="book-toc-title">${escapeHtml(book.title)}</p>
      ${toc}
    </div>
  </aside>

  <div class="book-reading-status" data-book-status aria-live="polite">
    第 1 / ${chapterCount} 章 · 0%
  </div>
</main>`;
}

function renderChapter(chapter, chapters, index) {
  const previous = chapters[index - 1];
  const next = chapters[index + 1];

  return `
    <section
      class="book-chapter"
      id="${escapeAttr(chapter.id)}"
      data-book-chapter
      data-chapter-number="${chapter.number}"
      data-chapter-title="${escapeAttr(chapter.title)}"
    >
      <header class="book-chapter-header">
        <p>第 ${chapter.number} 章</p>
        <h2>${escapeHtml(chapter.title)}</h2>
        ${chapter.description ? `<p class="book-chapter-description">${escapeHtml(chapter.description)}</p>` : ''}
      </header>

      <div class="prose book-chapter-prose">
        ${chapter.htmlBody}
      </div>

      <nav class="book-chapter-nav" aria-label="章节导航">
        ${previous
          ? `<a href="#${escapeAttr(previous.id)}" class="book-chapter-prev">← ${escapeHtml(previous.title)}</a>`
          : '<span></span>'}
        ${next
          ? `<a href="#${escapeAttr(next.id)}" class="book-chapter-next">${escapeHtml(next.title)} →</a>`
          : '<span></span>'}
      </nav>
    </section>`;
}

function renderBookToc(book) {
  return `
      <nav class="book-toc-list" data-book-toc aria-label="章节">
        <ol>
          ${book.chapters
            .map(
              (chapter) => `
          <li>
            <a href="#${escapeAttr(chapter.id)}" data-book-chapter-link>
              <span>${String(chapter.number).padStart(2, '0')}</span>
              <span>${escapeHtml(chapter.title)}</span>
            </a>
          </li>`
            )
            .join('')}
        </ol>
      </nav>`;
}
