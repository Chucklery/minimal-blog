// viewCounter.js — 阅读量统计
(async function () {
  const slug = location.pathname.split('/posts/')[1]?.replace('.html', '');
  if (!slug) return;
  try {
    await fetch(`/api/posts/${slug}/view`, { method: 'POST' });
    const res = await fetch(`/api/posts/${slug}/views`);
    const data = await res.json();
    if (data.success) {
      const el = document.querySelector('[data-view-count]');
      if (el) el.textContent = data.data.count;
    }
  } catch { /* views are optional */ }
})();
