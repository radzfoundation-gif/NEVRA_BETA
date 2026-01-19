/**
 * Canvas Analysis API Route
 * Analyzes Excalidraw canvas using Sumopod AI
 * Includes rate limiting and token billing
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { parseCanvas, buildAIPrompt, isValidCanvasJSON } from '@/lib/canvasParser';
import { checkRateLimit } from '@/lib/rateLimiter';
import { checkTokens, deductTokens, TOKEN_COSTS } from '@/lib/tokenManager';

export const runtime = 'nodejs';
export const maxDuration = 60;

const SUMOPOD_API_URL = 'https://ai.sumopod.com/v1/chat/completions';
const SUMOPOD_KEY = process.env.SUMOPOD_KEY;

export async function POST(req: NextRequest) {
    try {
        // 1. Authenticate user
        const supabase = createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Rate limit check
        const rateLimit = await checkRateLimit(user.id, '/api/analyze-canvas');
        if (!rateLimit.allowed) {
            return NextResponse.json(
                {
                    error: 'Rate limit exceeded. Please try again later.',
                    resetAt: rateLimit.resetAt,
                    limit: rateLimit.limit,
                },
                {
                    status: 429,
                    headers: {
                        'X-RateLimit-Limit': rateLimit.limit.toString(),
                        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
                        'X-RateLimit-Reset': rateLimit.resetAt.toISOString(),
                    }
                }
            );
        }

        // 3. Parse request body
        const body = await req.json();
        const { canvasJSON, question } = body;

        if (!canvasJSON) {
            return NextResponse.json(
                { error: 'Canvas JSON is required' },
                { status: 400 }
            );
        }

        // Validate canvas JSON structure
        if (!isValidCanvasJSON(canvasJSON)) {
            return NextResponse.json(
                { error: 'Invalid canvas JSON format' },
                { status: 400 }
            );
        }

        // 4. Token check
        const cost = TOKEN_COSTS.canvas_analyze;
        const hasTokens = await checkTokens(user.id, cost);

        if (!hasTokens) {
            return NextResponse.json(
                {
                    error: 'Insufficient tokens. Please upgrade your plan or wait for reset.',
                    code: 'CANVAS_ANALYZE_LIMIT',
                    cost,
                },
                { status: 402 } // Payment Required
            );
        }

        // 5. Parse canvas content
        const analysis = parseCanvas(canvasJSON);

        // Handle empty canvas
        if (analysis.isEmpty && !question) {
            return NextResponse.json({
                analysis,
                response: 'Your canvas is empty. Please draw or write your question on the canvas, and I\'ll help you analyze it!',
                tokensUsed: 0,
            });
        }

        // 6. Build AI prompt
        const { system, user: userPrompt } = buildAIPrompt(analysis, question);

        // 7. Check Sumopod API key
        if (!SUMOPOD_KEY) {
            console.error('[Analyze Canvas] SUMOPOD_KEY not configured');
            return NextResponse.json(
                { error: 'AI service not configured' },
                { status: 503 }
            );
        }

        // 8. Call Sumopod API with retry logic
        let sumopodResponse: Response | null = null;
        let retryCount = 0;
        const maxRetries = 2;

        while (retryCount <= maxRetries) {
            try {
                sumopodResponse = await fetch(SUMOPOD_API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${SUMOPOD_KEY}`,
                    },
                    body: JSON.stringify({
                        model: 'sumopod-llm',
                        messages: [
                            { role: 'system', content: system },
                            { role: 'user', content: userPrompt },
                        ],
                        max_tokens: 2000,
                        temperature: 0.7,
                    }),
                    signal: AbortSignal.timeout(30000), // 30s timeout
                });

                if (sumopodResponse.ok) {
                    break; // Success, exit retry loop
                }

                // Log error response
                const errorText = await sumopodResponse.text();
                console.error(`[Sumopod Error] Attempt ${retryCount + 1}:`, errorText);

                if (sumopodResponse.status === 429) {
                    // Rate limited by Sumopod - wait and retry
                    await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
                    retryCount++;
                } else {
                    // Other errors - don't retry
                    break;
                }
            } catch (fetchError: any) {
                console.error(`[Sumopod Fetch Error] Attempt ${retryCount + 1}:`, fetchError.message);

                if (fetchError.name === 'TimeoutError' || fetchError.name === 'AbortError') {
                    retryCount++;
                    if (retryCount > maxRetries) {
                        return NextResponse.json(
                            { error: 'AI service timeout. Please try again.' },
                            { status: 504 }
                        );
                    }
                } else {
                    throw fetchError; // Re-throw unexpected errors
                }
            }
        }

        // 9. Handle Sumopod API errors
        if (!sumopodResponse || !sumopodResponse.ok) {
            const errorText = sumopodResponse
                ? await sumopodResponse.text()
                : 'No response from AI service';

            console.error('[Sumopod Error]', errorText);

            return NextResponse.json(
                { error: 'AI service error. Please try again later.' },
                { status: sumopodResponse?.status || 500 }
            );
        }

        // 10. Parse AI response
        const aiData = await sumopodResponse.json();
        const aiResponse = aiData.choices?.[0]?.message?.content || '';

        if (!aiResponse) {
            console.error('[Sumopod] Empty response from AI');
            return NextResponse.json(
                { error: 'AI returned empty response' },
                { status: 500 }
            );
        }

        // 11. Deduct tokens
        const deducted = await deductTokens(user.id, cost, 'canvas_analyze', {
            promptLength: userPrompt.length,
            responseLength: aiResponse.length,
            model: 'sumopod-llm',
        });

        if (!deducted) {
            console.warn(`[Analyze Canvas] Token deduction failed for user ${user.id}`);
            // Still return response but log the issue
        }

        // 12. Return successful response
        return NextResponse.json({
            analysis,
            response: aiResponse,
            tokensUsed: cost,
        });

    } catch (error: any) {
        console.error('[Analyze Canvas] Unhandled error:', error);

        return NextResponse.json(
            {
                error: 'Internal server error',
                message: process.env.NODE_ENV === 'development' ? error.message : undefined,
            },
            { status: 500 }
        );
    }
}
