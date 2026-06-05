# Development Guide

## 环境要求

- Windows 10+
- Node.js 22 (LTS)
- pnpm
- Git

## 常用命令

```bash
pnpm install       # 安装依赖
pnpm dev           # 开发模式（自动 watch + rebuild）
pnpm build         # 生产构建
pnpm preview       # 本地预览 http://localhost:8088
pnpm check         # 构建产物校验
pnpm test:e2e      # Playwright E2E 测试
pnpm deploy:local  # 部署到本地 Nginx
```

## 添加新文章

```bash
# 在 site/content/posts/ 创建 .md 文件
# 格式见 README.md

pnpm build   # 重新构建
```

## 修改样式

编辑 `site/styles/` 下的 CSS 文件：
- `tokens.css` — 颜色、字体、间距变量
- `base.css` — 全局基础样式
- `layout.css` — 页面布局
- `prose.css` — 文章排版
- `components.css` — 组件样式

## 修改站点信息

编辑 `site/site.config.js`，修改 title、description、author 等。

## 调试

```bash
# 用 Chrome DevTools
pnpm preview
# 打开 http://localhost:8088 → F12

# 用 Playwright
pnpm test:e2e
```
