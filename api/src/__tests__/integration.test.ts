import axios, {AxiosInstance} from 'axios';
import {createTestApp, closeTestApp, TestApp} from './test-app';

describe('Integration Tests', () => {
  let testApp: TestApp;
  let client: AxiosInstance;

  beforeAll(async () => {
    testApp = await createTestApp();
    client = axios.create({baseURL: testApp.baseUrl});
  });

  afterAll(async () => {
    await closeTestApp(testApp);
  });

  describe('Health Endpoint', () => {
    it('should return health status', async () => {
      const response = await client.get('/health');
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('status', 'ok');
    });
  });

  describe('Auth API', () => {
    it('should register new user', async () => {
      const response = await client.post('/api/auth/register', {
        email: 'newuser@test.com',
        password: 'password123',
        name: 'New User'
      });
      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('id');
      expect(response.data).toHaveProperty('email', 'newuser@test.com');
    });

    it('should reject registration with missing fields', async () => {
      try {
        await client.post('/api/auth/register', {
          email: 'test@test.com'
        });
        fail('Should have thrown error');
      } catch (err: any) {
        expect(err.response.status).toBe(400);
        expect(err.response.data.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should login with valid credentials', async () => {
      const response = await client.post('/api/auth/login', {
        email: 'user@test.com',
        password: 'password123'
      });
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('accessToken');
      expect(response.data).toHaveProperty('refreshToken');
      expect(response.data.user).toHaveProperty('email', 'user@test.com');
    });

    it('should reject login with invalid credentials', async () => {
      try {
        await client.post('/api/auth/login', {
          email: 'fail@test.com',
          password: 'wrongpassword'
        });
        fail('Should have thrown error');
      } catch (err: any) {
        expect(err.response.status).toBe(401);
        expect(err.response.data.error.code).toBe('UNAUTHORIZED');
      }
    });
  });

  describe('Repos API', () => {
    const authHeader = {Authorization: 'Bearer test-token'};

    it('should require authentication for listing repos', async () => {
      try {
        await client.get('/api/repos');
        fail('Should have thrown error');
      } catch (err: any) {
        expect(err.response.status).toBe(401);
      }
    });

    it('should return repos with valid auth', async () => {
      const response = await client.get('/api/repos', {headers: authHeader});
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
    });

    it('should return repo by id', async () => {
      const response = await client.get('/api/repos/123', {headers: authHeader});
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('id', '123');
      expect(response.data).toHaveProperty('status', 'completed');
    });
  });

  describe('Graph API', () => {
    it('should return graph data', async () => {
      const response = await client.get('/api/graph/react', {
        headers: {Authorization: 'Bearer test-token'}
      });
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('nodes');
      expect(response.data).toHaveProperty('edges');
      expect(Array.isArray(response.data.nodes)).toBe(true);
      expect(Array.isArray(response.data.edges)).toBe(true);
    });

    it('should have file and function nodes', async () => {
      const response = await client.get('/api/graph/react', {
        headers: {Authorization: 'Bearer test-token'}
      });
      const nodes = response.data.nodes;
      const fileNodes = nodes.filter((n: any) => n.type === 'file');
      const functionNodes = nodes.filter((n: any) => n.type === 'function');
      expect(fileNodes.length).toBeGreaterThan(0);
      expect(functionNodes.length).toBeGreaterThan(0);
    });

    it('should have CALLS edges between nodes', async () => {
      const response = await client.get('/api/graph/react', {
        headers: {Authorization: 'Bearer test-token'}
      });
      const edges = response.data.edges;
      const callsEdges = edges.filter((e: any) => e.type === 'CALLS');
      expect(callsEdges.length).toBeGreaterThan(0);
    });
  });
});
