import { jest } from '@jest/globals';

jest.unstable_mockModule('../../app/config/supabaseAdmin.js', () => ({
  supabaseAdmin: { from: jest.fn() },
}));

const { registrarPorQr } = await import('../../app/services/asistencia.service.js');
const { supabaseAdmin } = await import('../../app/config/supabaseAdmin.js');

test('si el código QR no existe, registrarPorQr lanza CODIGO_QR_INVALIDO', async () => {
  supabaseAdmin.from.mockReturnValue({
    select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }),
  });

  await expect(registrarPorQr('coordinador-uuid', 1, 'codigo-inexistente')).rejects.toThrow(
    'El código QR no corresponde a ningún estudiante activo.'
  );
});