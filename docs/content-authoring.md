# Content Authoring

## Markdown 格式

每篇文章是一个 `.md` 文件，放在 `site/content/posts/`。

### Frontmatter

```yaml
---
title: "文章标题"          # 必填
slug: "url-friendly-name"  # 必填，唯一
date: "2026-06-05"         # 必填，YYYY-MM-DD
description: "摘要"         # 必填，一句话描述
tags: [tag1, tag2]         # 可选
draft: false               # 可选，默认 false
featured: false            # 可选，是否在首页主推
cover: "/images/cover.jpg" # 可选，封面图
updated: "2026-06-10"      # 可选，更新日期
---
```

### 正文

标准 Markdown 语法，支持：
- 标题（h2, h3）
- 段落
- **加粗** / *斜体*
- [链接](url)
- 图片
- > 引用块
- 有序/无序列表
- `行内代码`
- 代码块（自动 Shiki 高亮）

### 独立页面

在 `site/content/pages/` 创建 `.md` 文件：

```yaml
---
title: "About"
slug: "about"
---
```

## 发布流程

1. 在 `site/content/posts/` 创建 `.md` 文件
2. 设置 `draft: false`
3. 运行 `pnpm build`
4. 验证：`pnpm preview`
5. 部署：`pnpm deploy:local`
