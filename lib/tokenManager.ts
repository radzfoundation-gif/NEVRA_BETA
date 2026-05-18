export type RequestType = 'chat' | 'canvas' | 'redesign' | 'code' | 'research' | 'agent' | string;

export async function deductTokens(userId: string, cost: number, _requestType: RequestType): Promise<boolean> {
    try {
        const res = await fetch('/api/db/credits/increment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, amount: cost }),
        });
        return res.ok;
    } catch {
        return false;
    }
}

export async function getTokenBalance(userId: string): Promise<{ balance: number; plan: string; resetAt: Date }> {
    try {
        const res = await fetch(`/api/db/credits?userId=${encodeURIComponent(userId)}`);
        const data = res.ok ? await res.json() : { credits: 0, tier: 'free' };
        return { balance: data.credits || 0, plan: data.tier || 'free', resetAt: new Date() };
    } catch {
        return { balance: 0, plan: 'free', resetAt: new Date() };
    }
}

export async function getUserUsage(userId: string) {
    const balance = await getTokenBalance(userId);
    return {
        plan: balance.plan,
        tokensRemaining: balance.balance,
        resetAt: balance.resetAt,
        stats: { total_requests: 0, total_tokens: 0, chat_requests: 0, canvas_requests: 0, redesign_requests: 0 },
        recentUsage: [],
    };
}

export async function addTokens(_userId: string, _amount: number): Promise<boolean> { return true; }
export async function isUserPro(userId: string): Promise<boolean> { return (await getTokenBalance(userId)).plan === 'pro'; }
