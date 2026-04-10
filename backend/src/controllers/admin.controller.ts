import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin as supabase } from '../config/supabase';
import { AppError } from '../middleware/error.middleware';

// ─────────────────────────────────────────────────────────────
// NATIONAL STATS  [Admin / Government]
// GET /api/admin/stats
// ─────────────────────────────────────────────────────────────
export const getStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [totalRx, dispensedRx, fraudRx, patientCount] = await Promise.all([
      supabase.from('Prescriptions').select('id', { count: 'exact', head: true }),
      supabase.from('Prescriptions').select('id', { count: 'exact', head: true }).eq('status', 'dispensed'),
      supabase.from('SecurityLogs').select('id', { count: 'exact', head: true }).eq('type', 'double_dispense'),
      supabase.from('Patients').select('id', { count: 'exact', head: true }),
    ]);

    res.status(200).json({
      totalPrescriptions: totalRx.count ?? 0,
      dispensedPrescriptions: dispensedRx.count ?? 0,
      fraudAttempts: fraudRx.count ?? 0,
      registeredPatients: patientCount.count ?? 0,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// SECURITY LOGS  [Admin / Government]
// GET /api/admin/security-logs
// ─────────────────────────────────────────────────────────────
export const getSecurityLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;

    const { data: logs, error } = await supabase
      .from('SecurityLogs')
      .select('id, type, location, severity, created_at, metadata')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    res.status(200).json({ logs: logs || [] });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// LOG SECURITY EVENT  (internal helper called by dispense logic)
// POST /api/admin/security-logs
// ─────────────────────────────────────────────────────────────
export const logSecurityEvent = async (
  type: string,
  location: string,
  severity: 'low' | 'medium' | 'high',
  metadata?: Record<string, any>
): Promise<void> => {
  try {
    await supabase.from('SecurityLogs').insert([{
      type,
      location,
      severity,
      metadata: metadata || {},
    }]);
  } catch (err) {
    console.error('[SecurityLog] Failed to log event:', err);
  }
};
