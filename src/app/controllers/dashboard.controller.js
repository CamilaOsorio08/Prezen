import { AttendanceModel } from '../models/attendance.model.js';
import { GroupModel } from '../models/group.model.js';
import { NotificationModel } from '../models/notification.model.js';
import { PeriodModel } from '../models/period.model.js';
import { UserModel } from '../models/user.model.js';
import { AppError } from '../../lib/appError.js';

export async function getDashboard(req, res, next) {
  try {
    const { id: userId, rol } = req.user;
    let groupIds = [];
    let studentIds = [];

    if (rol === 'admin') {
      const groups = await GroupModel.listAll();
      groupIds = groups.map((group) => group.id);
    } else if (rol === 'director_grupo') {
      const groups = await GroupModel.getByDirector(userId);
      groupIds = groups.map((group) => group.id);
    } else if (rol === 'coordinador') {
      groupIds = await GroupModel.getIdsByCoordinator(userId);
    } else if (rol === 'padre_familia') {
      studentIds = await GroupModel.getStudentIdsByCaregiver(userId);
    } else if (rol === 'estudiante') {
      studentIds = [userId];
    } else {
      throw new AppError(403, 'ROL_NO_VALIDO', 'El rol de usuario no tiene un panel habilitado.');
    }

    let enrollments = [];
    if (['admin', 'director_grupo', 'coordinador'].includes(rol) && groupIds.length) {
      enrollments = await GroupModel.getActiveEnrollmentsByGroups(groupIds);
      studentIds = enrollments.map((enrollment) => enrollment.estudiante_usuario_id);
    } else if (['padre_familia', 'estudiante'].includes(rol) && studentIds.length) {
      enrollments = await GroupModel.getActiveEnrollmentsByStudents(studentIds);
      groupIds = [...new Set(enrollments.map((enrollment) => enrollment.grupo_id))];
    }

    const groups = await GroupModel.getByIds(groupIds);
    const uniqueStudentIds = [...new Set(studentIds)];
    const users = await UserModel.getStudentsByIds(uniqueStudentIds);
    const groupById = new Map(groups.map((group) => [group.id, group]));
    const students = enrollments.map((enrollment) => {
      const group = groupById.get(enrollment.grupo_id);
      const user = users.find((candidate) => candidate.id === enrollment.estudiante_usuario_id);
      return {
        id: enrollment.estudiante_usuario_id,
        nombre: user?.nombre || '',
        estado: enrollment.estado,
        grupo_id: enrollment.grupo_id,
        grupo: group?.nombre || '',
        jornada: group?.jornada || '',
      };
    });

    const since = new Date();
    since.setUTCDate(since.getUTCDate() - 365);
    const sessions = await AttendanceModel.getSessionsByGroupsSince(groupIds, since.toISOString().slice(0, 10));
    const sessionIds = sessions.map((session) => session.id);
    const records = await AttendanceModel.getRecordsBySessionsAndStudents(sessionIds, uniqueStudentIds);
    const sessionById = new Map(sessions.map((session) => [session.id, session]));
    const studentById = new Map(students.map((student) => [student.id, student]));
    const attendance = records.map((record) => {
      const session = sessionById.get(record.sesion_id);
      return {
        ...record,
        fecha: session?.fecha || '',
        tipo: session?.tipo || '',
        estudiante: studentById.get(record.estudiante_usuario_id)?.nombre || '',
      };
    });

    const notifications = await NotificationModel.listForUser(userId);

    res.json({
      success: true,
      data: {
        profile: req.user,
        groups,
        students,
        attendance,
        notifications,
        totals: {
          students: students.length,
          present: attendance.filter((entry) => entry.fecha === new Date().toISOString().slice(0, 10) && entry.tipo === 'entrada' && entry.estado === 'presente').length,
          absent: attendance.filter((entry) => entry.fecha === new Date().toISOString().slice(0, 10) && entry.tipo === 'entrada' && entry.estado === 'ausente').length,
          late: attendance.filter((entry) => entry.fecha === new Date().toISOString().slice(0, 10) && entry.tipo === 'entrada' && entry.estado === 'tardanza').length,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getReports(req, res, next) {
  try {
    const monthInput = req.query.month;
    if (monthInput != null && (typeof monthInput !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(monthInput))) {
      throw new AppError(400, 'MES_INVALIDO', 'El mes debe tener formato YYYY-MM.');
    }
    const month = monthInput || new Date().toISOString().slice(0, 7);
    const periodNumber = req.query.period == null ? null : Number(req.query.period);
    if (periodNumber !== null && ![1, 2, 3].includes(periodNumber)) {
      throw new AppError(400, 'PERIODO_INVALIDO', 'El período debe ser 1, 2 o 3.');
    }
    const week = req.query.week == null || req.query.week === 'all' ? null : Number(req.query.week);
    if (week !== null && (!Number.isInteger(week) || week < 1 || week > 6)) {
      throw new AppError(400, 'SEMANA_INVALIDA', 'La semana debe estar entre 1 y 6.');
    }

    const groups = req.user.rol === 'admin'
      ? await GroupModel.listAll()
      : await GroupModel.getByDirector(req.user.id);
    const groupIds = groups.map((group) => group.id);
    const bounds = await PeriodModel.listForGroups(groupIds);
    const applicablePeriods = periodNumber === null ? bounds : bounds.filter((period) => period.numero === periodNumber);
    const periodByGroup = new Map(applicablePeriods.map((period) => [period.grupo_id, period]));
    const periodStart = applicablePeriods.length ? applicablePeriods.map((period) => period.fecha_inicio).sort()[0] : null;
    const periodEnd = applicablePeriods.length ? applicablePeriods.map((period) => period.fecha_fin).sort().at(-1) : null;
    const monthStart = `${month}-01`;
    const monthEnd = new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0)).toISOString().slice(0, 10);
    const startDate = periodStart && periodStart > monthStart ? periodStart : monthStart;
    const endDate = periodEnd && periodEnd < monthEnd ? periodEnd : monthEnd;
    const sessions = await AttendanceModel.getSessionsByGroupsBetween(groupIds, startDate, endDate);
    let filteredSessions = periodNumber === null
      ? sessions
      : sessions.filter((session) => {
        const period = periodByGroup.get(session.grupo_id);
        return period && session.fecha >= period.fecha_inicio && session.fecha <= period.fecha_fin;
      });
    if (week !== null) {
      const weekStart = new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)) - 1, (week - 1) * 7 + 1)).toISOString().slice(0, 10);
      const weekEnd = new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)) - 1, week * 7)).toISOString().slice(0, 10);
      filteredSessions = filteredSessions.filter((session) => session.fecha >= weekStart && session.fecha <= weekEnd);
    }
    const sessionIds = filteredSessions.map((session) => session.id);
    const records = await AttendanceModel.getRecordsBySessions(sessionIds);

    const daily = new Map();
    for (const session of filteredSessions) {
      const totals = daily.get(session.fecha) || { date: session.fecha, present: 0, absent: 0, late: 0 };
      daily.set(session.fecha, totals);
    }
    const sessionById = new Map(filteredSessions.map((session) => [session.id, session]));
    for (const record of records) {
      const date = sessionById.get(record.sesion_id)?.fecha;
      const totals = daily.get(date);
      if (!totals) continue;
      if (record.estado === 'presente') totals.present += 1;
      else if (record.estado === 'ausente') totals.absent += 1;
      else if (record.estado === 'tardanza') totals.late += 1;
    }
    const series = [...daily.values()].sort((a, b) => a.date.localeCompare(b.date));
    const present = series.reduce((sum, day) => sum + day.present, 0);
    const absent = series.reduce((sum, day) => sum + day.absent, 0);
    const late = series.reduce((sum, day) => sum + day.late, 0);
    const absentStudents = new Set(records.filter((record) => record.estado === 'ausente').map((record) => record.estudiante_usuario_id)).size;
    res.json({
      success: true,
      data: {
        month,
        period: periodNumber,
        week,
        groups,
        periods: bounds,
        summary: { present, absent, late, absentStudents, total: present + absent + late },
        series,
      },
    });
  } catch (error) {
    next(error);
  }
}
