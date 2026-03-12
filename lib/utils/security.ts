import crypto from 'crypto';
import bcrypt from 'bcryptjs';

/**
 * Generate a secure random API key
 */
export function generateApiKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash API key for storage
 */
export async function hashApiKey(apiKey: string): Promise<string> {
  return bcrypt.hash(apiKey, 10);
}

/**
 * Verify API key against hash
 */
export async function verifyApiKey(apiKey: string, hash: string): Promise<boolean> {
  return bcrypt.compare(apiKey, hash);
}

/**
 * Generate webhook secret
 */
export function generateWebhookSecret(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Create HMAC signature for webhook
 */
export function createWebhookSignature(
  payload: string,
  secret: string
): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = createWebhookSignature(payload, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Encrypt sensitive data (for database storage)
 */
export function encryptData(data: string, encryptionKey: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    Buffer.from(encryptionKey.padEnd(32, '0').slice(0, 32)),
    iv
  );

  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt sensitive data from database
 */
export function decryptData(encryptedData: string, encryptionKey: string): string {
  const [ivHex, encrypted] = encryptedData.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    Buffer.from(encryptionKey.padEnd(32, '0').slice(0, 32)),
    iv
  );

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Generate secure random token
 */
export function generateToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Hash a string
 */
export function hashString(str: string): string {
  return crypto.createHash('sha256').update(str).digest('hex');
}

/**
 * Rate limit key generator
 */
export function getRateLimitKey(identifier: string, window: number = 60): string {
  const now = Math.floor(Date.now() / 1000);
  const windowStart = Math.floor(now / window) * window;
  return `${identifier}:${windowStart}`;
}

/**
 * Validate request signature for x402 protocol
 */
export function validateX402Signature(
  body: string,
  signature: string,
  publicKey: string
): boolean {
  try {
    const verify = crypto.createVerify('RSA-SHA256');
    verify.update(body);
    return verify.verify(publicKey, Buffer.from(signature, 'hex'));
  } catch (error) {
    console.error('[Security] x402 signature validation failed:', error);
    return false;
  }
}

/**
 * Create x402 signature for request
 */
export function createX402Signature(body: string, privateKey: string): string {
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(body);
  return sign.sign(privateKey).toString('hex');
}

export const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-me';
export const JWT_SECRET = process.env.JWT_SECRET || 'jwt-secret-change-me';
