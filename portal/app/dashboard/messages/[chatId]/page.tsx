'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCurrentUser } from 'aws-amplify/auth';
import { listMessages, getMerchantPublicKey, client } from '../../../../lib/queries';
import {
  loadPrivateKey,
  encryptMessage,
  decryptMessage,
} from '../../../../lib/crypto';
import { useParams, useRouter } from 'next/navigation';

export default function ChatPage() {
  const { chatId } = useParams<{ chatId: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [text, setText] = useState('');
  const [decrypted, setDecrypted] = useState<Record<string, string>>({});
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: getCurrentUser });

  // Derive the other participant's sub from chatId (format: sub1_sub2, sorted)
  const otherSub = chatId?.split('_').find((s) => s !== user?.userId) ?? '';

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['messages', chatId],
    queryFn: () => listMessages(chatId),
    enabled: !!chatId,
    refetchInterval: 5000, // Poll every 5s for new messages
  });

  // Decrypt messages when they load
  useEffect(() => {
    const privateKey = loadPrivateKey();
    if (!privateKey || !messages.length) return;

    const getMerchantKey = async () => {
      const otherPublicKey = await getMerchantPublicKey(otherSub);
      if (!otherPublicKey) return;
      const map: Record<string, string> = {};
      for (const msg of messages) {
        if (msg.ciphertext && msg.nonce) {
          const senderKey = msg.fromSub === user?.userId ? undefined : otherPublicKey;
          if (senderKey) {
            const plain = decryptMessage(msg.ciphertext, msg.nonce, senderKey, privateKey);
            if (plain) map[msg.id] = plain;
          } else {
            // Own message — re-encrypt with own key is not needed, show placeholder
            map[msg.id] = '[sent]';
          }
        }
      }
      setDecrypted(map);
    };

    getMerchantKey();
  }, [messages, otherSub, user?.userId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = useMutation({
    mutationFn: async (plaintext: string) => {
      if (!user || !otherSub) throw new Error('Not authenticated');
      const privateKey = loadPrivateKey();
      if (!privateKey) throw new Error('No private key — please re-login');
      const recipientPublicKey = await getMerchantPublicKey(otherSub);
      if (!recipientPublicKey) throw new Error('Recipient has no encryption key yet');

      const { ciphertext, nonce } = encryptMessage(plaintext, recipientPublicKey, privateKey);
      const cId = [user.userId, otherSub].sort().join('_');

      const { errors } = await client.models.ChatMessage.create({
        chatId: cId,
        fromSub: user.userId,
        toSub: otherSub,
        ciphertext,
        nonce,
      });
      if (errors?.length) throw new Error(errors[0].message);
    },
    onSuccess: () => {
      setText('');
      qc.invalidateQueries({ queryKey: ['messages', chatId] });
    },
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    send.mutate(text.trim());
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 text-xl">←</button>
        <div className="w-9 h-9 bg-agron-light rounded-full flex items-center justify-center font-bold text-agron-dark">
          {otherSub.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-gray-800 text-sm">{otherSub.slice(0, 16)}…</p>
          <p className="text-xs text-gray-400 flex items-center gap-1">🔒 End-to-end encrypted</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        {isLoading && <p className="text-gray-400 text-sm">Loading messages...</p>}
        {messages.map((msg) => {
          const isMine = msg.fromSub === user?.userId;
          const body = decrypted[msg.id] ?? (isMine ? '[sending…]' : '🔒 encrypted');
          return (
            <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs rounded-2xl px-4 py-2 text-sm ${
                isMine ? 'bg-agron-green text-white rounded-br-sm' : 'bg-white text-gray-800 shadow-sm rounded-bl-sm'
              }`}>
                {body}
                <p className={`text-xs mt-1 ${isMine ? 'text-green-100' : 'text-gray-400'}`}>
                  {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-agron-green"
        />
        <button
          type="submit"
          disabled={send.isPending || !text.trim()}
          className="bg-agron-green text-white px-5 rounded-xl font-medium hover:bg-green-600 transition-colors disabled:opacity-60"
        >
          {send.isPending ? '…' : 'Send'}
        </button>
      </form>
      {send.isError && (
        <p className="text-red-500 text-xs mt-1">{(send.error as Error).message}</p>
      )}
    </div>
  );
}
