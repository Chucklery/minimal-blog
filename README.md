# Minimal Blog

A fast, minimal static blog engine. Write in Markdown, build with a custom Node.js pipeline, and publish plain HTML, CSS, and JavaScript.

[简体中文](README.zh-CN.md)

## Features

- No client-side framework; pages are rendered at build time.
- Markdown rendering with syntax-highlighted code blocks.
- Separate reusable `core/` and site-specific `site/` layers.
- Generates static pages and supporting feeds and metadata.
- Local development builds the site, serves it at `http://localhost:8088`, and rebuilds when source files change.

## Requirements

- Node.js 22 or later
- pnpm

## Quick start

```sh
pnpm install
pnpm dev
```

Open <http://localhost:8088>. `pnpm dev` builds the site and starts the preview server; edits to content, styles, scripts, templates, and images trigger a rebuild.

```sh
pnpm build       # Build dist/
pnpm preview     # Serve an existing dist/ build on port 8088
pnpm check       # Check generated output
pnpm test:e2e    # Run Playwright smoke tests
```

## Write a post

Create a Markdown file under `site/content/posts/`:

```md
---
title: "An article title"
slug: "article-slug"
date: "2026-06-05"
description: "A one-sentence summary."
tags: [design, coding]
draft: false
featured: false
---

Write the post here.
```

Run `pnpm dev` to preview it, or `pnpm build` to generate the site in `dist/`.

## Project layout

```text
core/       Reusable content, rendering, templates, assets, and output code
site/       Site configuration, content, styles, scripts, and public files
scripts/    Build, development, deployment, and validation commands
tests/      Playwright tests
nginx/      Example Nginx configuration
dist/       Generated site (not committed)
```

Site-level settings live in `site/site.config.js`. See [docs/development.md](docs/development.md) for development details and [docs/content-authoring.md](docs/content-authoring.md) for the full Markdown format.

## Local deployment

```sh
pnpm deploy:local
```

The deployment helper targets a local Windows Nginx setup. For other hosting environments, build with `pnpm build` and serve the generated `dist/` directory with a static web server.

## Project status

This project is maintained in the open. Bug reports, security reports, and contributions are welcome; see [CONTRIBUTING.md](CONTRIBUTING.md) and [SECURITY.md](SECURITY.md).

## License

This project is licensed under the [Apache License 2.0](LICENSE).
