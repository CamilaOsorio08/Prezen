import { AdminModel } from '../models/admin.model.js';

export async function getAdminStats(req, res, next) {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const [students, sessions, groups, coordinators, users] = await AdminModel.getCounts(today);
    res.json({
      success: true,
      data: {
        totalEstudiantes: students,
        sesionesHoy: sessions,
        gruposActivos: groups,
        coordinaciones: coordinators,
        totalUsuarios: users,
      },
    });
  } catch (error) {
    next(error);
  }
}
