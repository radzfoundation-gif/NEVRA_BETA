import { NextResponse } from 'next/server';

// Force Node.js runtime (not Edge) as requested
export const runtime = 'nodejs';

// Types for request validation
interface Message {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

interface ChatRequest {
    model?: string;
    messages: Message[];
    max_tokens?: number;
    temperature?: number;
}

const SUMOPOD_API_KEY = process.env.SUMOPOD_API_KEY;
const SUMOPOD_BASE_URL = process.env.SUMOPOD_BASE_URL || 'https://api.sumopod.com/v1';

// Supported models whitelist
const ALLOWED_MODELS = ['gemini-1.5-flash-lite', 'gemini-1.5-pro-3'];

export async function POST(req: Request) {
    try {
        // 1. Validate API Key
        if (!SUMOPOD_API_KEY) {
            console.error('Missing SUMOPOD_API_KEY');
            return NextResponse.json(
                { error: 'Server configuration error' },
                { status: 500 }
            );
        }

        // 2. Parse and Validate Request Body
        let body: ChatRequest;
        try {
            body = await req.json();
        } catch (e) {
            return NextResponse.json(
                { error: 'Invalid JSON payload' },
                { status: 400 }
            );
        }

        const { messages, model = 'gemini-1.5-flash-lite', max_tokens = 2000, temperature = 0.7 } = body;

        // Validate Messages
        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json(
                { error: 'Messages array is required' },
                { status: 400 }
            );
        }

        // Validate Model
        if (!ALLOWED_MODELS.includes(model)) {
            // Fallback to safe default or error?
            // For this example, we'll allow it but log a warning
            console.warn(`Requested model ${model} not in allowed list.`);
        }

        // 3. Prepare Proxy Request
        // Ensure base URL doesn't have double slash issues if env var has/missing trailing slash
        const storedBaseUrl = SUMOPOD_BASE_URL.replace(/\/$/, '');
        const proxyUrl = `${storedBaseUrl}/chat/completions`;

        // Construct safe payload (strip potentially dangerous extra fields)
        const payload = {
            model,
            messages,
            max_tokens: Math.min(max_tokens, 8000), // Hard cap limit
            temperature,
            stream: false // Explicitly disable streaming for this endpoint
        };

        console.log(`[Sumopod Proxy] Sending request to ${proxyUrl} for model ${model}`);

        // 4. Execute Fetch
        const response = await fetch(proxyUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUMOPOD_API_KEY}`,
            },
            body: JSON.stringify(payload),
        });

        // 5. Handle Upstream Errors (HTML response etc.)
        const contentType = response.headers.get('content-type');

        if (!response.ok) {
            if (contentType && contentType.includes('application/json')) {
                const errorData = await response.json();
                console.error('[Sumopod API Error]', errorData);
                return NextResponse.json(errorData, { status: response.status });
            } else {
                // Handle HTML/Text errors (Common 500s or Gateway Timeouts)
                const errorText = await response.text();
                console.error('[Sumopod Non-JSON Error]', errorText.substring(0, 200));
                return NextResponse.json(
                    {
                        error: 'Upstream service error',
                        details: 'The AI service returned an unexpected response format.'
                    },
                    { status: 502 } // Bad Gateway
                );
            }
        }

        // 6. Return Successful JSON
        const data = await response.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error('[API Route Error]', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
