# NexusGraph — 系統設計文件 (SD)

## 1. API 規格

### 1.1 認證 API（`/api/auth`）

#### POST `/api/auth/register`
**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}
```
**Response (201):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "createdAt": "2026-04-12T00:00:00Z"
}
```

#### POST `/api/auth/login`
**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```
**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "id": "uuid", "email": "user@example.com", "name": "John Doe" }
}
```

#### POST `/api/auth/refresh`
**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```
**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

### 1.2 Repo API（`/api/repos`）

#### POST `/api/repos`
**Auth:** Required
**Request:**
```json
{
  "githubUrl": "https://github.com/facebook/react",
  "name": "react"
}
```
**Response (202):**
```json
{
  "id": "uuid",
  "githubUrl": "https://github.com/facebook/react",
  "name": "react",
  "status": "pending",
  "userId": "uuid",
  "createdAt": "2026-04-12T00:00:00Z"
}
```

#### GET `/api/repos/:id`
**Auth:** Required
**Response (200):**
```json
{
  "id": "uuid",
  "githubUrl": "https://github.com/facebook/react",
  "name": "react",
  "status": "completed",
  "nodeCount": 1542,
  "edgeCount": 3201,
  "createdAt": "2026-04-12T00:00:00Z"
}
```

#### GET `/api/repos/:id/status`
**Auth:** Required
**Response (200):**
```json
{
  "status": "completed",
  "progress": 100,
  "message": "Graph ready"
}
```

#### DELETE `/api/repos/:id`
**Auth:** Required (owner only)
**Response (204):** No content

---

### 1.3 圖譜 API（`/api/graph`）

#### GET `/api/graph/:repoId`
**Auth:** Required
**Response (200):**
```json
{
  "nodes": [
    {
      "id": "node_1",
      "type": "file",
      "label": "src/index.js",
      "filePath": "src/index.js",
      "description": "Main entry point for the application",
      "metrics": { "linesOfCode": 45, "functionCount": 3 }
    },
    {
      "id": "node_2",
      "type": "function",
      "label": "renderApp",
      "filePath": "src/index.js",
      "description": "Renders the main React application component",
      "metrics": { "linesOfCode": 12, "callCount": 5 }
    }
  ],
  "edges": [
    {
      "id": "edge_1",
      "source": "node_1",
      "target": "node_2",
      "type": "CALLS"
    }
  ]
}
```

#### GET `/api/graph/:repoId/nodes/:nodeId`
**Auth:** Required
**Response (200):**
```json
{
  "id": "node_1",
  "type": "file",
  "label": "src/index.js",
  "filePath": "src/index.js",
  "description": "Main entry point for the application",
  "content": "const React = require('react');...",
  "functions": [
    { "name": "renderApp", "line": 10, "endLine": 22 }
  ],
  "calledBy": ["node_3"],
  "calls": ["node_2"]
}
```

#### GET `/api/graph/:repoId/search`
**Auth:** Required
**Query:** `?q=renderApp`
**Response (200):**
```json
{
  "results": [
    {
      "id": "node_2",
      "type": "function",
      "label": "renderApp",
      "filePath": "src/index.js",
      "score": 0.95
    }
  ]
}
```

---

### 1.4 團隊 API（`/api/teams`）

#### POST `/api/teams`
**Auth:** Required
**Request:**
```json
{
  "name": "Acme Engineering",
  "slug": "acme-eng"
}
```
**Response (201):**
```json
{
  "id": "uuid",
  "name": "Acme Engineering",
  "slug": "acme-eng",
  "ownerId": "uuid",
  "createdAt": "2026-04-12T00:00:00Z"
}
```

#### POST `/api/teams/:id/invite`
**Auth:** Required (owner only)
**Request:**
```json
{
  "email": "newmember@example.com",
  "role": "member"
}
```
**Response (200):**
```json
{
  "invitationId": "uuid",
  "status": "pending"
}
```

#### GET `/api/teams/:id/members`
**Auth:** Required (member)
**Response (200):**
```json
{
  "members": [
    { "userId": "uuid", "name": "John", "email": "john@example.com", "role": "owner" },
    { "userId": "uuid", "name": "Jane", "email": "jane@example.com", "role": "member" }
  ]
}
```

---

### 1.5 匯出 API（`/api/export`）

#### POST `/api/export/:repoId/markdown`
**Auth:** Required
**Request:**
```json
{
  "nodeIds": ["node_1", "node_2"],
  "includeAnnotations": true,
  "includeEmbeddings": true
}
```
**Response (200):**
```json
{
  "markdown": "# Module Documentation\n\n## src/index.js\n\nMain entry point...\n\n## renderApp\n\nRenders the main...",
  "filename": "react-docs.md"
}
```

---

## 2. 資料庫 Schema

### 2.1 PostgreSQL Schema

```sql
-- 使用者
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  plan VARCHAR(50) DEFAULT 'free',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 團隊
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  owner_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 團隊成員
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(team_id, user_id)
);

-- Repo 中繼資料
CREATE TABLE repos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  team_id UUID REFERENCES teams(id),
  name VARCHAR(255) NOT NULL,
  github_url VARCHAR(500) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  node_count INTEGER DEFAULT 0,
  edge_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_repos_user_id ON repos(user_id);
CREATE INDEX idx_repos_team_id ON repos(team_id);
CREATE INDEX idx_team_members_user_id ON team_members(user_id);
CREATE INDEX idx_team_members_team_id ON team_members(team_id);
```

### 2.2 Neo4j Schema

```
(:File {
  id: String,
  repoId: String,
  name: String,
  path: String,
  description: String,
  linesOfCode: Integer
})

(:Function {
  id: String,
  repoId: String,
  name: String,
  filePath: String,
  line: Integer,
  endLine: Integer,
  description: String
})

(:File)-[:CALLS]->(:Function)
(:Function)-[:CALLS]->(:Function)
(:File)-[:IMPORTS]->(:File)
(:File)-[:CONTAINS]->(:Function)
```

### 2.3 Redis Keys

| Pattern | 用途 | TTL |
|---------|------|-----|
| `session:{userId}` | 使用者工作階段 | 24h |
| `graph:{repoId}:nodes` | 圖譜節點快取 | 1h |
| `graph:{repoId}:edges` | 圖譜邊快取 | 1h |
| `rate:{ip}` | API 速率限制計數 | 1min |
| `job:{repoId}:status` | 分析任務狀態 | 10min |

---

## 3. 錯誤處理

### 3.1 錯誤響應格式

所有 API 錯誤遵循以下格式：

```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "The requested repository does not exist",
    "details": {}
  }
}
```

### 3.2 錯誤碼定義

| HTTP 狀態 | 錯誤碼 | 說明 |
|-----------|--------|------|
| 400 | `VALIDATION_ERROR` | 請求參數校驗失敗 |
| 401 | `UNAUTHORIZED` | 未提供或無效的 JWT token |
| 403 | `FORBIDDEN` | 無權限存取該資源 |
| 404 | `RESOURCE_NOT_FOUND` | 資源不存在 |
| 409 | `CONFLICT` | 資源衝突（如 Email 已被註冊） |
| 429 | `RATE_LIMITED` | 請求頻率超標 |
| 500 | `INTERNAL_ERROR` | 伺服器內部錯誤 |

### 3.3 錯誤處理 Middleware

```typescript
// Express error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  const status = err.status || 500;
  const code = err.code || 'INTERNAL_ERROR';

  res.status(status).json({
    error: {
      code,
      message: err.message,
      details: err.details || {}
    }
  });
});
```

---

## 4. 模組介面

### 4.1 Code Analysis Service（Python/FastAPI）

```python
# main.py
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="Code Analysis Service")

class AnalyzeRequest(BaseModel):
    github_url: str
    repo_id: str

class AnalyzeResponse(BaseModel):
    job_id: str
    status: str

@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze_repo(request: AnalyzeRequest):
    """Clone GitHub repo and build call graph"""
    ...

@app.get("/analyze/{job_id}/status")
async def get_status(job_id: str):
    """Get analysis job status"""
    ...

@app.get("/graph/{repo_id}")
async def get_graph(repo_id: str):
    """Fetch the built graph from Neo4j"""
    ...
```

### 4.2 Graph Service（Node.js/Express）

```typescript
// graphService.ts
interface GraphController {
  getGraph(req: Request, res: Response): Promise<void>;
  getNode(req: Request, res: Response): Promise<void>;
  searchNodes(req: Request, res: Response): Promise<void>;
}

interface GraphService {
  fetchFromNeo4j(repoId: string): Promise<GraphData>;
  cacheGraph(repoId: string, data: GraphData): Promise<void>;
}
```

### 4.3 Auth Service（Node.js/Express）

```typescript
// authController.ts
interface AuthController {
  register(req: Request, res: Response): Promise<void>;
  login(req: Request, res: Response): Promise<void>;
  refresh(req: Request, res: Response): Promise<void>;
}

interface TokenPayload {
  userId: string;
  email: string;
  plan: string;
}
```

---

## 5. 速率限制

| 方案 | 限制 |
|------|------|
| Free | 100 req/min |
| Team | 1000 req/min |
| Enterprise | 10000 req/min |

超過限制時返回 `429 Rate Limited`，包含 `Retry-After` header。

---

*文件版本：v1.0*
*最後更新：2026-04-12*
