import crypto from 'crypto';

/**
 * Hash the National ID Number (NIN) using SHA-256.
 * It's crucial for identifying patients without storing plain text NINs.
 */
export const hashNIN = (nin: string): string => {
  return crypto.createHash('sha256').update(nin).digest('hex');
};

// Must be exactly 32 bytes (256 bits) for AES-256
// Default to a 32-byte hex string placeholder for development environments.
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'; 
const IV_LENGTH = 16; 

/**
 * Encrypt simple data.
 */
export const encryptData = (text: string): string => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
};

/**
 * Decrypt simple data.
 */
export const decryptData = (text: string): string => {
  const textParts = text.split(':');
  const ivStr = textParts.shift();
  if (!ivStr) throw new Error("Invalid encrypted text format.");
  
  const iv = Buffer.from(ivStr, 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  
  return decrypted.toString('utf8');
};
