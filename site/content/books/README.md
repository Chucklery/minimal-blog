# 书籍内容

每本书使用一个独立目录，Markdown 分章维护，构建时合并为一个连续阅读页面。

## 目录结构

```text
books/
└── zheng-jian/
    ├── book.json
    ├── 01-导言.md
    ├── 02-第二章.md
    └── ...
```

`book.json` 中的 `chapters` 决定章节顺序。章节文件使用以下 frontmatter：

```md
---
title: "第一章：章节标题"
description: "可选的章节摘要"
id: "chapter-introduction"
---

正文直接从段落开始。章节标题由页面模板生成，正文内部从 `##`、`###` 开始。
```

## 草稿预览

书籍保持 `"draft": true` 时不会发布到生产站点。使用以下命令生成本地草稿：

```bash
INCLUDE_DRAFTS=true pnpm build
pnpm preview
```

确认完成后将 `draft` 改为 `false`，书籍就会出现在 `/books/`、搜索与 Sitemap 中。
