import { AppError } from '../../lib/appError.js';

export async function queryRows(query, context = 'No se pudieron cargar los datos.') {
  const { data, error } = await query;
  if (error) {
    throw new AppError(503, 'ERROR_CONSULTA_BD', context);
  }
  return data || [];
}

export async function queryOne(query, context = 'No se pudo cargar el registro.') {
  const { data, error } = await query;
  if (error) {
    throw new AppError(503, 'ERROR_CONSULTA_BD', context);
  }
  return data;
}

export async function queryAll(makeQuery, context = 'No se pudieron cargar los datos.') {
  const rows = [];
  const pageSize = 500;
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await makeQuery().range(offset, offset + pageSize - 1);
    if (error) {
      throw new AppError(503, 'ERROR_CONSULTA_BD', context);
    }
    rows.push(...(data || []));
    if (!data || data.length < pageSize) return rows;
  }
}
