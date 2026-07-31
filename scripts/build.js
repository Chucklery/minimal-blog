// scripts/build.js
// 构建编排 — 按顺序调用 core 各模块

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { minify } from 'html-minifier-terser';

import { ROOT, SITE_CONFIG } from '../core/utils/paths.js';
import { loadPosts } from '../core/content/loadPosts.js';
import { loadPages } from '../core/content/loadPages.js';
import { loadBooks } from '../core/content/loadBooks.js';
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
import { renderNotFound } from '../core/template/renderNotFound.js';
import { renderBook } from '../core/template/renderBook.js';
import { renderBooksIndex } from '../core/template/renderBooksIndex.js';
import { cleanDist } from '../core/output/cleanDist.js';
import { writePage } from '../core/output/writePage.js';
import { writeRss } from '../core/output/writeRss.js';
import { writeSitemap } from '../core/output/writeSitemap.js';
import { writeSearchIndex } from '../core/output/writeSearchIndex.js';
import { writeTagPages } from '../core/output/writeTagPages.js';
import { writeSocialImages } from '../core/output/writeSocialImages.js';
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
  const includeDrafts = process.env.INCLUDE_DRAFTS === 'true';
  const posts = await loadPosts({ includeDrafts });
  const pages = await loadPages();
  const books = await loadBooks({ includeDrafts });
  site.hasBooks = books.length > 0;
  console.log(`  Posts: ${posts.length}`);
  console.log(`  Pages: ${pages.length}`);
  console.log(`  Books: ${books.length}${includeDrafts ? ' (including drafts)' : ''}`);

  // 3. 计算阅读时间
  for (const post of posts) {
    post.readingTime = estimateReadingTime(post.rawContent);
  }
  for (const book of books) {
    book.author ||= site.author?.name || '';
    book.readingTime = estimateReadingTime(
      book.chapters.map((chapter) => chapter.rawContent).join('\n')
    );
  }

  // 4. 渲染书籍：源文件分章，输出为一个连续阅读页
  for (const book of books) {
    for (const chapter of book.chapters) {
      chapter.htmlBody = await renderMarkdown(chapter.rawContent, {
        headingIdPrefix: chapter.id,
      });
    }

    const bookContent = renderBook({ book, site });
    let bookHtml = renderLayout({
      site,
      page: 'book',
      title: book.title,
      description: book.description,
      bodyContent: bookContent,
      canonicalUrl: `${site.baseUrl}/books/${book.slug}/`,
      ogImage: `${site.baseUrl}/assets/og/book-${book.slug}.jpg`,
      showProgress: true,
    });

    if (site.build?.minifyHtml) {
      bookHtml = await minify(bookHtml, {
        collapseWhitespace: true,
        removeComments: true,
        minifyCSS: true,
      });
    }
    await writePage(`books/${book.slug}/index.html`, bookHtml);
  }

  if (books.length > 0) {
    const booksIndexContent = renderBooksIndex({ books, site });
    let booksIndexHtml = renderLayout({
      site,
      page: 'books',
      title: '书架',
      description: `Books — ${site.title}`,
      bodyContent: booksIndexContent,
      canonicalUrl: `${site.baseUrl}/books/`,
    });
    if (site.build?.minifyHtml) {
      booksIndexHtml = await minify(booksIndexHtml, {
        collapseWhitespace: true,
        removeComments: true,
        minifyCSS: true,
      });
    }
    await writePage('books/index.html', booksIndexHtml);
  }

  // 5. 渲染每篇文章页
  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    const htmlBody = await renderMarkdown(post.rawContent);

    // TOC
    const flatHeadings = extractToc(htmlBody);
    const tocTree = buildTocTree(flatHeadings);
    const tocHtml = tocTree.length > 0 ? renderTocHtml(tocTree) : '';

    const prevPost = i < posts.length - 1 ? posts[i + 1] : null;
    const nextPost = i > 0 ? posts[i - 1] : null;
    const relatedPosts = findRelatedPosts(post, posts);

    const bodyContent = renderPost({
      post,
      htmlBody,
      tocHtml,
      prevPost,
      nextPost,
      relatedPosts,
      site,
    });

    const fullHtml = renderLayout({
      site,
      page: 'post',
      title: post.title,
      description: post.description,
      bodyContent,
      canonicalUrl: `${site.baseUrl}/posts/${post.slug}.html`,
      ogImage: `${site.baseUrl}/assets/og/${post.slug}.jpg`,
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

  // 9. GitHub Pages 404
  const notFoundContent = renderNotFound({ posts, site });
  let notFoundHtml = renderLayout({
    site,
    page: '404',
    title: '页面未找到',
    description: `页面未找到 — ${site.title}`,
    bodyContent: notFoundContent,
    noindex: true,
  });
  if (site.build?.minifyHtml) {
    notFoundHtml = await minify(notFoundHtml, {
      collapseWhitespace: true,
      removeComments: true,
      minifyCSS: true,
    });
  }
  await writePage('404.html', notFoundHtml);

  // 10. 构建 CSS
  await buildCss();

  // 11. 构建 JS（main.js + search-page.js）
  await buildJs();

  // 12. 图片优化
  await buildImages();

  // 13. 复制 public
  await copyPublic();

  // 14. 社交分享图
  await writeSocialImages({ posts, books });

  // 15. RSS
  await writeRss({ posts, site });

  // 16. Sitemap
  await writeSitemap({ posts, books, site });

  // 17. Tag 页面
  await writeTagPages({ posts, site, renderTagPage, renderLayout, minify });

  // 18. 搜索索引
  if (site.build?.generateSearch) {
    await writeSearchIndex({ posts, books, site });
  }

  console.log(`\n✅ Build complete`);
  console.timeEnd('Build');
}

// Run
build().catch((err) => {
  console.error('\n❌ Build failed:', err);
  process.exit(1);
});

function findRelatedPosts(currentPost, posts, limit = 3) {
  const currentTags = new Set((currentPost.tags || []).map((tag) => tag.toLowerCase()));

  return posts
    .filter((post) => post.slug !== currentPost.slug)
    .map((post) => {
      const sharedTags = (post.tags || []).filter((tag) => currentTags.has(tag.toLowerCase()));
      return { ...post, sharedTags, relatedScore: sharedTags.length };
    })
    .filter((post) => post.relatedScore > 0)
    .sort((a, b) => b.relatedScore - a.relatedScore || b.date - a.date)
    .slice(0, limit);
}
