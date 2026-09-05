import { describe, it, expect } from 'vitest';
import {
  validateFileSize,
  validateFileExtension,
  validateFile,
  MAX_UPLOAD_SIZE_BYTES,
  MAX_UPLOAD_SIZE_MB,
  EXTENSIONES_AVAL,
} from './fileValidation';

function makeFile(sizeBytes: number, name = 'archivo.pdf'): File {
  return new File([new Uint8Array(sizeBytes)], name, { type: 'application/pdf' });
}

describe('validateFileSize', () => {
  it('acepta un archivo por debajo del límite', () => {
    const file = makeFile(MAX_UPLOAD_SIZE_BYTES - 1);
    expect(validateFileSize(file)).toBeNull();
  });

  it('acepta un archivo exactamente en el límite', () => {
    const file = makeFile(MAX_UPLOAD_SIZE_BYTES);
    expect(validateFileSize(file)).toBeNull();
  });

  it('rechaza un archivo que excede el límite', () => {
    const file = makeFile(MAX_UPLOAD_SIZE_BYTES + 1);
    const error = validateFileSize(file);
    expect(error).not.toBeNull();
    expect(error).toContain(`${MAX_UPLOAD_SIZE_MB}MB`);
  });
});

describe('validateFileExtension', () => {
  it('acepta una extensión de la whitelist general por defecto', () => {
    expect(validateFileExtension(makeFile(10, 'a.pdf'))).toBeNull();
    expect(validateFileExtension(makeFile(10, 'a.xlsx'))).toBeNull();
  });

  it('rechaza una extensión fuera de la whitelist', () => {
    const error = validateFileExtension(makeFile(10, 'virus.exe'));
    expect(error).not.toBeNull();
  });

  it('respeta una whitelist restringida (aval institucional: solo .pdf)', () => {
    expect(validateFileExtension(makeFile(10, 'a.pdf'), EXTENSIONES_AVAL)).toBeNull();
    expect(validateFileExtension(makeFile(10, 'a.docx'), EXTENSIONES_AVAL)).not.toBeNull();
  });
});

describe('validateFile', () => {
  it('reporta el primer error entre extensión y tamaño', () => {
    expect(validateFile(makeFile(10, 'virus.exe'))).not.toBeNull();
    expect(validateFile(makeFile(MAX_UPLOAD_SIZE_BYTES + 1, 'a.pdf'))).not.toBeNull();
    expect(validateFile(makeFile(10, 'a.pdf'))).toBeNull();
  });
});
