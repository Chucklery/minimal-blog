// editor.js — Vditor markdown editor setup
(function () {
  const DEFAULT_DATE = new Date().toISOString().slice(0, 10);

  let postId = window.__POST_ID__ || '';
  const initialMd = window.__POST_MD__ || '';

  const titleEl = document.getElementById('title');
  const slugEl = document.getElementById('slug');
  const dateEl = document.getElementById('date');
  const descriptionEl = document.getElementById('description');
  const tagsEl = document.getElementById('tags');
  const draftEl = document.getElementById('draft');
  const featuredEl = document.getElementById('featured');
  const previewEl = document.getElementById('frontmatter-preview');

  function toast(msg, isErr) {
    const box = document.getElementById('toasts');
    const el = document.createElement('div');
    el.className = 'toast-msg';
    el.style.background = isErr ? '#d32f2f' : '#222';
    el.textContent = msg;
    box.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }

  function slugify(value) {
    return String(value || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-\u4e00-\u9fff]/g, '')
      .replace(/-+/g, '-')
      .slice(0, 80);
  }

  function quoteYaml(value) {
    return `"${String(value || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  }

  function parseBoolean(value, fallback) {
    if (typeof value !== 'string') return fallback;
    if (/^true$/i.test(value.trim())) return true;
    if (/^false$/i.test(value.trim())) return false;
    return fallback;
  }

  function parseTags(raw) {
    const text = String(raw || '').trim();
    if (!text) return [];
    const bracket = text.match(/^\[(.*)\]$/s);
    const body = bracket ? bracket[1] : text;
    return body
      .split(',')
      .map((tag) => tag.trim().replace(/^['"]|['"]$/g, ''))
      .filter(Boolean);
  }

  function parseFrontmatter(markdown) {
    const md = String(markdown || '').replace(/^\uFEFF/, '');
    const match = md.match(/^---\s*\n([\s\S]*?)\n---\s*(?:\n|$)([\s\S]*)$/);
    const meta = {
      title: titleEl.value || '',
      slug: slugEl.value || '',
      date: DEFAULT_DATE,
      description: '',
      tags: [],
      draft: false,
      featured: false,
    };
    if (!match) return { meta, body: md };

    for (const line of match[1].split(/\r?\n/)) {
      const pair = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
      if (!pair) continue;
      const key = pair[1];
      let value = pair[2].trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
      }
      if (key === 'title') meta.title = value;
      else if (key === 'slug') meta.slug = value;
      else if (key === 'date') meta.date = value;
      else if (key === 'description') meta.description = value;
      else if (key === 'tags') meta.tags = parseTags(value);
      else if (key === 'draft') meta.draft = parseBoolean(value, false);
      else if (key === 'featured') meta.featured = parseBoolean(value, false);
    }
    return { meta, body: match[2] || '' };
  }

  function readMeta() {
    const title = titleEl.value.trim();
    const slug = slugEl.value.trim() || slugify(title);
    const date = dateEl.value || DEFAULT_DATE;
    const tags = parseTags(tagsEl.value);
    return {
      title,
      slug,
      date,
      description: descriptionEl.value.trim(),
      tags,
      draft: Boolean(draftEl.checked),
      featured: Boolean(featuredEl.checked),
    };
  }

  function buildFrontmatter(meta) {
    return [
      '---',
      `title: ${quoteYaml(meta.title)}`,
      `slug: ${quoteYaml(meta.slug)}`,
      `date: ${quoteYaml(meta.date)}`,
      `description: ${quoteYaml(meta.description)}`,
      `tags: [${meta.tags.join(', ')}]`,
      `draft: ${meta.draft ? 'true' : 'false'}`,
      `featured: ${meta.featured ? 'true' : 'false'}`,
      '---',
    ].join('\n');
  }

  function updatePreview() {
    previewEl.textContent = buildFrontmatter(readMeta());
  }

  const parsed = parseFrontmatter(initialMd);
  titleEl.value = parsed.meta.title || titleEl.value || '';
  slugEl.value = parsed.meta.slug || slugEl.value || slugify(titleEl.value);
  dateEl.value = parsed.meta.date || DEFAULT_DATE;
  descriptionEl.value = parsed.meta.description || '';
  tagsEl.value = parsed.meta.tags.join(', ');
  draftEl.checked = parsed.meta.draft;
  featuredEl.checked = parsed.meta.featured;

  // Display timestamps from backend
  (function showTimestamps() {
    const createdEl = document.getElementById('created-display');
    const updatedEl = document.getElementById('updated-display');
    function fmt(raw) {
      if (!raw) return '—';
      const text = String(raw).trim();
      const normalized = text.includes('T') ? text : text.replace(' ', 'T');
      const d = new Date(normalized);
      if (Number.isNaN(d.getTime())) return text.slice(0, 10) || '—';
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      return `${y}/${m}/${day} ${hh}:${mm}`;
    }
    if (createdEl) createdEl.textContent = fmt(window.__POST_CREATED__);
    if (updatedEl) updatedEl.textContent = fmt(window.__POST_UPDATED__);
  })();

  titleEl.addEventListener('input', () => {
    if (!slugEl.dataset.manual) slugEl.value = slugify(titleEl.value);
    updatePreview();
  });
  slugEl.addEventListener('input', () => {
    slugEl.dataset.manual = '1';
    updatePreview();
  });
  for (const el of [dateEl, descriptionEl, tagsEl, draftEl, featuredEl]) {
    el.addEventListener('input', updatePreview);
    el.addEventListener('change', updatePreview);
  }
  updatePreview();

  const vditor = new Vditor('editor', {
    value: parsed.body.trimStart(),
    height: 560,
    mode: 'ir',
    cache: { enable: false },
    placeholder: '开始写 Markdown 正文。frontmatter 会由上面的表单自动生成。',
    preview: {
      markdown: {
        toc: true,
        mark: true,
        footnotes: true,
        autoSpace: true,
      },
    },
    toolbar: [
      'emoji', 'headings', 'bold', 'italic', 'strike', '|',
      'line', 'quote', 'list', 'ordered-list', 'check', '|',
      'code', 'inline-code', 'table', 'link', 'upload', '|',
      'undo', 'redo', '|', 'outline', 'preview', 'fullscreen', 'edit-mode'
    ],
    upload: {
      accept: 'image/*',
      handler(files) {
        return uploadImage(files && files[0]);
      },
    },
    after() {
      window.__editor__.ready = true;
    },
  });

  async function uploadImage(file) {
    if (!file || !file.type.startsWith('image/')) return null;
    const form = new FormData();
    form.append('file', file);
    try {
      const res = await fetch('/api/media/upload', { method: 'POST', body: form });
      const data = await res.json();
      if (!data.success) {
        toast(data.message || 'Upload failed', true);
        return null;
      }
      return `![${file.name}](${data.data.filepath})`;
    } catch (err) {
      toast('Network error', true);
      return null;
    }
  }

  function getMarkdown() {
    const meta = readMeta();
    const body = vditor.getValue().replace(/^\s+/, '');
    return `${buildFrontmatter(meta)}\n\n${body}`.trimEnd() + '\n';
  }

  async function doSave({ redirect = false } = {}) {
    const meta = readMeta();
    if (!meta.title) { toast('Title is required', true); return null; }
    if (!meta.slug) { toast('Slug is required', true); return null; }

    try {
      const res = await fetch('/api/posts/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: postId || undefined,
          title: meta.title,
          slug: meta.slug,
          content_md: getMarkdown(),
        }),
      });
      const data = await res.json();
      if (!data.success) {
        toast(data.message || 'Save failed', true);
        return null;
      }
      if (data.data?.id) postId = String(data.data.id);
      window.__editor__.postId = postId;
      toast('Draft saved!');
      if (redirect) setTimeout(() => { location.href = '/admin/posts'; }, 800);
      return data;
    } catch (err) {
      toast('Network error', true);
      return null;
    }
  }

  async function doPublish() {
    const result = await doSave();
    if (!result) return;
    const pid = result.data?.id || postId;
    try {
      const res = await fetch(`/api/posts/${pid}/publish`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        toast('Published!');
        setTimeout(() => { location.href = '/admin/posts'; }, 800);
      } else {
        toast(data.message || 'Publish failed', true);
      }
    } catch (err) {
      toast('Network error', true);
    }
  }

  window.__editor__ = {
    ready: false,
    getMarkdown,
    toast,
    vditor,
    titleEl,
    slugEl,
    postId,
    parseFrontmatter,
    buildFrontmatter,
  };

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      doSave();
    }
  });

  document.getElementById('btn-draft').addEventListener('click', () => doSave({ redirect: true }));
  document.getElementById('btn-publish').addEventListener('click', doPublish);
})();
