// scripts/build.js
// 构建编排 — 按顺序调用 core 各模块

import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { minify } from 'html-minifier-terser';

import { ROOT, SITE_CONFIG, DIST_DIR } from '../core/utils/paths.js';
import { loadPosts } from '../core/content/loadPosts.js';
import { loadPages } from '../core/content/loadPages.js';
import { estimateReadingTime } from '../core/content/readingTime.js';
import { renderMarkdown } from '../core/markdown/renderMarkdown.js';
import { extractToc, buildTocTree, renderTocHtml } from '../core/markdown/extractToc.js';
import { renderLayout } from '../core/template/renderLayout.js';
import { renderHome } from '../core/template/renderHome.js';
import { renderPost } from '../core/template/renderPost.js';
import { renderArchive } from '../core/template/renderArchive.js';
import { renderAbout } from '../core/template/renderAbout.js';
import { renderSearch } from '../core/template/renderSearch.js';
import { renderTagPage } from '../core/template/renderTagPage.js';
import { cleanDist } from '../core/output/cleanDist.js';
import { writePage } from '../core/output/writePage.js';
import { writeRss } from '../core/output/writeRss.js';
import { writeSitemap } from '../core/output/writeSitemap.js';
import { writeSearchIndex } from '../core/output/writeSearchIndex.js';
import { writeTagPages } from '../core/output/writeTagPages.js';
import { buildCss } from '../core/assets/buildCss.js';
import { buildJs } from '../core/assets/buildJs.js';
import { buildImages } from '../core/assets/buildImages.js';
import { copyPublic } from '../core/assets/copyPublic.js';
import { pathToFileURL } from 'node:url';

/**
 * 动态加载站点配置
 */
async function loadSiteConfig() {
  try {
    const url = pathToFileURL(SITE_CONFIG);
    url.searchParams.set('t', String(Date.now()));
    const mod = await import(url.href);
    return mod.default;
  } catch (err) {
    console.error('Failed to load site config:', err.message);
    process.exit(1);
  }
}

/**
 * 主构建流程
 */
async function build() {
  console.time('Build');

  const site = await loadSiteConfig();
  console.log(`\n🏗  Building: ${site.title}`);

  // 1. 清空 dist
  await cleanDist();

  // 2. 加载内容
  const posts = await loadPosts();
  const pages = await loadPages();
  console.log(`  Posts: ${posts.length}`);
  console.log(`  Pages: ${pages.length}`);

  // 3. 计算阅读时间
  for (const post of posts) {
    post.readingTime = estimateReadingTime(post.rawContent);
  }

  // 4. 渲染每篇文章页
  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    const htmlBody = await renderMarkdown(post.rawContent);

    // TOC
    const flatHeadings = extractToc(htmlBody);
    const tocTree = buildTocTree(flatHeadings);
    const tocHtml = tocTree.length > 0 ? renderTocHtml(tocTree) : '';

    const prevPost = i < posts.length - 1 ? posts[i + 1] : null;
    const nextPost = i > 0 ? posts[i - 1] : null;

    const bodyContent = renderPost({
      post,
      htmlBody,
      tocHtml,
      prevPost,
      nextPost,
      site,
    });

    const fullHtml = renderLayout({
      site,
      page: 'post',
      title: post.title,
      description: post.description,
      bodyContent,
      canonicalUrl: `${site.baseUrl}/posts/${post.slug}.html`,
      publishedDate: post.date.toISOString().split('T')[0],
      showProgress: true,
      tocHtml,
    });

    // 压缩 HTML
    const finalHtml = site.build?.minifyHtml
      ? await minify(fullHtml, {
          collapseWhitespace: true,
          removeComments: true,
          minifyCSS: true,
        })
      : fullHtml;

    await writePage(`posts/${post.slug}.html`, finalHtml);
  }

  // 5. 首页
  const homeContent = renderHome({ posts, site });
  let homeHtml = renderLayout({
    site,
    page: 'home',
    title: site.title,
    description: site.description,
    bodyContent: homeContent,
    canonicalUrl: site.baseUrl,
  });

  if (site.build?.minifyHtml) {
    homeHtml = await minify(homeHtml, {
      collapseWhitespace: true,
      removeComments: true,
      minifyCSS: true,
    });
  }
  await writePage('index.html', homeHtml);

  // 6. 归档页
  const archiveContent = renderArchive({ posts, site });
  let archiveHtml = renderLayout({
    site,
    page: 'archive',
    title: 'Archive',
    description: `All posts — ${site.title}`,
    bodyContent: archiveContent,
    canonicalUrl: `${site.baseUrl}/archive/`,
  });

  if (site.build?.minifyHtml) {
    archiveHtml = await minify(archiveHtml, {
      collapseWhitespace: true,
      removeComments: true,
      minifyCSS: true,
    });
  }
  await writePage('archive/index.html', archiveHtml);

  // 7. 关于页
  const aboutPage = pages.find((p) => p.slug === 'about');
  if (aboutPage) {
    const aboutHtmlBody = await renderMarkdown(aboutPage.rawContent);
    const aboutContent = renderAbout({ htmlBody: aboutHtmlBody, site });
    let aboutHtml = renderLayout({
      site,
      page: 'about',
      title: 'About',
      description: `About — ${site.title}`,
      bodyContent: aboutContent,
      canonicalUrl: `${site.baseUrl}/about/`,
    });

    if (site.build?.minifyHtml) {
      aboutHtml = await minify(aboutHtml, {
        collapseWhitespace: true,
        removeComments: true,
        minifyCSS: true,
      });
    }
    await writePage('about/index.html', aboutHtml);
  }

  // 8. 搜索页
  if (site.build?.generateSearch) {
    const searchContent = renderSearch({ site });
    let searchHtml = renderLayout({
      site,
      page: 'search',
      title: 'Search',
      description: `Search — ${site.title}`,
      bodyContent: searchContent,
      canonicalUrl: `${site.baseUrl}/search/`,
    });
    if (site.build?.minifyHtml) {
      searchHtml = await minify(searchHtml, {
        collapseWhitespace: true,
        removeComments: true,
        minifyCSS: true,
      });
    }
    await writePage('search/index.html', searchHtml);
  }

  // 9. 构建 CSS
  await buildCss();

  // 10. 构建 JS（main.js + search-page.js）
  await buildJs();

  // 11. 图片优化
  await buildImages();

  // 12. 复制 public
  await copyPublic();

  // 13. RSS
  await writeRss({ posts, site });

  // 14. Sitemap
  await writeSitemap({ posts, site });

  // 15. Tag 页面
  await writeTagPages({ posts, site, renderTagPage, renderLayout, minify });

  // 16. 搜索索引
  if (site.build?.generateSearch) {
    await writeSearchIndex({ posts, site });
  }

  // 17. 生成版本文件（前端轮询用）
  await writeFile(join(DIST_DIR, 'version.json'), JSON.stringify({ ts: Date.now() }), 'utf-8');

  console.log(`\n✅ Build complete`);
  console.timeEnd('Build');
}

// Run
build().catch((err) => {
  console.error('\n❌ Build failed:', err);
  process.exit(1);
});
