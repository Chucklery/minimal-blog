// core/utils/escapeHtml.js
// HTML 转义，防止 XSS

const ESCAPE_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/**
 * 转义 HTML 特殊字符
 * @param {string} str
 * @returns {string}
 */
export function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, (char) => ESCAPE_MAP[char] || char);
}

/**
 * 转义用于 HTML 属性的值
 * @param {string} str
 * @returns {string}
 */
export function escapeAttr(str) {
  return escapeHtml(str);
}
