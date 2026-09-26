# Minimal Blog

一个轻量、简洁的静态博客引擎。使用 Markdown 写作，通过自定义 Node.js 构建流程生成纯 HTML、CSS 和 JavaScript。

[English](README.md)

## 特性

- 无客户端框架，页面在构建时生成。
- 支持 Markdown 和代码语法高亮。
- 将可复用的 `core/` 与站点专属的 `site/` 分离。
- 生成静态页面及相关订阅源和元数据。
- 本地开发会构建并启动 `http://localhost:8088` 预览，源码变化后自动重新构建。

## 环境要求

- Node.js 22 或更高版本
- pnpm

## 快速开始

```sh
pnpm install
pnpm dev
```

打开 <http://localhost:8088>。`pnpm dev` 会先构建网站并启动预览服务；内容、样式、脚本、模板或图片变化时会自动重新构建。

```sh
pnpm build       # 构建到 dist/
pnpm preview     # 在 8088 端口预览已有的 dist/ 构建结果
pnpm check       # 检查构建产物
pnpm test:e2e    # 运行 Playwright 冒烟测试
```

## 编写文章

在 `site/content/posts/` 下创建 Markdown 文件：

```md
---
title: "文章标题"
slug: "article-slug"
date: "2026-06-05"
description: "用一句话概括文章。"
tags: [design, coding]
draft: false
featured: false
---

在这里编写正文。
```

运行 `pnpm dev` 预览，或运行 `pnpm build` 将网站生成到 `dist/`。

## 项目结构

```text
core/       可复用的内容处理、渲染、模板、资源和输出代码
site/       站点配置、内容、样式、脚本和静态文件
scripts/    构建、开发、部署和校验命令
tests/      Playwright 测试
nginx/      Nginx 配置示例
dist/       生成的网站（不纳入版本控制）
```

站点配置位于 `site/site.config.js`。开发细节见[开发指南](docs/development.md)，Markdown 格式见[内容编写指南](docs/content-authoring.md)。

## 本地部署

```sh
pnpm deploy:local
```

部署脚本面向本机 Windows Nginx 环境。使用其他托管服务时，可运行 `pnpm build`，再用静态 Web 服务器发布生成的 `dist/` 目录。

## 项目状态

本项目开放协作。欢迎提交缺陷报告、安全报告和代码贡献，详情见[贡献指南](CONTRIBUTING.md)及[安全政策](SECURITY.md)。

## 许可证

本项目采用 [Apache License 2.0](LICENSE) 开源。
