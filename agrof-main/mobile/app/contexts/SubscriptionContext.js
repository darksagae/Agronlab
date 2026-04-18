import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useUser } from './UserContext';
import { getMySubscription } from '../services/subscriptionService';

const SubscriptionContext = createContext({
  isSubscribed: false,
  subscription: null,
  loading: true,
  refresh: () => {},
});

export function SubscriptionProvider({ children }) {
  const { user } = useUser();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user?.uid) {
      setLoading(false);
      setSubscription(null);
      return;
    }
    const sub = await getMySubscription(user.uid);
    setSubscription(sub);
    setLoading(false);
  }, [user?.uid]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const isSubscribed = !!(
    subscription &&
    subscription.status === 'ACTIVE' &&
    new Date(subscription.expiresAt) > new Date()
  );

  return (
    <SubscriptionContext.Provider value={{ isSubscribed, subscription, loading, refresh }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  return useContext(SubscriptionContext);
}
