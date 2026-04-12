# NexusGraph API

API running at `http://localhost:4000`

## Endpoints

### Health
- `GET /health` - Health check

### Auth
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh access token

### Repos
- `POST /api/repos` - Create repo analysis job
- `GET /api/repos` - List user's repos
- `GET /api/repos/:id` - Get repo details
- `GET /api/repos/:id/status` - Get analysis status
- `DELETE /api/repos/:id` - Delete repo

### Graph
- `GET /api/graph/:repoId` - Get graph data
- `GET /api/graph/:repoId/nodes/:nodeId` - Get node details
- `GET /api/graph/:repoId/search?q=query` - Search nodes

### Teams
- `POST /api/teams` - Create team
- `GET /api/teams/:id/members` - Get team members
- `POST /api/teams/:id/invite` - Invite member

### Export
- `POST /api/export/:repoId/markdown` - Export as Markdown
