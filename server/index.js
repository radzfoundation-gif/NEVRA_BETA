import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import multer from 'multer';
import mammoth from 'mammoth';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';
import { createRequire } from 'module';
import Stripe from 'stripe';
// Supabase removed - using Firebase now

const execAsync = promisify(exec);
const require = createRequire(import.meta.url);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Debug logging helper (must be after __dirname is defined)
const DEBUG_LOG_PATH = path.join(__dirname, '..', '.cursor', 'debug.log');
const debugLog = (data) => {
  try {
    const logDir = path.dirname(DEBUG_LOG_PATH);
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
    const logEntry = JSON.stringify({ ...data, timestamp: Date.now() }) + '\n';
    fs.appendFileSync(DEBUG_LOG_PATH, logEntry, 'utf8');
  } catch (e) { console.error('Debug log error:', e); }
};

// Note: pdf-parse will be imported dynamically when needed

// Initialize Stripe (only if API key is provided)
const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim();
const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
    apiVersion: '2024-12-18.acacia',
  })
  : null;

if (!stripe) {
  console.warn('⚠️ STRIPE_SECRET_KEY not set. Stripe integration will not work.');
}

const app = express();
const PORT = process.env.PORT || 8788;

// CORS configuration: use CORS_ORIGIN if set, otherwise allow all origins
const corsOrigin = process.env.CORS_ORIGIN
  ? (process.env.CORS_ORIGIN === 'true' ? true : process.env.CORS_ORIGIN)
  : true;

app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  }),
);
app.use(express.json({ limit: '12mb' }));
// Stripe webhook needs raw body for signature verification
app.use('/api/payment/webhook', express.raw({ type: 'application/json' }));

// Ensure uploads directory exists (skip in Vercel serverless)
const uploadsDir = process.env.VERCEL
  ? '/tmp/uploads' // Vercel serverless uses /tmp
  : path.join(__dirname, 'uploads');

if (!process.env.VERCEL && !fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
} else if (process.env.VERCEL && !fs.existsSync('/tmp')) {
  // /tmp should exist in Vercel, but just in case
  try {
    fs.mkdirSync('/tmp', { recursive: true });
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
  } catch (e) {
    console.warn('Could not create uploads directory:', e);
  }
}

// Configure multer for file uploads
const upload = multer({
  dest: uploadsDir,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// #region agent log
const OPENROUTER_KEY_RAW = process.env.OPENROUTER_API_KEY;
const OPENROUTER_KEY_TRIMMED = OPENROUTER_KEY_RAW?.trim();
// Puter.js API - No API key needed (User-Pays model)
// Puter.js is serverless and doesn't require API keys
debugLog({ location: 'server/index.js:52', message: 'OPENROUTER_API_KEY env check', data: { rawExists: !!OPENROUTER_KEY_RAW, rawLength: OPENROUTER_KEY_RAW?.length || 0, trimmedExists: !!OPENROUTER_KEY_TRIMMED, trimmedLength: OPENROUTER_KEY_TRIMMED?.length || 0, firstChars: OPENROUTER_KEY_TRIMMED?.substring(0, 10) || 'N/A' }, sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' });
// #endregion

// Groq API Key (very fast, generous free tier!)
const GROQ_API_KEY = process.env.GROQ_API_KEY?.trim();

const PROVIDER_KEYS = {
  groq: GROQ_API_KEY || null, // Groq - VERY FAST, primary provider
  anthropic: GROQ_API_KEY || OPENROUTER_KEY_TRIMMED || null, // Use Groq first, fallback to OpenRouter
  deepseek: GROQ_API_KEY || OPENROUTER_KEY_TRIMMED || null, // Use Groq first, fallback to OpenRouter  
  openai: true, // GPT-5-Nano via Puter.js (no API key needed - User-Pays model)
  gemini: GROQ_API_KEY || OPENROUTER_KEY_TRIMMED || null, // Use Groq first, fallback to OpenRouter
};

// #region agent log
debugLog({ location: 'server/index.js:58', message: 'PROVIDER_KEYS initialized', data: { groq: !!PROVIDER_KEYS.groq, anthropic: !!PROVIDER_KEYS.anthropic, deepseek: !!PROVIDER_KEYS.deepseek, openai: !!PROVIDER_KEYS.openai, gemini: !!PROVIDER_KEYS.gemini }, sessionId: 'debug-session', runId: 'run1', hypothesisId: 'C' });
// #endregion

// Debug: Log API key status (without exposing actual keys)
console.log('🔑 API Key Status:', {
  GROQ_API_KEY: GROQ_API_KEY ? `Set (${GROQ_API_KEY.substring(0, 10)}...)` : 'NOT SET',
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY ? `Set (${process.env.OPENROUTER_API_KEY.substring(0, 10)}...)` : 'NOT SET',
  PUTER_JS: 'No API key needed (User-Pays model)',
  Providers: {
    groq: PROVIDER_KEYS.groq ? '✅ Configured (PRIMARY)' : 'Missing',
    anthropic: PROVIDER_KEYS.anthropic ? 'Configured' : 'Missing',
    openai: PROVIDER_KEYS.openai ? 'Configured (Puter.js)' : 'Missing',
    gemini: PROVIDER_KEYS.gemini ? 'Configured' : 'Missing',
    deepseek: PROVIDER_KEYS.deepseek ? 'Configured' : 'Missing',
  }
});

// Groq models (VERY FAST!)
const GROQ_MODELS = {
  default: 'llama-3.3-70b-versatile', // Best quality
  fast: 'llama-3.1-8b-instant', // Fastest
  tutor: 'llama-3.3-70b-versatile', // Good for explanations
};

const MODELS = {
  groq: GROQ_MODELS.default, // Primary: Groq Llama 3.3 70B
  anthropic: GROQ_MODELS.default, // Use Groq instead of OpenRouter
  deepseek: GROQ_MODELS.fast, // Use fast Groq model
  openai: 'gpt-5-nano', // GPT-5-Nano via Puter.js
  gemini: GROQ_MODELS.default, // Use Groq instead of OpenRouter
};

// Max tokens configuration (can be overridden via env)
const MAX_TOKENS = {
  groq: {
    builder: 8192,
    tutor: 4096,
  },
  anthropic: {
    builder: parseInt(process.env.ANTHROPIC_MAX_TOKENS_BUILDER) || 8192,
    tutor: parseInt(process.env.ANTHROPIC_MAX_TOKENS_TUTOR) || 4096,
  },
  deepseek: {
    builder: parseInt(process.env.DEEPSEEK_MAX_TOKENS_BUILDER) || 8192,
    tutor: parseInt(process.env.DEEPSEEK_MAX_TOKENS_TUTOR) || 4096,
  },
  openai: parseInt(process.env.OPENROUTER_MAX_TOKENS) || 2000, // Default safe value
  gemini: {
    builder: parseInt(process.env.GEMINI_MAX_TOKENS_BUILDER) || 4096,
    tutor: parseInt(process.env.GEMINI_MAX_TOKENS_TUTOR) || 4096,
  },
};

// Initialize SDK clients
// Most providers use OpenRouter via OpenAI SDK, but OpenAI provider now uses Puter.js
// #region agent log
const hasOpenaiKey = !!PROVIDER_KEYS.openai;
// Puter.js doesn't use API key (User-Pays model), so openaiKeyLength is 0
const openaiKeyLength = typeof PROVIDER_KEYS.openai === 'string' ? PROVIDER_KEYS.openai.length : 0;
const openaiKeyFirstChars = typeof PROVIDER_KEYS.openai === 'string' ? PROVIDER_KEYS.openai.substring(0, 10) : 'Puter.js (no key)';
debugLog({ location: 'server/index.js:97', message: 'Before openaiClient init', data: { hasKey: hasOpenaiKey, keyLength: openaiKeyLength, firstChars: openaiKeyFirstChars }, sessionId: 'debug-session', runId: 'run1', hypothesisId: 'C' });
// #endregion

// Groq client (PRIMARY - VERY FAST!)
const groqClient = GROQ_API_KEY ? new OpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: GROQ_API_KEY,
}) : null;

console.log('🚀 Groq Client:', groqClient ? '✅ Initialized (PRIMARY)' : '❌ Not configured');

// OpenRouter client for fallback
const openaiClient = OPENROUTER_KEY_TRIMMED ? new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: OPENROUTER_KEY_TRIMMED,
  defaultHeaders: {
    'HTTP-Referer': process.env.OPENROUTER_SITE_URL || 'https://rlabs-studio.cloud',
    'X-Title': process.env.OPENROUTER_SITE_NAME || 'Nevra',
  },
}) : null;

// Puter.js API configuration for GPT-5-Nano
// Puter.js uses User-Pays model - no API key needed
// API endpoint: https://api.puter.com/v1/ai/chat (or similar)
const PUTER_API_BASE = process.env.PUTER_API_BASE || 'https://api.puter.com/v1';

// #region agent log
debugLog({ location: 'server/index.js:104', message: 'After clients init', data: { groqExists: !!groqClient, openrouterExists: !!openaiClient }, sessionId: 'debug-session', runId: 'run1', hypothesisId: 'C' });
// #endregion

// Helper: Truncate history to fit within token limit (reduced for speed)
const truncateHistory = (history = [], maxMessages = 2) => {
  // Keep only the last 2 messages for faster processing
  return history.slice(-maxMessages);
};

const formatHistory = (history = []) =>
  history
    .map((msg) => ({
      role: msg.role === 'model' ? 'assistant' : 'user',
      content: msg.parts?.[0]?.text ?? '',
    }))
    .filter((msg) => msg.content);

// Auto Web Search Helper - Searches web for relevant info based on query
const autoWebSearch = async (query, maxResults = 3) => {
  const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

  if (!TAVILY_API_KEY) {
    console.log('[AutoSearch] No Tavily API key, skipping web search');
    return null;
  }

  // Skip internal orchestrator prompts
  const internalPromptMarkers = [
    'Review the following', 'Analyze this workflow', 'Please provide:',
    'Quality score', 'REJECTION DECISION', 'reflection', 'workflow execution',
    '=== USER INTENT ===', '=== EXECUTION RESULT ===', '=== REVIEW RESULT ==='
  ];

  const isInternalPrompt = internalPromptMarkers.some(marker =>
    query.includes(marker)
  );

  if (isInternalPrompt) {
    console.log('[AutoSearch] Internal prompt detected, skipping web search');
    return null;
  }

  // Limit query length - Tavily has limits
  if (query.length > 200) {
    console.log('[AutoSearch] Query too long, skipping web search');
    return null;
  }

  // Keywords that suggest user wants current/real-time information
  const currentInfoKeywords = [
    'sekarang', 'saat ini', 'terkini', 'terbaru', 'hari ini',
    'presiden', 'menteri', 'gubernur', 'walikota', 'bupati',
    'current', 'now', 'today', 'latest', 'recent',
    'siapa', 'berapa', 'kapan', 'dimana',
    'who is', 'what is', 'when', 'where',
    'berita', 'news', 'update', 'cuaca', 'weather',
    '2024', '2025'
  ];

  const queryLower = query.toLowerCase();
  const needsSearch = currentInfoKeywords.some(keyword => queryLower.includes(keyword));

  if (!needsSearch) {
    console.log('[AutoSearch] Query does not need web search');
    return null;
  }

  try {
    console.log(`[AutoSearch] Searching for: ${query}`);
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query: query,
        max_results: maxResults,
        search_depth: 'basic',
        include_answer: true, // Get direct answer if available
      }),
    });

    if (!response.ok) {
      console.error('[AutoSearch] Tavily API error:', response.statusText);
      return null;
    }

    const data = await response.json();
    console.log(`[AutoSearch] Found ${data.results?.length || 0} results`);

    // Format search results as context
    let searchContext = '\\n\\n📡 WEB SEARCH RESULTS (REAL-TIME INFORMATION):\\n';

    if (data.answer) {
      searchContext += `\\n🎯 Direct Answer: ${data.answer}\\n`;
    }

    if (data.results && data.results.length > 0) {
      data.results.slice(0, maxResults).forEach((result, i) => {
        searchContext += `\\n${i + 1}. **${result.title}**\\n`;
        searchContext += `   Source: ${result.url}\\n`;
        searchContext += `   ${result.content?.substring(0, 300)}...\\n`;
      });
    }

    searchContext += '\\n⚠️ Use the information above to provide accurate, up-to-date answers.\\n';

    return searchContext;
  } catch (error) {
    console.error('[AutoSearch] Error:', error);
    return null;
  }
};

const buildOpenAIUserContent = (prompt, images = []) => {
  const content = [{ type: 'text', text: prompt }];
  images.forEach((img) => {
    content.push({
      type: 'image_url',
      image_url: { url: img },
    });
  });
  return content;
};


app.post('/api/generate', async (req, res) => {
  // #region agent log
  debugLog({ location: 'server/index.js:132', message: '/api/generate endpoint called', data: { provider: req.body?.provider, mode: req.body?.mode }, sessionId: 'debug-session', runId: 'run1', hypothesisId: 'F' });
  // #endregion

  // Ensure response is always sent, even on unexpected errors
  let responseSent = false;
  let provider = 'deepseek'; // Default to Mistral Devstral (free)
  let mode = 'builder';
  let prompt = '';

  const sendResponse = (status, data) => {
    if (!responseSent) {
      responseSent = true;
      return res.status(status).json(data);
    }
  };

  const body = req.body || {};
  prompt = body.prompt || '';
  const history = body.history || [];
  const systemPrompt = body.systemPrompt;
  provider = body.provider || 'deepseek'; // Default to Mistral Devstral (free)
  mode = body.mode || 'builder';
  const images = body.images || [];

  console.log(`[${provider}] /api/generate called`, {
    hasPrompt: !!prompt,
    hasSystemPrompt: !!systemPrompt,
    mode,
    historyLength: history?.length || 0,
    imagesCount: images?.length || 0
  });

  if (!prompt || !systemPrompt) {
    console.error(`[${provider}] Missing required fields:`, { hasPrompt: !!prompt, hasSystemPrompt: !!systemPrompt });
    return sendResponse(400, { error: 'Missing prompt or systemPrompt' });
  }

  if (!PROVIDER_KEYS[provider]) {
    // Provide more helpful error messages
    if (provider === 'openai') {
      // GPT-5-Nano uses Puter.js (User-Pays model, no API key needed)
      // Puter.js doesn't require API keys, so we just check if provider is enabled
      if (!PROVIDER_KEYS.openai) {
        return sendResponse(500, {
          error: `Puter.js provider not configured. Provider "${provider}" uses Puter.js for GPT-5-Nano. No API key needed (User-Pays model).`,
        });
      }
    } else if (provider === 'anthropic' || provider === 'gemini') {
      // OpenRouter providers
      const envValue = process.env.OPENROUTER_API_KEY;
      const hasEnvButEmpty = envValue !== undefined && (!envValue || envValue.trim() === '');

      return sendResponse(500, {
        error: `OpenRouter API key not configured. Provider "${provider}" uses OpenRouter. ${hasEnvButEmpty ? 'OPENROUTER_API_KEY exists but is empty. Please check your .env file.' : 'Please set OPENROUTER_API_KEY in your environment variables and restart the server.'}`,
        debug: process.env.NODE_ENV === 'development' ? {
          hasEnvVar: envValue !== undefined,
          isEmpty: hasEnvButEmpty,
          keyLength: envValue?.length || 0
        } : undefined
      });
    }
    return sendResponse(500, { error: `${provider} API key not configured` });
  }

  // Providers that support image input via OpenRouter
  const imageSupportedProviders = ['openai', 'gemini', 'anthropic', 'deepseek'];
  if (!imageSupportedProviders.includes(provider) && images.length) {
    return sendResponse(400, { error: `${provider} does not support image input. Use ${imageSupportedProviders.join(', ')} provider.` });
  }

  const controller = new AbortController();
  // Reduced timeouts for better UX - fast models should respond quickly
  const timeoutDuration = provider === 'deepseek' ? 30_000 : 20_000;
  const timeout = setTimeout(() => controller.abort(), timeoutDuration);

  try {
    // Inject current date/time context into system prompt for up-to-date knowledge
    const now = new Date();
    const currentDateContext = `
📅 CURRENT DATE & TIME CONTEXT:
- Current Date: ${now.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
- Current Time: ${now.toLocaleTimeString('id-ID')}
- Year: ${now.getFullYear()}

🔔 IMPORTANT FACTS (as of December 2024):
- President of Indonesia: Prabowo Subianto (inaugurated October 20, 2024)
- Vice President of Indonesia: Gibran Rakabuming Raka
- Previous President: Joko Widodo (served 2014-2024)

Always provide information based on your training data AND the current date context above. If asked about current events or leaders, use this context.

`;

    // Auto web search for real-time information (in tutor mode)
    let webSearchContext = '';
    if (mode === 'tutor') {
      const searchResults = await autoWebSearch(prompt);
      if (searchResults) {
        webSearchContext = searchResults;
        console.log('[Generate] Added web search context to prompt');
      }
    }

    // Enhance system prompt for free models to ensure they follow NEVRA guidelines
    let enhancedSystemPrompt = currentDateContext + webSearchContext + systemPrompt;
    if (provider === 'deepseek') {
      if (mode === 'tutor') {
        // For tutor mode, ensure Mistral Devstral follows NEVRA Tutor guidelines
        enhancedSystemPrompt = systemPrompt + `

⚠️ IMPORTANT FOR MISTRAL DEVSTRAL IN TUTOR MODE:
- You are NEVRA TUTOR, a world-class AI Educator and Mentor
- Be patient, encouraging, and clear in your explanations
- Use Socratic questions, analogies, and step-by-step reasoning
- Help users achieve deep understanding, not just rote answers
- Format responses with bold for key concepts, code blocks for code, numbered steps for procedures
- Do NOT generate full applications in tutor mode; keep to snippets and explanations
- If images are provided, describe key elements and use them to answer questions
- Always be thorough and helpful in your analysis`;
      } else {
        // For builder mode, use existing guidelines
        enhancedSystemPrompt = systemPrompt + `

⚠️ IMPORTANT FOR MISTRAL DEVSTRAL:
- You MUST follow all NEVRA guidelines exactly as specified above
- Generate code that matches the exact format and structure required
- Use the same component patterns, styling approach, and architecture as other NEVRA providers
- Ensure your output is production-ready and follows all design system requirements
- Pay special attention to the code structure template and component patterns
- Always include proper error handling and React best practices`;
      }
    } else if (provider === 'anthropic' || provider === 'gemini') {
      // GPT OSS 20B (replaced Claude Sonnet) - same enhancements as Mistral Devstral
      if (mode === 'tutor') {
        enhancedSystemPrompt = systemPrompt + `

⚠️ IMPORTANT FOR GPT OSS 20B IN TUTOR MODE:
- You are NEVRA TUTOR, a world-class AI Educator and Mentor
- Be patient, encouraging, and clear in your explanations
- Use Socratic questions, analogies, and step-by-step reasoning
- Help users achieve deep understanding, not just rote answers
- Format responses with bold for key concepts, code blocks for code, numbered steps for procedures
- Do NOT generate full applications in tutor mode; keep to snippets and explanations
- If images are provided, describe key elements and use them to answer questions
- Always be thorough and helpful in your analysis`;
      } else {
        enhancedSystemPrompt = systemPrompt + `

⚠️ IMPORTANT FOR GPT OSS 20B:
- You MUST follow all NEVRA guidelines exactly as specified above
- Generate code that matches the exact format and structure required
- Use the same component patterns, styling approach, and architecture as other NEVRA providers
- Ensure your output is production-ready and follows all design system requirements
- Pay special attention to the code structure template and component patterns
- Always include proper error handling and React best practices`;
      }
    } else if (provider === 'openai') {
      // GPT-5-Nano via Puter.js - same enhancements
      if (mode === 'tutor') {
        enhancedSystemPrompt = systemPrompt + `

⚠️ IMPORTANT FOR GPT-5-NANO IN TUTOR MODE:
- You are NEVRA TUTOR, a world-class AI Educator and Mentor
- Be patient, encouraging, and clear in your explanations
- Use Socratic questions, analogies, and step-by-step reasoning
- Help users achieve deep understanding, not just rote answers
- Format responses with bold for key concepts, code blocks for code, numbered steps for procedures
- Do NOT generate full applications in tutor mode; keep to snippets and explanations
- If images are provided, describe key elements and use them to answer questions
- Always be thorough and helpful in your analysis`;
      } else {
        enhancedSystemPrompt = systemPrompt + `

⚠️ IMPORTANT FOR GPT-5-NANO:
- You MUST follow all NEVRA guidelines exactly as specified above
- Generate code that matches the exact format and structure required
- Use the same component patterns, styling approach, and architecture as other NEVRA providers
- Ensure your output is production-ready and follows all design system requirements
- Pay special attention to the code structure template and component patterns
- Always include proper error handling and React best practices`;
      }
    }

    const messagesBase = [
      { role: 'system', content: enhancedSystemPrompt },
      ...formatHistory(truncateHistory(history, 2)), // Truncate history for speed
    ];

    let content;

    switch (provider) {
      case 'openai': {
        // GPT-5-Nano via Puter.js API
        // Build messages for Puter.js API (OpenAI-compatible format)
        // messagesBase already has system and history, we just need to add user message
        const puterMessages = [...messagesBase];

        // Add user message with images if any
        if (images && images.length > 0) {
          // GPT-5-Nano supports images via OpenAI-compatible format
          const imageContents = images.map(img => ({
            type: 'image_url',
            image_url: { url: img }
          }));
          puterMessages.push({
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              ...imageContents
            ]
          });
        } else {
          puterMessages.push({
            role: 'user',
            content: prompt
          });
        }

        // Use configurable max_tokens
        const baseMaxTokens = MAX_TOKENS.openai;
        // Adjust temperature based on mode
        const temperature = mode === 'tutor' ? 0.7 : 0.5;

        try {
          // Puter.js API endpoint (OpenAI-compatible format)
          // Note: Puter.js uses User-Pays model, no API key needed
          const puterResponse = await fetch(`${PUTER_API_BASE}/ai/chat`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              // No Authorization header needed for Puter.js (User-Pays model)
            },
            body: JSON.stringify({
              model: MODELS.openai,
              messages: puterMessages,
              temperature: temperature,
              max_tokens: baseMaxTokens,
              stream: false,
            }),
            signal: controller.signal,
          });

          if (!puterResponse.ok) {
            const errorText = await puterResponse.text();
            let errorData;
            try {
              errorData = JSON.parse(errorText);
            } catch {
              errorData = { error: errorText || puterResponse.statusText };
            }

            const errorMsg = errorData?.error?.message || errorData?.error || errorText || puterResponse.statusText;
            console.error(`[${provider}] Puter.js API error:`, errorMsg);

            return sendResponse(puterResponse.status || 500, {
              error: `Puter.js API Error (GPT-5-Nano): ${errorMsg}`,
              detail: errorData?.error || errorMsg,
            });
          }

          const puterData = await puterResponse.json();
          // Puter.js response format may vary, try multiple possible formats
          content = puterData.choices?.[0]?.message?.content ||
            puterData.message?.content?.[0]?.text ||
            puterData.message?.content ||
            puterData.output_text ||
            puterData.response ||
            '';

          if (!content) {
            console.error(`[${provider}] No content in Puter.js response:`, puterData);
            return sendResponse(500, {
              error: 'Puter.js API response missing content',
              detail: JSON.stringify(puterData)
            });
          }

          console.log(`[${provider}] Puter.js API success, content length: ${content.length}`);
        } catch (fetchErr) {
          const errorMsg = fetchErr?.message || String(fetchErr);
          console.error(`[${provider}] Puter.js API fetch error:`, errorMsg);

          // Check for timeout/abort
          if (fetchErr?.name === 'AbortError' || errorMsg.toLowerCase().includes('aborted') || errorMsg.toLowerCase().includes('timeout')) {
            return sendResponse(504, {
              error: `Puter.js API Error (GPT-5-Nano): Request timeout - The request took too long to complete. Please try again with a shorter prompt.`,
              detail: 'Request timeout'
            });
          }

          return sendResponse(500, {
            error: `Puter.js API Error (GPT-5-Nano): ${errorMsg}`,
            detail: errorMsg,
          });
        }

        break;
      }
      case 'anthropic':
      case 'groq':
      case 'gemini':
      default: {
        // Use Groq as PRIMARY provider (VERY FAST!)
        // Auto-fallback to OpenRouter if Groq rate limited
        let client = groqClient || openaiClient;
        let modelToUse = groqClient ? MODELS.groq : MODELS.anthropic;
        let usingFallback = false;

        if (!client) {
          return sendResponse(500, { error: 'No AI client available. Please configure GROQ_API_KEY or OPENROUTER_API_KEY.' });
        }

        console.log(`[${provider}] Using ${groqClient && !usingFallback ? 'Groq ⚡' : 'OpenRouter'} with model: ${modelToUse}`);

        const messages = [
          ...messagesBase,
          { role: 'user', content: buildOpenAIUserContent(prompt, images) },
        ];

        // Use configurable max_tokens
        const maxTokensConfig = groqClient && !usingFallback ? MAX_TOKENS.groq : MAX_TOKENS.anthropic;
        const baseMaxTokens = mode === 'builder' ? maxTokensConfig.builder : maxTokensConfig.tutor;

        try {
          const completion = await client.chat.completions.create({
            model: modelToUse,
            messages,
            temperature: mode === 'tutor' ? 0.7 : 0.5,
            max_tokens: baseMaxTokens,
          }, {
            signal: controller.signal,
          });

          const anthropicContent = completion.choices[0]?.message?.content;
          content = anthropicContent;
        } catch (sdkErr) {
          const errorStatus = sdkErr?.status || sdkErr?.response?.status || 500;
          const errorMsg = sdkErr?.error?.message || sdkErr?.message || String(sdkErr);

          console.error(`[${provider}] ${groqClient && !usingFallback ? 'Groq' : 'OpenRouter'} SDK error:`, sdkErr);

          // Auto-fallback to OpenRouter if Groq rate limited (429)
          if (errorStatus === 429 && groqClient && openaiClient && !usingFallback) {
            console.log(`[${provider}] 🔄 Groq rate limited, falling back to OpenRouter...`);
            usingFallback = true;
            client = openaiClient;
            modelToUse = MODELS.anthropic;

            try {
              const fallbackCompletion = await client.chat.completions.create({
                model: modelToUse,
                messages,
                temperature: mode === 'tutor' ? 0.7 : 0.5,
                max_tokens: MAX_TOKENS.anthropic[mode === 'builder' ? 'builder' : 'tutor'],
              }, {
                signal: controller.signal,
              });

              content = fallbackCompletion.choices[0]?.message?.content;
              console.log(`[${provider}] ✅ Fallback to OpenRouter successful`);
            } catch (fallbackErr) {
              console.error(`[${provider}] OpenRouter fallback also failed:`, fallbackErr);
              return sendResponse(500, {
                error: `Both Groq and OpenRouter failed. Groq: ${errorMsg}. OpenRouter: ${fallbackErr?.message || String(fallbackErr)}`,
              });
            }
          } else {
            return sendResponse(errorStatus, {
              error: `${groqClient && !usingFallback ? 'Groq' : 'OpenRouter'} API Error: ${errorMsg}`,
              detail: sdkErr?.error || errorMsg,
            });
          }
        }
        break;
      }
      // deepseek case is now handled by default case above (uses Groq)
    }
    // Mistral AI Devstral 2512 (free) via OpenRouter
    // NOTE: All providers now use Groq as primary (handled by default case)
    // This orphan code block has been removed

    if (!content) {
      console.error(`[${provider}] No content in response`);
      return sendResponse(500, {
        error: `${provider.toUpperCase()} response missing content`
      });
    }

    return sendResponse(200, { content });
  } catch (err) {
    // Clear timeout in case of error
    clearTimeout(timeout);

    // Log error details for debugging
    console.error(`[${provider}] Error in /api/generate:`, {
      name: err?.name,
      message: err?.message,
      provider,
      mode,
      hasPrompt: !!prompt
    });

    if (err?.name === 'AbortError' || err?.message?.includes('aborted')) {
      return sendResponse(504, {
        error: `Request timeout - The request took too long to complete.`,
        detail: 'Request timeout'
      });
    }

    return sendResponse(500, {
      error: 'An unexpected error occurred',
      detail: err?.message || String(err)
    });
  }
});
// End of /api/generate endpoint

// Other orphan code removed (was dead code from old deepseek/gemini handlers)

// Health check endpoints
app.get('/', (_req, res) => {
  res.type('text/html').send('<h1>Nevra API OK</h1>');
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});
// Deployment endpoint
app.post('/api/deploy', async (req, res) => {
  const { code, platform, projectName, apiToken } = req.body || {};

  if (!code) {
    return res.status(400).json({ error: 'Code is required' });
  }

  if (!platform || !['vercel', 'netlify'].includes(platform)) {
    return res.status(400).json({ error: 'Platform must be vercel or netlify' });
  }

  try {
    if (platform === 'vercel') {
      const token = apiToken || process.env.VERCEL_TOKEN;
      if (!token) {
        return res.status(500).json({ error: 'Vercel token not configured. Add VERCEL_TOKEN to .env' });
      }

      // Create Vercel deployment
      // Note: Vercel API v13 requires different format - using simplified approach
      const vercelResponse = await fetch('https://api.vercel.com/v13/deployments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: projectName || `nevra-${Date.now()}`,
          files: [
            {
              file: '/index.html',
              data: Buffer.from(code).toString('base64'),
            },
          ],
          projectSettings: {
            framework: null,
          },
        }),
      });

      if (!vercelResponse.ok) {
        const error = await vercelResponse.json();
        return res.status(500).json({
          error: `Vercel deployment failed: ${error.error?.message || JSON.stringify(error)}`
        });
      }

      const deployment = await vercelResponse.json();
      return res.json({
        success: true,
        url: deployment.url ? `https://${deployment.url}` : undefined,
        deploymentId: deployment.id,
      });
    } else if (platform === 'netlify') {
      const token = apiToken || process.env.NETLIFY_TOKEN;
      if (!token) {
        return res.status(500).json({ error: 'Netlify token not configured. Add NETLIFY_TOKEN to .env' });
      }

      // Create Netlify site
      const siteResponse = await fetch('https://api.netlify.com/api/v1/sites', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: projectName || `nevra-${Date.now()}`,
        }),
      });

      if (!siteResponse.ok) {
        const error = await siteResponse.json();
        return res.status(500).json({
          error: `Netlify site creation failed: ${error.message || 'Unknown error'}`
        });
      }

      const site = await siteResponse.json();

      // Deploy files using Netlify API
      const formData = new FormData();
      const blob = new Blob([code], { type: 'text/html' });
      formData.append('file', blob, 'index.html');

      const deployResponse = await fetch(`https://api.netlify.com/api/v1/sites/${site.id}/deploys`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!deployResponse.ok) {
        const error = await deployResponse.json();
        return res.status(500).json({
          error: `Netlify deployment failed: ${error.message || 'Unknown error'}`
        });
      }

      const deployment = await deployResponse.json();
      return res.json({
        success: true,
        url: `https://${site.subdomain}.netlify.app`,
        deploymentId: deployment.id,
      });
    }
  } catch (error) {
    console.error('Deployment error:', error);
    return res.status(500).json({
      error: `Deployment failed: ${error.message || 'Unknown error'}`
    });
  }
});

// Deployment status endpoint
app.post('/api/deploy/status', async (req, res) => {
  const { deploymentId, platform } = req.body || {};

  if (!deploymentId || !platform) {
    return res.status(400).json({ error: 'deploymentId and platform are required' });
  }

  try {
    if (platform === 'vercel') {
      const token = process.env.VERCEL_TOKEN;
      if (!token) {
        return res.status(500).json({ error: 'Vercel token not configured' });
      }

      const response = await fetch(`https://api.vercel.com/v13/deployments/${deploymentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        return res.status(500).json({ error: 'Failed to get deployment status' });
      }

      const deployment = await response.json();
      return res.json({
        status: deployment.readyState === 'READY' ? 'ready' : 'building',
        url: deployment.url ? `https://${deployment.url}` : undefined,
      });
    } else if (platform === 'netlify') {
      const token = process.env.NETLIFY_TOKEN;
      if (!token) {
        return res.status(500).json({ error: 'Netlify token not configured' });
      }

      const response = await fetch(`https://api.netlify.com/api/v1/deploys/${deploymentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        return res.status(500).json({ error: 'Failed to get deployment status' });
      }

      const deployment = await response.json();
      return res.json({
        status: deployment.state === 'ready' ? 'ready' : 'building',
        url: deployment.deploy_ssl_url,
      });
    }
  } catch (error) {
    console.error('Status check error:', error);
    return res.status(500).json({ error: 'Failed to get deployment status' });
  }
});

// GitHub OAuth Routes
app.get('/api/github/auth', (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    return res.status(500).json({ error: 'GitHub Client ID not configured' });
  }

  const redirectUri = process.env.GITHUB_REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/github/callback`;
  const scope = 'repo';
  const state = req.query.state || Math.random().toString(36).substring(7);

  const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}`;

  res.json({ authUrl, state });
});

app.get('/api/github/callback', async (req, res) => {
  const { code, state } = req.query;

  if (!code) {
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/?github_error=no_code`);
  }

  try {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;
    const redirectUri = process.env.GITHUB_REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/github/callback`;

    if (!clientId || !clientSecret) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/?github_error=not_configured`);
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/?github_error=${tokenData.error}`);
    }

    // Redirect to frontend with token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/?github_token=${tokenData.access_token}&state=${state}`);
  } catch (error) {
    console.error('GitHub OAuth error:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/?github_error=server_error`);
  }
});

app.post('/api/github/repos', async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(401).json({ error: 'GitHub token required' });
  }

  try {
    const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100', {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch repositories' });
    }

    const repos = await response.json();
    res.json({
      repos: repos.map(repo => ({
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        private: repo.private,
        url: repo.html_url,
        defaultBranch: repo.default_branch,
      }))
    });
  } catch (error) {
    console.error('GitHub repos error:', error);
    res.status(500).json({ error: 'Failed to fetch repositories' });
  }
});

app.post('/api/github/create-repo', async (req, res) => {
  const { token, name, description, isPrivate } = req.body;

  if (!token || !name) {
    return res.status(400).json({ error: 'Token and repository name required' });
  }

  try {
    const response = await fetch('https://api.github.com/user/repos', {
      method: 'POST',
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        description: description || '',
        private: isPrivate || false,
        auto_init: true,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return res.status(response.status).json({ error: error.message || 'Failed to create repository' });
    }

    const repo = await response.json();
    res.json({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      url: repo.html_url,
      defaultBranch: repo.default_branch,
    });
  } catch (error) {
    console.error('GitHub create repo error:', error);
    res.status(500).json({ error: 'Failed to create repository' });
  }
});

app.post('/api/github/push', async (req, res) => {
  const { token, repo, files, commitMessage, branch } = req.body;

  if (!token || !repo || !files || !Array.isArray(files) || files.length === 0) {
    return res.status(400).json({ error: 'Token, repository, and files required' });
  }

  try {
    const repoFullName = typeof repo === 'string' ? repo : repo.fullName;
    const targetBranch = branch || 'main';
    const message = commitMessage || 'Update from NEVRA';

    // Get current tree SHA
    const refResponse = await fetch(`https://api.github.com/repos/${repoFullName}/git/ref/heads/${targetBranch}`, {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    let baseTreeSha;
    if (refResponse.ok) {
      const refData = await refResponse.json();
      const commitResponse = await fetch(`https://api.github.com/repos/${repoFullName}/git/commits/${refData.object.sha}`, {
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });
      if (commitResponse.ok) {
        const commitData = await commitResponse.json();
        baseTreeSha = commitData.tree.sha;
      }
    }

    // Create blobs for all files
    const blobPromises = files.map(async (file) => {
      const content = typeof file === 'string' ? file : file.content;
      const path = typeof file === 'string' ? 'index.html' : (file.path || file.name || 'index.html');
      const blobContent = Buffer.from(content).toString('base64');

      const blobResponse = await fetch(`https://api.github.com/repos/${repoFullName}/git/blobs`, {
        method: 'POST',
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: blobContent,
          encoding: 'base64',
        }),
      });

      if (!blobResponse.ok) {
        throw new Error(`Failed to create blob for ${path}`);
      }

      const blobData = await blobResponse.json();
      return {
        path,
        mode: '100644',
        type: 'blob',
        sha: blobData.sha,
      };
    });

    const treeItems = await Promise.all(blobPromises);

    // Create tree
    const treeResponse = await fetch(`https://api.github.com/repos/${repoFullName}/git/trees`, {
      method: 'POST',
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        base_tree: baseTreeSha,
        tree: treeItems,
      }),
    });

    if (!treeResponse.ok) {
      const error = await treeResponse.json();
      throw new Error(error.message || 'Failed to create tree');
    }

    const treeData = await treeResponse.json();

    // Get current commit SHA
    let parentSha = null;
    if (refResponse.ok) {
      const refData = await refResponse.json();
      parentSha = refData.object.sha;
    }

    // Create commit
    const commitResponse = await fetch(`https://api.github.com/repos/${repoFullName}/git/commits`, {
      method: 'POST',
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        tree: treeData.sha,
        parents: parentSha ? [parentSha] : [],
      }),
    });

    if (!commitResponse.ok) {
      const error = await commitResponse.json();
      throw new Error(error.message || 'Failed to create commit');
    }

    const commitData = await commitResponse.json();

    // Update branch reference
    const updateRefResponse = await fetch(`https://api.github.com/repos/${repoFullName}/git/refs/heads/${targetBranch}`, {
      method: 'PATCH',
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sha: commitData.sha,
      }),
    });

    if (!updateRefResponse.ok) {
      const error = await updateRefResponse.json();
      throw new Error(error.message || 'Failed to update branch');
    }

    res.json({
      success: true,
      url: `https://github.com/${repoFullName}`,
      commitSha: commitData.sha,
    });
  } catch (error) {
    console.error('GitHub push error:', error);
    res.status(500).json({ error: error.message || 'Failed to push to GitHub' });
  }
});

// Web Search endpoint (for Tutor mode)
app.post('/api/search', async (req, res) => {
  const { query, maxResults = 10 } = req.body || {};

  if (!query) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  try {
    // Use Tavily API for web search (free tier available)
    // Alternative: SerpAPI, Google Custom Search, or DuckDuckGo
    const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

    if (!TAVILY_API_KEY) {
      // Fallback: Use DuckDuckGo HTML scraping (no API key needed)
      const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;

      // For now, return mock results (implement actual search later)
      const mockResults = [
        {
          title: `Search results for: ${query}`,
          url: searchUrl,
          snippet: `Search results for "${query}". To enable real web search, add TAVILY_API_KEY to your environment variables.`,
          source: 'DuckDuckGo',
        },
      ];

      return res.json({
        query,
        results: mockResults.slice(0, maxResults),
        totalResults: mockResults.length,
        searchTime: 0.5,
      });
    }

    // Use Tavily API for real search
    const tavilyResponse = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query,
        max_results: maxResults,
        search_depth: 'basic',
      }),
    });

    if (!tavilyResponse.ok) {
      throw new Error(`Tavily API error: ${tavilyResponse.statusText}`);
    }

    const tavilyData = await tavilyResponse.json();

    const results = (tavilyData.results || []).map((result) => ({
      title: result.title || 'No title',
      url: result.url || '',
      snippet: result.content || '',
      source: new URL(result.url || '').hostname,
      relevanceScore: result.score,
    }));

    res.json({
      query,
      results,
      totalResults: tavilyData.results?.length || 0,
      searchTime: tavilyData.query_time || 0,
    });
  } catch (error) {
    console.error('Web search error:', error);
    res.status(500).json({
      error: error?.message || 'Web search failed',
      query,
      results: [],
      totalResults: 0,
      searchTime: 0,
    });
  }
});

// Document parsing endpoint
app.post('/api/parse-document', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.file;
    const filePath = file.path;
    const fileName = file.originalname;
    const fileExt = path.extname(fileName).toLowerCase();

    let content = '';
    let pages = 0;
    let metadata = {};

    try {
      // Parse based on file type
      if (fileExt === '.pdf') {
        // pdf-parse v2+ exports PDFParse class, create wrapper function
        const pdfParseModule = require('pdf-parse');
        const PDFParse = pdfParseModule.PDFParse;

        if (!PDFParse || typeof PDFParse !== 'function') {
          throw new Error(`pdf-parse PDFParse class not found. Please reinstall: npm install pdf-parse`);
        }

        const dataBuffer = fs.readFileSync(filePath);

        // Create wrapper function compatible with old API
        const pdfParseWrapper = async (buffer) => {
          const parser = new PDFParse({ data: buffer });
          await parser.load();

          const text = parser.getText();
          const info = parser.getInfo();

          // Get page count (try different properties)
          let numPages = 0;
          if (parser.numPages !== undefined) {
            numPages = parser.numPages;
          } else if (parser.pages && Array.isArray(parser.pages)) {
            numPages = parser.pages.length;
          } else if (info && info.Pages) {
            numPages = parseInt(info.Pages) || 0;
          }

          return {
            text: text || '',
            numpages: numPages,
            info: info || {},
          };
        };

        const pdfData = await pdfParseWrapper(dataBuffer);
        content = pdfData.text;
        pages = pdfData.numpages;
        metadata = {
          author: pdfData.info?.Author,
          createdAt: pdfData.info?.CreationDate,
          wordCount: content.split(/\s+/).length,
        };
      } else if (fileExt === '.docx') {
        const result = await mammoth.extractRawText({ path: filePath });
        content = result.value;
        const messages = result.messages;
        metadata = {
          wordCount: content.split(/\s+/).length,
        };
        // Estimate pages (rough estimate: 500 words per page)
        pages = Math.ceil(metadata.wordCount / 500);
      } else if (fileExt === '.txt' || fileExt === '.md') {
        content = fs.readFileSync(filePath, 'utf-8');
        metadata = {
          wordCount: content.split(/\s+/).length,
        };
        pages = Math.ceil(metadata.wordCount / 500);
      } else {
        // Try to read as text for unknown types
        try {
          content = fs.readFileSync(filePath, 'utf-8');
          metadata = {
            wordCount: content.split(/\s+/).length,
          };
          pages = Math.ceil(metadata.wordCount / 500);
        } catch (err) {
          return res.status(400).json({
            error: 'Unsupported file type',
            message: `File type ${fileExt} is not supported. Supported types: .pdf, .docx, .txt, .md`
          });
        }
      }

      // Clean up uploaded file
      fs.unlinkSync(filePath);

      // Split content into sections (by paragraphs or headings)
      const sections = [];
      const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 0);

      paragraphs.forEach((para, index) => {
        // Check if paragraph looks like a heading (short and might be all caps or have specific patterns)
        const isHeading = para.length < 100 && (para === para.toUpperCase() || para.match(/^#{1,6}\s/));

        if (isHeading || index === 0) {
          sections.push({
            title: isHeading ? para.trim() : `Section ${sections.length + 1}`,
            content: para.trim(),
            pageNumber: Math.floor(index / 10) + 1, // Rough page estimate
          });
        } else if (sections.length > 0) {
          // Append to last section
          sections[sections.length - 1].content += '\n\n' + para.trim();
        } else {
          sections.push({
            title: 'Introduction',
            content: para.trim(),
            pageNumber: 1,
          });
        }
      });

      res.json({
        title: fileName,
        content: content,
        pages: pages,
        sections: sections,
        metadata: metadata,
      });
    } catch (parseError) {
      // Clean up file on error
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      throw parseError;
    }
  } catch (error) {
    console.error('Document parsing error:', error);
    res.status(500).json({
      error: 'Failed to parse document',
      message: error.message || 'An error occurred while parsing the document'
    });
  }
});

// Code execution endpoint (Python)
app.post('/api/execute-code', async (req, res) => {
  const { code, language = 'python' } = req.body || {};

  if (!code) {
    return res.status(400).json({ error: 'Code is required' });
  }

  // Code execution not available in Vercel serverless environment
  if (process.env.VERCEL || process.env.VERCEL_ENV) {
    return res.status(503).json({
      error: 'Code execution is not available in serverless environment. Please use a dedicated server for this feature.',
      output: '',
      executionTime: 0
    });
  }

  if (language !== 'python') {
    return res.status(400).json({ error: 'Only Python execution is supported on server' });
  }

  try {
    const startTime = Date.now();

    // Create temporary Python file
    const tempDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const tempFile = path.join(tempDir, `exec_${Date.now()}_${Math.random().toString(36).substring(7)}.py`);

    try {
      // Write code to temporary file
      fs.writeFileSync(tempFile, code, 'utf-8');

      // Execute Python code with timeout (10 seconds)
      const timeout = 10000; // 10 seconds
      const pythonCommand = process.env.PYTHON_COMMAND || 'python3';

      const { stdout, stderr } = await execAsync(`${pythonCommand} "${tempFile}"`, {
        timeout,
        maxBuffer: 1024 * 1024, // 1MB max output
      });

      const executionTime = Date.now() - startTime;

      // Clean up temp file
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }

      if (stderr && stderr.trim()) {
        res.json({
          output: stdout || '',
          error: stderr.trim(),
          executionTime,
        });
      } else {
        res.json({
          output: stdout || '',
          error: null,
          executionTime,
        });
      }
    } catch (execError) {
      // Clean up temp file on error
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }

      const executionTime = Date.now() - startTime;

      // Handle different error types
      let errorMessage = 'Execution failed';
      if (execError.code === 'ETIMEDOUT' || execError.signal === 'SIGTERM' || execError.message?.includes('timeout')) {
        errorMessage = 'Execution timeout: Code took too long to execute (max 10 seconds)';
      } else if (execError.stderr) {
        errorMessage = execError.stderr.trim();
      } else if (execError.stdout) {
        // Sometimes Python errors are in stdout
        errorMessage = execError.stdout.trim();
      } else if (execError.message) {
        errorMessage = execError.message;
      } else if (execError.code === 'ENOENT') {
        errorMessage = 'Python not found. Please install Python 3 or set PYTHON_COMMAND environment variable.';
      }

      res.json({
        output: '',
        error: errorMessage,
        executionTime,
      });
    }
  } catch (error) {
    console.error('Code execution error:', error);
    res.status(500).json({
      error: error?.message || 'Code execution failed',
      output: '',
    });
  }
});

// Agentic Planning endpoint
app.post('/api/plan', async (req, res) => {
  const { prompt, provider = 'deepseek' } = req.body || {}; // Default to Mistral Devstral

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    // Use AI to generate a plan with enhanced instructions
    const planningPrompt = `You are an expert project planning assistant. Your task is to break down the user's request into a detailed, actionable task list with clear dependencies, priorities, and time estimates.

User Request: "${prompt}"

INSTRUCTIONS:
1. Analyze the request thoroughly and identify all required components
2. Break down into logical, sequential tasks that can be executed independently when dependencies are met
3. Each task should be specific, actionable, and have clear deliverables
4. Identify dependencies carefully - tasks should only depend on completed tasks
5. Estimate time realistically in minutes (5-60 minutes per task typically)
6. Assign priorities based on critical path and importance
7. Categorize tasks appropriately

TASK CATEGORIES:
- setup: Initial configuration, dependencies, project structure
- component: UI components, React components, visual elements
- styling: CSS, Tailwind, design system, themes
- logic: Business logic, state management, algorithms
- integration: API calls, external services, data fetching
- testing: Unit tests, integration tests, e2e tests
- deployment: Build, deployment configuration, hosting
- documentation: Code comments, README, user guides

PRIORITIES:
- high: Critical path, blocking other tasks, core functionality
- medium: Important but not blocking, enhances functionality
- low: Nice-to-have, polish, optimizations

Create a JSON response with this EXACT structure:
{
  "tasks": [
    {
      "id": "1",
      "title": "Clear, concise task title (verb + noun)",
      "description": "Detailed description of what needs to be done, including specific requirements and acceptance criteria",
      "status": "pending",
      "dependencies": ["task_id_if_any"],
      "estimatedTime": 15,
      "priority": "high",
      "category": "setup"
    }
  ],
  "estimatedTotalTime": 45
}

IMPORTANT:
- Always return valid JSON
- IDs should be sequential strings ("1", "2", "3", etc.)
- Dependencies array should reference task IDs
- estimatedTime should be in minutes (integer)
- estimatedTotalTime should be the sum of all task times
- Be thorough but practical - typically 3-10 tasks depending on complexity
- Consider the full development lifecycle from setup to deployment`;

    const messages = [
      { role: 'system', content: planningPrompt },
      { role: 'user', content: prompt },
    ];

    let content = '';

    // Create timeout promise (10 seconds for planning)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Planning request timeout')), 10000);
    });

    // Support all OpenRouter providers for planning with timeout
    let completion;
    try {
      if (provider === 'openai' && PROVIDER_KEYS.openai) {
        // GPT-5-Nano via Puter.js API for planning
        const planningPromise = fetch(`${PUTER_API_BASE}/ai/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // No Authorization header needed for Puter.js
          },
          body: JSON.stringify({
            model: MODELS.openai,
            messages,
            temperature: 0.7,
            max_tokens: 2000,
            stream: false,
          }),
        }).then(res => {
          if (!res.ok) throw new Error(`Puter.js API error: ${res.statusText}`);
          return res.json();
        }).then(data => ({
          choices: [{ message: { content: data.choices?.[0]?.message?.content || data.message?.content?.[0]?.text || data.message?.content || data.output_text || '' } }]
        }));
        completion = await Promise.race([planningPromise, timeoutPromise]);
      } else if (provider === 'gemini' && openaiClient) {
        // GPT OSS 20B (Free) via OpenRouter
        const planningPromise = openaiClient.chat.completions.create({
          model: MODELS.gemini,
          messages,
          temperature: 0.7,
          max_tokens: 2000, // Reduced from 3000 for faster response
        });
        completion = await Promise.race([planningPromise, timeoutPromise]);
      } else if (provider === 'anthropic' && openaiClient) {
        // GPT OSS 20B (Free) via OpenRouter
        const planningPromise = openaiClient.chat.completions.create({
          model: MODELS.anthropic,
          messages,
          temperature: 0.7,
          max_tokens: 2000, // Reduced from 3000 for faster response
        });
        completion = await Promise.race([planningPromise, timeoutPromise]);
      } else if (provider === 'deepseek' && openaiClient) {
        // Mistral AI Devstral 2512 (free) via OpenRouter - DEFAULT
        const planningPromise = openaiClient.chat.completions.create({
          model: MODELS.deepseek,
          messages,
          temperature: 0.7,
          max_tokens: 2000, // Reduced from 3000 for faster response
        });
        completion = await Promise.race([planningPromise, timeoutPromise]);
      } else if (openaiClient) {
        // Default to Mistral Devstral (free)
        const planningPromise = openaiClient.chat.completions.create({
          model: MODELS.deepseek,
          messages,
          temperature: 0.7,
          max_tokens: 2000, // Reduced from 3000 for faster response
        });
        completion = await Promise.race([planningPromise, timeoutPromise]);
      } else {
        throw new Error('No AI client available');
      }
      content = completion.choices[0]?.message?.content || '';
    } catch (error) {
      if (error.message === 'Planning request timeout' || error.message?.includes('timeout')) {
        throw new Error('Planning timeout - request took too long');
      }
      throw error;
    }

    // Try to parse JSON from response
    let planData;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
      const jsonContent = jsonMatch ? jsonMatch[1] : content;
      planData = JSON.parse(jsonContent.trim());
    } catch (parseError) {
      // If parsing fails, create a basic plan
      planData = {
        tasks: [
          {
            id: '1',
            title: 'Analyze Requirements',
            description: 'Understand the user requirements',
            status: 'pending',
            dependencies: [],
            priority: 'high',
            category: 'setup',
          },
          {
            id: '2',
            title: 'Generate Code',
            description: 'Create the application code',
            status: 'pending',
            dependencies: ['1'],
            priority: 'high',
            category: 'component',
          },
        ],
        estimatedTotalTime: 15,
      };
    }

    res.json({
      id: Date.now().toString(),
      prompt,
      tasks: planData.tasks || [],
      estimatedTotalTime: planData.estimatedTotalTime || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Planning error:', error);
    res.status(500).json({
      error: error?.message || 'Planning failed',
      id: Date.now().toString(),
      prompt,
      tasks: [],
      estimatedTotalTime: 0,
    });
  }
});

// Currency detection endpoint
app.get('/api/currency/detect', async (req, res) => {
  try {
    const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.ip;

    // Try to detect from IP
    let countryCode = 'US';
    try {
      const response = await fetch(`https://ipapi.co/${clientIp}/json/`);
      if (response.ok) {
        const data = await response.json();
        countryCode = data.country_code || 'US';
      }
    } catch (error) {
      console.warn('Failed to detect IP location:', error);
    }

    const currency = countryCode === 'ID' ? 'IDR' : 'USD';
    const exchangeRate = countryCode === 'ID' ? 16000 : 1;

    res.json({
      currency,
      countryCode,
      exchangeRate,
    });
  } catch (error) {
    console.error('Currency detection error:', error);
    res.json({
      currency: 'USD',
      countryCode: 'US',
      exchangeRate: 1,
    });
  }
});

// Payment checkout endpoint with Stripe
app.post('/api/payment/checkout', async (req, res) => {
  const { plan, currency, amount, userId } = req.body || {};

  if (!plan || plan !== 'premium') {
    return res.status(400).json({ error: 'Invalid plan' });
  }

  if (!userId) {
    return res.status(401).json({ error: 'User ID is required. Please sign in.' });
  }

  if (!stripe || !process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: 'Stripe is not configured. Please contact support.' });
  }

  try {
    // Convert amount to cents (Stripe uses smallest currency unit)
    const amountInCents = Math.round(amount * 100);

    // Get base URL for success/cancel URLs
    const baseUrl = process.env.FRONTEND_URL || req.headers.origin || 'http://localhost:5173';

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: 'NEVRA Premium Subscription',
              description: 'Unlimited AI tokens, all AI models, priority support, and more',
            },
            recurring: {
              interval: 'month',
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${baseUrl}/pricing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing?canceled=true`,
      client_reference_id: userId, // Store user ID for webhook
      metadata: {
        userId,
        plan: 'premium',
      },
    });

    res.json({
      checkout_url: session.url,
      session_id: session.id,
    });
  } catch (error) {
    console.error('Payment checkout error:', error);
    res.status(500).json({
      error: error?.message || 'Payment checkout failed',
    });
  }
});

// Stripe webhook endpoint for handling subscription events
app.post('/api/payment/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('⚠️ STRIPE_WEBHOOK_SECRET not set. Webhook verification disabled.');
    return res.status(400).send('Webhook secret not configured');
  }

  if (!stripe) {
    return res.status(500).send('Stripe not initialized');
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.client_reference_id || session.metadata?.userId;

        if (!userId) {
          console.error('No user ID found in checkout session');
          return res.status(400).json({ error: 'Missing user ID' });
        }

        // TODO: Implement Firebase subscription update
        // For now, just log the subscription activation
        console.log(`✅ Subscription activated for user ${userId}`);
        console.log(`   Stripe Customer ID: ${session.customer}`);
        console.log(`   Stripe Subscription ID: ${session.subscription}`);
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer;
        const isActive = subscription.status === 'active' || subscription.status === 'trialing';

        // TODO: Implement Firebase subscription status update
        console.log(`📋 Subscription ${event.type}:`);
        console.log(`   Customer ID: ${customerId}`);
        console.log(`   Status: ${subscription.status}`);
        console.log(`   Is Active: ${isActive}`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Get subscription status endpoint
app.get('/api/payment/subscription', async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    // TODO: Implement Firebase subscription check
    // For now, return free tier for all users
    console.log('[Subscription] Checking subscription for user:', userId);

    res.json({
      subscription: 'free',
      isActive: false,
      subscribedAt: null,
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({ error: 'Failed to fetch subscription status' });
  }
});

// Create customer portal session for managing subscription
// Workflow endpoint - Multi-stage AI workflow
app.post('/api/workflow', async (req, res) => {
  const {
    prompt,
    history = [],
    mode = 'builder',
    provider = 'deepseek',
    images = [],
    framework = 'html',
    userId,
    sessionId,
  } = req.body || {};

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    // For now, workflow is primarily client-side
    // This endpoint can be used for server-side workflow execution in the future
    // For now, it acts as a proxy that uses the existing generate endpoint

    // The actual workflow orchestration happens in the frontend (lib/workflow/orchestrator.ts)
    // This endpoint is here for future server-side workflow execution

    // For now, just call the generate endpoint
    // In the future, this could execute the full workflow server-side
    const generateResponse = await fetch(`${req.protocol}://${req.get('host')}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        history,
        mode,
        provider,
        images,
        systemPrompt: mode === 'builder'
          ? 'You are NEVRA BUILDER, an elite Frontend Engineer.'
          : 'You are NEVRA TUTOR, a world-class AI Educator.',
      }),
    });

    if (!generateResponse.ok) {
      const errorData = await generateResponse.json().catch(() => ({ error: 'Workflow execution failed' }));
      return res.status(generateResponse.status).json(errorData);
    }

    const result = await generateResponse.json();

    // Return workflow result format
    return res.json({
      response: typeof result === 'string' ? result : result.content || '',
      code: typeof result === 'string' ? result : result.content || undefined,
      files: result.files || undefined,
      metadata: {
        tokensUsed: 0, // Will be calculated by workflow
        executionTime: 0,
        stagesExecuted: ['generate'], // Simplified for now
      },
    });
  } catch (error) {
    console.error('Workflow error:', error);
    return res.status(500).json({
      error: 'Workflow execution failed',
      message: error.message
    });
  }
});

app.post('/api/payment/portal', async (req, res) => {
  const { userId, customerId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  if (!stripe) {
    return res.status(500).json({ error: 'Stripe not configured' });
  }

  try {
    // TODO: Get customer ID from Firebase
    // For now, require customerId to be passed from frontend
    if (!customerId) {
      return res.status(404).json({ error: 'No active subscription found. Customer ID required.' });
    }

    const baseUrl = process.env.FRONTEND_URL || req.headers.origin || 'http://localhost:5173';

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${baseUrl}/pricing`,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Error creating portal session:', error);
    res.status(500).json({ error: 'Failed to create portal session' });
  }
});

// Export app for Vercel serverless functions
export default app;

// Start server - Only if not in Vercel environment
if (process.env.VERCEL !== '1' && !process.env.VERCEL_ENV) {
  // Knowledge management endpoints (only in Node.js environment, not Vercel serverless)
  if (process.env.VERCEL !== '1' && !process.env.VERCEL_ENV) {
    // Initialize Knowledge Scheduler (if enabled)
    if (process.env.ENABLE_KNOWLEDGE_SCHEDULER === 'true') {
      try {
        // Dynamic import to avoid issues if knowledge module has issues
        import('../lib/knowledge/scheduler/KnowledgeScheduler.js').then(({ KnowledgeScheduler }) => {
          const intervalMinutes = parseInt(process.env.KNOWLEDGE_SCHEDULER_INTERVAL || '60', 10);
          KnowledgeScheduler.start(intervalMinutes);
          console.log(`📅 Knowledge Scheduler: Started (interval: ${intervalMinutes} minutes)`);
        }).catch(err => {
          console.warn('⚠️ Knowledge Scheduler: Failed to start', err.message);
        });
      } catch (error) {
        console.warn('⚠️ Knowledge Scheduler: Not available', error.message);
      }
    }

    // Knowledge management endpoints
    app.post('/api/knowledge/trigger', async (req, res) => {
      try {
        const { KnowledgeScheduler } = await import('../lib/knowledge/scheduler/KnowledgeScheduler.js');
        await KnowledgeScheduler.runPipeline();
        res.json({ success: true, message: 'Knowledge pipeline triggered' });
      } catch (error) {
        console.error('Knowledge trigger error:', error);
        res.status(500).json({ error: 'Failed to trigger knowledge pipeline' });
      }
    });

    app.post('/api/knowledge/source/:sourceId', async (req, res) => {
      try {
        const { sourceId } = req.params;
        const { KnowledgeScheduler } = await import('../lib/knowledge/scheduler/KnowledgeScheduler.js');
        await KnowledgeScheduler.runForSource(sourceId);
        res.json({ success: true, message: `Processed source: ${sourceId}` });
      } catch (error) {
        console.error('Knowledge source processing error:', error);
        res.status(500).json({ error: error.message || 'Failed to process source' });
      }
    });

    app.get('/api/knowledge/sources', async (req, res) => {
      try {
        const { SourceRegistry } = await import('../lib/knowledge/sources/SourceRegistry.js');
        SourceRegistry.initializeDefaults();
        const sources = SourceRegistry.getAllSources();
        res.json({ sources });
      } catch (error) {
        console.error('Knowledge sources error:', error);
        res.status(500).json({ error: 'Failed to get sources' });
      }
    });
  }

  app.listen(PORT, () => {
    console.log(`API proxy listening on ${PORT}`);
  });
}
