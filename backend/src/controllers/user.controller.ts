import { Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { AuthRequest } from '../types';

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', req.user!.id)
      .single();

    if (error) {
      res.status(404).json({ message: 'Profile not found' });
      return;
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
};

export const updateMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, avatar_url } = req.body;

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ name, avatar_url, updated_at: new Date().toISOString() })
      .eq('id', req.user!.id)
      .select()
      .single();

    if (error) {
      res.status(400).json({ message: error.message });
      return;
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: (err as Error).message });
  }
};