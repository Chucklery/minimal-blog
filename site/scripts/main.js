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
  btn.innerHTML = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="48" height="48">
<path d="M0 0 C3.43372322 0.99397251 5.16959963 3.02007441 7.375 5.6875 C7.98085938 6.40035156 8.58671875 7.11320313 9.2109375 7.84765625 C15.02824461 14.95901739 15.02824461 14.95901739 15.375 19.6875 C14.715 20.3475 14.055 21.0075 13.375 21.6875 C11.395 21.6875 9.415 21.6875 7.375 21.6875 C6.055 30.2675 4.735 38.8475 3.375 47.6875 C1.89 48.1825 1.89 48.1825 0.375 48.6875 C1.365 38.7875 2.355 28.8875 3.375 18.6875 C7.07652678 17.76211831 8.00958162 17.60575838 11.375 18.6875 C10.13258865 16.91133426 8.88075129 15.14175957 7.625 13.375 C6.58085938 11.89580078 6.58085938 11.89580078 5.515625 10.38671875 C3.60421682 7.9765307 1.92290867 6.36889018 -0.625 4.6875 C-1.90013763 5.76576365 -3.16992569 6.85035519 -4.4375 7.9375 C-5.14519531 8.54078125 -5.85289063 9.1440625 -6.58203125 9.765625 C-8.54389671 11.61120398 -10.08169625 13.48695332 -11.625 15.6875 C-9.315 16.3475 -7.005 17.0075 -4.625 17.6875 C-4.50382812 18.75226562 -4.38265625 19.81703125 -4.2578125 20.9140625 C-3.19007553 30.19606971 -2.00178704 39.44545083 -0.625 48.6875 C-1.615 48.3575 -2.605 48.0275 -3.625 47.6875 C-4.33276367 45.97265625 -4.33276367 45.97265625 -4.79296875 43.75 C-4.96376953 42.93660156 -5.13457031 42.12320313 -5.31054688 41.28515625 C-5.47619141 40.42792969 -5.64183594 39.57070313 -5.8125 38.6875 C-5.98974609 37.86121094 -6.16699219 37.03492188 -6.34960938 36.18359375 C-7.48332062 30.58945098 -7.79176155 25.39189519 -7.625 19.6875 C-9.935 19.6875 -12.245 19.6875 -14.625 19.6875 C-15.285 18.3675 -15.945 17.0475 -16.625 15.6875 C-6.37671782 1.67009276 -6.37671782 1.67009276 0 0 Z " fill="#000000" transform="translate(24.625,-0.6875)"/>';
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
