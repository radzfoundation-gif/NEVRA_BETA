/**
 * Canvas Save API Route
 * Persists canvas data to Supabase
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { checkRateLimit } from '@/lib/rateLimiter';
import { isValidCanvasJSON } from '@/lib/canvasParser';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(req: NextRequest) {
    try {
        // 1. Authenticate user
        const supabase = createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Rate limit check
        const rateLimit = await checkRateLimit(user.id, '/api/canvas/save');
        if (!rateLimit.allowed) {
            return NextResponse.json(
                { error: 'Rate limit exceeded', resetAt: rateLimit.resetAt },
                { status: 429 }
            );
        }

        // 3. Parse request
        const body = await req.json();
        const { roomId, canvasJSON, title } = body;

        if (!roomId || !canvasJSON) {
            return NextResponse.json(
                { error: 'roomId and canvasJSON are required' },
                { status: 400 }
            );
        }

        // Validate canvas JSON
        if (!isValidCanvasJSON(canvasJSON)) {
            return NextResponse.json(
                { error: 'Invalid canvas JSON format' },
                { status: 400 }
            );
        }

        // 4. Upsert canvas session
        const { data, error } = await supabase
            .from('canvas_sessions')
            .upsert(
                {
                    user_id: user.id,
                    room_id: roomId,
                    canvas_json: canvasJSON,
                    title: title || 'Untitled Canvas',
                    updated_at: new Date().toISOString(),
                },
                {
                    onConflict: 'room_id',
                }
            )
            .select()
            .single();

        if (error) {
            console.error('[Canvas Save] Supabase error:', error);
            return NextResponse.json(
                { error: 'Failed to save canvas' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data,
        });
    } catch (error: any) {
        console.error('[Canvas Save] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
