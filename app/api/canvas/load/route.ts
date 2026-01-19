/**
 * Canvas Load API Route
 * Retrieves canvas data from Supabase
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

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

        // 2. Get roomId from query params
        const { searchParams } = new URL(req.url);
        const roomId = searchParams.get('roomId');

        if (!roomId) {
            return NextResponse.json(
                { error: 'roomId query parameter is required' },
                { status: 400 }
            );
        }

        // 3. Load canvas session
        const { data, error } = await supabase
            .from('canvas_sessions')
            .select('*')
            .eq('room_id', roomId)
            .eq('user_id', user.id)
            .maybeSingle();

        if (error) {
            console.error('[Canvas Load] Supabase error:', error);
            return NextResponse.json(
                { error: 'Failed to load canvas' },
                { status: 500 }
            );
        }

        if (!data) {
            return NextResponse.json(
                { error: 'Canvas not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data,
        });
    } catch (error: any) {
        console.error('[Canvas Load] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
