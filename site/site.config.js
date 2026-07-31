// site/site.config.js
// 站点配置 — 所有站点级别的差异都在这里
// 换一个 site 时，只改这个文件和 content/、styles/、public/

const baseUrl = (process.env.SITE_URL || 'http://localhost:8088').replace(/\/+$/, '');
const basePath = (process.env.BASE_PATH || '').replace(/\/+$/, '');

export default {
  // 站点基础信息
  title: "Chuckle's Blog",
  description: 'Writing about code, design, and the spaces between.',
  language: 'zh-CN',
  baseUrl,
  socialImage: `${baseUrl}/og/default.jpg`,

  // 本地默认留空，GitHub Actions 构建时注入仓库子路径
  basePath,

  // 作者信息
  author: {
    name: 'Chuckle',
    handle: 'Chuckle',
    url: `${baseUrl}/about/`,
    avatar: `${basePath}/avatar.svg`,
  },

  // 路由前缀
  routes: {
    posts: '/posts',
    books: '/books',
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
