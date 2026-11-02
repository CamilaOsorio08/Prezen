import { AppError } from '../../lib/appError.js';
import { createTextPdf } from '../../lib/simplePdf.js';
import { AttendanceModel } from '../models/attendance.model.js';
import { GroupModel } from '../models/group.model.js';
import { PeriodModel } from '../models/period.model.js';
import { UserModel } from '../models/user.model.js';

function monthRange(month) {
  const start = `${month}-01`;
  const [year, monthNumber] = month.split('-').map(Number);
  const end = new Date(Date.UTC(year, monthNumber, 0)).toISOString().slice(0, 10);
  return { start, end };
}

async function getScope(user) {
  if (user.rol === 'admin') {
    const groups = await GroupModel.listAll();
    return { groupIds: groups.map((group) => group.id), studentIds: null };
  }
  if (user.rol === 'director_grupo') {
    const groups = await GroupModel.getByDirector(user.id);
    return { groupIds: groups.map((group) => group.id), studentIds: null };
  }
  if (user.rol === 'coordinador') {
    return { groupIds: await GroupModel.getIdsByCoordinator(user.id), studentIds: null };
  }
  if (user.rol === 'padre_familia') {
    return { groupIds: [], studentIds: await GroupModel.getStudentIdsByCaregiver(user.id) };
  }
  if (user.rol === 'estudiante') {
    return { groupIds: [], studentIds: [user.id] };
  }
  throw new AppError(403, 'ROL_NO_VALIDO', 'El rol de usuario no tiene reportes disponibles.');
}

export async function downloadAttendanceReport(req, res, next) {
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
    const week = req.query.week == null ? null : Number(req.query.week);
    if (week !== null && (!Number.isInteger(week) || week < 1 || week > 6)) {
      throw new AppError(400, 'SEMANA_INVALIDA', 'La semana debe estar entre 1 y 6.');
    }
    const scope = await getScope(req.user);
    let groupIds = scope.groupIds;
    let studentIds = scope.studentIds;
    let enrollments = [];
    if (studentIds) {
      enrollments = await GroupModel.getActiveEnrollmentsByStudents(studentIds);
      groupIds = [...new Set(enrollments.map((enrollment) => enrollment.grupo_id))];
      studentIds = enrollments.map((enrollment) => enrollment.estudiante_usuario_id);
    } else if (groupIds.length) {
      enrollments = await GroupModel.getActiveEnrollmentsByGroups(groupIds);
      studentIds = enrollments.map((enrollment) => enrollment.estudiante_usuario_id);
    } else {
      studentIds = [];
    }
    studentIds = [...new Set(studentIds)];

    const { start: monthStart, end: monthEnd } = monthRange(month);
    const periods = await PeriodModel.listForGroups(groupIds);
    const applicablePeriods = periodNumber == null
      ? periods
      : periods.filter((period) => period.numero === periodNumber);
    const periodByGroup = new Map(applicablePeriods.map((period) => [period.grupo_id, period]));
    const periodStart = applicablePeriods.length
      ? applicablePeriods.map((period) => period.fecha_inicio).sort()[0]
      : null;
    const periodEnd = applicablePeriods.length
      ? applicablePeriods.map((period) => period.fecha_fin).sort().at(-1)
      : null;
    const start = periodStart && periodStart > monthStart ? periodStart : monthStart;
    const end = periodEnd && periodEnd < monthEnd ? periodEnd : monthEnd;
    let sessions = start <= end
      ? (await AttendanceModel.getSessionsByGroupsSince(groupIds, start))
        .filter((session) => session.fecha <= end)
      : [];
    if (periodNumber !== null) {
      sessions = sessions.filter((session) => {
        const period = periodByGroup.get(session.grupo_id);
        return period && session.fecha >= period.fecha_inicio && session.fecha <= period.fecha_fin;
      });
    }
    if (week !== null) {
      const [year, monthNumber] = month.split('-').map(Number);
      const weekStart = new Date(Date.UTC(year, monthNumber - 1, (week - 1) * 7 + 1)).toISOString().slice(0, 10);
      const weekEnd = new Date(Date.UTC(year, monthNumber - 1, week * 7)).toISOString().slice(0, 10);
      sessions = sessions.filter((session) => session.fecha >= weekStart && session.fecha <= weekEnd);
    }
    const sessionIds = sessions.map((session) => session.id);
    const records = await AttendanceModel.getRecordsBySessionsAndStudents(sessionIds, studentIds);
    const [users, groups] = await Promise.all([
      UserModel.getNamesByIds(studentIds),
      GroupModel.getBasicByIds(groupIds),
    ]);
    const userNames = new Map(users.map((user) => [user.id, user.nombre]));
    const groupNames = new Map(groups.map((group) => [group.id, group.nombre]));
    const sessionById = new Map(sessions.map((session) => [session.id, session]));
    const totals = { presente: 0, tardanza: 0, ausente: 0 };
    const details = records.map((record) => {
      const session = sessionById.get(record.sesion_id);
      totals[record.estado] += 1;
      return {
        fecha: session?.fecha || '',
        tipo: session?.tipo || '',
        estudiante: userNames.get(record.estudiante_usuario_id) || 'Estudiante',
        grupo: groupNames.get(session?.grupo_id) || '',
        estado: record.estado,
      };
    }).sort((left, right) => left.fecha.localeCompare(right.fecha)
      || left.grupo.localeCompare(right.grupo)
      || left.estudiante.localeCompare(right.estudiante));

    const lines = [
      'PREZEN - REPORTE DE ASISTENCIA',
      `Usuario: ${req.user.nombre} (${req.user.rol})`,
      `Periodo consultado: ${month}`,
      `Filtro de periodo: ${periodNumber == null ? 'todos' : periodNumber} | Semana: ${week == null ? 'todas' : week}`,
      `Registros: ${details.length}`,
      `Presentes: ${totals.presente} | Tardanzas: ${totals.tardanza} | Ausentes: ${totals.ausente}`,
      '',
      'FECHA       TIPO     GRUPO      ESTUDIANTE                         ESTADO',
      '--------------------------------------------------------------------------',
      ...details.map((record) => [
        record.fecha.padEnd(11),
        record.tipo.padEnd(8),
        record.grupo.slice(0, 10).padEnd(10),
        record.estudiante.slice(0, 34).padEnd(34),
        record.estado,
      ].join(' ')),
    ];
    const pdf = createTextPdf(lines);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="prezen-asistencia-${month}.pdf"`,
      'Cache-Control': 'private, no-store',
    });
    res.send(pdf);
  } catch (error) {
    next(error);
  }
}
