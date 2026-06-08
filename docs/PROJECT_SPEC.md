# PROJECT_SPEC.md

# Minimal Blog Platform V3

## AI Agent First Architecture

---

# Product Definition

这是一个面向普通用户的：

```txt
Markdown CMS
+
Static Site Generator
+
Media Library
+
Search Engine
+
AI Knowledge Base
```

系统。

用户无需接触：

```txt
Git
Markdown文件
代码
Nginx
数据库
```

全部通过 Web 后台完成。

---

# Core Principles

必须遵守：

```txt
内容管理与内容展示分离

动态管理
静态发布

后台负责写作

前台负责访问
```

---

# Final Architecture

```txt
                    Browser
                       │
                       ▼

                    Nginx
                       │

       ┌───────────────┴───────────────┐
       │                               │

       ▼                               ▼

   Static Site                    Fastify API

     dist/                           backend/

       │                               │

       │                               ├── Auth
       │                               ├── CMS
       │                               ├── Media
       │                               ├── Search
       │                               ├── AI
       │
       ▼
                                 SQLite
```

---

# User Flow

## Writing

用户：

```txt
登录后台

↓

创建文章

↓

Markdown编辑

↓

上传图片

↓

保存草稿
```

---

## Publishing

用户：

```txt
点击发布
```

系统：

```txt
Markdown

↓

HTML

↓

Generate Page

↓

Generate RSS

↓

Generate Sitemap

↓

Write Dist
```

---

## Reading

访客：

```txt
访问网站

↓

Nginx

↓

Static HTML
```

无需访问数据库。

---

# Tech Stack

## Frontend

```txt
HTML
CSS
Vanilla JS
```

禁止：

```txt
React
Vue
Angular
```

---

## Admin

```txt
EJS
Bootstrap
Milkdown
```

---

## Backend

```txt
Node.js 22

Fastify

SQLite

Drizzle ORM

JWT
```

---

## Media

```txt
Sharp

Local Storage
```

---

## AI

```txt
Embedding

Vector Search

RAG
```

---

# Directory Structure

```txt
minimal-blog/

frontend/
│
├─ core/
├─ site/
├─ dist/
└─ nginx/

backend/
│
├─ src/
│
├─ routes/
│
├─ services/
│
├─ repositories/
│
├─ db/
│
├─ middleware/
│
├─ admin/
│
├─ uploads/
│
└─ scripts/
```

---

# Database Design

## users

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY,

  username TEXT UNIQUE,

  password_hash TEXT,

  created_at DATETIME
);
```

---

## posts

```sql
CREATE TABLE posts (
  id INTEGER PRIMARY KEY,

  title TEXT,

  slug TEXT UNIQUE,

  content_md TEXT,

  content_html TEXT,

  excerpt TEXT,

  status TEXT,

  created_at DATETIME,

  updated_at DATETIME,

  published_at DATETIME
);
```

status:

```txt
draft
published
archived
```

---

## media

```sql
CREATE TABLE media (
  id INTEGER PRIMARY KEY,

  filename TEXT,

  filepath TEXT,

  mime_type TEXT,

  size INTEGER,

  width INTEGER,

  height INTEGER,

  created_at DATETIME
);
```

---

## views

```sql
CREATE TABLE views (
  id INTEGER PRIMARY KEY,

  post_id INTEGER,

  count INTEGER DEFAULT 0
);
```

---

## search_index

```sql
CREATE TABLE search_index (
  id INTEGER PRIMARY KEY,

  post_id INTEGER,

  content TEXT
);
```

---

## ai_documents

```sql
CREATE TABLE ai_documents (
  id INTEGER PRIMARY KEY,

  post_id INTEGER,

  chunk_text TEXT,

  embedding TEXT
);
```

---

# CMS Modules

## Dashboard

显示：

```txt
文章数

阅读量

存储占用

最近发布
```

---

## Post Manager

功能：

```txt
文章列表

新建

编辑

删除

发布

归档
```

---

## Markdown Editor

使用：

```txt
Milkdown
```

必须支持：

```txt
标题

列表

代码块

表格

引用

图片
```

---

## Media Library

功能：

```txt
上传图片

删除图片

复制链接

图片预览
```

---

## Settings

功能：

```txt
站点名称

SEO描述

主题配置

首页介绍
```

---

# API Design

## Auth

```http
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/profile
```

---

## Posts

```http
GET    /api/posts

GET    /api/posts/:id

POST   /api/posts

PUT    /api/posts/:id

DELETE /api/posts/:id
```

---

## Publish

```http
POST /api/posts/:id/publish
```

触发：

```txt
Markdown → HTML

Generate Page

Generate RSS

Generate Sitemap

Update Dist
```

---

## Media

```http
POST   /api/media/upload

GET    /api/media

DELETE /api/media/:id
```

---

## Search

```http
GET /api/search?q=keyword
```

---

## AI

```http
POST /api/ai/chat
```

---

# Publish Pipeline

发布时执行：

```txt
Load Post

↓

Markdown Render

↓

TOC Generate

↓

Template Render

↓

HTML Generate

↓

RSS Update

↓

Sitemap Update

↓

Write Dist
```

禁止：

```txt
运行时解析Markdown
```

---

# Media Pipeline

上传：

```txt
Image Upload

↓

Sharp Compress

↓

WebP Convert

↓

Store Uploads

↓

Record Database
```

目录：

```txt
uploads/

images/

YYYY/MM/
```

示例：

```txt
uploads/images/2026/06/
```

---

# Search Pipeline

发布时：

```txt
Markdown

↓

Extract Text

↓

Store Search Index
```

搜索：

```txt
SQLite FTS5
```

优先。

禁止：

```txt
ElasticSearch
OpenSearch
```

---

# AI Knowledge Base

仅索引：

```txt
published
```

文章。

---

# Embedding Pipeline

发布时：

```txt
Markdown

↓

Chunk Split

↓

Embedding

↓

Store ai_documents
```

---

# RAG Flow

```txt
Question

↓

Embedding

↓

Similarity Search

↓

Top K Chunks

↓

Prompt Build

↓

LLM

↓

Answer
```

禁止：

```txt
直接发送全部文章给LLM
```

---

# Route Rules

Route：

```txt
参数验证

调用Service

返回结果
```

禁止：

```txt
SQL

业务逻辑
```

---

# Service Rules

Service：

```txt
业务逻辑
```

允许：

```txt
组合多个Repository
```

---

# Repository Rules

Repository：

```txt
数据库访问
```

禁止：

```txt
业务逻辑
```

---

# AI Agent Development Rules

每次任务：

```txt
最多修改3个文件
```

---

单文件：

```txt
≤ 500行
```

理想：

```txt
≤ 300行
```

---

单函数：

```txt
≤ 80行
```

---

禁止：

```txt
DDD

CQRS

Microservice

EventBus

Kafka

GraphQL
```

---

# Future Roadmap

Phase1

```txt
CMS
Markdown Editor
Media
Publish
```

---

Phase2

```txt
Analytics
```

---

Phase3

```txt
Search
```

---

Phase4

```txt
AI Knowledge Base
```

---

# Definition Of Done

项目完成标准：

```txt
✓ 普通用户可写文章

✓ 图片上传正常

✓ Markdown编辑正常

✓ 一键发布正常

✓ 静态页面生成正常

✓ RSS正常

✓ Sitemap正常

✓ 搜索正常

✓ AI问答正常

✓ Lighthouse ≥ 95

✓ 无React依赖

✓ AI Agent可持续维护
```
