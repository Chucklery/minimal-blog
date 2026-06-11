// backend/services/publishService.js
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFileSync, mkdirSync, readdirSync, unlinkSync, readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FRONTEND_ROOT = join(__dirname, '..', '..');

function quoteYaml(value) {
  return `"${String(value || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function parseTags(raw) {
  const text = String(raw || '').trim();
  if (!text) return [];
  const bracket = text.match(/^\[(.*)\]$/s);
  const body = bracket ? bracket[1] : text;
  return body
    .split(',')
    .map((tag) => tag.trim().replace(/^['"]|['"]$/g, ''))
    .filter(Boolean);
}

function parseBoolean(value, fallback) {
  if (typeof value !== 'string') return fallback;
  if (/^true$/i.test(value.trim())) return true;
  if (/^false$/i.test(value.trim())) return false;
  return fallback;
}

function parseFrontmatter(markdown) {
  const md = String(markdown || '').replace(/^\uFEFF/, '');
  const match = md.match(/^---\s*\n([\s\S]*?)\n---\s*(?:\n|$)([\s\S]*)$/);
  if (!match) return { meta: {}, body: md, hasFrontmatter: false };

  const meta = {};
  for (const line of match[1].split(/\r?\n/)) {
    const pair = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!pair) continue;
    const key = pair[1];
    let value = pair[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    }
    if (key === 'tags') meta.tags = parseTags(value);
    else if (key === 'draft' || key === 'featured') meta[key] = parseBoolean(value, false);
    else meta[key] = value;
  }

  return { meta, body: match[2] || '', hasFrontmatter: true };
}

function buildFrontmatter(meta) {
  return [
    '---',
    `title: ${quoteYaml(meta.title)}`,
    `slug: ${quoteYaml(meta.slug)}`,
    `date: ${quoteYaml(meta.date)}`,
    `description: ${quoteYaml(meta.description)}`,
    `tags: [${(meta.tags || []).join(', ')}]`,
    `draft: ${meta.draft ? 'true' : 'false'}`,
    `featured: ${meta.featured ? 'true' : 'false'}`,
    '---',
  ].join('\n');
}

export async function buildPublish(db, post, oldSlug) {
  const postsDir = join(FRONTEND_ROOT, 'site', 'content', 'posts');
  mkdirSync(postsDir, { recursive: true });

  const dbSlug = post.slug;
  const parsed = parseFrontmatter(post.content_md);

  let md;
  if (parsed.hasFrontmatter && parsed.meta.title && parsed.meta.slug) {
    const now = new Date();
    const pubDate = now.toISOString().split('T')[0];
    const pubTime = String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0');
    md = post.content_md
      .replace(/(\r?\n)draft:\s*true/, '$1draft: false')
      .replace(/(\r?\ndate:\s*)"[^"]*"/, `$1"${pubDate} ${pubTime}"`)
      .replace(/(\r?\nslug:\s*)"[^"]*"/, `$1"${dbSlug}"`);
  } else {
    const publishDate = post.published_at
      ? new Date(post.published_at).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];
    md = `${buildFrontmatter({
      title: post.title, slug: dbSlug, date: publishDate,
      description: (post.excerpt || '').slice(0, 200), tags: [], draft: false, featured: false,
    })}\n\n${post.content_md.trimStart()}`.trimEnd() + '\n';
  }

  // Delete old slug file if slug changed (the old frontmatter slug is different)
  if (oldSlug && oldSlug !== dbSlug) {
    const oldPath = join(postsDir, `${oldSlug}.md`);
    try { unlinkSync(oldPath); } catch {}
  }
  // Always overwrite current slug file
  writeFileSync(join(postsDir, `${dbSlug}.md`), md, 'utf-8');
  execSync('node scripts/build.js', { cwd: FRONTEND_ROOT, stdio: 'pipe' });
  console.log(`Published: ${dbSlug}`);
}
