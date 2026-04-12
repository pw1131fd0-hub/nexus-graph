import express from 'express';
import cors from 'cors';
import * as http from 'http';
import {AddressInfo} from 'net';

interface TestApp {
  app: express.Express;
  server: http.Server;
  baseUrl: string;
}

export async function createTestApp(): Promise<TestApp> {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({status: 'ok'});
  });

  app.post('/api/auth/register', (req, res) => {
    const {email, password, name} = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({
        error: {code: 'VALIDATION_ERROR', message: 'Missing required fields'}
      });
    }
    res.status(201).json({id: 'test-id', email, name});
  });

  app.post('/api/auth/login', (req, res) => {
    const {email, password} = req.body;
    if (!email || !password) {
      return res.status(400).json({
        error: {code: 'VALIDATION_ERROR', message: 'Missing credentials'}
      });
    }
    if (email === 'fail@test.com') {
      return res.status(401).json({
        error: {code: 'UNAUTHORIZED', message: 'Invalid credentials'}
      });
    }
    res.json({
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token',
      user: {id: 'test-id', email, name: 'Test User'}
    });
  });

  app.get('/api/repos', (req, res) => {
    const auth = req.headers.authorization;
    if (!auth) {
      return res.status(401).json({
        error: {code: 'UNAUTHORIZED', message: 'No token provided'}
      });
    }
    res.json([
      {id: '1', name: 'test-repo', status: 'completed'}
    ]);
  });

  app.get('/api/repos/:id', (req, res) => {
    res.json({
      id: req.params.id,
      name: 'test-repo',
      status: 'completed',
      nodeCount: 100,
      edgeCount: 200
    });
  });

  app.get('/api/graph/:repoId', (req, res) => {
    res.json({
      nodes: [
        {id: 'n1', type: 'file', label: 'index.js', filePath: 'src/index.js', description: 'Entry point', metrics: {linesOfCode: 50, functionCount: 3}},
        {id: 'n2', type: 'function', label: 'main', filePath: 'src/index.js', description: 'Main function', metrics: {linesOfCode: 10, functionCount: 1}}
      ],
      edges: [
        {id: 'e1', source: 'n1', target: 'n2', type: 'CALLS'}
      ]
    });
  });

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));

  const {port} = server.address() as AddressInfo;
  return {
    app,
    server,
    baseUrl: `http://localhost:${port}`
  };
}

export async function closeTestApp(testApp: TestApp): Promise<void> {
  await new Promise<void>((resolve) => testApp.server.close(resolve));
}
