import { randomBytes, createHash } from 'crypto';

export function generateCodeVerifier() {
  return randomBytes(32).toString('base64url');
}

export function generateCodeChallenge(codeVerifier) {
  return createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');
}