import { Request, Response, NextFunction } from 'express';
import * as jose from 'jose';
import { createError } from './errorHandler';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'nexus-graph-dev-secret-change-in-production'
);

export interface TokenPayload {
  userId: string;
  email: string;
  plan: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createError('No token provided', 401, 'UNAUTHORIZED');
    }

    const token = authHeader.substring(7);

    try {
      const { payload } = await jose.jwtVerify(token, JWT_SECRET);
      req.user = payload as TokenPayload;
      next();
    } catch {
      throw createError('Invalid or expired token', 401, 'UNAUTHORIZED');
    }
  } catch (err) {
    next(err);
  }
};
