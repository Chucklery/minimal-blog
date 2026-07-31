// main.js — 所有客户端微交互（目标 gzip < 6KB）
// 无框架、无依赖、纯 Vanilla JS

// =============================================================================
// 1. 主题切换
// =============================================================================

function initTheme() {
  // 立即设置主题，避免闪烁（此部分也在 <head> 内联执行）
  const stored = localStorage.getItem('theme');
  const prefers = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = stored || (prefers ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', theme);
}

function toggleTheme() {
  const html = document.documentElement;
  const current = html.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  syncThemeToggle(next);
}

function syncThemeToggle(theme) {
  const btn = document.querySelector('[data-theme-toggle]');
  if (!btn) return;

  const isDark = theme === 'dark';
  btn.setAttribute('aria-pressed', String(isDark));
  btn.setAttribute('aria-label', isDark ? 'Switch to light theme' : 'Switch to dark theme');
}

function bindThemeToggle() {
  const btn = document.querySelector('[data-theme-toggle]');
  if (btn) {
    syncThemeToggle(document.documentElement.getAttribute('data-theme'));
    btn.addEventListener('click', toggleTheme);
  }

  // 监听系统主题变化
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
      const theme = e.matches ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', theme);
      syncThemeToggle(theme);
    }
  });
}

// =============================================================================
// 2. 阅读进度条
// =============================================================================

function initProgressBar() {
  const bar = document.querySelector('[data-progress]');
  if (!bar) return;

  let ticking = false;
  const update = () => {
    const doc = document.documentElement;
    const max = doc.scrollHeight - doc.clientHeight;
    const pct = max > 0 ? doc.scrollTop / max : 0;
    bar.style.transform = `scaleX(${pct})`;
    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });
}

// =============================================================================
// 3. 代码块复制按钮
// =============================================================================

function initCodeCopy() {
  document.querySelectorAll('pre').forEach((block) => {
    // 避免重复添加
    if (block.querySelector('.code-copy')) return;

    const btn = document.createElement('button');
    btn.className = 'code-copy';
    btn.type = 'button';
    btn.textContent = 'Copy';
    btn.setAttribute('aria-label', 'Copy code');
    btn.setAttribute('aria-live', 'polite');

    btn.addEventListener('click', async () => {
      const code = block.querySelector('code');
      if (!code) return;
      const text = code.textContent || '';

      const showCopiedState = () => {
        btn.textContent = 'Copied';
        btn.setAttribute('aria-label', 'Code copied to clipboard');
        btn.dataset.state = 'copied';
        setTimeout(() => {
          btn.textContent = 'Copy';
          btn.setAttribute('aria-label', 'Copy code');
          delete btn.dataset.state;
        }, 1500);
      };

      try {
        await navigator.clipboard.writeText(text);
        showCopiedState();
      } catch {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showCopiedState();
      }
    });

    block.appendChild(btn);
  });
}

// =============================================================================
// 4. TOC 章节高亮
// =============================================================================

function initTocHighlight() {
  const tocLinks = document.querySelectorAll('[data-toc] a');
  if (!tocLinks.length) return;

  const headings = Array.from(
    document.querySelectorAll('.prose h2[id], .prose h3[id]')
  ).map((h) => ({ id: h.id, el: h }));

  if (!headings.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          tocLinks.forEach((l) => l.classList.remove('active'));
          document
            .querySelectorAll('[data-toc] .toc-section-active')
            .forEach((item) => item.classList.remove('toc-section-active'));
          const activeLinks = document.querySelectorAll(
            `[data-toc] a[href="#${entry.target.id}"]`
          );
          activeLinks.forEach((link) => {
            link.classList.add('active');
            const section = link.closest('.toc-level-h2') || link.parentElement?.closest('.toc-level-h2');
            section?.classList.add('toc-section-active');
          });
        }
      }
    },
    { rootMargin: '-15% 0px -75% 0px' }
  );

  headings.forEach((h) => observer.observe(h.el));
}

function initInlineToc() {
  const inlineToc = document.querySelector('[data-inline-toc]');
  if (!inlineToc) return;

  inlineToc.addEventListener('click', (event) => {
    if (event.target.closest('a[href^="#"]')) {
      inlineToc.removeAttribute('open');
    }
  });
}

// =============================================================================
// 5. 链接预加载（hover 时 prefetch）
// =============================================================================

function initPrefetch() {
  // IntersectionObserver 模式：卡片进入视口时预加载
  if (!('IntersectionObserver' in window)) return;

  const prefetched = new Set();

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const link = entry.target.querySelector('a[href]');
          if (link && link.href && !prefetched.has(link.href)) {
            // 只预加载同源链接
            const url = new URL(link.href, location.origin);
            if (url.origin === location.origin) {
              const prefetch = document.createElement('link');
              prefetch.rel = 'prefetch';
              prefetch.href = link.href;
              prefetch.as = 'document';
              document.head.appendChild(prefetch);
              prefetched.add(link.href);
            }
          }
        }
      }
    },
    { rootMargin: '200px' }
  );

  document.querySelectorAll('[data-prefetch]').forEach((el) => observer.observe(el));
}

// =============================================================================
// 6. 书籍连续阅读：章节定位、进度与断点续读
// =============================================================================

function initBookReader() {
  const reader = document.querySelector('[data-book-reader]');
  if (!reader) return;

  const chapters = [...reader.querySelectorAll('[data-book-chapter]')];
  const tocLinks = [...reader.querySelectorAll('[data-book-chapter-link]')];
  const status = reader.querySelector('[data-book-status]');
  const resume = reader.querySelector('[data-book-resume]');
  const resumeLabel = reader.querySelector('[data-book-resume-label]');
  const resumeButton = reader.querySelector('[data-book-resume-button]');
  const drawer = reader.querySelector('[data-book-toc-drawer]');
  const storageKey = `book-progress:${reader.dataset.bookSlug}`;
  let activeIndex = 0;
  let allowUrlSync = Boolean(location.hash);
  let ticking = false;
  let lastSyncedChapter = location.hash.slice(1);

  if (!chapters.length) return;

  const readSavedProgress = () => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || 'null');
    } catch {
      return null;
    }
  };

  const saveProgress = (chapter, percent) => {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          chapterId: chapter.id,
          chapterTitle: chapter.dataset.chapterTitle,
          offset: Math.max(0, window.scrollY - chapter.offsetTop),
          percent,
          updatedAt: Date.now(),
        })
      );
    } catch {
      // 存储不可用时不影响阅读
    }
  };

  const setActiveChapter = (index, percent, shouldSave = true) => {
    activeIndex = index;
    const chapter = chapters[index];

    tocLinks.forEach((link) => {
      const active = link.getAttribute('href') === `#${chapter.id}`;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });

    if (status) {
      status.textContent = `第 ${index + 1} / ${chapters.length} 章 · ${percent}%`;
    }

    if (allowUrlSync && lastSyncedChapter !== chapter.id) {
      history.replaceState(null, '', `#${chapter.id}`);
      lastSyncedChapter = chapter.id;
    }

    if (shouldSave) saveProgress(chapter, percent);
  };

  const update = (shouldSave = true) => {
    const threshold = window.innerHeight * 0.32;
    let index = 0;
    chapters.forEach((chapter, chapterIndex) => {
      if (chapter.getBoundingClientRect().top <= threshold) index = chapterIndex;
    });

    const start = chapters[0].offsetTop;
    const end = chapters.at(-1).offsetTop + chapters.at(-1).offsetHeight - window.innerHeight;
    const percent = Math.round(
      Math.max(0, Math.min(1, (window.scrollY - start) / Math.max(1, end - start))) * 100
    );

    setActiveChapter(index, percent, shouldSave);
    ticking = false;
  };

  const saved = readSavedProgress();
  const savedChapter = saved && chapters.find((chapter) => chapter.id === saved.chapterId);
  if (!location.hash && savedChapter && saved.percent > 0 && resume && resumeButton) {
    resume.hidden = false;
    if (resumeLabel) {
      resumeLabel.textContent = `${saved.chapterTitle} · ${saved.percent}%`;
    }
    resumeButton.addEventListener('click', () => {
      allowUrlSync = true;
      resume.hidden = true;
      window.scrollTo({
        top: savedChapter.offsetTop + (saved.offset || 0),
        behavior: 'smooth',
      });
    });
  }

  tocLinks.forEach((link) => {
    link.addEventListener('click', () => {
      allowUrlSync = true;
      if (resume) resume.hidden = true;
      if (drawer) drawer.removeAttribute('open');
    });
  });

  window.addEventListener(
    'scroll',
    () => {
      allowUrlSync = true;
      if (resume) resume.hidden = true;
      if (!ticking) {
        requestAnimationFrame(() => update(true));
        ticking = true;
      }
    },
    { passive: true }
  );

  update(false);
}

// =============================================================================
// 7. Mermaid 图表（仅在需要时加载）
// =============================================================================

async function initMermaid() {
  const diagrams = [...document.querySelectorAll('[data-mermaid-diagram] .mermaid')];
  if (!diagrams.length) return;

  try {
    const { default: mermaid } = await import(
      'https://cdn.jsdelivr.net/npm/mermaid@11.12.0/dist/mermaid.esm.min.mjs'
    );
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'strict',
      theme: document.documentElement.dataset.theme === 'dark' ? 'dark' : 'neutral',
      fontFamily: 'system-ui, sans-serif',
    });
    await mermaid.run({ nodes: diagrams });
  } catch {
    document.querySelectorAll('[data-mermaid-diagram]').forEach((diagram) => {
      diagram.classList.add('mermaid-fallback');
    });
  }
}

// =============================================================================
// 8. 返回顶部
// =============================================================================

function initBackToTop() {
  // 只在长页面添加
  if (document.documentElement.scrollHeight < window.innerHeight * 2) return;

  const btn = document.createElement('button');
  btn.className = 'back-to-top';
  btn.innerHTML = "<svg fill=\"currentColor\" height=\"24\" width=\"24\">\n" +
      "  <path stroke=\"currentColor\" d=\"M5 8c0.742 0 1.85 -0.733 2.78 -1.475 1.2 -0.954 2.247 -2.094 3.046 -3.401C11.425 2.144 12 0.956 12 0m0 0c0 0.956 0.575 2.145 1.174 3.124 0.8 1.307 1.847 2.447 3.045 3.401C17.15 7.267 18.26 8 19 8m-7 -8 0 24\" stroke-width=\"1\"></path>\n" +
      "</svg>";
  btn.setAttribute('aria-label', 'Back to top');
  document.body.appendChild(btn);

  let ticking = false;
  const toggle = () => {
    btn.classList.toggle('visible', window.scrollY > 400);
    ticking = false;
  };

  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        requestAnimationFrame(toggle);
        ticking = true;
      }
    },
    { passive: true }
  );

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// =============================================================================
// 启动
// =============================================================================

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  bindThemeToggle();
  initProgressBar();
  initCodeCopy();
  initTocHighlight();
  initInlineToc();
  initPrefetch();
  initBookReader();
  initMermaid();
  initBackToTop();
});
