import { generateClient } from 'aws-amplify/data';
import {
  getOrCreateKeyPair,
  getPublicKeyBase64,
  encryptMessage,
  decryptMessage,
  makeChatId,
} from './cryptoService';

import { encodeBase64 as _encodeBase64 } from 'tweetnacl-util';

function getPublicKeyBase64FromKp(kp) {
  return _encodeBase64(kp.publicKey);
}

let client = null;
function getClient() {
  if (client) return client;
  try {
    client = generateClient();
    return client;
  } catch (err) {
    console.error('[chatService] Failed to generate Amplify Data client:', err.message);
    return null;
  }
}

// ── MerchantProfile ────────────────────────────────────────────────

/**
 * Create or update the current user's MerchantProfile with their NaCl public key.
 * Call this once after login.
 */
export async function ensureMerchantProfile(user) {
  if (!user?.uid) return;
  try {
    const publicKey = await getPublicKeyBase64();
    const c = getClient();

    const { data: existing } = await c.models.MerchantProfile.list();
    if (existing && existing.length > 0) {
      const profile = existing[0];
      if (profile.publicKey !== publicKey || profile.userSub !== user.uid) {
        await c.models.MerchantProfile.update({
          id: profile.id,
          publicKey,
          userSub: user.uid,
          displayName: user.fullName || user.username || profile.displayName,
        });
      }
    } else {
      await c.models.MerchantProfile.create({
        displayName: user.fullName || user.username || 'Farmer',
        role: 'BOTH',
        publicKey,
        userSub: user.uid,
      });
    }
  } catch (err) {
    console.warn('[chatService] ensureMerchantProfile error:', err);
  }
}

/**
 * Fetch another user's NaCl public key from their MerchantProfile.
 * Returns null if they haven't registered one yet.
 */
export async function fetchRecipientPublicKey(sellerSub) {
  if (!sellerSub) return null;
  try {
    const { data } = await getClient().models.MerchantProfile.list({
      filter: { userSub: { eq: sellerSub } },
    });
    return data?.[0]?.publicKey ?? null;
  } catch (err) {
    console.warn('[chatService] fetchRecipientPublicKey error:', err);
    return null;
  }
}

// ── ChatMessage ────────────────────────────────────────────────────

/**
 * Send an E2E encrypted message from `fromSub` to `toSub`.
 * Double-encrypts: once to recipient, once to self (so sender can read history).
 * Returns { success, error }.
 */
export async function sendEncryptedMessage({ fromSub, toSub, plaintext }) {
  try {
    const recipientPublicKey = await fetchRecipientPublicKey(toSub);
    if (!recipientPublicKey) {
      return { success: false, error: 'RECIPIENT_NO_KEY' };
    }

    const myKp = await getOrCreateKeyPair();
    // Encrypt to recipient
    const { ciphertext, nonce } = encryptMessage(plaintext, recipientPublicKey, myKp.secretKey);
    // Encrypt to self so sender can read their own messages
    const selfEnc = encryptMessage(plaintext, getPublicKeyBase64FromKp(myKp), myKp.secretKey);
    const chatId = makeChatId(fromSub, toSub);

    const { data, errors } = await getClient().models.ChatMessage.create({
      chatId,
      fromSub,
      toSub,
      ciphertext,
      nonce,
      selfCiphertext: selfEnc.ciphertext,
      selfNonce: selfEnc.nonce,
    });

    if (errors?.length) throw new Error(errors[0].message);
    return { success: true, message: data };
  } catch (err) {
    console.error('[chatService] sendEncryptedMessage error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Load and decrypt all messages in a chat thread.
 * Returns array of { id, fromSub, toSub, text, createdAt, decrypted } objects.
 * `decrypted` is false when the message could not be decrypted (wrong key or corrupted).
 */
export async function loadChatMessages({ mySub, otherSub }) {
  try {
    const chatId = makeChatId(mySub, otherSub);
    const { data, errors } = await getClient().models.ChatMessage.list({
      filter: { chatId: { eq: chatId } },
    });

    if (errors?.length) throw new Error(errors[0].message);
    if (!data?.length) return [];

    const [myKp, otherPublicKey, myPublicKeyB64] = await Promise.all([
      getOrCreateKeyPair(),
      fetchRecipientPublicKey(otherSub),
      getPublicKeyBase64(),
    ]);

    const decoded = data.map((msg) => {
      let text = null;
      let decrypted = false;

      if (msg.fromSub === mySub) {
        // Message we sent — decrypt using self-copy (selfCiphertext encrypted to our own public key)
        if (msg.selfCiphertext && msg.selfNonce) {
          const plain = decryptMessage(msg.selfCiphertext, msg.selfNonce, myPublicKeyB64, myKp.secretKey);
          if (plain !== null) {
            text = plain;
            decrypted = true;
          } else {
            text = '[Sent message — key mismatch]';
            decrypted = false;
          }
        } else {
          // Legacy messages without self-copy
          text = '[Message sent]';
          decrypted = false;
        }
      } else if (otherPublicKey) {
        // Message they sent to us — encrypted with our pubkey, signed with their privkey
        const plain = decryptMessage(msg.ciphertext, msg.nonce, otherPublicKey, myKp.secretKey);
        if (plain !== null) {
          text = plain;
          decrypted = true;
        } else {
          text = '[Encrypted message — unable to decrypt]';
          decrypted = false;
        }
      } else {
        text = '[Encrypted message]';
        decrypted = false;
      }

      return {
        id: msg.id,
        fromSub: msg.fromSub,
        toSub: msg.toSub,
        readAt: msg.readAt,
        text,
        decrypted,
        createdAt: msg.createdAt,
      };
    });

    return decoded.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  } catch (err) {
    console.error('[chatService] loadChatMessages error:', err);
    return [];
  }
}

/**
 * Fetch another user's MerchantProfile (display name, role, publicKey).
 * Returns null if not found.
 */
export async function fetchMerchantProfile(userSub) {
  if (!userSub) return null;
  try {
    const { data } = await getClient().models.MerchantProfile.list({
      filter: { userSub: { eq: userSub } },
    });
    return data?.[0] ?? null;
  } catch (err) {
    console.warn('[chatService] fetchMerchantProfile error:', err);
    return null;
  }
}

/**
 * List all chat threads the current user is part of.
 * Returns array of { chatId, otherSub, latestAt, hasUnread } sorted newest first.
 */
export async function listMyChats(mySub) {
  if (!mySub) return [];
  try {
    const [sent, received] = await Promise.all([
      getClient().models.ChatMessage.list({ filter: { fromSub: { eq: mySub } } }),
      getClient().models.ChatMessage.list({ filter: { toSub: { eq: mySub } } }),
    ]);
    const allMessages = [...(sent.data ?? []), ...(received.data ?? [])];

    const chatMap = new Map();
    allMessages.forEach((msg) => {
      const otherSub = msg.fromSub === mySub ? msg.toSub : msg.fromSub;
      const existing = chatMap.get(msg.chatId);
      const isNewer = !existing || new Date(msg.createdAt) > new Date(existing.latestAt);
      if (isNewer) {
        chatMap.set(msg.chatId, {
          chatId: msg.chatId,
          otherSub,
          latestAt: msg.createdAt,
          hasUnread: !msg.readAt && msg.toSub === mySub,
        });
      } else if (!existing.hasUnread && !msg.readAt && msg.toSub === mySub) {
        existing.hasUnread = true;
      }
    });

    return [...chatMap.values()].sort(
      (a, b) => new Date(b.latestAt) - new Date(a.latestAt)
    );
  } catch (err) {
    console.error('[chatService] listMyChats error:', err);
    return [];
  }
}

/**
 * Mark a message as read.
 */
export async function markMessageRead(messageId) {
  try {
    await getClient().models.ChatMessage.update({
      id: messageId,
      readAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('[chatService] markMessageRead error:', err);
  }
}
