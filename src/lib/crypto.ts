import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';

// AES-256-GCM encryption for API keys and secrets.
// The encryption key is stored as an env var and NEVER in the database.
// Each secret gets a unique IV and auth tag for integrity verification.

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;     // 128-bit IV for GCM
const KEY_LENGTH = 32;    // 256-bit key

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) throw new Error('ENCRYPTION_KEY environment variable is not set');
  const buf = Buffer.from(key, 'hex');
  if (buf.length !== KEY_LENGTH) {
    throw new Error(`ENCRYPTION_KEY must be ${KEY_LENGTH} bytes (${KEY_LENGTH * 2} hex chars)`);
  }
  return buf;
}

export interface EncryptedData {
  encrypted_value: string;  // base64
  iv: string;               // base64
  auth_tag: string;         // base64
}

export function encrypt(plaintext: string): EncryptedData {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const authTag = cipher.getAuthTag();

  return {
    encrypted_value: encrypted,
    iv: iv.toString('base64'),
    auth_tag: authTag.toString('base64'),
  };
}

export function decrypt(data: EncryptedData): string {
  const key = getEncryptionKey();
  const iv = Buffer.from(data.iv, 'base64');
  const authTag = Buffer.from(data.auth_tag, 'base64');
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(data.encrypted_value, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
