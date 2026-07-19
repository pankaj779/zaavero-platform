import { describe, expect, it } from 'vitest';
import {
  decryptPayload,
  decryptSecret,
  encryptPayload,
  encryptSecret,
  hashValue,
} from '../utils/token-encryption';

describe('token-encryption', () => {
  const key = 'dev-only-meeting-token-encryption-key';

  it('round-trips payload encryption', () => {
    const encrypted = encryptPayload('access-token-value', key);
    expect(encrypted.ciphertext).toBeTruthy();
    expect(decryptPayload(encrypted, key)).toBe('access-token-value');
  });

  it('round-trips compact secrets', () => {
    const blob = encryptSecret('https://host.example/start', key);
    expect(blob.split('.')).toHaveLength(3);
    expect(decryptSecret(blob, key)).toBe('https://host.example/start');
  });

  it('hashes stably', () => {
    expect(hashValue('abc')).toBe(hashValue('abc'));
    expect(hashValue('abc')).not.toBe(hashValue('abcd'));
  });
});
