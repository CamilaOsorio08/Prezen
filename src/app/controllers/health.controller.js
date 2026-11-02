import { HealthModel } from '../models/health.model.js';

export function getHealth(req, res) {
  res.json({ success: true, data: { status: 'ok' } });
}

export async function getDatabaseHealth(req, res, next) {
  try {
    await HealthModel.checkDatabase();
    res.json({ success: true, data: { status: 'ok', db: 'supabase' } });
  } catch (error) {
    next(error);
  }
}
