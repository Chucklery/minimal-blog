// scripts/generate-test-posts.js
// 生成 100 篇测试文章，用于性能压测

import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const POSTS_DIR = join(import.meta.dirname, '..', 'site', 'content', 'posts');

const TITLES = [
  '关于系统设计的思考', '函数式编程入门', '理解 CSS Grid', 'TypeScript 高级技巧',
  'Rust 的所有权模型', '设计模式在实践中的应用', '响应式布局原理', '数据库索引优化',
  'Git 工作流最佳实践', 'API 设计规范', 'Web 性能优化指南', '代码审查清单',
  '测试驱动开发实战', '微服务架构反思', '前端状态管理演进', '正则表达式深入',
  'Linux 命令行技巧', 'Docker 容器化实践', 'GraphQL vs REST', 'WebAssembly 入门',
  'Python 异步编程', '算法复杂度分析', '网络协议基础', '安全编码规范',
  '持续集成与部署', '日志系统设计', '错误处理策略', '缓存架构',
  '消息队列选型', '负载均衡实践', '数据可视化', '自然语言处理入门',
  '编译器原理浅析', '操作系统调度', '分布式事务', '区块链基础',
  '机器学习实践', '计算机图形学', '音频处理基础', '视频编码原理',
  '嵌入式系统', '移动端适配', '无障碍设计', '国际化方案',
  '技术写作指南', '开源项目维护', '代码重构技巧', '性能剖析工具',
  '内存管理', '并发编程模型', '网络爬虫设计', '搜索引擎原理',
];

const SUBJECTS = [
  '深入浅出地讲解核心概念', '从实践出发的完整指南', '理论与代码结合的教程',
  '多年经验的总结与反思', '写给初学者的入门笔记', '高级用法的详细说明',
  '常见误区的澄清与纠正', '不同技术方案的对比分析', '生产环境中的实战经验',
];

function randomPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateContent(title, i) {
  const subject = randomPick(SUBJECTS);
  const paragraphs = [
    `这是关于「${title}」的第 ${i + 1} 篇测试文章。${subject}。`,
    '',
    '## 背景',
    '',
    `在软件开发的过程中，${title} 是一个经常被讨论的话题。很多开发者在日常工作中都会遇到与之相关的问题。理解其背后的原理，能够帮助我们做出更好的技术决策。`,
    '',
    '## 核心概念',
    '',
    `要理解 ${title}，首先需要了解它的基本构成。一个好的抽象能够让代码更容易维护和扩展。以下是几个关键点：`,
    '',
    '- **抽象层次**：选择合适的抽象层次对代码的可维护性至关重要',
    '- **性能考量**：在追求代码优雅的同时，不能忽视运行时性能',
    '- **工程实践**：理论最终要落地到实际的工程实践中',
    '- **团队协作**：技术选型需要考虑团队的技术栈和学习成本',
    '',
    '## 实践建议',
    '',
    '在实际项目中，我建议采取渐进的策略。先从最简单的场景开始，逐步扩展到复杂的用例。这样既能保证项目的稳定性，又能让团队有足够的时间学习和适应。',
    '',
    '```js',
    `// ${title} 示例代码`,
    'function example() {',
    `  const result = "Hello from ${title}";`,
    '  console.log(result);',
    '  return result;',
    '}',
    '```',
    '',
    '## 总结',
    '',
    `总的来说，${title} 是一个值得深入学习的方向。关键不在于掌握所有的细节，而在于理解其核心思想，并能在合适的场景中灵活运用。`,
    '',
    '> 技术的本质是解决问题，而不是追求新奇。选择合适的技术方案，远比追逐潮流更重要。',
  ];

  return paragraphs.join('\n');
}

function randomDate() {
  const start = new Date('2024-01-01').getTime();
  const end = new Date('2026-06-01').getTime();
  const d = new Date(start + Math.random() * (end - start));
  return d.toISOString().split('T')[0];
}

async function main() {
  await mkdir(POSTS_DIR, { recursive: true });

  for (let i = 0; i < 100; i++) {
    const title = `${randomPick(TITLES)} (${i + 1})`;
    const slug = `test-post-${String(i + 1).padStart(3, '0')}`;
    const tags = [randomPick(['engineering', 'design', 'frontend', 'backend', 'devops'])];
    const isFeatured = i < 2;

    const md = `---
title: "${title}"
slug: "${slug}"
date: "${randomDate()}"
description: "这是关于${title}的自动生成测试文章，用于性能压测。"
tags: ${JSON.stringify(tags)}
draft: false
featured: ${isFeatured}
---

${generateContent(title, i)}`;

    await writeFile(join(POSTS_DIR, `${slug}.md`), md, 'utf-8');
  }

  console.log('✅ Generated 100 test posts');
}

main().catch(console.error);
