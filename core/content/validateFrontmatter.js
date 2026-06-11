// core/content/validateFrontmatter.js
// 校验文章 frontmatter，构建时报错

/**
 * @typedef {Object} Frontmatter
 * @property {string} title
 * @property {string} slug
 * @property {string} date
 * @property {string} description
 * @property {string[]} [tags]
 * @property {boolean} [draft]
 * @property {boolean} [featured]
 * @property {string} [cover]
 * @property {string} [updated]
 */

const REQUIRED_FIELDS = ['title', 'slug', 'date'];
const MAX_DESCRIPTION_LENGTH = 320;

/**
 * 校验单篇文章 frontmatter
 * @param {Frontmatter} frontmatter
 * @param {string} filename - 用于错误提示
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateFrontmatter(frontmatter, filename) {
  const errors = [];

  for (const field of REQUIRED_FIELDS) {
    if (!frontmatter[field] || String(frontmatter[field]).trim() === '') {
      errors.push(`[${filename}] Missing required field: "${field}"`);
    }
  }

  // date 合法性
  if (frontmatter.date) {
    const d = new Date(frontmatter.date);
    if (isNaN(d.getTime())) {
      errors.push(`[${filename}] Invalid date: "${frontmatter.date}"`);
    }
  }

  // draft 类型
  if (frontmatter.draft !== undefined && typeof frontmatter.draft !== 'boolean') {
    errors.push(`[${filename}] "draft" must be boolean`);
  }

  // description 长度
  if (frontmatter.description && frontmatter.description.length > MAX_DESCRIPTION_LENGTH) {
    errors.push(
      `[${filename}] Description too long (${frontmatter.description.length}/${MAX_DESCRIPTION_LENGTH})`
    );
  }

  return { valid: errors.length === 0, errors };
}

/**
 * 批量校验，收集所有错误
 * @param {Array<{frontmatter: Frontmatter, filename: string}>} items
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateAll(items) {
  const allErrors = [];
  for (const { frontmatter, filename } of items) {
    const { errors } = validateFrontmatter(frontmatter, filename);
    allErrors.push(...errors);
  }
  return { valid: allErrors.length === 0, errors: allErrors };
}
