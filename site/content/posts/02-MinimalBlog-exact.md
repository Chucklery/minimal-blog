---
title: "极简高性能博客软件详细落地方案"
slug: "02-MinimalBlog-exact"
date: "2026-06-01"
description: "产品设计到原型、技术选型、开发、Nginx for Windows 本机部署"
tags: [zen, buddhism, philosophy, classics, chan]
draft: false
featured: true
---

# 极简高性能博客软件详细落地方案：产品设计到原型、技术选型、开发、Nginx for Windows 本机部署

生成时间：2026-06-05 15:26 CST

## 0. 项目总览

## Goal

从 0 到 1 开发一个可复用的极简高性能博客软件，开发系统为 Windows 原生环境，本机部署采用 Nginx for Windows，架构采用“内核 + 站点配置”，不使用前端运行时框架，允许构建期工具。

## Architecture

```txt
core/ 负责构建能力：内容解析、Markdown 渲染、模板、路由、RSS、Sitemap、资源优化
site/ 负责站点差异：配置、文章、样式、脚本、静态资源
public/ 负责公共静态文件
dist/ 负责构建输出
nginx/ 负责本机部署配置
```

最终浏览器收到：

```txt
静态 HTML + CSS + 少量 Vanilla JS
```

不会有 React/Vue/Svelte 运行时，不会有 hydration，不会在浏览器端解析 Markdown。

## Tech Stack

- Windows 10。
- Node.js 22。
- pnpm。
- Vanilla HTML/CSS/JS。
- markdown-it。
- gray-matter。
- Shiki。
- Sharp。
- esbuild。
- Lightning CSS。
- html-minifier-terser。
- Nginx for Windows。
- Playwright。
- Chrome DevTools / Chrome DevTools MCP。

---

## 1. 产品设计

### 1.1 产品定位

这是一个面向个人开发者、设计师、独立创作者的极简博客系统。

它不是 CMS，也不是复杂建站平台。

核心价值：

1. 写作简单：Markdown 即内容。
2. 访问极快：构建为静态文件。
3. 审美高级：少颜色、强排版、克制动效。
4. 工程可控：不依赖现成博客框架。
5. 后续可复用：core 与 site 分离。
6. 可扩展性清楚：主题、站点、模板、构建 pipeline 都有明确扩展点。
7. 本机可部署：Nginx 服务 `dist/`。

### 1.2 用户画像

目标用户：

- 前端开发者。
- 想建立个人博客的技术学习者。
- 重视审美和性能的人。
- 想理解底层构建过程的人。
- 不想被框架主题束缚的人。

用户需求：

- 快速写文章。
- 页面非常快。
- 样式独特，不像模板站。
- 后续能改成另一个站。
- 本机能长期运行。

### 1.3 MVP 功能

第一版必须包含：

1. 首页文章列表。
2. 文章详情页。
3. 归档页。
4. 关于页。
5. Markdown + frontmatter。
6. 明暗主题。
7. 阅读进度条。
8. 代码块复制。
9. 构建期代码高亮。
10. 图片优化。
11. RSS。
12. Sitemap。
13. Nginx for Windows 本机部署。
14. Playwright smoke test。
15. Lighthouse 验收。

第一版不做：

1. 登录。
2. 评论。
3. 后台编辑器。
4. 在线发布。
5. 多用户。
6. 数据库。
7. 全文搜索。
8. 复杂动画。
9. 前端 SPA 路由。

### 1.4 产品验收标准

产品层验收：

- 只新增一篇 Markdown，即可生成新文章页。
- 修改 `site/site.config.js` 可以改变站点基础信息。
- 首页和文章页视觉一致。
- 明暗主题可用。
- 本机 Nginx 可访问。

性能层验收：

- Lighthouse Performance ≥ 95。
- Lighthouse SEO ≥ 95。
- Lighthouse Accessibility ≥ 95。
- JS gzip < 8KB。
- CSS gzip < 15KB。
- 无 console error。
- 无异常 404/500。

---

## 2. 原型设计

### 2.1 页面列表

第一版页面：

```txt
/                       首页
/posts/{slug}.html      文章页
/archive/index.html     归档页
/about/index.html       关于页
/rss.xml                RSS
/sitemap.xml            Sitemap
/robots.txt             robots
```

### 2.2 首页原型

首页结构：

```txt
Header
  - Logo / Site Name
  - Writing
  - Archive
  - About
  - Theme Toggle

Hero
  - 一句话介绍
  - 简短副标题

Featured
  - 主推文章

Recent Posts
  - 文章列表
  - 标题
  - 日期
  - 摘要
  - 标签

Footer
  - RSS
  - GitHub / X / Email
```

首页原则：

- 不做复杂网格。
- 不做图片瀑布流。
- 文章列表优先可读性。
- 空间感比信息密度更重要。

### 2.3 文章页原型

文章页结构：

```txt
Progress Bar
Header
  - Back Home
  - Theme Toggle

Article Header
  - Title
  - Date
  - Reading Time
  - Tags
  - Description

Article Body
  - Markdown content
  - Code blocks
  - Images
  - Blockquotes

Optional TOC
  - Desktop sticky
  - Mobile hidden

Article Footer
  - Previous / Next
  - Back to top
```

正文宽度：

```css
width: min(100% - 32px, 720px);
```

正文行高：

```css
line-height: 1.8;
```

### 2.4 归档页原型

结构：

```txt
Archive
  2026
    - 2026-06-05 文章 A
    - 2026-05-20 文章 B
  2025
    - ...
```

优先按年份分组，不做复杂筛选。

### 2.5 关于页原型

结构：

```txt
About
  - 简短介绍
  - 当前关注领域
  - 链接
  - 联系方式
```

---

## 3. 视觉设计

### 3.1 设计方向

关键词：

```txt
calm
precise
editorial
minimal
tactile
fast
```

参考：

- steipete.me：开发者个人站、窄内容宽度、monospace 气质、明暗主题、头像和社交入口的轻微反馈。
- Linear：精确、边界感、暗色质感。
- Vercel：黑白、高对比、技术感。
- Notion：阅读友好、出版物气质。
- xAI：冷静、单色、未来感。

### 3.1.1 steipete.me 设计学习结论

我实际查看了 `https://steipete.me/` 的页面结构和 CSS，值得学习的是这些点：

1. 页面容器克制：主体最大宽度约 `48rem`，让个人站像“工程师笔记”，不是营销官网。
2. Header 很轻：站点名 + 少量导航 + 搜索/主题按钮，下方一条细线建立层级。
3. 首页人格化：头像、简短介绍、社交链接先出现，文章列表随后出现。
4. 字体选择有辨识度：站点加载 Atkinson 字体，同时 body 使用 mono 气质，整体更像技术笔记。
5. 色彩 token 简单：浅色为接近白的背景，深色为蓝灰底，accent 在明暗主题中切换。
6. 动效克制：主题切换、头像 hover scale、社交图标 rotate、链接 hover accent，不做复杂动画。
7. 可访问性细节完整：skip-to-content、focus-visible、aria-label、RSS auto-discovery。

本项目采用这些设计原则，但不采用它的技术栈：steipete.me 当前页面由 Astro 生成并使用 Tailwind 输出，本项目仍坚持自研 Node 构建器 + 原生 HTML/CSS/JS。

### 3.2 色彩系统

`site/styles/tokens.css`：

```css
:root {
  color-scheme: light;

  /* Inspired by steipete.me light theme, adjusted for this project. */
  --bg: #fdfdfd;
  --surface: rgba(255, 255, 255, 0.72);
  --text: #282728;
  --muted: #6f6f6f;
  --line: #ece9e9;
  --accent: #006cac;
  --accent-soft: color-mix(in oklab, var(--accent) 12%, transparent);

  --container: 48rem;
  --radius-sm: 6px;
  --radius-md: 10px;
  --ease-standard: cubic-bezier(.4, 0, .2, 1);
  --duration-fast: 150ms;
  --duration-normal: 250ms;
}

[data-theme="dark"] {
  color-scheme: dark;

  /* Inspired by steipete.me dark theme, with Hermes purple as optional brand override. */
  --bg: #212737;
  --surface: rgba(255, 255, 255, 0.045);
  --text: #eaedf3;
  --muted: rgba(234, 237, 243, 0.68);
  --line: rgba(255, 107, 1, 0.36);
  --accent: #ff6b01;
  --accent-soft: color-mix(in oklab, var(--accent) 18%, transparent);
}
```

如果你希望继续保留 Hermes Agent 暗色主题，可以把暗色 accent 替换为：

```css
[data-theme="dark"] {
  --accent: #7c3aed;
}
```

但第一版建议先学习 steipete.me 的蓝灰底 + 橙色 accent，因为它的个人站辨识度更强。

### 3.3 字体系统

steipete.me 使用 Atkinson 字体文件，并让整体界面带有 mono 气质。本项目建议用“可维护 + 不拖慢中文”的方式吸收它：

```css
@font-face {
  font-family: "Atkinson";
  src: url("/fonts/atkinson-regular.woff2") format("woff2");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: "Atkinson";
  src: url("/fonts/atkinson-bold.woff2") format("woff2");
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}

body {
  font-family:
    "Atkinson", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    "Microsoft YaHei UI", "Microsoft YaHei", sans-serif;
}

.prose {
  font-family:
    "Atkinson", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
    "Segoe UI", "Microsoft YaHei UI", "Microsoft YaHei", sans-serif;
}

code, pre, kbd {
  font-family:
    "Geist Mono", "JetBrains Mono", ui-monospace,
    SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}
```

字体维护规则：

- 英文字体可以本地托管 Atkinson woff2，放在 `site/public/fonts/`。
- 不加载全量中文 webfont，避免首屏和长文性能被字体拖垮。
- 中文靠系统字体、字号、行高和留白建立质感。
- 如果发现 Atkinson 对中文混排不够稳，正文 `.prose` 可切回系统 sans，导航和元信息继续使用 Atkinson/mono。
- 字体选择写入 `docs/design-reference-steipete.md`，不要只存在于 CSS 里。

### 3.4 微交互

保留：

- 链接 hover underline。
- 文章卡片 hover 边框和背景变化。
- 主题切换过渡。
- 阅读进度条。
- 代码复制反馈。
- TOC 当前章节高亮。

禁止：

- 粒子背景。
- 大光标。
- 大面积视差滚动。
- 大量毛玻璃。
- 复杂动画库。

---

## 4. 技术选型

### 4.1 为什么不用前端运行时框架

博客是内容展示，不是复杂交互应用。

React/Vue/Svelte 的优势：

- 状态管理。
- 组件化交互。
- 动态应用。

本项目不需要这些运行时能力。

不用它们的收益：

- 无 hydration。
- 无运行时 bundle。
- 页面加载更快。
- 出错面更小。
- Nginx 静态服务即可。

### 4.2 为什么允许构建期工具

构建期工具不会增加浏览器运行成本。

构建期可以做：

- Markdown 转 HTML。
- 代码高亮。
- 图片压缩。
- CSS/JS 压缩。
- RSS/Sitemap 生成。

运行时只展示结果。

### 4.3 技术清单

| 类型       | 工具                   | 说明                          |
| -------- | -------------------- | --------------------------- |
| 运行时      | Node.js 22           | 构建器运行                       |
| 包管理      | pnpm                 | 快速、稳定                       |
| Markdown | markdown-it          | Markdown 转 HTML             |
| 元数据      | gray-matter          | frontmatter                 |
| 代码高亮     | Shiki                | 构建期高亮                       |
| 图片优化     | Sharp                | WebP/AVIF/尺寸                |
| JS 构建    | esbuild              | 压缩 main.js                  |
| CSS 构建   | Lightning CSS        | 压缩 CSS                      |
| HTML 压缩  | html-minifier-terser | 压缩 HTML                     |
| 本机服务     | Nginx for Windows    | 静态部署                        |
| E2E      | Playwright           | 自动化测试                       |
| 调试       | Chrome DevTools MCP  | console/network/performance |

---

## 5. Windows 原生开发系统方案

### 5.1 环境边界

本项目明确要求：全部在 Windows 原生环境下开发。

```txt
Windows 原生环境负责全部工作：
  - VS Code / Cursor
  - Chrome
  - 文件管理
  - 设计工具
  - Git for Windows
  - Node.js Windows 版
  - pnpm
  - Nginx for Windows
  - PowerShell 7 / Windows Terminal
  - Playwright
  - Chrome DevTools MCP
```

### 5.2 项目目录建议

推荐放在 D 盘工作区：

```txt
D:\workspace\minimal-blog
```

约束：

- 不使用 `/home/...`。
- 不使用 Linux shell 脚本作为部署入口。
- 所有命令默认在 PowerShell 7 中执行。

建议：

- 用 Windows Terminal + PowerShell 7 运行 `pnpm`、`nginx.exe`、`playwright`。
- Nginx 配置里的路径统一使用正斜杠：`D:/workspace/minimal-blog/dist`。

### 5.3 环境安装命令

PowerShell 7 中：

```powershell
node --version
npm --version
corepack enable
corepack prepare pnpm@latest --activate
pnpm --version
git --version
nginx -v
```

推荐安装方式：

```powershell
winget install OpenJS.NodeJS.LTS
winget install Git.Git
winget install Microsoft.PowerShell
winget install Google.Chrome
```

Nginx for Windows 建议从官网 zip 包安装到：

```txt
C:\tools\nginx
```

Playwright：

```powershell
pnpm add -D playwright
pnpm exec playwright install chromium
```

---

## 6. 工程结构

最终结构：

```txt
minimal-blog/
  core/
    content/
      loadPosts.js
      loadPages.js
      validateFrontmatter.js
      readingTime.js
    markdown/
      createMarkdownRenderer.js
      renderMarkdown.js
      extractToc.js
    template/
      renderLayout.js
      renderHome.js
      renderPost.js
      renderArchive.js
      renderAbout.js
      renderMeta.js
    assets/
      buildCss.js
      buildJs.js
      buildImages.js
      copyPublic.js
    output/
      writePage.js
      writeRss.js
      writeSitemap.js
      cleanDist.js
    utils/
      paths.js
      dates.js
      escapeHtml.js
      slug.js
  site/
    site.config.js
    content/
      posts/
        2026-hello-world.md
      pages/
        about.md
    styles/
      reset.css
      tokens.css
      base.css
      layout.css
      prose.css
      components.css
      utilities.css
    scripts/
      main.js
      modules/
        theme.js
        readingProgress.js
        copyCode.js
        tocSpy.js
    public/
      favicon.svg
      robots.txt
      fonts/
        atkinson-regular.woff2
        atkinson-bold.woff2
  docs/
    architecture.md
    design-reference-steipete.md
    maintainability.md
    performance-checklist.md
  nginx/
    minimal-blog.conf
  scripts/
    build.js
    dev.js
    deploy-local.ps1
    check-dist.js
  tests/
    smoke.spec.js
    performance.spec.js
  dist/
  package.json
  README.md
```

关键原则：

```txt
core 不知道具体站点审美
site 不负责底层构建逻辑
scripts 只编排，不堆业务逻辑
docs 记录设计、架构、维护规则，方便后期自己或 AI agent 接手
```

可维护性要求：

1. `core/` 中不允许出现具体颜色、站点名称、Windows 绝对路径。
2. `site/styles/tokens.css` 是视觉系统入口，主题变化优先改 token。
3. `site/scripts/main.js` 只负责初始化，具体交互拆到 `site/scripts/modules/`。
4. 模板函数必须保持输入输出清楚，例如：

```js
renderLayout({ site, page, content })
renderPost({ site, post, html, toc })
renderPostList({ posts, variant })
```

5. 后期新增功能按插件式 pipeline 接入，不直接改穿核心流程。

```txt
load content
→ validate schema
→ transform markdown
→ render templates
→ optimize assets
→ emit dist
→ verify dist
```

---

## 7. 站点配置设计

`site/site.config.js`：

```js
export default {
  title: 'Minimal Blog',
  description: 'A fast, minimal, local-first writing site.',
  language: 'zh-CN',
  baseUrl: 'http://localhost:8088',
  author: {
    name: 'Your Name',
    url: 'http://localhost:8088/about/'
  },
  routes: {
    posts: '/posts',
    archive: '/archive',
    about: '/about'
  },
  build: {
    postsPerHomePage: 12,
    generateTags: false,
    minifyHtml: true
  },
  design: {
    reference: 'steipete.me',
    container: '48rem',
    fontProfile: 'atkinson-mono-readable',
    motion: 'subtle'
  }
};
```

后续复用时，只替换：

```txt
site/site.config.js
site/content/
site/styles/
site/public/
```

---

## 8. 内容 schema

文章 frontmatter：

```md
---
title: "第一篇文章"
slug: "hello-world"
date: "2026-06-05"
description: "文章摘要。"
tags: [design, coding]
draft: false
featured: true
cover: "/images/cover.jpg"
---
```

必填字段：

```txt
title
slug
date
description
```

可选字段：

```txt
tags
draft
featured
cover
updated
```

构建时必须校验：

- title 非空。
- slug 唯一。
- date 合法。
- draft 为 boolean。
- description 不超过合理长度。

---

## 9. 构建流程

`scripts/build.js` 负责编排：

```txt
1. 读取 site config
2. 创建路径上下文
3. 清空 dist
4. 加载文章和页面
5. 校验 frontmatter
6. Markdown 渲染
7. 提取 TOC
8. 生成首页
9. 生成文章页
10. 生成归档页
11. 生成关于页
12. 构建 CSS
13. 构建 JS
14. 优化图片
15. 复制 public
16. 生成 RSS
17. 生成 Sitemap
18. 压缩 HTML
19. 输出构建报告
```

构建报告建议包含：

```txt
Posts: 12
Pages: 1
CSS: 9.2KB gzip
JS: 4.1KB gzip
Images optimized: 8
Output: dist/
Build time: 830ms
```

---

## 10. Nginx for Windows 本机部署方案

### 10.1 Nginx 配置

`nginx/minimal-blog.conf`：

```nginx
server {
  listen 8088;
  server_name localhost;

  root D:/workspace/minimal-blog/dist;
  index index.html;

  charset utf-8;

  gzip on;
  gzip_comp_level 6;
  gzip_min_length 1024;
  gzip_types
    text/plain
    text/css
    application/javascript
    application/json
    application/xml
    image/svg+xml;

  location / {
    try_files $uri $uri/ =404;
  }

  location ~* \.(css|js|png|jpg|jpeg|gif|webp|avif|svg|woff2)$ {
    expires 30d;
    add_header Cache-Control "public, max-age=2592000, immutable";
  }

  location ~* \.(html|xml|txt)$ {
    add_header Cache-Control "no-cache";
  }
}
```

### 10.2 启用 Nginx 配置

```powershell
Copy-Item .\nginx\minimal-blog.conf C:\tools\nginx\conf\conf.d\minimal-blog.conf
cd C:\tools\nginx
.\nginx.exe -t
.\nginx.exe -s reload
```

如果 Nginx 尚未启动：

```powershell
cd C:\tools\nginx
start .\nginx.exe
```

访问：

```txt
http://localhost:8088
```

### 10.3 部署脚本

`scripts/deploy-local.ps1`：

```powershell
pnpm build
Set-Location C:\tools\nginx
.\nginx.exe -t
.\nginx.exe -s reload
curl.exe -I http://localhost:8088
```

---

## 11. 开发流程

### 11.1 初始化

```powershell
New-Item -ItemType Directory -Force D:\workspace\minimal-blog | Out-Null
Set-Location D:\workspace\minimal-blog
pnpm init
pnpm add -D fast-glob gray-matter markdown-it shiki sharp esbuild lightningcss html-minifier-terser chokidar serve playwright
New-Item -ItemType Directory -Force core\content,core\markdown,core\template,core\assets,core\output,core\utils | Out-Null
New-Item -ItemType Directory -Force site\content\posts,site\content\pages,site\styles,site\scripts,site\public | Out-Null
New-Item -ItemType Directory -Force nginx,scripts,tests,dist | Out-Null
```

### 11.2 package.json

```json
{
  "type": "module",
  "scripts": {
    "build": "node scripts/build.js",
    "dev": "node scripts/dev.js",
    "preview": "serve dist -l 8088",
    "deploy:local": "powershell -ExecutionPolicy Bypass -File scripts/deploy-local.ps1",
    "test:e2e": "playwright test",
    "check": "node scripts/check-dist.js"
  }
}
```

### 11.3 开发循环

```txt
写 Markdown / 改 CSS / 改模板
  ↓
pnpm build
  ↓
pnpm preview 或 Nginx 访问
  ↓
Chrome DevTools 检查
  ↓
Playwright smoke test
  ↓
修复问题
  ↓
commit
```

---

## 12. 测试方案

### 12.1 Playwright smoke test

`tests/smoke.spec.js`：

```js
import { test, expect } from '@playwright/test';

const baseUrl = 'http://localhost:8088';

test('home page renders', async ({ page }) => {
  await page.goto(baseUrl);
  await expect(page.locator('body')).toBeVisible();
  await expect(page).toHaveTitle(/Minimal Blog/i);
});

test('no console errors on home', async ({ page }) => {
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  await page.goto(baseUrl);
  expect(errors).toEqual([]);
});

test('rss and sitemap exist', async ({ request }) => {
  expect((await request.get(`${baseUrl}/rss.xml`)).ok()).toBeTruthy();
  expect((await request.get(`${baseUrl}/sitemap.xml`)).ok()).toBeTruthy();
});
```

### 12.2 构建检查

`scripts/check-dist.js` 检查：

- `dist/index.html` 存在。
- `dist/rss.xml` 存在。
- `dist/sitemap.xml` 存在。
- `dist/assets/main.css` 存在。
- `dist/assets/main.js` 存在。
- JS/CSS 大小未超预算。

预算：

```txt
main.js gzip < 8KB
main.css gzip < 15KB
```

---

## 13. Chrome DevTools 调试流程

配置 Chrome DevTools MCP 后，调试流程：

```txt
1. pnpm build
2. pnpm deploy:local 或启动 Nginx
3. 打开 http://localhost:8088
4. 查看 console messages
5. 查看 network requests
6. 截图
7. Lighthouse audit
8. Performance trace
9. 修改代码
10. 重新 build
11. 再验证
```

如果 MCP 当前不可用，用 Playwright 替代：

```powershell
pnpm exec playwright test
```

或写临时脚本：

```js
import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();
page.on('console', msg => console.log(msg.type(), msg.text()));
page.on('pageerror', err => console.error(err));
await page.goto('http://localhost:8088');
await page.screenshot({ path: 'debug-home.png', fullPage: true });
await browser.close();
```

---

## 14. 详细落地任务

### Task 1：产品说明文档

目标：写清楚软件目标和边界。

文件：

```txt
README.md
docs/product.md
```

内容：

- 产品目标。
- 第一版功能。
- 非目标。
- 架构原则。

验收：产品边界清楚。

---

### Task 2：初始化工程

目标：创建 core + site 结构。

命令：

```powershell
New-Item -ItemType Directory -Force D:\workspace\minimal-blog | Out-Null
Set-Location D:\workspace\minimal-blog
pnpm init
New-Item -ItemType Directory -Force core\content,core\markdown,core\template,core\assets,core\output,core\utils | Out-Null
New-Item -ItemType Directory -Force site\content\posts,site\content\pages,site\styles,site\scripts,site\public | Out-Null
New-Item -ItemType Directory -Force nginx,scripts,tests,dist,docs | Out-Null
```

验收：目录完整。

---

### Task 3：安装依赖

命令：

```powershell
pnpm add -D fast-glob gray-matter markdown-it shiki sharp esbuild lightningcss html-minifier-terser chokidar serve playwright
```

验收：`pnpm-lock.yaml` 生成。

---

### Task 4：站点配置

文件：

```txt
site/site.config.js
```

验收：构建器可以 import 配置。

---

### Task 5：文章加载模块

文件：

```txt
core/content/loadPosts.js
core/content/validateFrontmatter.js
```

功能：

- 读取 Markdown。
- 解析 frontmatter。
- 校验字段。
- 排序。

验收：能打印文章对象数组。

---

### Task 6：Markdown 渲染模块

文件：

```txt
core/markdown/createMarkdownRenderer.js
core/markdown/renderMarkdown.js
core/markdown/extractToc.js
```

功能：

- Markdown 转 HTML。
- Shiki 代码高亮。
- 提取 heading TOC。

验收：文章正文 HTML 正确。

---

### Task 7：模板模块

文件：

```txt
core/template/renderLayout.js
core/template/renderHome.js
core/template/renderPost.js
core/template/renderArchive.js
core/template/renderAbout.js
core/template/renderMeta.js
```

功能：

- 统一 layout。
- 输出 SEO meta。
- 渲染首页/文章页/归档页。

验收：生成可打开 HTML。

---

### Task 8：资源构建模块

文件：

```txt
core/assets/buildCss.js
core/assets/buildJs.js
core/assets/buildImages.js
core/assets/copyPublic.js
```

功能：

- 合并 CSS。
- 压缩 CSS。
- 压缩 JS。
- 图片 WebP/AVIF。
- 复制 public。

验收：dist/assets 生成。

---

### Task 9：RSS 和 Sitemap

文件：

```txt
core/output/writeRss.js
core/output/writeSitemap.js
```

验收：

```txt
dist/rss.xml
dist/sitemap.xml
```

存在且可访问。

---

### Task 10：Nginx for Windows 部署

文件：

```txt
nginx/minimal-blog.conf
scripts/deploy-local.ps1
```

验收：

```powershell
pnpm deploy:local
curl.exe -I http://localhost:8088
```

返回 200。

---

### Task 11：测试和性能验收

文件：

```txt
tests/smoke.spec.js
tests/performance.spec.js
scripts/check-dist.js
```

验收：

```powershell
pnpm check
pnpm test:e2e
```

全部通过。

---

## 15. 交付标准

最终交付时，项目必须满足：

- [ ] Windows 原生环境可开发。
- [ ] `pnpm build` 成功。
- [ ] `dist/` 静态产物完整。
- [ ] Nginx for Windows 本机部署成功。
- [ ] 首页可访问。
- [ ] 文章页可访问。
- [ ] 归档页可访问。
- [ ] RSS 可访问。
- [ ] Sitemap 可访问。
- [ ] JS gzip < 8KB。
- [ ] CSS gzip < 15KB。
- [ ] console 无 error。
- [ ] network 无异常 404/500。
- [ ] Lighthouse Performance ≥ 95。
- [ ] core 和 site 分离清楚。
- [ ] 换 site 配置不需要改 core。

---

## 16. 后续复用路线

### 阶段 1：单项目复用

复制整个项目，替换：

```txt
site/site.config.js
site/content/
site/styles/
site/public/
```

### 阶段 2：多站点复用

结构升级：

```txt
minimal-blog-platform/
  core/
  sites/
    personal-blog/
    docs-site/
    portfolio/
```

构建命令：

```powershell
pnpm build --site personal-blog
pnpm build --site docs-site
```

### 阶段 3：内部 npm 包

当 core 在 2-3 个站点复用后，再考虑：

```txt
packages/blog-core
```

不要第一版就 npm 包化，容易过早抽象。

---

## 17. 最终判断

这个方案不使用前端运行时框架是可行的。

关键不是“完全不用工具”，而是：

```txt
构建期可以复杂
运行时必须简单
```

正确边界：

```txt
允许 Node 构建工具
允许 Markdown/图片/CSS/JS 构建期处理
不允许浏览器端框架运行时
不允许浏览器端 Markdown 解析
不允许为了炫技增加动画库
```

最终形态：

```txt
core + site
→ build
→ dist
→ Nginx localhost:8088
```

这是本机部署、性能、审美、可复用性之间最稳的折中。
