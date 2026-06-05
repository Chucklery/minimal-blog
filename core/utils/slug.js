// core/utils/slug.js
// slug 生成和校验

/**
 * 从字符串生成 URL 友好的 slug
 * @param {string} text
 * @returns {string}
 */
export function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')       // 空格转连字符
    .replace(/[^\w-]+/g, '')    // 移除非单词字符
    .replace(/--+/g, '-')       // 合并多个连字符
    .replace(/^-+/, '')         // 去掉开头连字符
    .replace(/-+$/, '');        // 去掉结尾连字符
}

/**
 * 确保 slug 在文章集合中唯一
 * @param {string} slug
 * @param {Set<string>} existing
 * @returns {string}
 */
export function uniqueSlug(slug, existing) {
  let candidate = slug;
  let counter = 1;
  while (existing.has(candidate)) {
    candidate = `${slug}-${counter}`;
    counter++;
  }
  return candidate;
}
