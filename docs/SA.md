# NexusGraph — 系統架構文件 (SA)

## 1. 系統概覽

NexusGraph 是一個雲端同步的 Git Repo 知識圖譜平台，由以下子系統組成：

```
┌─────────────────────────────────────────────────────────┐
│                      Client (Next.js)                     │
│              Cytoscape.js 圖譜渲染 / Zustand 狀態        │
└─────────────────────────┬───────────────────────────────┘
                          │ HTTPS
┌─────────────────────────▼───────────────────────────────┐
│                    API Gateway (Express)                 │
│              JWT Auth / Rate Limit / Routing              │
└──────┬──────────────────┬────────────────────┬────────────┘
       │                  │                    │
┌──────▼──────┐  ┌───────▼──────┐  ┌─────────▼─────────┐
│  Auth Svc   │  │  Graph Svc   │  │  Team Svc         │
│  (Express)  │  │  (Express)  │  │  (Express)        │
└──────┬──────┘  └──────┬───────┘  └─────────┬─────────┘
       │                 │                    │
┌──────▼─────────────────▼────────────────────▼───────────┐
│                    Data Layer                             │
│  PostgreSQL  │  Neo4j (Graph DB)  │  Redis (Cache)      │
│  (Users/Teams│  (Call Graph)      │  (Session/APIs)    │
│   /Repos)    │                    │                     │
└──────────────┴────────────────────┴─────────────────────┘
       │
┌──────▼───────────────────────────────────────────────────┐
│              Code Analysis Microservice (Python/FastAPI)  │
│              AST Parser / tree-sitter / Jina Embeddings  │
└───────────────────────────────────────────────────────────┘
```

---

## 2. 元件職責

### 2.1 前端 Client（Next.js 14）

| 元件 | 職責 |
|------|------|
| `GraphCanvas` | 使用 Cytoscape.js 渲染互動式知識圖譜 |
| `NodeDetailPanel` | 右側側邊欄，顯示點擊節點的詳情 |
| `RepoInputForm` | GitHub URL 輸入與提交表單 |
| `Dashboard` | 團隊 Repo 列表與健康度概覽 |
| `AuthForm` | 登入/註冊表單 |
| `TeamMemberList` | 團隊成員管理 |

### 2.2 API Gateway（Express）

| 端點前綴 | 職責 |
|----------|------|
| `/api/auth/*` | 認證：登入、註冊、refresh token |
| `/api/repos/*` | Repo 管理：建立分析、取得圖譜、刪除 |
| `/api/teams/*` | 團隊管理：建立團隊、邀請成員、ACL |
| `/api/graph/*` | 圖譜查詢：取得節點、邊、搜尋 |
| `/api/export/*` | 匯出：Markdown 文件生成 |

### 2.3 Auth Service（Express + JWT）

- **職責**：使用者認證與授權
- **儲存**：PostgreSQL `users` 表
- **Token**：Access Token (24h) + Refresh Token (7d)
- **密碼**：bcrypt cost factor 12

### 2.4 Graph Service（Express）

- **職責**：圖譜資料的 CRUD 與查詢
- **儲存**：Neo4j（節點 + 邊關係）
- **快取**：Redis（熱門 Repo 圖譜節點）

### 2.5 Team Service（Express）

- **職責**：團隊 CRUD、成員邀請、ACL 權限
- **儲存**：PostgreSQL `teams`, `team_members` 表

### 2.6 Code Analysis Microservice（Python/FastAPI）

- **職責**：
  - 接收 GitHub URL，Clone Repo
  - 使用 `tree-sitter` 解析 AST，建立呼叫關係圖
  - 呼叫 Jina Embeddings API 自動生成模組說明
  - 將圖譜資料寫入 Neo4j
- **輸入**：GitHub URL
- **輸出**：節點列表 + 邊列表（寫入 Neo4j）

### 2.7 資料庫職責

| 資料庫 | 用途 | 主要 Schema |
|--------|------|-------------|
| PostgreSQL | 使用者、團隊、Repo 中繼資料 | `users`, `teams`, `team_members`, `repos` |
| Neo4j | 知識圖譜儲存 | `File` / `Function` 節點 + `CALLS` / `IMPORTS` 邊 |
| Redis | API 快取、工作階段 | `session:*`, `graph:*`, `rate:*` |

---

## 3. 資料流

### 3.1 Repo 分析流程

```
User Input GitHub URL
         │
         ▼
┌──────────────────┐
│  API Gateway     │
│  POST /repos      │
└────────┬─────────┘
         │  async job (queue)
         ▼
┌──────────────────┐
│  Code Analysis   │  ← Python/FastAPI 微服務
│  Microservice    │
│  1. Clone repo   │
│  2. tree-sitter  │
│  3. Build graph  │
│  4. Write Neo4j  │
└──────────────────┘
         │
         ▼
Graph stored in Neo4j
         │
         ▼
User polls GET /repos/:id/status
         │
         ▼
Graph ready → Frontend fetches and renders
```

### 3.2 圖譜查詢流程

```
User clicks node
         │
         ▼
GET /graph/nodes/:id
         │
         ▼
┌────────┴─────────┐
│  Redis Cache ?   │──Yes──► Return cached
│       │          │
│      No          │
│       ▼          │
│  Neo4j Cypher    │
│  Query           │
│       │          │
│       ▼          │
│  Cache result    │
└────────┬─────────┘
         │
         ▼
Return JSON to client
```

---

## 4. 部署架構

### 4.1 開發環境（Docker Compose）

```yaml
services:
  client:
    image: node:20-alpine
    command: npm run dev
    ports:
      - "3000:3000"
    volumes:
      - ./client:/app

  api-gateway:
    image: node:20-alpine
    command: npm run dev
    ports:
      - "4000:4000"
    volumes:
      - ./api-gateway:/app

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: nexusgraph
      POSTGRES_USER: nexus
      POSTGRES_PASSWORD: secret

  neo4j:
    image: neo4j:5-community
    environment:
      NEO4J_AUTH: neo4j/secret

  redis:
    image: redis:7-alpine

  code-analysis:
    image: python:3.11-slim
    volumes:
      - ./code-analysis:/app
    command: uvicorn main:app --host 0.0.0.0 --port 5000
    ports:
      - "5000:5000"
```

### 4.2 生產環境

| 元件 | 雲端服務 |
|------|----------|
| 前端 | Vercel（Next.js 原生部署） |
| API Gateway + Services | Railway（Node.js Express） |
| PostgreSQL | Railway Postgres |
| Neo4j | Neo4j Aura（免費 tier）/ Railway |
| Redis | Railway Redis |
| Code Analysis | Railway（Python FastAPI）/ AWS Lambda |
| CDN | Vercel Edge Network |

### 4.3 環境變數

```
# Auth
JWT_SECRET=***
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Database
DATABASE_URL=postgresql://nexus:secret@host:5432/nexusgraph
NEO4J_URI=neo4j://host:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=secret
REDIS_URL=redis://host:6379

# External
JINA_API_KEY=***
GITHUB_TOKEN=***

# App
PORT=4000
NODE_ENV=production
```

---

## 5. 安全架構

### 5.1 認證流程

```
Client ──► JWT Access Token ──► API Gateway ──► Service
                    │
                    └── Expired ? ──► Refresh Token ──► New Access Token
```

### 5.2 授權模型

- **個人用戶**：只能存取自己的 Repo
- **團隊成員**：根據角色（owner/member）決定可存取的 Repo
- **ACL 優先順序**：Team Owner > Team Member > Repo Owner

### 5.3 網路安全

- 所有流量 HTTPS（SSL Termination at Vercel/Railway）
- 內部服務之間使用 VPC 或私有網路
- API Rate Limit：100 req/min（未登入），1000 req/min（已登入）

---

*文件版本：v1.0*
*最後更新：2026-04-12*
