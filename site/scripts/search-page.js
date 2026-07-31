// search-page.js — 支持正文、多关键词、排序、高亮与键盘操作

(async function () {
  const input = document.getElementById('search-input');
  const results = document.getElementById('search-results');
  if (!input || !results) return;

  const basePath = location.pathname.replace(/\/search\/.*$/, '');
  let posts = [];
  let matchedPosts = [];
  let activeIndex = -1;

  try {
    const response = await fetch(`${basePath}/assets/search-index.json`);
    if (!response.ok) throw new Error('Index not found');
    posts = await response.json();
  } catch {
    results.innerHTML = '<p class="search-error">Search index unavailable.</p>';
    return;
  }

  function escape(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function getTokens(term) {
    return [...new Set(term.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean))];
  }

  function highlight(value, tokens) {
    if (!tokens.length) return escape(value);
    const pattern = new RegExp(`(${tokens.map(escapeRegExp).join('|')})`, 'giu');
    return String(value)
      .split(pattern)
      .map((part) =>
        tokens.some((token) => part.toLocaleLowerCase() === token)
          ? `<mark>${escape(part)}</mark>`
          : escape(part)
      )
      .join('');
  }

  function scorePost(post, tokens) {
    const title = post.title.toLocaleLowerCase();
    const description = post.description.toLocaleLowerCase();
    const content = (post.content || '').toLocaleLowerCase();
    const tags = (post.tags || []).map((tag) => tag.toLocaleLowerCase());
    const searchable = `${title} ${description} ${tags.join(' ')} ${content}`;

    if (!tokens.every((token) => searchable.includes(token))) return -1;

    return tokens.reduce((score, token) => {
      if (title === token) return score + 120;
      if (title.includes(token)) score += 40;
      if (tags.some((tag) => tag === token)) score += 30;
      else if (tags.some((tag) => tag.includes(token))) score += 18;
      if (description.includes(token)) score += 12;
      if (content.includes(token)) score += 2;
      return score;
    }, 0);
  }

  function getSnippet(post, tokens) {
    const description = post.description || '';
    const content = post.content || '';
    const source = tokens.some((token) => description.toLocaleLowerCase().includes(token))
      ? description
      : content;
    const lower = source.toLocaleLowerCase();
    const positions = tokens
      .map((token) => lower.indexOf(token))
      .filter((position) => position >= 0);
    const firstMatch = positions.length ? Math.min(...positions) : 0;
    const start = Math.max(0, firstMatch - 55);
    const end = Math.min(source.length, start + 170);
    return `${start > 0 ? '…' : ''}${source.slice(start, end).trim()}${end < source.length ? '…' : ''}`;
  }

  function renderPost(post, tokens, index) {
    const snippet = getSnippet(post, tokens);
    const meta = [
      post.bookTitle ? `《${post.bookTitle}》` : '',
      post.date,
      ...(post.tags || []),
    ].filter(Boolean);
    return `
      <article class="search-result" role="option" aria-selected="false">
        <h2 class="search-result-title">
          <a id="search-result-${index}" href="${basePath}${escape(post.url || `/posts/${post.slug}.html`)}">
            ${highlight(post.title, tokens)}
          </a>
        </h2>
        <div class="search-result-meta">
          ${meta.map((item) => highlight(item, tokens)).join(' · ')}
        </div>
        <p class="search-result-desc">${highlight(snippet, tokens)}</p>
      </article>`;
  }

  function syncUrl(term) {
    const url = new URL(location.href);
    if (term.trim()) url.searchParams.set('q', term.trim());
    else url.searchParams.delete('q');
    history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
  }

  function setActive(index) {
    const options = [...results.querySelectorAll('[role="option"]')];
    if (!options.length) {
      activeIndex = -1;
      input.removeAttribute('aria-activedescendant');
      return;
    }

    activeIndex = Math.max(0, Math.min(index, options.length - 1));
    options.forEach((option, optionIndex) => {
      const active = optionIndex === activeIndex;
      option.classList.toggle('is-active', active);
      option.setAttribute('aria-selected', String(active));
    });
    const link = options[activeIndex].querySelector('a');
    input.setAttribute('aria-activedescendant', link.id);
    options[activeIndex].scrollIntoView({ block: 'nearest' });
  }

  function search(term, { updateUrl = true } = {}) {
    const tokens = getTokens(term);
    activeIndex = -1;
    input.removeAttribute('aria-activedescendant');

    if (updateUrl) syncUrl(term);

    if (!tokens.length) {
      matchedPosts = [];
      input.setAttribute('aria-expanded', 'false');
      results.innerHTML = '<p class="search-empty">Type to search...</p>';
      return;
    }

    matchedPosts = posts
      .map((post) => ({ ...post, score: scorePost(post, tokens) }))
      .filter((post) => post.score >= 0)
      .sort((a, b) => b.score - a.score || b.date.localeCompare(a.date));

    if (!matchedPosts.length) {
      input.setAttribute('aria-expanded', 'false');
      results.innerHTML = `<p class="search-empty">No results for “${escape(term)}”.</p>`;
      return;
    }

    input.setAttribute('aria-expanded', 'true');
    results.innerHTML = `
      <p class="search-count">${matchedPosts.length} result${matchedPosts.length > 1 ? 's' : ''}</p>
      <div class="search-result-list" role="listbox">
        ${matchedPosts.map((post, index) => renderPost(post, tokens, index)).join('')}
      </div>`;
  }

  let timer;
  input.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => search(input.value), 120);
  });

  input.addEventListener('keydown', (event) => {
    if (!matchedPosts.length) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive(activeIndex < matchedPosts.length - 1 ? activeIndex + 1 : 0);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive(activeIndex > 0 ? activeIndex - 1 : matchedPosts.length - 1);
    } else if (event.key === 'Enter') {
      const index = activeIndex >= 0 ? activeIndex : 0;
      const link = document.getElementById(`search-result-${index}`);
      if (link) {
        event.preventDefault();
        location.href = link.href;
      }
    } else if (event.key === 'Escape') {
      input.value = '';
      search('');
    }
  });

  const initialQuery = new URLSearchParams(location.search).get('q');
  if (initialQuery) {
    input.value = initialQuery;
    search(initialQuery, { updateUrl: false });
  }
})();
