import nacl from 'tweetnacl';
import { encodeBase64, decodeBase64, encodeUTF8, decodeUTF8 } from 'tweetnacl-util';

const PRIVATE_KEY_STORAGE = 'agron_portal_sk';

// Generate a new X25519 keypair and return the base64 public key.
// The private key is stored encrypted in localStorage using the user's sub as a seed.
export function generateKeypair(): { publicKey: string; privateKey: string } {
  const kp = nacl.box.keyPair();
  return {
    publicKey: encodeBase64(kp.publicKey),
    privateKey: encodeBase64(kp.secretKey),
  };
}

export function storePrivateKey(privateKeyB64: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(PRIVATE_KEY_STORAGE, privateKeyB64);
  }
}

export function loadPrivateKey(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(PRIVATE_KEY_STORAGE);
}

export function clearPrivateKey() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(PRIVATE_KEY_STORAGE);
  }
}

// Encrypt a plaintext message for a recipient using their public key.
export function encryptMessage(
  plaintext: string,
  recipientPublicKeyB64: string,
  senderPrivateKeyB64: string
): { ciphertext: string; nonce: string } {
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  const box = nacl.box(
    encodeUTF8(plaintext),
    nonce,
    decodeBase64(recipientPublicKeyB64),
    decodeBase64(senderPrivateKeyB64)
  );
  return {
    ciphertext: encodeBase64(box),
    nonce: encodeBase64(nonce),
  };
}

// Decrypt a message using the recipient's private key.
export function decryptMessage(
  ciphertextB64: string,
  nonceB64: string,
  senderPublicKeyB64: string,
  recipientPrivateKeyB64: string
): string | null {
  const opened = nacl.box.open(
    decodeBase64(ciphertextB64),
    decodeBase64(nonceB64),
    decodeBase64(senderPublicKeyB64),
    decodeBase64(recipientPrivateKeyB64)
  );
  if (!opened) return null;
  return decodeUTF8(opened);
}
