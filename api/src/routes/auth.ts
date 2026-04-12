import { Router, Request, Response, NextFunction } from 'express';
import * as jose from 'jose';
import bcrypt from 'bcrypt';
import { createError } from '../middleware/errorHandler';
import { db } from '../db';

const router = Router();
const BCRYPT_ROUNDS = 12;
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'nexus-graph-dev-secret-change-in-production'
);

router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      throw createError('Email, password, and name are required', 400, 'VALIDATION_ERROR');
    }

    if (db.findUserByEmail(email)) {
      throw createError('Email already registered', 409, 'CONFLICT');
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = db.createUser({ email, passwordHash, name, plan: 'free' });

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

    const user = db.findUserByEmail(email);
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

    db.storeRefreshToken(refreshToken, user.id);

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
      const userId = db.getRefreshTokenUserId(refreshToken);

      if (userId !== payload.userId) {
        throw createError('Invalid refresh token', 401, 'UNAUTHORIZED');
      }

      const user = db.findUserById(payload.userId as string);
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
