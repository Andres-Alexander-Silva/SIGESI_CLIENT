import { describe, it, expect } from 'vitest';
import { formatApiError } from './apiError';

describe('formatApiError', () => {
  it('concatena los mensajes de un error de campo tipo DRF ({campo: [mensajes]})', () => {
    const error = { response: { data: { password: ['La contraseña es obligatoria.'] } } };
    expect(formatApiError(error)).toBe('La contraseña es obligatoria.');
  });

  it('concatena varios campos con espacio', () => {
    const error = {
      response: {
        data: {
          email: ['Este campo es obligatorio.'],
          password: ['La contraseña es muy corta.'],
        },
      },
    };
    const result = formatApiError(error);
    expect(result).toContain('Este campo es obligatorio.');
    expect(result).toContain('La contraseña es muy corta.');
  });

  it('devuelve el string directo si la respuesta ya es un string', () => {
    const error = { response: { data: 'Error de servidor' } };
    expect(formatApiError(error)).toBe('Error de servidor');
  });

  it('devuelve el mensaje por defecto si no hay data reconocible', () => {
    expect(formatApiError(undefined, 'Ocurrió un error.')).toBe('Ocurrió un error.');
  });

  it('usa el mensaje por defecto genérico si no se especifica uno', () => {
    expect(formatApiError(undefined)).toBe('Ocurrió un error.');
  });

  it('devuelve cadena vacía si la respuesta es un objeto sin campos', () => {
    // Comportamiento actual de formatApiError: un objeto vacío no cae en el
    // mensaje por defecto porque `{} && typeof {} === 'object'` es verdadero.
    expect(formatApiError({})).toBe('');
  });
});
