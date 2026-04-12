import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { createError } from '../middleware/errorHandler';
import { authenticate } from '../middleware/auth';

const router = Router();

interface Team {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  createdAt: Date;
}

interface TeamMember {
  userId: string;
  name: string;
  email: string;
  role: 'owner' | 'member';
}

const teams = new Map<string, Team>();
const teamMembers = new Map<string, TeamMember[]>();

router.post('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, slug } = req.body;

    if (!name || !slug) {
      throw createError('Team name and slug are required', 400, 'VALIDATION_ERROR');
    }

    for (const team of teams.values()) {
      if (team.slug === slug) {
        throw createError('Slug already taken', 409, 'CONFLICT');
      }
    }

    const team: Team = {
      id: uuidv4(),
      name,
      slug,
      ownerId: req.user!.userId,
      createdAt: new Date(),
    };

    teams.set(team.id, team);
    teamMembers.set(team.id, [
      { userId: req.user!.userId, name: req.user!.email, email: req.user!.email, role: 'owner' },
    ]);

    res.status(201).json(team);
  } catch (err) {
    next(err);
  }
});

router.get('/:id/members', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const team = teams.get(req.params.id);
    if (!team) {
      throw createError('Team not found', 404, 'RESOURCE_NOT_FOUND');
    }

    const members = teamMembers.get(req.params.id) || [];
    res.json({ members });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/invite', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const team = teams.get(req.params.id);
    if (!team) {
      throw createError('Team not found', 404, 'RESOURCE_NOT_FOUND');
    }

    if (team.ownerId !== req.user!.userId) {
      throw createError('Only team owner can invite members', 403, 'FORBIDDEN');
    }

    const { email, role } = req.body;
    if (!email) {
      throw createError('Email is required', 400, 'VALIDATION_ERROR');
    }

    res.json({
      invitationId: uuidv4(),
      status: 'pending',
    });
  } catch (err) {
    next(err);
  }
});

export default router;
