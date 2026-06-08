# Minimal Blog Platform V2

# Task Breakdown

---

# Sprint 0

## Project Bootstrap

目标：

```txt
初始化项目结构
```

---

### TASK-001

创建 backend 目录

输出：

```txt
backend/

src/
routes/
services/
repositories/
db/
middleware/
admin/
```

验收：

```txt
目录完整
```

---

### TASK-002

初始化 package.json

安装：

```txt
fastify
drizzle-orm
better-sqlite3
jsonwebtoken
bcrypt
ejs
```

验收：

```bash
pnpm install
成功
```

---

### TASK-003

创建 app.js

功能：

```txt
启动 Fastify
监听3000
```

验收：

```bash
localhost:3000
返回ok
```

---

# Sprint 1

## Database

目标：

```txt
建立数据库层
```

---

### TASK-004

初始化 SQLite

创建：

```txt
backend/db/database.js
```

验收：

```txt
database.db生成
```

---

### TASK-005

创建 users 表

输出：

```txt
schema/users.js
```

字段：

```txt
id
username
password_hash
created_at
```

---

### TASK-006

创建 posts 表

字段：

```txt
id
slug
title
created_at
```

---

### TASK-007

创建 views 表

字段：

```txt
id
post_id
count
```

---

### TASK-008

执行 migration

验收：

```txt
SQLite中存在全部表
```

---

# Sprint 2

## Repository Layer

目标：

```txt
数据库读写封装
```

---

### TASK-009

UserRepository

方法：

```txt
findByUsername()

createUser()
```

---

### TASK-010

PostRepository

方法：

```txt
findAll()

findBySlug()
```

---

### TASK-011

ViewRepository

方法：

```txt
getViews()

incrementViews()
```

---

# Sprint 3

## Authentication

目标：

```txt
管理员登录
```

---

### TASK-012

AuthService

实现：

```txt
password verify
jwt generate
```

---

### TASK-013

Login API

接口：

```http
POST /api/auth/login
```

---

### TASK-014

JWT Middleware

功能：

```txt
验证token
```

---

### TASK-015

Seed Admin User

创建：

```txt
admin/admin123
```

仅开发环境。

---

# Sprint 4

## Analytics

目标：

```txt
阅读量系统
```

---

### TASK-016

ViewService

实现：

```txt
增加阅读量
```

---

### TASK-017

GET Views API

接口：

```http
GET /api/posts/:slug/views
```

---

### TASK-018

POST View API

接口：

```http
POST /api/posts/:slug/view
```

---

### TASK-019

前端接入阅读量

修改：

```txt
site/scripts/
```

新增：

```txt
viewCounter.js
```

---

# Sprint 5

## Admin

目标：

```txt
后台系统
```

---

### TASK-020

配置 EJS

验收：

```txt
能够渲染页面
```

---

### TASK-021

Admin Login Page

路径：

```txt
/admin/login
```

---

### TASK-022

Dashboard Page

路径：

```txt
/admin/dashboard
```

显示：

```txt
文章数
总阅读量
```

---

### TASK-023

Admin Auth Middleware

保护：

```txt
/admin/*
```

---

### TASK-024

Settings Page

路径：

```txt
/admin/settings
```

---

# Sprint 6

## Search

目标：

```txt
全文搜索
```

---

### TASK-025

构建阶段抽取 Markdown

输出：

```txt
search_index
```

---

### TASK-026

Search Repository

方法：

```txt
search(keyword)
```

---

### TASK-027

Search Service

实现：

```txt
全文匹配
```

---

### TASK-028

Search API

接口：

```http
GET /api/search
```

---

### TASK-029

前端搜索框

新增：

```txt
search.js
```

---

# Sprint 7

## AI Preparation

目标：

```txt
建立知识库基础设施
```

---

### TASK-030

创建 ai_documents 表

字段：

```txt
id
title
content
embedding
```

---

### TASK-031

Markdown Chunk Splitter

输出：

```txt
chunk数组
```

---

### TASK-032

Embedding Service

接口：

```txt
generateEmbedding()
```

---

### TASK-033

Embedding Import Script

命令：

```bash
pnpm ai:index
```

---

# Sprint 8

## Vector Search

目标：

```txt
相似度检索
```

---

### TASK-034

Vector Repository

方法：

```txt
saveEmbedding()

searchSimilar()
```

---

### TASK-035

Cosine Similarity

实现：

```txt
向量相似度计算
```

---

### TASK-036

Top-K Retrieval

返回：

```txt
Top 5 Chunks
```

---

# Sprint 9

## AI Chat

目标：

```txt
RAG问答
```

---

### TASK-037

Chat Service

流程：

```txt
Question
↓
Embedding
↓
Retrieval
↓
Context
↓
LLM
```

---

### TASK-038

Chat API

接口：

```http
POST /api/ai/chat
```

---

### TASK-039

Prompt Builder

输入：

```txt
Question
Chunks
```

输出：

```txt
Prompt
```

---

### TASK-040

LLM Client

封装：

```txt
OpenAI
OpenRouter
兼容接口
```

---

# Sprint 10

## Production

目标：

```txt
上线准备
```

---

### TASK-041

Nginx Proxy

配置：

```txt
/api
/admin
```

---

### TASK-042

Gzip

配置：

```txt
html
css
js
```

---

### TASK-043

Cache Policy

配置：

```txt
静态资源缓存
```

---

### TASK-044

Health Check

接口：

```http
GET /health
```

---

### TASK-045

Error Logger

记录：

```txt
API错误
系统错误
```

---

# Sprint 11

## Testing

目标：

```txt
自动测试
```

---

### TASK-046

Auth Test

---

### TASK-047

Analytics Test

---

### TASK-048

Search Test

---

### TASK-049

AI Test

---

### TASK-050

Build Verification

验证：

```txt
Frontend Build

Backend Start

Database Ready

Search Ready

AI Ready
```

---

# Done Definition

项目完成标准

```txt
✓ 静态博客正常

✓ 后台登录正常

✓ 阅读量统计正常

✓ 搜索正常

✓ AI知识库正常

✓ SQLite正常

✓ Fastify正常

✓ Nginx正常

✓ Lighthouse ≥ 95

✓ 无评论系统

✓ 无React/Vue依赖

✓ 可由AI Agent持续维护
```
