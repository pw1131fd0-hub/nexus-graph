import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

import authRoutes from './routes/auth';
import reposRoutes from './routes/repos';
import graphRoutes from './routes/graph';
import teamsRoutes from './routes/teams';
import exportRoutes from './routes/export';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 4000;

app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(rateLimiter);

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/repos', reposRoutes);
app.use('/api/graph', graphRoutes);
app.use('/api/teams', teamsRoutes);
app.use('/api/export', exportRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`NexusGraph API running on port ${PORT}`);
});

export default app;
