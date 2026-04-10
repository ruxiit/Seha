import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest, User } from '../types';
import { AppError } from './error.middleware';

const JWT_SECRET = process.env.JWT_SECRET || 'hackathon-super-secret';

export const verifyToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const err = new Error('Unauthorized: No token provided') as AppError;
      err.status = 401;
      throw err;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as User;
    
    // Attach user to req for downstream usage
    req.user = decoded;
    next();
  } catch (error) {
    const err = new Error('Unauthorized: Invalid token') as AppError;
    err.status = 401;
    next(err);
  }
};

export const authorizeRole = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      const err = new Error('Forbidden: Insufficient privileges') as AppError;
      err.status = 403;
      next(err);
      return;
    }
    next();
  };
};