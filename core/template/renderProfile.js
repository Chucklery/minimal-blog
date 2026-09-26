// core/template/renderProfile.js
// 沉浸式个人简介页模板

import { escapeAttr } from '../utils/escapeHtml.js';

export function renderProfile({ htmlBody, page, site }) {
  const bp = site.basePath || '';
  const title = escapeAttr(page.title || '关于我');
  const description = escapeAttr(
    page.description || '关于 Chuckle：技术、产品、设计与持续写作。'
  );
  const portrait = `${bp}/images/about-portrait.jpg`;

  return `
<main class="profile-page" id="main-content">
  <header class="profile-hero" data-profile-hero>
    <img class="profile-portrait" src="${portrait}" alt="" aria-hidden="true">
    <canvas class="profile-particles" data-profile-particles data-source="${portrait}" aria-hidden="true"></canvas>

    <nav class="profile-nav" aria-label="个人页导航">
      <a class="profile-brand" href="${bp}/">Chuckle</a>
      <a class="profile-back" href="${bp}/about/">返回 About <span aria-hidden="true">↗</span></a>
    </nav>

    <div class="profile-hero-copy">
      <p class="profile-kicker">About me · 关于我</p>
      <h1>${title}</h1>
      <p>${description}</p>
      <a class="profile-scroll" href="#profile-story">继续了解我 <span aria-hidden="true">↓</span></a>
    </div>

    <p class="profile-hint" aria-hidden="true">移动光标，触碰粒子</p>
  </header>

  <section class="profile-story" id="profile-story">
    <div class="profile-story-heading">
      <p>01 · Profile</p>
      <h2>在复杂世界里，<br>寻找清晰的表达。</h2>
    </div>
    <article class="profile-prose prose">
      ${htmlBody}
    </article>
  </section>
</main>`;
}
