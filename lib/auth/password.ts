import bcrypt from "bcrypt";

const DEFAULT_SALT_ROUNDS = 12;
export const DUMMY_PASSWORD_HASH = "$2b$12$xsMdQJvWILWddo4afAmJdeyg/Tpwp4wmNQ4gHxFPUsJu6eCM53iCS";

function getSaltRounds(): number {
  const configuredRounds = Number(process.env.BCRYPT_SALT_ROUNDS ?? DEFAULT_SALT_ROUNDS);

  if (!Number.isInteger(configuredRounds) || configuredRounds < 10 || configuredRounds > 14) {
    throw new Error("BCRYPT_SALT_ROUNDS must be an integer between 10 and 14");
  }

  return configuredRounds;
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, getSaltRounds());
}

export function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}
