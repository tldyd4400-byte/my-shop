import {
  createHmac,
  randomBytes,
  scrypt,
  timingSafeEqual,
} from "node:crypto";

const SCRYPT_N = 16_384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SCRYPT_KEY_LENGTH = 32;
const SALT_LENGTH = 16;
const MAX_ENCODED_HASH_LENGTH = 512;
const MAX_SESSION_TOKEN_LENGTH = 4_096;
const SESSION_LIFETIME_SECONDS = 60 * 60 * 8;
const BASE64URL_PATTERN = /^[A-Za-z0-9_-]+$/u;

export const ADMIN_COOKIE_NAME = "eomeutteull_admin";
export const ADMIN_PASSWORD_MAX_BYTES = 1_024;
export const adminCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/admin",
  maxAge: SESSION_LIFETIME_SECONDS,
};

function deriveScrypt(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(
      password,
      salt,
      SCRYPT_KEY_LENGTH,
      { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P },
      (error, derivedKey) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(derivedKey);
      },
    );
  });
}

function decodeCanonicalBase64url(value: string): Buffer | null {
  if (!BASE64URL_PATTERN.test(value)) {
    return null;
  }

  try {
    const decoded = Buffer.from(value, "base64url");
    return decoded.length > 0 && decoded.toString("base64url") === value
      ? decoded
      : null;
  } catch {
    return null;
  }
}

function isValidUnixSeconds(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 0;
}

function currentUnixSeconds(): number {
  return Math.floor(Date.now() / 1_000);
}

function hasWellFormedUnicode(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const codeUnit = value.charCodeAt(index);
    if (codeUnit >= 0xd800 && codeUnit <= 0xdbff) {
      const nextCodeUnit = value.charCodeAt(index + 1);
      if (!(nextCodeUnit >= 0xdc00 && nextCodeUnit <= 0xdfff)) {
        return false;
      }
      index += 1;
    } else if (codeUnit >= 0xdc00 && codeUnit <= 0xdfff) {
      return false;
    }
  }
  return true;
}

function isPasswordWithinSizeLimit(password: unknown): password is string {
  return (
    typeof password === "string" &&
    password.length > 0 &&
    password.length <= ADMIN_PASSWORD_MAX_BYTES &&
    hasWellFormedUnicode(password) &&
    Buffer.byteLength(password, "utf8") <= ADMIN_PASSWORD_MAX_BYTES
  );
}

export async function hashAdminPassword(
  password: string,
  salt: Uint8Array = randomBytes(SALT_LENGTH),
): Promise<string> {
  if (!isPasswordWithinSizeLimit(password)) {
    throw new TypeError("Admin password is invalid");
  }
  if (!(salt instanceof Uint8Array) || salt.byteLength !== SALT_LENGTH) {
    throw new TypeError("Admin password salt must be exactly 16 bytes");
  }

  const saltBuffer = Buffer.from(salt);
  const derivedKey = await deriveScrypt(password, saltBuffer);
  return [
    "scrypt",
    String(SCRYPT_N),
    String(SCRYPT_R),
    String(SCRYPT_P),
    saltBuffer.toString("base64url"),
    derivedKey.toString("base64url"),
  ].join("$");
}

export async function verifyAdminPassword(
  password: string,
  encodedHash: string,
): Promise<boolean> {
  if (
    !isPasswordWithinSizeLimit(password) ||
    typeof encodedHash !== "string" ||
    encodedHash.length === 0 ||
    encodedHash.length > MAX_ENCODED_HASH_LENGTH
  ) {
    return false;
  }

  const parts = encodedHash.split("$");
  if (
    parts.length !== 6 ||
    parts[0] !== "scrypt" ||
    parts[1] !== String(SCRYPT_N) ||
    parts[2] !== String(SCRYPT_R) ||
    parts[3] !== String(SCRYPT_P)
  ) {
    return false;
  }

  const salt = decodeCanonicalBase64url(parts[4]);
  const expectedHash = decodeCanonicalBase64url(parts[5]);
  if (
    salt === null ||
    salt.length !== SALT_LENGTH ||
    expectedHash === null ||
    expectedHash.length !== SCRYPT_KEY_LENGTH
  ) {
    return false;
  }

  try {
    const actualHash = await deriveScrypt(password, salt);
    return (
      actualHash.length === expectedHash.length &&
      timingSafeEqual(actualHash, expectedHash)
    );
  } catch {
    return false;
  }
}

export function createAdminSession(
  secret: string,
  now: number = currentUnixSeconds(),
): string {
  if (typeof secret !== "string" || secret.length === 0) {
    throw new TypeError("Admin session secret must be a non-empty string");
  }
  if (!isValidUnixSeconds(now)) {
    throw new TypeError("Admin session time must be non-negative integer seconds");
  }
  if (now > Number.MAX_SAFE_INTEGER - SESSION_LIFETIME_SECONDS) {
    throw new TypeError("Admin session time is outside the supported range");
  }

  const payload = Buffer.from(
    JSON.stringify({ exp: now + SESSION_LIFETIME_SECONDS }),
  ).toString("base64url");
  const signature = createHmac("sha256", secret)
    .update(payload)
    .digest("base64url");
  return `${payload}.${signature}`;
}

export function verifyAdminSession(
  token: string,
  secret: string,
  now: number = currentUnixSeconds(),
): boolean {
  if (
    typeof token !== "string" ||
    token.length === 0 ||
    token.length > MAX_SESSION_TOKEN_LENGTH ||
    typeof secret !== "string" ||
    secret.length === 0 ||
    !isValidUnixSeconds(now)
  ) {
    return false;
  }

  const parts = token.split(".");
  if (parts.length !== 2) {
    return false;
  }

  const payloadBytes = decodeCanonicalBase64url(parts[0]);
  const suppliedSignature = decodeCanonicalBase64url(parts[1]);
  if (payloadBytes === null || suppliedSignature?.length !== 32) {
    return false;
  }

  const expectedSignature = createHmac("sha256", secret)
    .update(parts[0])
    .digest();
  if (
    suppliedSignature.length !== expectedSignature.length ||
    !timingSafeEqual(suppliedSignature, expectedSignature)
  ) {
    return false;
  }

  try {
    const rawPayload = payloadBytes.toString("utf8");
    const payload: unknown = JSON.parse(rawPayload);
    if (
      typeof payload !== "object" ||
      payload === null ||
      Array.isArray(payload) ||
      Object.keys(payload).length !== 1 ||
      !("exp" in payload)
    ) {
      return false;
    }

    const exp = (payload as { exp?: unknown }).exp;
    return (
      typeof exp === "number" &&
      isValidUnixSeconds(exp) &&
      rawPayload === JSON.stringify({ exp }) &&
      exp > now
    );
  } catch {
    return false;
  }
}
