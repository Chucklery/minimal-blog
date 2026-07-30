// core/template/renderMeta.js
// 生成 <head> 中的 meta / og / structured data 标签

import { escapeAttr } from '../utils/escapeHtml.js';

/**
 * 生成 SEO meta 标签
 * @param {Object} opts
 * @param {string} opts.title
 * @param {string} opts.description
 * @param {string} [opts.canonicalUrl]
 * @param {string} [opts.ogImage]
 * @param {'article'|'website'} [opts.ogType]
 * @param {string} [opts.publishedDate] - ISO date
 * @param {string} [opts.siteName]
 * @param {string} [opts.authorName]
 * @param {string} [opts.language]
 * @param {boolean} [opts.noindex]
 * @param {string} [opts.contentTitle]
 * @returns {string}
 */
export function renderMeta({
  title,
  description,
  canonicalUrl,
  ogImage,
  ogType = 'website',
  publishedDate,
  siteName,
  authorName,
  language = 'zh-CN',
  noindex = false,
  contentTitle = title,
}) {
  const lines = [];

  lines.push(`  <title>${escapeAttr(title)}</title>`);
  lines.push(`  <meta name="description" content="${escapeAttr(description)}">`);
  if (noindex) {
    lines.push('  <meta name="robots" content="noindex, follow">');
  }

  // Open Graph
  lines.push(`  <meta property="og:title" content="${escapeAttr(title)}">`);
  lines.push(`  <meta property="og:description" content="${escapeAttr(description)}">`);
  lines.push(`  <meta property="og:type" content="${ogType}">`);
  if (siteName) {
    lines.push(`  <meta property="og:site_name" content="${escapeAttr(siteName)}">`);
  }
  lines.push(`  <meta property="og:locale" content="${escapeAttr(language.replace('-', '_'))}">`);
  if (canonicalUrl) {
    lines.push(`  <meta property="og:url" content="${escapeAttr(canonicalUrl)}">`);
  }
  if (ogImage) {
    lines.push(`  <meta property="og:image" content="${escapeAttr(ogImage)}">`);
    lines.push('  <meta property="og:image:width" content="1200">');
    lines.push('  <meta property="og:image:height" content="630">');
  }
  if (ogType === 'article' && publishedDate) {
    lines.push(`  <meta property="article:published_time" content="${escapeAttr(publishedDate)}">`);
  }
  if (ogType === 'article' && authorName) {
    lines.push(`  <meta property="article:author" content="${escapeAttr(authorName)}">`);
  }

  // Twitter Card
  lines.push(`  <meta name="twitter:card" content="summary_large_image">`);
  lines.push(`  <meta name="twitter:title" content="${escapeAttr(title)}">`);
  lines.push(`  <meta name="twitter:description" content="${escapeAttr(description)}">`);
  if (ogImage) {
    lines.push(`  <meta name="twitter:image" content="${escapeAttr(ogImage)}">`);
  }

  // Canonical
  if (canonicalUrl) {
    lines.push(`  <link rel="canonical" href="${escapeAttr(canonicalUrl)}">`);
  }

  // Structured data for articles
  if (ogType === 'article' && publishedDate) {
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: contentTitle,
      description,
      datePublished: publishedDate,
      mainEntityOfPage: canonicalUrl,
      ...(authorName ? { author: { '@type': 'Person', name: authorName } } : {}),
      ...(siteName ? { publisher: { '@type': 'Organization', name: siteName } } : {}),
      ...(ogImage ? { image: ogImage } : {}),
    };
    lines.push(`  <script type="application/ld+json">${JSON.stringify(structuredData).replace(/</g, '\\u003c')}</script>`);
  }

  return lines.join('\n');
}
