// autosave.js — 5s debounced draft save
export function initAutosave({ editor, editorEl, titleEl }) {

  let timer = null;
  let lastMd = '';

  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(doAutosave, 5000);
  }

  async function doAutosave() {
    const md = window.__editor__.getMarkdown();
    const title = titleEl.value.trim();
    if (!title || md === lastMd) return;
    lastMd = md;

    try {
      const res = await fetch('/api/posts/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: window.__editor__.postId || undefined,
          title,
          slug: document.getElementById('slug').value.trim(),
          content_md: md,
        })
      });
      const data = await res.json();
      if (data.success && !window.__editor__.postId) {
        window.__editor__.postId = data.data.id;
      }
    } catch {}
  }

  // Listen for changes
  editorEl.addEventListener('input', schedule);
  titleEl.addEventListener('input', schedule);
}
