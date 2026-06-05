// site/site.config.js
// 站点配置 — 所有站点级别的差异都在这里
// 换一个 site 时，只改这个文件和 content/、styles/、public/

export default {
  // 站点基础信息
  title: "Chuckle's Blog",
  description: 'Writing about code, design, and the spaces between.',
  language: 'zh-CN',
  baseUrl: 'http://localhost:8088',

  // GitHub Pages 部署路径
  basePath: '/minimal-blog',

  // 作者信息
  author: {
    name: 'Chuckle',
    handle: 'Chuckle',
    url: 'http://localhost:8088/about/',
    avatar: '/avatar.svg',
  },

  // 路由前缀
  routes: {
    posts: '/posts',
    archive: '/archive',
    about: '/about',
    search: '/search',
  },

  // 构建选项
  build: {
    postsPerHomePage: 12,
    generateSearch: true,
    minifyHtml: true,
  },
};
