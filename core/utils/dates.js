// core/utils/dates.js
// 日期格式化和处理

const LOCALE = 'zh-CN';

/**
 * 格式化日期为可读字符串
 * @param {Date|string} date
 * @param {'full'|'short'|'iso'} style
 * @returns {string}
 */
export function formatDate(date, style = 'full') {
  const d = date instanceof Date ? date : new Date(date);

  if (isNaN(d.getTime())) {
    return 'Invalid Date';
  }

  switch (style) {
    case 'iso':
      return d.toISOString().split('T')[0]; // 2026-06-05
    case 'short':
      return d.toLocaleDateString(LOCALE, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }); // 2026/06/05
    case 'full':
    default:
      return d.toLocaleDateString(LOCALE, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }); // 2026年6月5日
  }
}

/**
 * 格式化为 RSS pubDate
 * @param {Date|string} date
 * @returns {string}
 */
export function toUTCString(date) {
  const d = date instanceof Date ? date : new Date(date);
  return d.toUTCString();
}

/**
 * 获取年份
 * @param {Date|string} date
 * @returns {number}
 */
export function getYear(date) {
  const d = date instanceof Date ? date : new Date(date);
  return d.getFullYear();
}

/**
 * 按年份分组文章
 * @param {Array<{date: Date}>} posts
 * @returns {Map<number, Array>}
 */
export function groupByYear(posts) {
  const map = new Map();
  for (const post of posts) {
    const year = getYear(post.date);
    if (!map.has(year)) map.set(year, []);
    map.get(year).push(post);
  }
  return map;
}
