import { Router, Request, Response, NextFunction } from 'express';
import { createError } from '../middleware/errorHandler';
import { authenticate } from '../middleware/auth';
import { db } from '../db';

const router = Router();

router.post('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { githubUrl, name } = req.body;

    if (!githubUrl || !name) {
      throw createError('GitHub URL and name are required', 400, 'VALIDATION_ERROR');
    }

    const repo = db.createRepo({
      userId: req.user!.userId,
      teamId: null,
      name,
      githubUrl,
      status: 'pending',
      nodeCount: 0,
      edgeCount: 0,
    });

    res.status(202).json(repo);
  } catch (err) {
    next(err);
  }
});

router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const repos = db.findReposByUserId(req.user!.userId);
    res.json(repos);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const repo = db.findRepoById(req.params.id);

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
    const repo = db.findRepoById(req.params.id);

    if (!repo) {
      throw createError('Repository not found', 404, 'RESOURCE_NOT_FOUND');
    }

    const progress =
      repo.status === 'completed' ? 100 :
      repo.status === 'processing' ? 50 : 10;

    res.json({
      status: repo.status,
      progress,
      message: repo.status === 'completed' ? 'Graph ready' : 'Analyzing...',
    });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const repo = db.findRepoById(req.params.id);

    if (!repo) {
      throw createError('Repository not found', 404, 'RESOURCE_NOT_FOUND');
    }

    if (repo.userId !== req.user!.userId) {
      throw createError('Access denied', 403, 'FORBIDDEN');
    }

    db.deleteRepo(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
