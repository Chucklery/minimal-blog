# AGENTS.md

## Project

Minimal Blog Platform V2

---

# Mission

本项目目标：

```txt
构建一个：

Static Blog
+
Admin System
+
Analytics
+
Search
+
AI Knowledge Base

的平台。
```

核心原则：

```txt
Frontend 保持极简

Backend 保持单体

AI 易理解

AI 易维护

避免过度工程化
```

---

# Architecture Rules

必须遵守：

```txt
Nginx
 ↓
Fastify
 ↓
Service
 ↓
Repository
 ↓
SQLite
```

禁止：

```txt
Route
 ↓
Database
```

直接访问数据库。

---

# Frontend Rules

Frontend 目录：

```txt
frontend/

core/
site/
dist/
```

Frontend 负责：

```txt
页面展示
主题切换
TOC
代码复制
阅读进度
```

禁止：

```txt
业务逻辑
权限控制
数据库访问
JWT解析
```

---

# Backend Rules

Backend 目录：

```txt
backend/

routes/
services/
repositories/
db/
middleware/
admin/
```

职责：

```txt
登录
统计
搜索
AI
后台管理
```

---

# Layer Rules

## Route

只负责：

```txt
参数解析
调用Service
返回Response
```

禁止：

```txt
SQL
复杂逻辑
```

---

## Service

负责：

```txt
业务逻辑
```

允许：

```txt
多个Repository组合
```

---

## Repository

负责：

```txt
数据库读写
```

禁止：

```txt
业务逻辑
```

---

# File Size Rules

必须遵守：

```txt
单文件 ≤ 500行
```

理想：

```txt
单文件 ≤ 300行
```

超过：

```txt
拆分
```

---

# Function Rules

必须遵守：

```txt
单函数 ≤ 80行
```

理想：

```txt
≤ 40行
```

---

# Dependency Rules

优先：

```txt
Node.js标准库
```

其次：

```txt
Fastify
Drizzle
SQLite
```

新增依赖前：

必须确认：

```txt
现有代码无法实现
```

---

# Naming Rules

## File

使用：

```txt
camelCase.js
```

例如：

```txt
viewService.js

searchRepository.js

authMiddleware.js
```

禁止：

```txt
ViewServiceManager.js

BlogSystemController.js

SuperAdminService.js
```

---

## Function

使用：

```txt
verb + noun
```

例如：

```txt
findPost()

createUser()

incrementViews()

generateEmbedding()
```

---

# Database Rules

必须：

```txt
SQLite优先
```

禁止：

```txt
MongoDB
Redis持久化
ElasticSearch
```

除非任务明确要求。

---

# Search Rules

搜索阶段：

```txt
SQLite LIKE
FTS5
```

优先。

禁止：

```txt
ElasticSearch
OpenSearch
```

---

# AI Rules

Phase5前：

禁止：

```txt
OpenAI
Embedding
Vector Search
```

---

Phase5开始：

允许：

```txt
Embedding

Vector Search

RAG
```

---

# RAG Rules

流程固定：

```txt
Question
 ↓
Embedding
 ↓
Similarity Search
 ↓
TopK Chunks
 ↓
Prompt
 ↓
LLM
 ↓
Answer
```

禁止：

```txt
直接把全部文章发给LLM
```

---

# Admin Rules

后台：

```txt
EJS
Bootstrap
```

允许：

```txt
少量Vanilla JS
```

禁止：

```txt
React

Vue

Next.js

Nuxt
```

后台不是SPA。

---

# Error Handling

所有API：

必须：

```txt
try/catch
```

返回：

```json
{
  "success": false,
  "message": "..."
}
```

---

成功：

```json
{
  "success": true,
  "data": {}
}
```

统一格式。

---

# Logging Rules

允许：

```txt
console.error
```

开发阶段。

生产：

```txt
logger.error
```

统一输出。

---

# Testing Rules

新增功能时：

至少新增：

```txt
1个成功测试

1个失败测试
```

---

# Commit Rules

每个任务：

```txt
一个Commit
```

格式：

```txt
feat(auth): add login api

feat(views): add view counter

feat(search): add sqlite search

feat(ai): add vector retrieval
```

---

# Forbidden

禁止引入：

```txt
DDD

CQRS

EventBus

Microservice

Kafka

RabbitMQ

GraphQL

Redux

Mobx

Pinia

Zustand

Prisma

TypeORM
```

原因：

```txt
增加复杂度

增加Token消耗

降低AI成功率
```

---

# Performance Rules

必须满足：

```txt
Lighthouse ≥ 95
```

---

静态资源：

```txt
JS gzip < 20KB

CSS gzip < 20KB
```

---

# AI Agent Workflow

执行任务时：

```txt
阅读Task

理解目标

查看相关文件

最小修改

运行验证

提交结果
```

禁止：

```txt
重构无关模块

修改无关文件

优化未要求代码
```

---

# Decision Priority

发生冲突时：

```txt
可维护性
 >
 简洁性
 >
 性能
 >
 炫技
```

---

# Final Principle

优先：

```txt
简单

稳定

可读

可维护
```

不要：

```txt
过度设计

提前优化

炫技架构
```

项目最终服务对象：

```txt
个人博客

知识库

AI问答系统
```

而不是：

```txt
高并发社交平台
```
