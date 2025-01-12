import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

const SALT_LENGTH = 32;
const KEY_LENGTH = 64;

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const derivedKey = await scryptAsync(password, salt, KEY_LENGTH);
  return `${derivedKey.toString('hex')}.${salt.toString('hex')}`;
}

// Generate hash for test password
async function main() {
  const password = 'test123';
  const hash = await hashPassword(password);
  console.log('Generated hash:', hash);
}

main().catch(console.error);
