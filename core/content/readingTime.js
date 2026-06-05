// core/content/readingTime.js
// 估算文章阅读时间

const CHINESE_CHARS_PER_MINUTE = 300;
const ENGLISH_WORDS_PER_MINUTE = 200;

/**
 * 统计中文汉字数量
 * @param {string} text
 * @returns {number}
 */
function countChinese(text) {
  const matches = text.match(/[一-鿿㐀-䶿]/g);
  return matches ? matches.length : 0;
}

/**
 * 统计英文单词数量
 * @param {string} text
 * @returns {number}
 */
function countEnglish(text) {
  const cleaned = text.replace(/[一-鿿㐀-䶿]/g, '');
  const matches = cleaned.match(/\b\w+\b/g);
  return matches ? matches.length : 0;
}

/**
 * 估算阅读时间（分钟）
 * @param {string} text - Markdown 原文或 HTML
 * @returns {number} 分钟数
 */
export function estimateReadingTime(text) {
  // 去掉 HTML 标签
  const plain = text.replace(/<[^>]+>/g, '');

  const chineseChars = countChinese(plain);
  const englishWords = countEnglish(plain);

  const chineseMinutes = chineseChars / CHINESE_CHARS_PER_MINUTE;
  const englishMinutes = englishWords / ENGLISH_WORDS_PER_MINUTE;

  const total = Math.ceil(chineseMinutes + englishMinutes);
  return Math.max(1, total);
}
