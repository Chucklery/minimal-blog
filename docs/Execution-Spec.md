# Minimal Blog Platform V2

## Project Goal

在现有静态博客基础上升级为：

```txt
Static Blog
+
Admin System
+
Analytics
+
Search
+
AI Knowledge Base
```

要求：

```txt
Frontend 尽量不重构
AI Agent 易理解
部署简单
单机运行
高性能
低维护成本
```

---

# Architecture

```txt
Browser
   │
   ▼
 Nginx
   │
   ├─────────────── dist/
   │                 │
   │                 ├─ 首页
   │                 ├─ 文章页
   │                 ├─ 归档页
   │                 └─ About
   │
   ▼

 Fastify API
   │
   ├─ Auth
   ├─ Analytics
   ├─ Search
   ├─ Admin
   ├─ AI
   │
   ▼

 SQLite
```

原则：

```txt
静态内容 → Build阶段生成

动态内容 → API返回

浏览器不直接访问数据库
```

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
Redux
Pinia
Mobx
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

## AI

Phase5 引入：

```txt
OpenAI API
Embedding
Vector Search
```

---

# Project Structure

```txt
minimal-blog/

frontend/
│
├─ core/
├─ site/
├─ dist/
│
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
└─ app.js
```

---

# Responsibility

## Frontend

负责：

```txt
页面展示
主题切换
阅读进度
代码复制
TOC
```

禁止：

```txt
业务逻辑
数据库访问
权限控制
```

---

## Backend

负责：

```txt
登录
权限
统计
搜索
AI
后台管理
```

---

# Database

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
  slug TEXT UNIQUE,
  title TEXT,
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
  title TEXT,
  content TEXT,
  embedding TEXT
);
```

---

# Backend Layers

必须保持：

```txt
Route
 ↓
Service
 ↓
Repository
 ↓
Database
```

---

# Route Layer

职责：

```txt
参数校验
调用Service
返回结果
```

禁止：

```txt
SQL
业务逻辑
```

示例：

```js
GET /api/posts
POST /api/login
GET /api/search
```

---

# Service Layer

职责：

```txt
业务逻辑
```

例如：

```txt
增加阅读量
登录验证
搜索逻辑
AI检索
```

---

# Repository Layer

职责：

```txt
数据库读写
```

例如：

```txt
findBySlug()
incrementViews()
saveEmbedding()
```

---

# API Specification

## Auth

### Login

```http
POST /api/auth/login
```

Request

```json
{
  "username":"admin",
  "password":"123456"
}
```

Response

```json
{
  "token":"jwt"
}
```

---

## Analytics

### Get Views

```http
GET /api/posts/:slug/views
```

Response

```json
{
  "count":123
}
```

---

### Increment View

```http
POST /api/posts/:slug/view
```

---

## Search

### Search Articles

```http
GET /api/search?q=node
```

Response

```json
[
  {
    "title":"Node Guide",
    "slug":"node-guide"
  }
]
```

---

# Admin System

## Goal

后台仅用于管理。

不承担博客展示。

---

## Routes

```txt
/admin/login
/admin/dashboard
/admin/posts
/admin/settings
```

---

## Admin UI

使用：

```txt
Bootstrap
EJS
```

禁止：

```txt
React Admin
Vue Admin
Ant Design Pro
```

---

# Authentication

使用：

```txt
JWT
HttpOnly Cookie
```

登录流程：

```txt
Login
 ↓
JWT
 ↓
Cookie
 ↓
Auth Middleware
```

---

# Search System

Phase4 开始。

数据来源：

```txt
Markdown
 ↓
Build
 ↓
抽取纯文本
 ↓
SQLite Search Index
```

搜索：

```txt
Keyword Search
```

暂不使用：

```txt
ElasticSearch
OpenSearch
```

---

# AI Knowledge Base

Phase5

目标：

```txt
博客内容问答
```

---

## Build Pipeline

新增：

```txt
Markdown
 ↓
HTML
 ↓
Plain Text
 ↓
Embedding
 ↓
Vector Store
```

---

## AI Flow

```txt
User Question
 ↓
Embedding
 ↓
Similarity Search
 ↓
Relevant Chunks
 ↓
LLM
 ↓
Answer
```

---

## API

```http
POST /api/ai/chat
```

Request

```json
{
  "message":"什么是Node事件循环"
}
```

Response

```json
{
  "answer":"..."
}
```

---

# Nginx

## Static Site

```nginx
location / {
  root dist;
}
```

---

## API

```nginx
location /api {
  proxy_pass http://127.0.0.1:3000;
}
```

---

## Admin

```nginx
location /admin {
  proxy_pass http://127.0.0.1:3000;
}
```

---

# Development Phases

## Phase1

静态博客

完成：

```txt
首页
文章页
归档页
RSS
Sitemap
```

---

## Phase2

统计系统

完成：

```txt
阅读量
文章统计
```

---

## Phase3

后台系统

完成：

```txt
登录
Dashboard
设置管理
```

---

## Phase4

搜索系统

完成：

```txt
全文搜索
标签搜索
```

---

## Phase5

AI知识库

完成：

```txt
Embedding
向量检索
RAG问答
```

---

# AI Agent Rules

生成代码必须遵守：

```txt
单文件不超过500行

函数不超过80行

禁止过度抽象

禁止创建无意义基类

禁止使用工厂模式

禁止使用DDD

禁止微服务

优先可读性
```

---

# Final Goal

最终产物：

```txt
Frontend
  HTML
  CSS
  Vanilla JS

Backend
  Fastify
  SQLite
  Drizzle

Deployment
  Nginx

AI
  RAG Knowledge Base
```

保证：

```txt
AI开发效率最高
Token消耗最低
维护成本最低
后续扩展AI能力最容易
```
