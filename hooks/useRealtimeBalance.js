import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

/**
 * useRealtimeBalance — subscribes to Supabase Realtime changes on users table
 * Calls onBalanceChange(newBalance) whenever the current user's balance is updated
 *
 * @param {string} userId - the logged-in user's UUID
 * @param {function} onBalanceChange - callback(newBalance: number)
 * @param {function} onIncomingTx - callback(tx) when money received
 */
export function useRealtimeBalance(userId, onBalanceChange, onIncomingTx) {
  const channelRef = useRef(null);

  useEffect(() => {
    if (!userId) return;

    // Subscribe to user balance changes
    const userChannel = supabase
      .channel(`user-balance-${userId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'users', filter: `id=eq.${userId}` },
        (payload) => {
          const newBalance = payload.new?.balance;
          if (newBalance !== undefined && onBalanceChange) {
            onBalanceChange(newBalance);
            // Update localStorage too
            const saved = JSON.parse(localStorage.getItem('cc_user') || '{}');
            localStorage.setItem('cc_user', JSON.stringify({ ...saved, balance: newBalance }));
          }
        }
      )
      .subscribe();

    // Subscribe to incoming ledger transactions
    const txChannel = supabase
      .channel(`incoming-tx-${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'ledger', filter: `to_user=eq.${userId}` },
        (payload) => {
          if (onIncomingTx) onIncomingTx(payload.new);
        }
      )
      .subscribe();

    channelRef.current = { userChannel, txChannel };

    return () => {
      supabase.removeChannel(userChannel);
      supabase.removeChannel(txChannel);
    };
  }, [userId]);
}
