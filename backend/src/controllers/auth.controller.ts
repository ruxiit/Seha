import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabaseAdmin as supabase } from '../config/supabase';
import { hashNIN, hashPhone, encryptData, decryptData } from '../utils/crypto';
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
      .select('id, nin_hash, password_hash, role, encrypted_profile')
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

    // Decrypt profile if present
    let profile: Record<string, any> = {};
    if (user.encrypted_profile) {
      try {
        profile = JSON.parse(decryptData(user.encrypted_profile));
      } catch (e) {
        console.error('Failed to decrypt profile', e);
      }
    }

    res.status(200).json({
      message: 'Login successful',
      token,
      user: payload,
      profile,
    });
  } catch (error) {
    next(error);
  }
};

export const requestOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { nin, phone } = req.body;

    if (!nin || !phone) {
      const err = new Error('NIN and phone are required') as AppError;
      err.status = 400;
      throw err;
    }

    const nin_hash = hashNIN(nin);
    const phone_hash = hashPhone(phone);

    // Verify user by hashed NIN and hashed phone from 'Users' table
    const { data: user, error } = await supabase
      .from('Users')
      .select('id')
      .eq('nin_hash', nin_hash)
      .eq('phone_hash', phone_hash)
      .eq('role', 'patient')
      .single();

    if (error || !user) {
      const err = new Error('Patient not found or credentials mismatch') as AppError;
      err.status = 404;
      throw err;
    }

    // In a real app, send OTP to phone here. We mock it for MVP.
    res.status(200).json({
      message: 'OTP sent successfully (mocked 1234)'
    });
  } catch (error) {
    next(error);
  }
};

export const verifyPatientOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { nin, phone, otp } = req.body;

    if (!nin || !phone || !otp) {
      const err = new Error('NIN, phone and OTP are required') as AppError;
      err.status = 400;
      throw err;
    }

    if (otp !== '1234') {
      const err = new Error('Invalid OTP') as AppError;
      err.status = 400;
      throw err;
    }

    const nin_hash = hashNIN(nin);
    const phone_hash = hashPhone(phone);

    const { data: user, error } = await supabase
      .from('Users')
      .select('id, encrypted_profile, role')
      .eq('nin_hash', nin_hash)
      .eq('phone_hash', phone_hash)
      .eq('role', 'patient')
      .single();

    if (error || !user) {
      const err = new Error('Patient not found') as AppError;
      err.status = 404;
      throw err;
    }

    let profile = {};
    if (user.encrypted_profile) {
      try {
        profile = JSON.parse(decryptData(user.encrypted_profile));
      } catch (e) {
        console.error('Failed to decrypt profile', e);
      }
    }

    // Usually we would sign a JWT here. For MVP OTP flow, we return success + profile.
    res.status(200).json({
      message: 'OTP verified successfully',
      profile
    });
  } catch (error) {
    next(error);
  }
};

export const adminLogin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { password } = req.body;

    if (!password) {
      const err = new Error('Password is required') as AppError;
      err.status = 400;
      throw err;
    }

    // Check hardcoded admin password
    if (password !== 'adminseha2026') {
      const err = new Error('Invalid admin password') as AppError;
      err.status = 401;
      throw err;
    }

    // Create JWT token for admin
    const payload = {
      id: 'admin_user',
      nin_hash: 'admin',
      role: 'admin'
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    res.status(200).json({
      message: 'Admin login successful',
      token,
      user: payload,
    });
  } catch (error) {
    next(error);
  }
};

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { nin, phone, password, role, profileData } = req.body;

    if (!nin || !phone || !password || !role) {
      const err = new Error('Missing required fields') as AppError;
      err.status = 400;
      throw err;
    }

    const nin_hash = hashNIN(nin);
    const phone_hash = hashPhone(phone);

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('Users')
      .select('id')
      .eq('nin_hash', nin_hash)
      .single();

    if (existingUser) {
      const err = new Error('User with this NIN already exists') as AppError;
      err.status = 409;
      throw err;
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    
    const encrypted_profile = profileData ? encryptData(JSON.stringify(profileData)) : null;

    const { data: user, error } = await supabase
      .from('Users')
      .insert([{ nin_hash, phone_hash, password_hash, role, encrypted_profile }])
      .select('id, nin_hash, role')
      .single();

    if (error) throw error;

    res.status(201).json({ message: 'User created', user });
  } catch (error) {
    next(error);
  }
};