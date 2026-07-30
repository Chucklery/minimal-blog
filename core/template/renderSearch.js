// core/template/renderSearch.js
// 搜索页模板

export function renderSearch({ site }) {
  const bp = site.basePath || '';
  return `
<main class="search-page">
  <section class="search-hero">
    <h1>Search</h1>
    <div class="search-box">
      <label for="search-input" class="search-label">Search posts</label>
      <input
        type="search"
        id="search-input"
        class="search-input"
        placeholder="Search posts..."
        autocomplete="off"
        autofocus
      >
    </div>
  </section>

  <section class="search-results" id="search-results">
    <p class="search-empty">Type to search ${site.title}...</p>
  </section>
</main>

<script src="${bp}/assets/search-page.js" type="module"></script>`;
}
