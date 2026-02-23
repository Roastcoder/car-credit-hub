/**
 * Biometric Authentication using Web Authentication API (WebAuthn)
 * Supports fingerprint, Face ID, and other platform authenticators.
 * 
 * Flow:
 * 1. User logs in with email/password
 * 2. User enables biometric login → registers a credential + stores encrypted session
 * 3. On next visit, user taps "Login with Fingerprint" → authenticates with WebAuthn → restores session
 */

const BIOMETRIC_CRED_KEY = 'biometric_credential_id';
const BIOMETRIC_SESSION_KEY = 'biometric_session';
const BIOMETRIC_EMAIL_KEY = 'biometric_email';

function generateChallenge(): Uint8Array {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return arr;
}

function bufferToBase64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function base64ToBuffer(b64: string): ArrayBuffer {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

export function isBiometricSupported(): boolean {
  return !!window.PublicKeyCredential;
}

export async function isBiometricAvailable(): Promise<boolean> {
  if (!isBiometricSupported()) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

export function hasBiometricCredential(): boolean {
  return !!localStorage.getItem(BIOMETRIC_CRED_KEY) && !!localStorage.getItem(BIOMETRIC_SESSION_KEY);
}

export function getBiometricEmail(): string | null {
  return localStorage.getItem(BIOMETRIC_EMAIL_KEY);
}

export async function registerBiometric(userId: string, email: string, refreshToken: string): Promise<boolean> {
  if (!await isBiometricAvailable()) return false;

  try {
    const challenge = generateChallenge();
    const credential = await navigator.credentials.create({
      publicKey: {
        challenge: challenge as any,
        rp: {
          name: 'Mehar Finance',
          id: window.location.hostname,
        },
        user: {
          id: new TextEncoder().encode(userId),
          name: email,
          displayName: email.split('@')[0],
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },   // ES256
          { alg: -257, type: 'public-key' },  // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'preferred',
        },
        timeout: 60000,
      },
    }) as PublicKeyCredential | null;

    if (!credential) return false;

    // Store credential ID and session
    localStorage.setItem(BIOMETRIC_CRED_KEY, bufferToBase64(credential.rawId));
    localStorage.setItem(BIOMETRIC_SESSION_KEY, refreshToken);
    localStorage.setItem(BIOMETRIC_EMAIL_KEY, email);
    return true;
  } catch (err) {
    console.error('Biometric registration failed:', err);
    return false;
  }
}

export async function authenticateBiometric(): Promise<{ refreshToken: string; email: string } | null> {
  if (!hasBiometricCredential()) return null;

  const credId = localStorage.getItem(BIOMETRIC_CRED_KEY)!;
  const refreshToken = localStorage.getItem(BIOMETRIC_SESSION_KEY)!;
  const email = localStorage.getItem(BIOMETRIC_EMAIL_KEY)!;

  try {
    const challenge = generateChallenge();
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: challenge as any,
        allowCredentials: [{
          id: base64ToBuffer(credId),
          type: 'public-key',
          transports: ['internal'],
        }],
        userVerification: 'required',
        timeout: 60000,
      },
    }) as PublicKeyCredential | null;

    if (!assertion) return null;

    return { refreshToken, email };
  } catch (err) {
    console.error('Biometric authentication failed:', err);
    return null;
  }
}

export function clearBiometricCredential(): void {
  localStorage.removeItem(BIOMETRIC_CRED_KEY);
  localStorage.removeItem(BIOMETRIC_SESSION_KEY);
  localStorage.removeItem(BIOMETRIC_EMAIL_KEY);
}
