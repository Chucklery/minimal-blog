// search-page.js — 客户端搜索（加载构建期索引，内存过滤）

(async function () {
  const input = document.getElementById('search-input');
  const results = document.getElementById('search-results');
  if (!input || !results) return;

  // 加载索引
  let posts = [];
  try {
    const res = await fetch('/assets/search-index.json');
    if (!res.ok) throw new Error('Index not found');
    posts = await res.json();
  } catch {
    results.innerHTML = '<p class="search-error">Search index unavailable.</p>';
    return;
  }

  function escape(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function render(post) {
    return `
    <article class="search-result">
      <h3 class="search-result-title">
        <a href="/posts/${escape(post.slug)}.html">${escape(post.title)}</a>
      </h3>
      <div class="search-result-meta">${escape(post.date)}${post.tags.length ? ' · ' + post.tags.map(escape).join(', ') : ''}</div>
      <p class="search-result-desc">${escape(post.description)}</p>
    </article>`;
  }

  function search(term) {
    if (!term.trim()) {
      results.innerHTML = '<p class="search-empty">Type to search...</p>';
      return;
    }

    const q = term.toLowerCase();
    const matched = posts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        (p.tags && p.tags.some((t) => t.toLowerCase().includes(q)))
    );

    if (matched.length === 0) {
      results.innerHTML = `<p class="search-empty">No results for "${escape(term)}".</p>`;
      return;
    }

    results.innerHTML = `<p class="search-count">${matched.length} result${matched.length > 1 ? 's' : ''}</p>${matched.map(render).join('')}`;
  }

  // Debounced input
  let timer;
  input.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => search(input.value), 100);
  });

  // Initial search if URL has ?q=
  const params = new URLSearchParams(location.search);
  const q = params.get('q');
  if (q) {
    input.value = q;
    search(q);
  }
})();
