// core/markdown/createMarkdownRenderer.js
// 创建 Markdown 渲染器（markdown-it + Shiki 代码高亮）

import MarkdownIt from 'markdown-it';
import { createHighlighter } from 'shiki';

let highlighter = null;

/**
 * 获取或创建 Shiki highlighter 单例
 */
async function getHighlighter() {
  if (highlighter) return highlighter;

  highlighter = await createHighlighter({
    themes: ['github-light', 'github-dark'],
    langs: [
      'js', 'ts', 'javascript', 'typescript',
      'css', 'html', 'xml',
      'bash', 'shell', 'sh',
      'json', 'yaml', 'toml',
      'python', 'py',
      'rust', 'rs',
      'go',
      'java', 'kotlin',
      'c', 'cpp',
      'sql',
      'markdown', 'md',
      'text',
    ],
  });

  return highlighter;
}

/**
 * 创建 MarkdownIt 实例，注入 Shiki highlight
 */
export async function createMarkdownRenderer() {
  const h = await getHighlighter();

  const md = new MarkdownIt({
    html: false,        // 不允许原始 HTML，安全
    breaks: true,       // 换行转 <br>
    typographer: true,  // 智能引号、破折号
    linkify: true,      // 自动链接
  });

  // 代码块高亮 — 构建期完成
  const defaultFence = md.renderer.rules.fence;
  md.renderer.rules.fence = function (tokens, idx, options, env, self) {
    const token = tokens[idx];
    const lang = token.info ? token.info.trim().split(/\s+/)[0] : 'text';

    // 先调用原始 fence，获取不含高亮的 <code>
    const code = defaultFence
      ? defaultFence(tokens, idx, options, env, self)
      : `<pre><code>${md.utils.escapeHtml(token.content)}</code></pre>`;

    try {
      const highlighted = h.codeToHtml(token.content, {
        lang,
        themes: { light: 'github-light', dark: 'github-dark' },
      });
      return highlighted;
    } catch {
      // 不支持的语言直接返回原始代码
      return code;
    }
  };

  return md;
}
