# Performance Checklist

## 构建时检查

- [ ] `pnpm build` 无错误
- [ ] `pnpm check` 全部通过

## 运行时检查

- [ ] 首页 `< 200ms` 加载（本地）
- [ ] 长文章滚动 60fps
- [ ] JS gzip < 8KB（`pnpm check` 自动检查）
- [ ] CSS gzip < 15KB
- [ ] 无 console error
- [ ] 无 404/500 请求
- [ ] Lighthouse Performance ≥ 95
- [ ] Lighthouse Accessibility ≥ 95
- [ ] Lighthouse SEO ≥ 95
- [ ] CLS = 0
- [ ] 暗色/亮色主题切换正常
- [ ] Reduced motion 下动画关闭

## 验收命令

```bash
pnpm check                    # 构建产物校验
pnpm test:e2e                 # Playwright E2E
npx lighthouse http://localhost:8088 --view  # Lighthouse
```

## 常见问题

### 图片太大？
- 放在 `images/` 目录，构建时 `sharp` 自动优化
- 使用 WebP/AVIF 格式
- 设置 `loading="lazy"`

### 字体影响 LCP？
- 不加载中文 webfont
- 英文使用系统字体栈
- 避免 Google Fonts CDN

### JS 体积超标？
- 检查是否引入了第三方库
- main.js 应只包含 6 个微交互函数
- 使用 `pnpm check` 检查
