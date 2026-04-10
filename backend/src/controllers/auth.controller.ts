import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabaseAdmin as supabase } from '../config/supabase';
import { hashNIN } from '../utils/crypto';
import { AppError } from '../middleware/error.middleware';

const JWT_SECRET = process.env.JWT_SECRET || 'hackathon-super-secret';
const JWT_EXPIRES_IN = '1d';

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { nin, password } = req.body;

    if (!nin || !password) {
      const err = new Error('NIN and password are required') as AppError;
      err.status = 400;
      throw err;
    }

    const nin_hash = hashNIN(nin);

    // Verify user by hashed NIN from 'Users' table
    const { data: user, error } = await supabase
      .from('Users')
      .select('id, nin_hash, password_hash, role')
      .eq('nin_hash', nin_hash)
      .single();

    if (error || !user) {
      const err = new Error('Invalid credentials') as AppError;
      err.status = 401;
      throw err;
    }

    // Verify password using bcrypt
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      const err = new Error('Invalid credentials') as AppError;
      err.status = 401;
      throw err;
    }

    const payload = {
      id: user.id,
      nin_hash: user.nin_hash,
      role: user.role
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    res.status(200).json({
      message: 'Login successful',
      token,
      user: payload
    });
  } catch (error) {
    next(error);
  }
};

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { nin, password, role } = req.body;

    if (!nin || !password || !role) {
      const err = new Error('Missing required fields') as AppError;
      err.status = 400;
      throw err;
    }

    const nin_hash = hashNIN(nin);
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const { data: user, error } = await supabase
      .from('Users')
      .insert([{ nin_hash, password_hash, role }])
      .select('id, nin_hash, role')
      .single();

    if (error) throw error;

    res.status(201).json({ message: 'User created', user });
  } catch (error) {
    next(error);
  }
};