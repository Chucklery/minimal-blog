// 书籍列表页

import { escapeAttr, escapeHtml } from '../utils/escapeHtml.js';

export function renderBooksIndex({ books, site }) {
  const bp = site.basePath || '';

  return `
<main class="books-index" id="main-content">
  <header class="books-index-header">
    <p>LIBRARY</p>
    <h1>书架</h1>
    <p>分章写作，连续阅读。</p>
  </header>

  <div class="books-grid">
    ${books
      .map(
        (book) => `
    <article class="book-card">
      <p>${book.chapters.length} CHAPTERS</p>
      <h2><a href="${bp}/books/${escapeAttr(book.slug)}/">${escapeHtml(book.title)}</a></h2>
      <p>${escapeHtml(book.description)}</p>
      <div>
        ${book.author ? `<span>${escapeHtml(book.author)}</span>` : ''}
        ${book.readingTime ? `<span>约 ${book.readingTime} 分钟</span>` : ''}
      </div>
    </article>`
      )
      .join('')}
  </div>
</main>`;
}
