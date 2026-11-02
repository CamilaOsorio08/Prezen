import { NotificationModel } from '../models/notification.model.js';

export async function markNotificationsRead(req, res, next) {
  try {
    const updated = await NotificationModel.markAllReadForUser(req.user.id);
    res.json({ success: true, data: { actualizadas: updated.length } });
  } catch (error) {
    next(error);
  }
}
