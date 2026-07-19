import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { MeetingTokenEncryptionException } from '../exceptions';

const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12;

export interface EncryptedPayload {
  ciphertext: string;
  iv: string;
  authTag: string;
}

/** Compact AEAD blob for single-column secrets (host URL / passcode). */
export function encryptSecret(plaintext: string, keyMaterial: string | undefined): string {
  const { ciphertext, iv, authTag } = encryptPayload(plaintext, keyMaterial);
  return `${iv}.${authTag}.${ciphertext}`;
}

export function decryptSecret(blob: string, keyMaterial: string | undefined): string {
  const [iv, authTag, ciphertext] = blob.split('.');
  if (!iv || !authTag || !ciphertext) {
    throw new MeetingTokenEncryptionException('Encrypted secret format is invalid.');
  }
  return decryptPayload({ ciphertext, iv, authTag }, keyMaterial);
}

export function encryptPayload(plaintext: string, keyMaterial: string | undefined): EncryptedPayload {
  const key = resolveKey(keyMaterial);
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  return {
    ciphertext: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    authTag: cipher.getAuthTag().toString('base64'),
  };
}

export function decryptPayload(
  payload: EncryptedPayload,
  keyMaterial: string | undefined,
): string {
  const key = resolveKey(keyMaterial);
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(payload.iv, 'base64'));
  decipher.setAuthTag(Buffer.from(payload.authTag, 'base64'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(payload.ciphertext, 'base64')),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
}

export function hashValue(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function resolveKey(keyMaterial: string | undefined): Buffer {
  if (!keyMaterial?.trim()) {
    throw new MeetingTokenEncryptionException(
      'TOKEN_ENCRYPTION_KEY is required for meeting OAuth token storage.',
    );
  }
  const trimmed = keyMaterial.trim();
  if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
    return Buffer.from(trimmed, 'hex');
  }
  try {
    const fromB64 = Buffer.from(trimmed, 'base64');
    if (fromB64.length === 32) {
      return fromB64;
    }
  } catch {
    // fall through to derive
  }
  // Deterministic 32-byte key derivation for non-raw materials (dev convenience).
  return createHash('sha256').update(trimmed).digest();
}
