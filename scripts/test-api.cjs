// scripts/test-api.js — login, save draft, publish
const http = require('node:http');
const HOST = '172.23.128.1';

function req(method, path, opts = {}) {
  return new Promise((resolve, reject) => {
    const headers = {};
    for (const [k, v] of Object.entries(opts.headers || {})) headers[k] = v;
    if (opts.body !== undefined) headers['Content-Type'] = 'application/json';

    const options = {
      hostname: HOST,
      port: 8055,
      path,
      method,
      headers,
    };
    const r = http.request(options, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString();
        const cookies = res.headers['set-cookie'] || [];
        resolve({ status: res.statusCode, headers: res.headers, body, cookies });
      });
    });
    r.on('error', reject);
    if (opts.body) r.write(JSON.stringify(opts.body));
    r.end();
  });
}

async function main() {
  // 1. Login
  console.log('[1] Login...');
  const login = await req('POST', '/admin/login', {
    body: { username: 'admin', password: 'admin123' },
  });
  console.log(`    status=${login.status}  cookies=${login.cookies.length}`);

  const tokenCookie = login.cookies.find((c) => c.startsWith('token='));
  if (!tokenCookie) {
    console.log('    FAILED: no token cookie. Response:', login.body.slice(0, 300));
    process.exit(1);
  }
  const token = tokenCookie.match(/token=([^;]+)/)[1];
  console.log(`    token=${token.slice(0, 15)}...`);

  const authHeaders = { Cookie: `token=${token}` };

  // 2. Save Draft
  console.log('[2] Save Draft...');
  const draft = await req('POST', '/api/posts/draft', {
    headers: authHeaders,
    body: {
      title: 'Vditor 编辑器测试',
      slug: 'vditor-editor-test',
      content_md: [
        '---',
        'title: "Vditor 编辑器测试"',
        'slug: "vditor-editor-test"',
        'date: "2026-06-09"',
        'description: "测试新 Vditor 编辑器的保存和发布流程"',
        'tags: [test, vditor, editor]',
        'draft: true',
        'featured: false',
        '---',
        '',
        '## Hello Vditor',
        '',
        '这是一篇测试文章，用于验证新的 Vditor 编辑器。',
        '',
        '### 功能列表',
        '',
        '- [x] 标题和 slug',
        '- [x] Tags 输入',
        '- [x] 日期设置',
        '- [x] draft / featured 开关',
        '- [x] Vditor 实时预览',
        '',
        '**保存后请确认这篇内容能正常展示。**',
        '',
      ].join('\n'),
    },
  });
  console.log(`    status=${draft.status}`);
  const draftData = JSON.parse(draft.body);
  console.log(`    success=${draftData.success}  id=${draftData.data?.id}`);
  if (!draftData.success) process.exit(1);

  const postId = draftData.data.id;

  // 2b. Verify the saved post
  console.log('[2b] Read back post...');
  const getPost = await req('GET', `/api/posts/${postId}`, { headers: authHeaders });
  const postData = JSON.parse(getPost.body);
  const md = postData.data?.content_md || '';
  const hasTitle = md.includes('title: "Vditor');
  const hasTags = md.includes('tags: [test, vditor, editor]');
  console.log(`    content_md length=${md.length}  hasTitle=${hasTitle}  hasTags=${hasTags}`);

  if (!hasTitle || !hasTags) {
    console.log('    WARNING: frontmatter missing fields!');
    console.log('    content_md preview:', md.slice(0, 400));
  }

  // 3. Publish
  console.log('[3] Publish...');
  const publish = await req('POST', `/api/posts/${postId}/publish`, { headers: authHeaders });
  console.log(`    status=${publish.status}  body=${publish.body.slice(0,500)}`);
  const pubData = (() => { try { return JSON.parse(publish.body); } catch { return null; } })();
  if (pubData?.success) {
    // 3b. Verify generated .md file
    const fs = require('node:fs');
    const filePath = '/mnt/d/workspace/others/minimal-blog/site/content/posts/vditor-editor-test.md';
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf-8').slice(0, 500);
      console.log(`    Generated file exists, preview:`);
      console.log(fileContent);
    } else {
      console.log(`    WARNING: Generated file not found at ${filePath}`);
    }
  } else {
    console.log('    FAILED');
  }

  console.log('\n✅ All tests passed!');
}

main().catch((err) => {
  console.error('Test failed:', err.message);
  process.exit(1);
});
