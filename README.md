# Minimal Blog

极简高性能博客软件。Markdown 写作 → 自定义构建器 → 纯静态 HTML/CSS/JS → Nginx 本机部署。

## 特性

- **零运行时框架**：无 React/Vue/Svelte/Next/Nuxt
- **构建期渲染**：Markdown → HTML + Shiki 代码高亮
- **极简审美**：Linear 精度 × Vercel 克制 × Notion 出版感
- **本机部署**：Nginx for Windows，localhost:8088
- **core/site 分离**：换站点换配置即可，不改核心
- **< 6KB JS gzip**：主题切换、阅读进度、代码复制、TOC 高亮

## 快速开始

```bash
# 安装依赖
pnpm install

# 开发（watch + rebuild）
pnpm dev

# 构建
pnpm build

# 预览
pnpm preview
# → http://localhost:8088
```

## 目录结构

```
minimal-blog/
  core/          # 可复用构建内核（不依赖站点）
    content/     # 文章加载、校验、阅读时间
    markdown/    # MD→HTML 渲染、Shiki 高亮、TOC 提取
    template/    # HTML 模板（Layout、Home、Post、Archive、About）
    assets/      # CSS/JS 构建、图片优化、public 复制
    output/      # 写入页面、RSS、Sitemap
    utils/       # 路径、日期、HTML 转义、slug
  site/          # 当前站点（配置、内容、样式、脚本、静态资源）
    site.config.js
    content/
    styles/
    scripts/
    public/
  scripts/       # 构建编排、开发模式、部署、校验
  tests/         # Playwright E2E
  nginx/         # Nginx 部署配置
  dist/          # 构建输出
```

## 写作

在 `site/content/posts/` 创建 Markdown 文件：

```md
---
title: "文章标题"
slug: "article-slug"
date: "2026-06-05"
description: "文章摘要。"
tags: [design, coding]
draft: false
featured: false
---

正文内容。
```

然后 `pnpm build`，页面自动生成到 `/posts/article-slug.html`。

## 部署

```bash
pnpm deploy:local
```

或手动：

```bash
pnpm build
# 复制 nginx/minimal-blog.conf → local\nginx\conf\conf.d\
# 启动 local\nginx\nginx.exe
```

## 验收

```bash
pnpm check           # 构建产物校验
pnpm test:e2e        # Playwright 冒烟测试
```

## 性能目标

- Lighthouse Performance ≥ 95
- JS gzip < 8KB
- CSS gzip < 15KB
- CLS → 0
- LCP < 1.5s

## 技术栈

| 类型 | 工具 |
|------|------|
| 运行时 | Node.js 22 |
| 包管理 | pnpm |
| Markdown | markdown-it + gray-matter |
| 代码高亮 | Shiki |
| 图片 | sharp |
| JS 构建 | esbuild |
| CSS | Lightning CSS |
| 测试 | Playwright |
| 部署 | Nginx for Windows |
