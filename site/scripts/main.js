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
}

function bindThemeToggle() {
  const btn = document.querySelector('[data-theme-toggle]');
  if (btn) {
    btn.addEventListener('click', toggleTheme);
  }

  // 监听系统主题变化
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
      document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
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
    btn.textContent = 'Copy';
    btn.setAttribute('aria-label', 'Copy code');

    btn.addEventListener('click', async () => {
      const code = block.querySelector('code');
      if (!code) return;
      const text = code.textContent || '';
      try {
        await navigator.clipboard.writeText(text);
        btn.textContent = 'Copied';
        setTimeout(() => {
          btn.textContent = 'Copy';
        }, 1500);
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
        btn.textContent = 'Copied';
        setTimeout(() => {
          btn.textContent = 'Copy';
        }, 1500);
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
          const active = document.querySelector(
            `[data-toc] a[href="#${entry.target.id}"]`
          );
          if (active) active.classList.add('active');
        }
      }
    },
    { rootMargin: '-15% 0px -75% 0px' }
  );

  headings.forEach((h) => observer.observe(h.el));
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
// 6. 返回顶部
// =============================================================================

function initBackToTop() {
  // 只在长页面添加
  if (document.documentElement.scrollHeight < window.innerHeight * 2) return;

  const btn = document.createElement('button');
  btn.className = 'back-to-top';
  btn.innerHTML = "<svg fill=\"currentColor\" height=\"24\" width=\"24\">\n" +
      "  <path stroke=\"currentColor\" d=\"M5 8c0.742 0 1.85 -0.733 2.78 -1.475 1.2 -0.954 2.247 -2.094 3.046 -3.401C11.425 2.144 12 0.956 12 0m0 0c0 0.956 0.575 2.145 1.174 3.124 0.8 1.307 1.847 2.447 3.045 3.401C17.15 7.267 18.26 8 19 8m-7 -8 0 24\" stroke-width=\"1\"></path>\n" +
      "</svg>"
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
  initPrefetch();
  initBackToTop();
});
