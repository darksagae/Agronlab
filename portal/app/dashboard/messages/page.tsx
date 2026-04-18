'use client';

import { useQuery } from '@tanstack/react-query';
import { getCurrentUser } from 'aws-amplify/auth';
import { listMyChats } from '../../../lib/queries';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function MessagesContent() {
  const searchParams = useSearchParams();
  const withSub = searchParams.get('with');
  const listingId = searchParams.get('listing');

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: getCurrentUser });

  const { data: chatIds = [], isLoading } = useQuery({
    queryKey: ['myChats', user?.userId],
    queryFn: () => listMyChats(user!.userId),
    enabled: !!user?.userId,
  });

  // If redirected here from "Message Seller", navigate directly to that chat
  if (withSub && user?.userId) {
    const chatId = [user.userId, withSub].sort().join('_');
    return (
      <div>
        <h1 className="text-2xl font-bold text-agron-dark mb-6">Messages</h1>
        <div className="bg-white rounded-xl p-6 shadow-sm text-center">
          <p className="text-gray-600 mb-4">
            Starting a conversation{listingId ? ' about this listing' : ''}...
          </p>
          <Link
            href={`/dashboard/messages/${chatId}`}
            className="bg-agron-green text-white px-6 py-2 rounded-lg font-medium hover:bg-green-600 transition-colors"
          >
            Open Chat
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-agron-dark mb-6">Messages</h1>
      <p className="text-xs text-gray-400 mb-4 flex items-center gap-1">
        <span>🔒</span> All messages are end-to-end encrypted
      </p>

      {isLoading && <p className="text-gray-400">Loading conversations...</p>}

      {!isLoading && chatIds.length === 0 && (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm">
          <p className="text-4xl mb-3">💬</p>
          <p className="text-gray-500">No conversations yet.</p>
          <p className="text-sm text-gray-400 mt-1">
            Browse the <Link href="/dashboard/market" className="text-agron-green underline">market</Link> and message a seller to get started.
          </p>
        </div>
      )}

      <div className="space-y-2">
        {chatIds.map((chatId) => (
          <Link
            key={chatId}
            href={`/dashboard/messages/${chatId}`}
            className="flex items-center gap-4 bg-white rounded-xl px-5 py-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="w-10 h-10 bg-agron-light rounded-full flex items-center justify-center text-agron-dark font-bold shrink-0">
              {chatId.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-800 truncate">{chatId}</p>
              <p className="text-xs text-gray-400">Tap to open</p>
            </div>
            <span className="text-gray-300">›</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<p className="text-gray-400">Loading...</p>}>
      <MessagesContent />
    </Suspense>
  );
}
