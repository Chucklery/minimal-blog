// search-page.js — 后端 API 搜索 + 客户端 JSON 兜底

(async function () {
  const input = document.getElementById('search-input');
  const results = document.getElementById('search-results');
  if (!input || !results) return;

  const pagePath = location.pathname;
  const basePath = pagePath.replace(/\/search\/.*$/, '');
  let posts = []; // JSON fallback

  // Try loading JSON index as fallback
  try {
    const r = await fetch(`${basePath}/assets/search-index.json`);
    if (r.ok) posts = await r.json();
  } catch {};

  function escape(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  async function search(term) {
    if (!term.trim()) {
      results.innerHTML = '<p class="search-empty">Type to search...</p>';
      return;
    }

    // Try backend API first
    try {
      const apiRes = await fetch(`/api/search?q=${encodeURIComponent(term)}`);
      const apiData = await apiRes.json();
      if (apiData.success && apiData.data.length > 0) {
        results.innerHTML = `<p class="search-count">${apiData.data.length} result${apiData.data.length > 1 ? 's' : ''}</p>` +
          apiData.data.map(p => `
            <article class="search-result">
              <h3 class="search-result-title"><a href="${basePath}/posts/${escape(p.slug)}.html">${escape(p.title)}</a></h3>
              <p class="search-result-desc">${p.snippet || ''}</p>
            </article>`).join('');
        return;
      }
    } catch {}

    // Fallback to client-side JSON
    const q = term.toLowerCase();
    const matched = posts.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      (p.tags && p.tags.some(t => t.toLowerCase().includes(q)))
    );
    if (matched.length === 0) {
      results.innerHTML = `<p class="search-empty">No results for "${escape(term)}".</p>`;
      return;
    }
    results.innerHTML = `<p class="search-count">${matched.length} result${matched.length > 1 ? 's' : ''}</p>${matched.map(r => `
      <article class="search-result">
        <h3 class="search-result-title"><a href="${basePath}/posts/${escape(r.slug)}.html">${escape(r.title)}</a></h3>
        <p class="search-result-desc">${escape(r.description)}</p>
      </article>`).join('')}`;
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
