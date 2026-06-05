# Architecture

## 整体架构

```
site/content/*.md  (Markdown 写作)
       │
       ▼
core/content/      (前端校验 + 加载)
       │
       ▼
core/markdown/     (MD → HTML + Shiki + TOC)
       │
       ▼
core/template/     (HTML 模板组合)
       │
       ▼
core/assets/       (CSS/JS/图片处理)
       │
       ▼
core/output/       (写入 dist + RSS + Sitemap)
       │
       ▼
dist/              (纯静态产物)
       │
       ▼
Nginx              (静态服务)
```

## 核心原则

1. **构建期做重活，运行时做轻活**
2. **core 不知道站点审美，site 不负责构建逻辑**
3. **scripts 只编排，不堆业务逻辑**
4. **零浏览器端框架运行时**

## core/site 分离

- `core/`：可被多个站点复用的构建逻辑
- `site/`：单个站点的所有差异配置（config、content、styles、public）

换一个站点只需：
1. 复制 `site/`
2. 修改 `site.config.js`
3. 替换 `content/` 和 `styles/`
4. `pnpm build`
