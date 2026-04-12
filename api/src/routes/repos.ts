import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { createError } from '../middleware/errorHandler';
import { authenticate } from '../middleware/auth';

const router = Router();

interface Repo {
  id: string;
  userId: string;
  teamId: string | null;
  name: string;
  githubUrl: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  nodeCount: number;
  edgeCount: number;
  createdAt: Date;
}

const repos = new Map<string, Repo>();

router.post('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { githubUrl, name } = req.body;

    if (!githubUrl || !name) {
      throw createError('GitHub URL and name are required', 400, 'VALIDATION_ERROR');
    }

    const repo: Repo = {
      id: uuidv4(),
      userId: req.user!.userId,
      teamId: null,
      name,
      githubUrl,
      status: 'pending',
      nodeCount: 0,
      edgeCount: 0,
      createdAt: new Date(),
    };

    repos.set(repo.id, repo);

    res.status(202).json(repo);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const repo = repos.get(req.params.id);

    if (!repo) {
      throw createError('Repository not found', 404, 'RESOURCE_NOT_FOUND');
    }

    if (repo.userId !== req.user!.userId) {
      throw createError('Access denied', 403, 'FORBIDDEN');
    }

    res.json(repo);
  } catch (err) {
    next(err);
  }
});

router.get('/:id/status', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const repo = repos.get(req.params.id);

    if (!repo) {
      throw createError('Repository not found', 404, 'RESOURCE_NOT_FOUND');
    }

    res.json({
      status: repo.status,
      progress: repo.status === 'completed' ? 100 : repo.status === 'processing' ? 50 : 10,
      message: repo.status === 'completed' ? 'Graph ready' : 'Analyzing...',
    });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const repo = repos.get(req.params.id);

    if (!repo) {
      throw createError('Repository not found', 404, 'RESOURCE_NOT_FOUND');
    }

    if (repo.userId !== req.user!.userId) {
      throw createError('Access denied', 403, 'FORBIDDEN');
    }

    repos.delete(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userRepos: Repo[] = [];
    for (const repo of repos.values()) {
      if (repo.userId === req.user!.userId) {
        userRepos.push(repo);
      }
    }

    res.json(userRepos);
  } catch (err) {
    next(err);
  }
});

export default router;
