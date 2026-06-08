---
title: "极简高性能博客软件总体 Phase 计划"
slug: "platform-sutra-interpretation"
date: "2026-06-01"
description: "极简高性能博客软件总体 Phase 计划"
tags: [plans, Phase]
draft: false
featured: true
---

# 极简高性能博客软件总体 Phase 计划

生成时间：2026-06-05 15:26 CST

## 0. 项目定位

目标：开发一个本机部署的极简高性能博客软件。

核心约束：

- 开发系统：Windows 原生环境。
- 部署方式：本机 Nginx for Windows 部署。
- 架构：内核 + 站点配置。
- 不使用前端运行时框架：不用 React / Vue / Svelte / Next / Nuxt。
- 不使用现成静态博客生成框架：不用 Astro / Hugo / Hexo / Jekyll。
- 允许构建期工具：Node.js、markdown-it、gray-matter、Shiki、Sharp、esbuild、Lightning CSS。
- 输出：纯静态 HTML / CSS / 少量 JS。

一句话路线：

```txt
产品定义 → 原型设计 → 技术选型 → 内核开发 → 站点配置 → 本机 Nginx for Windows 部署 → DevTools/Playwright 验收
```

---

## Phase 1：产品定义

目标：明确这个软件到底解决什么问题，避免一上来写代码。

产出：

- 产品目标文档。
- 用户画像。
- MVP 功能列表。
- 非目标列表。
- 验收标准。

关键决策：

- 第一版只做个人博客，不做 CMS。
- 第一版只支持 Markdown 写作。
- 第一版不做登录、评论、后台、多用户。
- 第一版重点是审美、性能、可复用架构。

验收：

- 能用一句话描述产品。
- 能列出第一版必须做和坚决不做的功能。

---

## Phase 2：信息架构与原型

目标：设计用户看到的页面结构。

页面：

1. 首页。
2. 文章页。
3. 归档页。
4. 标签页，可选。
5. 关于页。
6. RSS / Sitemap，不是视觉页面但必须生成。

产出：

- 页面流程图。
- 低保真线框图。
- 首页信息层级。
- 文章页阅读结构。
- 移动端布局规则。

验收：

- 不写代码也能说明每个页面有什么。
- 首页和文章页的布局优先级明确。

---

## Phase 3：视觉系统

目标：确定高级极简审美，避免后面边写边乱调。此阶段必须专门学习 `https://steipete.me/` 的 UI 设计和字体系统，但只吸收设计原则，不照抄整站结构，也不引入 Astro/Tailwind 作为本项目依赖。

产出：

- 色彩 token。
- 字体系统。
- 间距系统。
- 动效参数。
- 组件状态规范。
- `docs/design-reference-steipete.md`：记录从 steipete.me 学到的设计规律、字体选择、交互节奏和可复用 token。

设计方向：

```txt
steipete.me 的开发者个人站气质
+ Linear 的精确
+ Vercel 的克制
+ Notion 的出版阅读感
```

从 steipete.me 学习的重点：

- 页面最大宽度克制，主体接近 `48rem`，不做宽屏铺满。
- Header 简单，导航少，顶部用细分割线建立秩序。
- 首页先给个人身份，再给文章，不堆营销组件。
- 字体气质偏 monospace / readable，技术感强但仍适合阅读。
- 明暗主题用 CSS variables 切换，主题切换动画短而轻。
- 链接、图标、头像 hover 有小幅反馈，但不干扰阅读。
- focus 状态清楚，保留 skip-to-content 等可访问性细节。

建议字体策略：

- 英文/代码感界面：优先学习 steipete.me 的 Atkinson + mono 气质。
- 中文正文：不加载大体积中文 webfont，使用系统中文字体。
- 代码：Geist Mono / JetBrains Mono / Consolas。

验收：

- 明亮 / 暗黑主题都可读。
- 正文排版舒服。
- 微交互克制，不抢阅读。
- 有独立设计参考文档，不把审美规则散落在代码里。

---

## Phase 4：技术方案确定

目标：确认技术边界和工程结构。

技术选择：

- Node.js：构建器运行时。
- pnpm：包管理。
- markdown-it：Markdown 渲染。
- gray-matter：frontmatter。
- Shiki：构建期代码高亮。
- Sharp：图片优化。
- esbuild：JS 打包压缩。
- Lightning CSS：CSS 压缩。
- Nginx for Windows：本机静态部署。
- Playwright：自动化验证。
- Chrome DevTools MCP：调试 console/network/performance，可选。

架构选择：

```txt
core/   可复用构建内核
site/   当前站点配置、内容、样式
public/ 公共静态资源
dist/   构建输出
```

验收：

- 不依赖任何前端运行时框架。
- 构建器职责清楚。
- 站点配置可以替换。

---

## Phase 5：Windows 原生开发环境准备

目标：确保所有开发、构建、预览、Nginx for Windows 本机部署都在 Windows 原生环境完成。

推荐方式：

```txt
Windows 负责全部工作：
- 编辑器
- 浏览器
- Node.js / pnpm
- Git
- Nginx for Windows
- 构建与部署
- Playwright / Chrome DevTools 调试
```

需要安装：

- Windows Terminal。
- VS Code / Cursor。
- Node.js 22 Windows 版。
- pnpm。
- Git。
- Nginx for Windows。
- Chrome。
- Playwright。

验收命令：

```powershell
node --version
npm --version
pnpm --version
git --version
nginx -v
```

---

## Phase 6：项目骨架搭建

目标：建立可复用、可维护、后期可扩展的工程结构。第一版不要为了“极简”把所有逻辑塞进一个 build 脚本，否则后期换主题、加站点、加搜索、加多语言都会失控。

目录：

```txt
minimal-blog/
  core/
  site/
  public/
  dist/
  scripts/
  tests/
  nginx/
  docs/
  package.json
```

可维护性边界：

- `core/`：只放可复用构建能力。
- `site/`：只放当前站点配置、内容、样式、脚本。
- `docs/`：放架构、设计系统、部署、性能验收文档。
- `tests/`：放 smoke、accessibility、performance 基础测试。
- `scripts/`：只做命令编排，不堆核心业务逻辑。


产出：

- package.json。
- pnpm-lock.yaml。
- 基础目录。
- 示例文章。
- 站点配置文件。

验收：

- `pnpm install` 成功。
- `pnpm build` 有基础输出。

---

## Phase 7：构建内核开发

目标：实现可复用 core。

模块：

1. 内容加载模块。
2. frontmatter 校验模块。
3. Markdown 渲染模块。
4. 模板渲染模块。
5. 路由生成模块。
6. CSS/JS 构建模块。
7. 图片优化模块。
8. RSS 生成模块。
9. Sitemap 生成模块。
10. 输出写入模块。

验收：

- 从 Markdown 生成首页和文章页。
- core 不写死站点名称、路径、颜色。
- 换 site/config 后能复用。

---

## Phase 8：站点配置与内容系统

目标：把当前博客作为一个 site 接入 core。

site 负责：

- site.config.js。
- content/posts。
- content/pages。
- styles。
- scripts。
- templates 可选覆盖。
- public 静态资源。

验收：

- 修改站点标题只改 config。
- 添加文章只新增 Markdown。
- 不需要改 core。

---

## Phase 9：前端样式和微交互

目标：建立最终视觉质感，并把 steipete.me 的设计优点转换成可维护的 CSS token 和组件规则。

实现：

- tokens.css：颜色、字体、间距、圆角、动效时长。
- base.css：全局排版、选择文字、focus、scroll 行为。
- layout.css：header、main、footer、container。
- prose.css：文章正文排版。
- components.css：post-list、theme-toggle、copy-button、toc。
- main.js：主题切换、阅读进度、代码复制、TOC 高亮。

微交互：

- 主题切换：150-250ms，优先使用 View Transition API，失败时降级为 CSS transition。
- 阅读进度：`requestAnimationFrame` 写入 transform，不直接频繁改 width。
- 代码复制：按钮文案和 aria-label 同步变化。
- 链接 hover：颜色 / underline / text-underline-offset，不做大幅位移。
- TOC 高亮：IntersectionObserver，不用滚动事件硬算。
- 头像/图标 hover：允许 2-4deg rotate 或 1.03-1.05 scale，但只用于装饰性入口。

验收：

- JS gzip < 8KB。
- CSS gzip < 15KB。
- 长文滚动无明显掉帧。

---

## Phase 10：本机 Nginx for Windows 部署

目标：让软件在本机通过 Nginx 稳定访问。

产出：

- nginx/minimal-blog.conf。
- scripts/deploy-local.ps1。
- dist/ 构建产物。

访问地址：

```txt
http://localhost:8088
```

验收：

```powershell
curl.exe -I http://localhost:8088
```

返回：

```txt
HTTP/1.1 200 OK
```

---

## Phase 11：调试与验证

目标：保证不是“看起来能跑”，而是真的稳定。

工具：

- Chrome DevTools。
- Chrome DevTools MCP。
- Playwright。
- Lighthouse。
- curl。

检查项：

- console error。
- network 404/500。
- Lighthouse Performance。
- SEO。
- Accessibility。
- 长文滚动性能。
- 移动端布局。

验收：

- Performance ≥ 95。
- Accessibility ≥ 95。
- SEO ≥ 95。
- console 无 error。
- network 无异常 404/500。

---

## Phase 12：复用能力整理

目标：让这个软件以后能被多个站点复用。

整理：

- core 不依赖当前站点。
- site 可以替换。
- config schema 固定。
- 内容 schema 固定。
- 模板接口固定。
- 输出接口固定。
- 设计 token 固定，主题只通过 token 替换。
- 组件 API 固定，例如 `renderPostCard(post, options)`，不要在模板里散落条件判断。
- 构建步骤可插拔，例如 `load -> transform -> render -> optimize -> emit`。

维护规则：

- 新功能先判断属于 core 还是 site。
- 新样式先判断属于 token、layout、prose 还是 component。
- 不允许在 `main.js` 中堆页面专属逻辑；页面逻辑必须按模块拆分。
- 每次新增能力同时补充 README 或 docs。

复用方式：

```txt
复制 site/
修改 site.config.js
替换 content/
替换 styles/
运行 pnpm build
```

后续高级复用：

```txt
packages/blog-core
sites/personal-blog
sites/docs-site
```

---

## Phase 13：文档与交付

目标：让自己以后能维护，也能让 AI agent 接手。

产出：

- README.md。
- docs/architecture.md。
- docs/development.md。
- docs/deployment-nginx.md。
- docs/content-authoring.md。
- docs/performance-checklist.md。

验收：

- 新环境能按文档跑起来。
- 新文章能按文档发布。
- Nginx 能按文档部署。

---

## 总结

大体路线：

```txt
产品定义
→ 原型设计
→ 视觉系统
→ 技术选型
→ Windows 原生环境
→ core + site 工程骨架
→ 构建内核
→ 站点实现
→ Nginx for Windows 本机部署
→ DevTools/Playwright 验收
→ 复用能力整理
```

本方案的关键判断：

```txt
不用前端运行时框架是可行的。
不用现成博客框架也是可行的。
但必须自己建立清晰的构建内核和站点配置边界。
```
