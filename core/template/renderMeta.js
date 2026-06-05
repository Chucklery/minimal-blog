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
 * @returns {string}
 */
export function renderMeta({
  title,
  description,
  canonicalUrl,
  ogImage,
  ogType = 'website',
  publishedDate,
}) {
  const lines = [];

  lines.push(`  <title>${escapeAttr(title)}</title>`);
  lines.push(`  <meta name="description" content="${escapeAttr(description)}">`);

  // Open Graph
  lines.push(`  <meta property="og:title" content="${escapeAttr(title)}">`);
  lines.push(`  <meta property="og:description" content="${escapeAttr(description)}">`);
  lines.push(`  <meta property="og:type" content="${ogType}">`);
  if (canonicalUrl) {
    lines.push(`  <meta property="og:url" content="${escapeAttr(canonicalUrl)}">`);
  }
  if (ogImage) {
    lines.push(`  <meta property="og:image" content="${escapeAttr(ogImage)}">`);
  }

  // Twitter Card
  lines.push(`  <meta name="twitter:card" content="summary_large_image">`);

  // Canonical
  if (canonicalUrl) {
    lines.push(`  <link rel="canonical" href="${escapeAttr(canonicalUrl)}">`);
  }

  // Structured data for articles
  if (ogType === 'article' && publishedDate) {
    lines.push(`  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": "${escapeAttr(title)}",
    "description": "${escapeAttr(description)}",
    "datePublished": "${publishedDate}"
  }
  </script>`);
  }

  return lines.join('\n');
}
