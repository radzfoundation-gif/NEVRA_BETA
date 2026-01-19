/**
 * User Usage API Route
 * Returns user's token balance and usage statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { getUserUsage } from '@/lib/tokenManager';
import { checkRateLimit } from '@/lib/rateLimiter';

export const runtime = 'nodejs';
export const maxDuration = 10;

export async function GET(req: NextRequest) {
    try {
        // 1. Authenticate user
        const supabase = createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Rate limit check (generous for read-only endpoint)
        const rateLimit = await checkRateLimit(user.id, '/api/user/usage');
        if (!rateLimit.allowed) {
            return NextResponse.json(
                { error: 'Rate limit exceeded', resetAt: rateLimit.resetAt },
                { status: 429 }
            );
        }

        // 3. Get usage data
        const usage = await getUserUsage(user.id);

        if (!usage) {
            return NextResponse.json(
                { error: 'Failed to retrieve usage data' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data: usage,
        });
    } catch (error: any) {
        console.error('[User Usage] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
