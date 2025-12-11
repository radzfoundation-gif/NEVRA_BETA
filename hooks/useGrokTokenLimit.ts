import { useState, useEffect } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { checkGrokTokenLimit, GROK_TOKEN_LIMIT } from '@/lib/grokTokenLimit';

const SUPABASE_TEMPLATE = import.meta.env.VITE_CLERK_SUPABASE_TEMPLATE || 'supabase';

/**
 * Hook to check Grok (Kimi K2) token limit status
 * Returns whether Grok is available or locked due to limit
 */
export function useGrokTokenLimit() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [isGrokLocked, setIsGrokLocked] = useState(false);
  const [grokTokensUsed, setGrokTokensUsed] = useState(0);
  const [grokTokensRemaining, setGrokTokensRemaining] = useState(GROK_TOKEN_LIMIT);
  const [loading, setLoading] = useState(true);

  const checkLimit = async () => {
    if (!user) {
      setIsGrokLocked(false);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const token = await getToken({ template: SUPABASE_TEMPLATE }).catch(() => null);
      const limit = await checkGrokTokenLimit(user.id, token);
      
      setIsGrokLocked(limit.hasExceeded);
      setGrokTokensUsed(limit.tokensUsed);
      setGrokTokensRemaining(limit.tokensRemaining);
    } catch (error) {
      console.error('Error checking Grok token limit:', error);
      // On error, allow usage (fail open)
      setIsGrokLocked(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkLimit();
    
    // Refresh every 30 seconds to check if token was recharged
    const interval = setInterval(checkLimit, 30000);
    
    return () => clearInterval(interval);
  }, [user, getToken]);

  return {
    isGrokLocked,
    grokTokensUsed,
    grokTokensRemaining,
    grokTokenLimit: GROK_TOKEN_LIMIT,
    loading,
    refreshLimit: checkLimit,
  };
}
