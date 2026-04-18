import 'react-native-get-random-values';
import nacl from 'tweetnacl';
import { encodeBase64, decodeBase64, encodeUTF8, decodeUTF8 } from 'tweetnacl-util';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SK_STORAGE_KEY = 'agron_nacl_sk';

export async function getOrCreateKeyPair() {
  const stored = await AsyncStorage.getItem(SK_STORAGE_KEY);
  if (stored) {
    const secretKey = decodeBase64(stored);
    return nacl.box.keyPair.fromSecretKey(secretKey);
  }
  const keyPair = nacl.box.keyPair();
  await AsyncStorage.setItem(SK_STORAGE_KEY, encodeBase64(keyPair.secretKey));
  return keyPair;
}

export async function getPublicKeyBase64() {
  const kp = await getOrCreateKeyPair();
  return encodeBase64(kp.publicKey);
}

export function encryptMessage(plaintext, recipientPubKeyB64, mySecretKey) {
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  const message = encodeUTF8(plaintext);
  const recipientPubKey = decodeBase64(recipientPubKeyB64);
  const box = nacl.box(message, nonce, recipientPubKey, mySecretKey);
  return {
    ciphertext: encodeBase64(box),
    nonce: encodeBase64(nonce),
  };
}

export function decryptMessage(ciphertextB64, nonceB64, senderPubKeyB64, mySecretKey) {
  try {
    const box = decodeBase64(ciphertextB64);
    const nonce = decodeBase64(nonceB64);
    const senderPubKey = decodeBase64(senderPubKeyB64);
    const plaintext = nacl.box.open(box, nonce, senderPubKey, mySecretKey);
    if (!plaintext) return null;
    return decodeUTF8(plaintext);
  } catch {
    return null;
  }
}

export function makeChatId(subA, subB) {
  return [subA, subB].sort().join('_');
}
