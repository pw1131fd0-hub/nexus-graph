import { Router, Request, Response, NextFunction } from 'express';
import * as jose from 'jose';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { createError } from '../middleware/errorHandler';

const router = Router();
const BCRYPT_ROUNDS = 12;
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'nexus-graph-dev-secret-change-in-production'
);

interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  plan: string;
  createdAt: Date;
}

const users = new Map<string, User>();

const findUserByEmail = (email: string): User | undefined => {
  for (const user of users.values()) {
    if (user.email === email) return user;
  }
  return undefined;
};

router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      throw createError('Email, password, and name are required', 400, 'VALIDATION_ERROR');
    }

    if (findUserByEmail(email)) {
      throw createError('Email already registered', 409, 'CONFLICT');
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user: User = {
      id: uuidv4(),
      email,
      passwordHash,
      name,
      plan: 'free',
      createdAt: new Date(),
    };

    users.set(user.id, user);

    res.status(201).json({
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw createError('Email and password are required', 400, 'VALIDATION_ERROR');
    }

    const user = findUserByEmail(email);
    if (!user) {
      throw createError('Invalid credentials', 401, 'UNAUTHORIZED');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw createError('Invalid credentials', 401, 'UNAUTHORIZED');
    }

    const accessToken = await new jose.SignJWT({
      userId: user.id,
      email: user.email,
      plan: user.plan,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('24h')
      .sign(JWT_SECRET);

    const refreshToken = await new jose.SignJWT({ userId: user.id })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(JWT_SECRET);

    res.json({
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw createError('Refresh token is required', 400, 'VALIDATION_ERROR');
    }

    try {
      const { payload } = await jose.jwtVerify(refreshToken, JWT_SECRET);
      const user = users.get(payload.userId as string);

      if (!user) {
        throw createError('User not found', 401, 'UNAUTHORIZED');
      }

      const accessToken = await new jose.SignJWT({
        userId: user.id,
        email: user.email,
        plan: user.plan,
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('24h')
        .sign(JWT_SECRET);

      res.json({ accessToken });
    } catch {
      throw createError('Invalid refresh token', 401, 'UNAUTHORIZED');
    }
  } catch (err) {
    next(err);
  }
});

export default router;
