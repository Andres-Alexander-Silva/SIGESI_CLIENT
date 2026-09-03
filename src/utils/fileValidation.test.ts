import { describe, it, expect } from 'vitest';
import { validateFileSize, MAX_UPLOAD_SIZE_BYTES, MAX_UPLOAD_SIZE_MB } from './fileValidation';

function makeFile(sizeBytes: number): File {
  return new File([new Uint8Array(sizeBytes)], 'archivo.pdf', { type: 'application/pdf' });
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
