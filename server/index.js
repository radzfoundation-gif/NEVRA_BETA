import dotenv from 'dotenv';
import path from 'path';

// Load .env and .env.local
dotenv.config(); // Load .env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), override: true }); // Load .env.local requesting override
import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import OpenAI from 'openai';
import multer from 'multer';
import mammoth from 'mammoth';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';
import { createRequire } from 'module';
import midtransClient from 'midtrans-client';
import { YoutubeTranscript } from 'youtube-transcript';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';


// Feature Limits handled by new configuration below

// Supabase Client for Backend
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = (SUPABASE_URL && SUPABASE_KEY) ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

if (supabase) {
  console.log('✅ Supabase connected:', SUPABASE_URL);
} else {
  console.warn('⚠️ Supabase not configured. Using file-based fallback.');
}

// =====================================================
// MISSING FUNCTION DEFINITIONS (Fixed)
// =====================================================

// Note: tokenStorageFile, subscriptionStorageFile, canvasAnalyzeStorageFile
// are defined later in the file (around line 1255)
// Note: getUserTier is defined later in the file (around line 1310)

// Get feature usage for a specific feature (wrapper for checkFeatureUsage)
// Note: checkFeatureUsage is defined later, so we use a forward reference pattern
const getFeatureUsage = async (userId, featureType) => {
  // This will be resolved at runtime when checkFeatureUsage is available
  if (typeof checkFeatureUsage === 'function') {
    return await checkFeatureUsage(userId, featureType);
  }
  // Fallback if called before checkFeatureUsage is defined
  return { used: 0, limit: 10, allowed: true, tier: 'free' };
};

const execAsync = promisify(exec);
const require = createRequire(import.meta.url);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Debug logging helper (console only - Vercel serverless compatible)
const debugLog = (data) => {
  try {
    console.log('[DEBUG]', JSON.stringify({ ...data, timestamp: Date.now() }));
  } catch (e) { console.error('Debug log error:', e); }
};

// Note: pdf-parse will be imported dynamically when needed

// Initialize Midtrans Snap
const midtransServerKey = process.env.MIDTRANS_SERVER_KEY?.trim();
const midtransClientKey = process.env.VITE_MIDTRANS_CLIENT_KEY?.trim();
const midtransIsProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';

let snap = null;
if (midtransServerKey) {
  snap = new midtransClient.Snap({
    isProduction: midtransIsProduction,
    serverKey: midtransServerKey,
    clientKey: midtransClientKey
  });
  console.log('✅ Midtrans Snap initialized:', midtransIsProduction ? 'PRODUCTION' : 'SANDBOX');
} else {
  console.warn('⚠️ MIDTRANS_SERVER_KEY not set. Payment integration will not work.');
}

// =====================================================
// SUMOPOD AI CLIENT (Gemini 3 Pro for Redesign/Design)
// =====================================================
const sumopodApiKey = process.env.SUMOPOD_API_KEY?.trim();
const sumopodBaseUrl = process.env.SUMOPOD_BASE_URL?.trim() || 'https://api.sumopod.com';

let sumopodClient = null;
if (sumopodApiKey) {
  sumopodClient = new OpenAI({
    apiKey: sumopodApiKey,
    baseURL: sumopodBaseUrl + '/v1',
  });
  console.log('✅ SumoPod AI client initialized:', sumopodBaseUrl);
} else {
  console.warn('⚠️ SUMOPOD_API_KEY not set. Redesign/Design features will not work.');
}

const app = express();

// Security Headers
app.use(helmet());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 2000, // Limit each IP to 2000 requests per windowMs
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter Abuse Limiter (e.g. for heavy AI endpoints)
const abuseLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 requests per minute
  message: { error: 'Too many requests (abuse protection). Please slow down.' }
});
app.use(limiter);

const PORT = process.env.PORT || 8788;

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:8788',
  'https://www.rlabs-studio.web.id',
  'https://rlabs-studio.web.id',
  'https://rlabs-studio.vercel.app',
  process.env.CORS_ORIGIN
].filter(Boolean);

// Enable pre-flight for all routes
// app.options('*', cors()); // Removed to fix PathError with * wildcard

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        console.log('Blocked by CORS:', origin);
        callback(null, false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
  }),
);
app.use(express.json({ limit: '50mb' }));
// Midtrans webhook handler
app.use('/api/payment/webhook', express.json());

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

// SumoPod only - no other API dependencies

// --- Canvas Analyze Limit Management (Supabase with file fallback) ---
const CANVAS_ANALYZE_LIMIT = 2; // Free users: 2 analyzes per month

const getCanvasAnalyzeUsage = async (userId) => {
  const month = getCurrentMonth ? getCurrentMonth() : `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

  // Try Supabase
  if (supabase) {
    try {
      const { data } = await supabase
        .from('canvas_usage')
        .select('analyze_count')
        .eq('user_id', userId)
        .eq('month', month)
        .single();

      if (data) {
        return { used: data.analyze_count, limit: CANVAS_ANALYZE_LIMIT, month };
      }
      return { used: 0, limit: CANVAS_ANALYZE_LIMIT, month };
    } catch (e) {
      // Supabase failed, use file fallback
    }
  }

  // No file fallback - Supabase required for Vercel serverless
  console.warn('⚠️ Supabase not available, returning default canvas usage');
  return { used: 0, limit: CANVAS_ANALYZE_LIMIT, lastReset: new Date().toISOString() };
};

const incrementCanvasAnalyzeUsage = async (userId) => {
  const month = getCurrentMonth ? getCurrentMonth() : `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

  // Try Supabase
  if (supabase) {
    try {
      const { data: existing } = await supabase
        .from('canvas_usage')
        .select('analyze_count')
        .eq('user_id', userId)
        .eq('month', month)
        .single();

      if (existing) {
        await supabase
          .from('canvas_usage')
          .update({ analyze_count: existing.analyze_count + 1 })
          .eq('user_id', userId)
          .eq('month', month);
      } else {
        await supabase
          .from('canvas_usage')
          .insert({ user_id: userId, month, analyze_count: 1 });
      }
      console.log(`📊 Supabase: Canvas usage updated for ${userId}`);
      return true;
    } catch (e) {
      console.warn('Canvas usage increment failed on Supabase:', e.message);
    }
  }

  // No file fallback - Supabase required for Vercel serverless
  console.warn('⚠️ Supabase not available, canvas usage NOT incremented');
  return false;
};

// Daily Reset Endpoint for Vercel Cron
app.get('/api/cron/reset', (req, res) => {
  // Verify using a simple secret or just rely on Vercel's protection (optional)
  // const authHeader = req.headers['authorization'];
  // if (authHeader !== \`Bearer \${process.env.CRON_SECRET}\`) return res.status(401).json({ error: 'Unauthorized' });

  console.log('🕒 Running Daily Usage Reset (Supabase-based)...');
  try {
    // Supabase handles daily resets via RLS and time-based queries
    // No file system operations needed in serverless environment
    console.log('✅ Daily Reset: Supabase resets handled by database');
    res.json({ success: true, message: 'Daily reset completed via Supabase' });
  } catch (error) {
    console.error('❌ Error during Daily Reset:', error);
    res.status(500).json({ error: 'Failed to reset usage', details: error.message });
  }
});
// NEW FEATURE LIMITS (Configurable)
const FEATURE_LIMITS = {
  free: {
    chat: { limit: 10, period: 'day' },
    deep_dive: { limit: 2, period: 'day' }, // Deep Dive: gpt-5, limited to 2/day
    convert: { limit: 3, period: 'month' },
    redesign: { limit: 3, period: 'month' },
    logo: { limit: 3, period: 'month' }
  },
  pro: {
    chat: { limit: 999999, period: 'day' },
    deep_dive: { limit: 999999, period: 'day' }, // Pro: unlimited deep dive
    convert: { limit: 999999, period: 'month' },
    redesign: { limit: 999999, period: 'month' },
    logo: { limit: 999999, period: 'month' }
  }
};

// Tokens per request (for legacy compatibility - 1 prompt = 1 token)
const TOKENS_PER_REQUEST = 1;

// Feature costs for different operations (credit system)
const FEATURE_COSTS = {
  chat: 1,
  deep_dive: 5, // Deep Dive costs more (uses gpt-5)
  convert: 5,
  redesign: 10,
  youtube: 3,
  audio: 5,
  image: 10,
  logo: 15,
  knowledge: 5
};

const getPeriodString = (period) => {
  const d = new Date();
  const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  if (period === 'day') return `${month}-${String(d.getDate()).padStart(2, '0')}`;
  return month;
};

// Check Feature Usage (Supabase Only)
const checkFeatureUsage = async (userId, feature) => {
  if (!supabase) return { allowed: true, limit: 999, used: 0 };

  const tier = await getUserTier(userId);
  const userLimits = FEATURE_LIMITS[tier] || FEATURE_LIMITS.free;
  const config = userLimits[feature] || userLimits.chat;

  const periodKey = getPeriodString(config.period);
  const storageKey = `${periodKey}_${feature}`; // stored in 'month' column

  try {
    const { data } = await supabase
      .from('token_usage')
      .select('tokens_used')
      .eq('user_id', userId)
      .eq('month', storageKey)
      .maybeSingle();

    const used = data?.tokens_used || 0;

    if (tier === 'pro') return { allowed: true, limit: config.limit, used, tier };

    return {
      allowed: used < config.limit,
      limit: config.limit,
      used,
      tier
    };
  } catch (e) {
    console.warn(`Usage check failed for ${userId}:`, e);
    return { allowed: true, limit: config.limit, used: 0, tier: 'free' };
  }
};

// Increment Feature Usage
const incrementFeatureUsage = async (userId, feature) => {
  if (!supabase) return;

  const tier = await getUserTier(userId);
  const userLimits = FEATURE_LIMITS[tier] || FEATURE_LIMITS.free;
  const config = userLimits[feature] || userLimits.chat;

  const periodKey = getPeriodString(config.period);
  const storageKey = `${periodKey}_${feature}`;

  try {
    const { data } = await supabase
      .from('token_usage')
      .select('tokens_used')
      .eq('user_id', userId)
      .eq('month', storageKey)
      .maybeSingle();

    const current = data?.tokens_used || 0;

    await supabase.from('token_usage').upsert({
      user_id: userId,
      month: storageKey,
      tokens_used: current + 1,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id, month' });

  } catch (e) {
    console.error(`Usage increment failed for ${userId}:`, e);
  }
};

// Compatibility Wrappers (async)
const getUserUsage = async (userId) => {
  const check = await checkFeatureUsage(userId, 'chat');
  return { used: check.used, limit: check.limit, allowed: check.allowed, tier: check.tier };
};

const updateUserUsage = async (userId, amount) => {
  // Map legacy 'tokens' (prompts) to 'chat' increment
  if (amount > 0) {
    await incrementFeatureUsage(userId, 'chat');
  }
};

// Legacy Feature Usage Logic Removed - Replaced by checkFeatureUsage above

const getAllFeatureUsage = async (userId) => {
  const chat = await checkFeatureUsage(userId, 'chat');
  const convert = await checkFeatureUsage(userId, 'convert');
  const youtube = await checkFeatureUsage(userId, 'youtube');
  const audio = await checkFeatureUsage(userId, 'audio');
  const redesign = await checkFeatureUsage(userId, 'redesign');
  const image = await checkFeatureUsage(userId, 'image');
  const knowledge = await checkFeatureUsage(userId, 'knowledge');

  return { chat, convert, youtube, audio, redesign, image, knowledge };
};

// Usage Endpoint (includes feature usage)
app.get('/api/user/usage', async (req, res) => {
  try {
    const { userId } = req.query;

    // Define limits (ensure consistency with /api/generate)
    const USAGE_LIMITS = {
      free: 150,
      normal: 300,
      pro: 1000000
    };

    if (!userId) return res.json({ used: 0, limit: USAGE_LIMITS.free, tier: 'free', features: null });

    const usage = await getUserUsage(userId);
    const userTier = await getUserTier(userId);
    const limit = USAGE_LIMITS[userTier] || USAGE_LIMITS.free;
    const featureUsage = await getAllFeatureUsage(userId);

    res.json({
      used: usage.used,
      limit: limit,
      tier: userTier,
      remaining: Math.max(0, limit - usage.used),
      features: featureUsage
    });
  } catch (error) {
    console.error('Error in /api/user/usage:', error);
    res.status(500).json({ error: 'Failed to fetch usage', details: error.message });
  }
});

// Feature Usage Endpoint
app.get('/api/user/feature-usage', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const userTier = await getUserTier(userId);
    const isProUser = userTier === 'pro';

    // Pro users have unlimited
    if (isProUser) {
      return res.json({
        tier: 'pro',
        chat: { used: 0, limit: 999999, exceeded: false, period: 'day' },
        convert: { used: 0, limit: 999999, exceeded: false, period: 'month' },
        redesign: { used: 0, limit: 999999, exceeded: false, period: 'month' },
        youtube: { used: 0, limit: 999999, exceeded: false, period: 'day' },
        audio: { used: 0, limit: 999999, exceeded: false, period: 'day' },
        image: { used: 0, limit: 999999, exceeded: false, period: 'day' },
        knowledge: { used: 0, limit: 999999, exceeded: false, period: 'month' }
      });
    }

    const featureUsage = await getAllFeatureUsage(userId);
    res.json({
      tier: userTier,
      ...featureUsage
    });
  } catch (error) {
    console.error('❌ Error fetching feature usage:', error);
    res.status(500).json({ error: 'Failed to fetch feature usage', details: error.message, stack: error.stack });
  }
});

// Increment feature usage endpoint (called after successful operation)
app.post('/api/user/feature-usage/increment', async (req, res) => {
  const { userId, featureType } = req.body;
  if (!userId || !featureType) return res.status(400).json({ error: 'userId and featureType required' });

  const userTier = await getUserTier(userId);
  if (userTier === 'pro') {
    return res.json({ success: true, message: 'Pro user - unlimited' });
  }

  await incrementFeatureUsage(userId, featureType);
  const updated = await getFeatureUsage(userId, featureType);
  res.json({ success: true, ...updated });
});

// =====================================================
// KNOWLEDGE BASE ENDPOINTS (text-embedding-3-small)
// =====================================================

// In-memory knowledge store (for demo - use vector DB in production)
const knowledgeStore = new Map(); // userId -> [{id, text, embedding, metadata}]

// Embed Document
app.post('/api/embed-document', async (req, res) => {
  try {
    const { userId, text, title, chunkSize = 500 } = req.body;

    if (!userId || !text) {
      return res.status(400).json({ error: 'userId and text required' });
    }

    if (!sumopodClient) {
      return res.status(500).json({ error: 'AI service not configured' });
    }

    // Split text into chunks
    const chunks = [];
    const sentences = text.split(/[.!?]+/).filter(s => s.trim());
    let currentChunk = '';

    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > chunkSize) {
        if (currentChunk) chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += (currentChunk ? '. ' : '') + sentence;
      }
    }
    if (currentChunk) chunks.push(currentChunk.trim());

    console.log(`[Embed] Processing ${chunks.length} chunks for user ${userId}`);

    // Embed each chunk
    const embeddings = [];
    for (const chunk of chunks) {
      const response = await sumopodClient.embeddings.create({
        model: 'text-embedding-3-small',
        input: chunk,
      });
      embeddings.push({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        text: chunk,
        embedding: response.data[0].embedding,
        metadata: { title, createdAt: new Date().toISOString() }
      });
    }

    // Store embeddings
    const userKnowledge = knowledgeStore.get(userId) || [];
    userKnowledge.push(...embeddings);
    knowledgeStore.set(userId, userKnowledge);

    console.log(`[Embed] Stored ${embeddings.length} embeddings for user ${userId}`);

    res.json({
      success: true,
      chunksProcessed: chunks.length,
      totalDocuments: userKnowledge.length
    });

  } catch (error) {
    console.error('[Embed] Error:', error);
    res.status(500).json({ error: 'Failed to embed document' });
  }
});

// Search Knowledge Base
app.post('/api/search-knowledge', async (req, res) => {
  try {
    const { userId, query, topK = 3 } = req.body;

    if (!userId || !query) {
      return res.status(400).json({ error: 'userId and query required' });
    }

    if (!sumopodClient) {
      return res.status(500).json({ error: 'AI service not configured' });
    }

    const userKnowledge = knowledgeStore.get(userId);
    if (!userKnowledge || userKnowledge.length === 0) {
      return res.json({ results: [], message: 'No documents in knowledge base' });
    }

    // Embed query
    const queryResponse = await sumopodClient.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
    });
    const queryEmbedding = queryResponse.data[0].embedding;

    // Calculate cosine similarity
    const cosineSimilarity = (a, b) => {
      let dotProduct = 0, normA = 0, normB = 0;
      for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
      }
      return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    };

    // Find top K similar chunks
    const scored = userKnowledge.map(doc => ({
      ...doc,
      score: cosineSimilarity(queryEmbedding, doc.embedding)
    }));

    scored.sort((a, b) => b.score - a.score);
    const topResults = scored.slice(0, topK);

    console.log(`[Search] Found ${topResults.length} results for query: "${query.substring(0, 50)}..."`);

    res.json({
      results: topResults.map(r => ({
        text: r.text,
        score: r.score,
        metadata: r.metadata
      }))
    });

  } catch (error) {
    console.error('[Search] Error:', error);
    res.status(500).json({ error: 'Failed to search knowledge base' });
  }
});

// =====================================================
// IMAGE GENERATION ENDPOINT (gpt-image-1 via SumoPod)
// =====================================================
app.post('/api/generate-image', async (req, res) => {
  try {
    const { prompt, size = '1024x1024', userId } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!sumopodClient) {
      return res.status(500).json({ error: 'AI service not configured' });
    }

    console.log(`[ImageGen] Generating image for: "${prompt.substring(0, 50)}..."`);

    const response = await sumopodClient.images.generate({
      model: 'gpt-image-1',
      prompt: prompt,
      n: 1,
      size: size,
    });

    const imageData = response.data[0];

    console.log(`[ImageGen] Image generated successfully`);

    res.json({
      success: true,
      image: imageData.url || imageData.b64_json,
      revised_prompt: imageData.revised_prompt
    });

  } catch (error) {
    console.error('[ImageGen] Error:', error);
    res.status(500).json({ error: 'Failed to generate image', details: error.message });
  }
});

// =====================================================
// PAYMENT ENDPOINTS (Midtrans)
// =====================================================

// =====================================================
// REDESIGN ENDPOINT (Gemini 3 Pro Preview via SumoPod)
// =====================================================
app.post('/api/redesign', async (req, res) => {
  try {
    const { image, prompt, userId } = req.body;

    // Check for URL in prompt if explicit 'url' field isn't passed
    const urlMatch = prompt?.match(/https?:\/\/[^\s]+/);
    const targetUrl = urlMatch ? urlMatch[0] : null;

    // IMAGE IS NOW OPTIONAL for "Design" mode
    if (!prompt) {
      return res.status(400).json({ error: 'Please describe what you want to create' });
    }

    if (!sumopodClient) {
      return res.status(500).json({
        error: 'AI service not configured. Please set SUMOPOD_API_KEY, SUMOPOD_BASE_URL, and SUMOPOD_MODEL_ID.'
      });
    }

    // URL Scraping Logic (Simple)
    let scrapedContext = "";
    if (targetUrl) {
      try {
        const urlRes = await fetch(targetUrl);
        if (urlRes.ok) {
          const text = await urlRes.text();
          // Extract title and body content roughly
          const title = text.match(/<title>(.*?)<\/title>/i)?.[1] || "";
          // Remove scripts and styles for cleaner context
          const cleanText = text.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "")
            .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gim, "")
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .substring(0, 15000); // Limit context
          scrapedContext = `\n\nWEBSITE CONTEXT(from ${targetUrl}): \nTitle: ${title} \nContent: ${cleanText} `;
          console.log(`[Redesign] Scraped ${targetUrl}: ${cleanText.length} chars`);
        }
      } catch (e) {
        console.warn(`[Redesign] Failed to scrape ${targetUrl}: `, e.message);
      }
    }

    // Use Gemini 3 Pro Preview for better vision capabilities, fallback to configured SUMOPOD_MODEL_ID
    const redesignModelId = process.env.SUMOPOD_REDESIGN_MODEL_ID || process.env.SUMOPOD_MODEL_ID || 'gemini/gemini-3-pro-preview';

    const systemPrompt = `You are an expert UI / UX designer, Frontend Developer, and Digital Artist.
Your task is to create high - fidelity HTML / CSS designs based on the user's request.
${scrapedContext ? `\nCONTEXT: The user wants to CLONE or reference the website content provided below. Use this content to populate the design.` : ''}

    CAPABILITIES:
    1. ** Redesign **: If an image is provided, redesign it based on instructions.
2. ** Clone **: If user asks to "clone", replicate the image pixel - perfectly.
3. ** Creation **: If NO image is provided(or if requested), create designs from scratch.
4. ** Mockups **: You can create realistic 3D product mockups(t - shirts, phones, boxes) using advanced CSS (transform - style: preserve - 3d, gradients, box - shadows) or SVG.

USER REQUEST: ${prompt}
${scrapedContext}

OUTPUT FORMAT:
1. Return ONLY valid HTML code(complete document with < !DOCTYPE html >)
2. Include all CSS inline or in a < style > tag
3. Use Tailwind CSS via CDN: <script src="https://cdn.tailwindcss.com"></script>
4. For 3D Mockups / Art: Use pure CSS / Tailwind or SVG.Do NOT use external images for the product itself if possible, build it with code.
5. Make it responsive and interactive(hover states, animations).
6. Use modern, premium aesthetics.

  CRITICAL: Your response must be ONLY the HTML code, nothing else. No explanations, no markdown.`;

    console.log(`[Design] Processing request: "${prompt.substring(0, 50)}..." via ${redesignModelId} (Image provided: ${!!image})`);

    const messages = [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: image
          ? [
            { type: 'text', text: `Request: "${prompt}".Create the design as HTML code only.` },
            { type: 'image_url', image_url: { url: image } }
          ]
          : [
            { type: 'text', text: `Request: "${prompt}".Create this design / mockup from scratch using HTML/CSS. Make it high-quality and premium.` }
          ]
      }
    ];

    const completion = await sumopodClient.chat.completions.create({
      model: redesignModelId,
      messages,
      temperature: 0.7,
      max_tokens: 8000,
    });

    let htmlContent = completion.choices[0]?.message?.content || '';

    // Clean up response - remove markdown code blocks if present
    htmlContent = htmlContent.replace(/```html\n?/gi, '').replace(/```\n?/gi, '').trim();

    // If response doesn't start with <!DOCTYPE or <html, it might be wrapped
    if (!htmlContent.toLowerCase().startsWith('<!doctype') && !htmlContent.toLowerCase().startsWith('<html')) {
      // Try to extract HTML from the response
      const htmlMatch = htmlContent.match(/<!DOCTYPE[\s\S]*<\/html>/i) || htmlContent.match(/<html[\s\S]*<\/html>/i);
      if (htmlMatch) {
        htmlContent = htmlMatch[0];
      }
    }

    // SAVE TO DATABASE (Supabase)
    if (userId && supabase) {
      try {
        await supabase.from('redesigns').insert({
          user_id: userId,
          prompt: prompt,
          content: htmlContent,
          type: image ? 'redesign' : 'creation' // Differentiate slightly
        });
        console.log(`[Redesign] Saved to history for user ${userId}`);
      } catch (dbErr) {
        console.error('[Redesign] Failed to save to DB:', dbErr.message);
        // Don't fail the request if save fails
      }
    }

    // Generate design suggestions based on the prompt
    const suggestions = [
      `Created design based on your request: "${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}"`,
      `Used modern design principles with responsive layout`,
      `Added smooth animations and hover effects`,
      `Optimized for both mobile and desktop views`
    ];

    console.log(`[Redesign] Successfully generated redesign (${htmlContent.length} chars)`);

    res.json({
      html: htmlContent,
      suggestions,
      prompt
    });

  } catch (error) {
    console.error('[Redesign] Error:', error);
    res.status(500).json({
      error: 'Failed to generate redesign',
      details: error.message
    });
  }
});

// =====================================================
// GENERATE ENDPOINT (Standard Chat/Completion)
// =====================================================
app.post('/api/generate', async (req, res) => {
  try {
    const { prompt, model, images, messages } = req.body;

    if (!prompt && (!messages || messages.length === 0)) {
      return res.status(400).json({ error: 'Prompt or messages are required' });
    }

    // Default to SumoPod if configured
    const client = sumopodClient || openai;
    const targetModel = model || process.env.SUMOPOD_MODEL_ID || 'gemini/gemini-2.5-flash-lite';

    // Construct messages if only prompt provided
    const chatMessages = messages || [
      { role: 'user', content: prompt }
    ];

    // Handle images if provided (add to last user message)
    if (images && images.length > 0) {
      const lastMsg = chatMessages[chatMessages.length - 1];
      if (lastMsg.role === 'user') {
        if (typeof lastMsg.content === 'string') {
          lastMsg.content = [
            { type: 'text', text: lastMsg.content },
            ...images.map(img => ({ type: 'image_url', image_url: { url: img } }))
          ];
        }
      }
    }

    console.log(`[Generate] Processing request for model: ${targetModel}`);

    const completion = await client.chat.completions.create({
      model: targetModel,
      messages: chatMessages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    const responseText = completion.choices[0].message.content;

    res.json({
      text: responseText,
      model: targetModel
    });

  } catch (error) {
    console.error('[Generate] Error:', error);
    // CRITICAL: Always return JSON, never HTML
    res.status(500).json({
      error: 'Failed to generate response',
      details: error.message || 'Creating chat completion failed',
      code: 'GENERATE_ERROR'
    });
  }
});

// =====================================================
// TOOLS ENDPOINTS (YouTube, URL, PDF, Audio)
// =====================================================

// YouTube Transcript Extraction
app.post('/api/youtube-transcript', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'YouTube URL is required' });
    }

    // Extract video ID from URL
    const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
    const videoId = videoIdMatch ? videoIdMatch[1] : null;

    if (!videoId) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    console.log(`[YouTube] Extracting transcript for video: ${videoId}`);

    // Use youtube-transcript library (already imported at top)
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);

    // Combine transcript segments
    const fullTranscript = transcript.map(item => item.text).join(' ');

    // Try to get video title from oEmbed API
    let title = 'YouTube Video';
    try {
      const oembedRes = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
      if (oembedRes.ok) {
        const oembedData = await oembedRes.json();
        title = oembedData.title || title;
      }
    } catch (e) {
      console.warn('[YouTube] Could not fetch video title');
    }

    console.log(`[YouTube] Extracted ${fullTranscript.length} chars from "${title}"`);

    res.json({
      transcript: fullTranscript,
      title,
      videoId
    });

  } catch (error) {
    console.error('[YouTube] Error:', error);
    res.status(500).json({
      error: 'Failed to extract YouTube transcript',
      details: error.message
    });
  }
});

// URL Content Fetch
app.post('/api/fetch-url', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    console.log(`[URL] Fetching content from: ${url}`);

    const response = await fetch(url);
    const html = await response.text();

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : url;

    // Clean HTML to text
    const cleanText = html
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gim, '')
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gim, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 30000); // Limit content

    console.log(`[URL] Extracted ${cleanText.length} chars from "${title}"`);

    res.json({
      content: cleanText,
      title,
      url
    });

  } catch (error) {
    console.error('[URL] Error:', error);
    res.status(500).json({
      error: 'Failed to fetch URL content',
      details: error.message
    });
  }
});

// PDF Text Extraction
app.post('/api/extract-pdf', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'PDF file is required' });
    }

    console.log(`[PDF] Extracting text from: ${req.file.originalname}`);

    const pdfParse = (await import('pdf-parse')).default;
    const dataBuffer = fs.readFileSync(req.file.path);
    const pdfData = await pdfParse(dataBuffer);

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    console.log(`[PDF] Extracted ${pdfData.text.length} chars from "${req.file.originalname}"`);

    res.json({
      text: pdfData.text,
      pages: pdfData.numpages,
      filename: req.file.originalname
    });

  } catch (error) {
    console.error('[PDF] Error:', error);
    // Clean up file if exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({
      error: 'Failed to extract PDF text',
      details: error.message
    });
  }
});

// Audio Transcription (using SumoPod Whisper)
app.post('/api/transcribe-audio', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Audio file is required' });
    }

    console.log(`[Audio] Processing: ${req.file.originalname}`);

    // Use SumoPod (OpenAI compatible) Whisper
    // Ensure sumopodClient is available
    if (!sumopodClient) {
      throw new Error('SumoPod client not initialized');
    }

    console.log(`[Audio] Sending to SumoPod Whisper...`);

    // Read file as buffer and use toFile to include proper metadata
    const fileBuffer = fs.readFileSync(req.file.path);
    const { toFile } = await import('openai/uploads');

    // Workaround: Some WhatsApp audio (Opus in OGG) may not be recognized
    // Rename to .mp3 extension - Whisper can still decode the actual audio content
    let filename = req.file.originalname;
    if (filename.endsWith('.ogg') || filename.endsWith('.opus')) {
      filename = filename.replace(/\.(ogg|opus)$/, '.mp3');
      console.log(`[Audio] Renamed to: ${filename} for compatibility`);
    }

    const transcription = await sumopodClient.audio.transcriptions.create({
      file: await toFile(fileBuffer, filename),
      model: "whisper-1",
      prompt: "Please add proper punctuation including periods, commas, question marks, and exclamation marks.",
    });

    console.log(`[Audio] Transcription complete (${transcription.text?.length || 0} chars)`);

    // Clean up uploaded file (with small delay to ensure stream is closed)
    setTimeout(() => {
      try {
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
      } catch (e) {
        console.warn('[Audio] Cleanup warning:', e.message);
      }
    }, 500);

    res.json({
      transcript: transcription.text,
      filename: req.file.originalname
    });

  } catch (error) {
    console.error('[Audio] Error:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({
      error: 'Failed to transcribe audio',
      details: error.message
    });
  }
});

// Create Midtrans transaction
app.post('/api/payment/create-transaction', async (req, res) => {
  try {
    const { userId, userEmail, userName, plan, amount } = req.body;

    if (!snap) {
      return res.status(500).json({ error: 'Payment gateway not configured' });
    }

    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    const orderId = `NEVRA-PRO-${Date.now()}-${userId.slice(-6)}`;

    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: amount || 50000, // IDR 50,000 default
      },
      customer_details: {
        first_name: userName || 'User',
        email: userEmail || 'user@example.com',
      },
      item_details: [{
        id: 'nevra-pro-monthly',
        price: amount || 50000,
        quantity: 1,
        name: 'Nevra Pro - Monthly Subscription',
      }],
      callbacks: {
        finish: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/`,
      },
    };

    const transaction = await snap.createTransaction(parameter);

    console.log(`✅ Payment transaction created: ${orderId}`);
    res.json({
      token: transaction.token,
      orderId: orderId,
      redirectUrl: transaction.redirect_url,
    });
  } catch (error) {
    console.error('Payment create error:', error);
    res.status(500).json({ error: 'Failed to create transaction', details: error.message });
  }
});

// Activate subscription after payment
app.post('/api/payment/activate', async (req, res) => {
  try {
    const { userId, orderId } = req.body;

    if (!userId || !orderId) {
      return res.status(400).json({ error: 'User ID and Order ID required' });
    }

    // Calculate expiry (1 month from now)
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    // Save subscription
    const success = await saveSubscription(userId, 'pro', expiresAt.toISOString(), orderId);

    if (success) {
      console.log(`✅ Pro subscription activated for ${userId} until ${expiresAt.toISOString()}`);
      res.json({ success: true, tier: 'pro', expiresAt: expiresAt.toISOString() });
    } else {
      throw new Error('Failed to save subscription');
    }
  } catch (error) {
    console.error('Activation error:', error);
    res.status(500).json({ error: 'Failed to activate subscription', details: error.message });
  }
});

// Midtrans webhook (for server-side verification)
app.post('/api/payment/webhook', async (req, res) => {
  try {
    const notification = req.body;
    const orderId = notification.order_id;
    const transactionStatus = notification.transaction_status;
    const fraudStatus = notification.fraud_status;

    console.log(`📬 Midtrans webhook: ${orderId} - ${transactionStatus}`);

    // Extract userId from orderId (format: NEVRA-PRO-timestamp-userId)
    const parts = orderId.split('-');
    const userId = parts.length >= 4 ? parts[3] : null;

    if (!userId) {
      console.error('Invalid order ID format:', orderId);
      return res.status(400).json({ error: 'Invalid order ID' });
    }

    // Check transaction status
    if (transactionStatus === 'capture' && fraudStatus === 'accept') {
      // Credit card payment success
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1);
      await saveSubscription(userId, 'pro', expiresAt.toISOString(), orderId);
      console.log(`✅ Webhook: Pro activated for ${userId}`);
    } else if (transactionStatus === 'settlement') {
      // Bank transfer, e-wallet success
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1);
      await saveSubscription(userId, 'pro', expiresAt.toISOString(), orderId);
      console.log(`✅ Webhook: Pro activated for ${userId}`);
    } else if (['deny', 'cancel', 'expire'].includes(transactionStatus)) {
      console.log(`❌ Payment failed for ${userId}: ${transactionStatus}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});


// SumoPod API Key (OpenAI-compatible API)
const SUMOPOD_API_KEY = process.env.SUMOPOD_API_KEY?.trim();
const SUMOPOD_BASE_URL = process.env.SUMOPOD_BASE_URL?.trim(); // REQUIRED: Get from SumoPod dashboard
const SUMOPOD_MODEL_ID = process.env.SUMOPOD_MODEL_ID?.trim(); // REQUIRED: Get from SumoPod dashboard

if (SUMOPOD_API_KEY && !SUMOPOD_BASE_URL) {
  console.warn('⚠️ SUMOPOD_BASE_URL not set! Please add it to .env file. Get the correct base URL from https://sumopod.com/dashboard/ai/quickstart');
}
if (SUMOPOD_API_KEY && !SUMOPOD_MODEL_ID) {
  console.warn('⚠️ SUMOPOD_MODEL_ID not set! Please add it to .env file. Get the model ID from SumoPod dashboard');
}

const PROVIDER_KEYS = {
  groq: SUMOPOD_API_KEY || null, // SumoPod - Only provider
};


// Debug: Log API key status (without exposing actual keys)
console.log('🔑 API Key Status:', {
  SUMOPOD_API_KEY: SUMOPOD_API_KEY ? `Set (${SUMOPOD_API_KEY.substring(0, 10)}...)` : 'NOT SET',
  SUMOPOD_BASE_URL: SUMOPOD_BASE_URL,
  SUMOPOD_MODEL_ID: SUMOPOD_MODEL_ID,
  Provider: {
    groq: PROVIDER_KEYS.groq ? '✅ Configured (SumoPod)' : 'Missing',
  }
});

// SumoPod models - Smart Routing per Tech Spec
const SUMOPOD_MODELS = {
  // Default chat - gemini-2.5-flash-lite (fast, cost-effective)
  default: SUMOPOD_MODEL_ID || 'gemini-2.5-flash-lite',
  fast: 'gemini-2.5-flash-lite',
  // Pro/Tutor mode - gpt-5-mini (complex reasoning)
  tutor: 'gpt-5-mini',
  pro: 'gpt-5-mini',
  // Redesign/Creative - gemini-3-pro-preview
  redesign: 'gemini-3-pro-preview',
  creative: 'gemini-3-pro-preview',
};

const MODELS = {
  groq: SUMOPOD_MODEL_ID || 'gemini-2.5-flash-lite', // Default model
  redesign: 'gemini-3-pro-preview', // UI/Creative tasks
  pro: 'gpt-5-mini', // Pro reasoning mode
};

// Validate model ID
if (!SUMOPOD_MODEL_ID) {
  console.warn('⚠️ SUMOPOD_MODEL_ID not set! Using default: gemini/gemini-2.5-flash-lite');
  console.warn('   To use a different model, set SUMOPOD_MODEL_ID in .env file.');
}

// Max tokens configuration based on subscription tier
// Free: 150, Normal: 300, Pro: 500
function getMaxTokensForTier(tier = 'free', mode) {
  const tierLimits = {
    free: 2000,   // Increased from 150
    normal: 4000, // Increased from 300
    pro: 8000,    // Increased from 500
  };
  return tierLimits[tier.toLowerCase()] || tierLimits.free;
}

// --- Subscription Management (Supabase Only - Vercel compatible) ---
// File storage removed for serverless compatibility

// Helper: Get current month in YYYY-MM format
const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

// Load/Get Subscription (Supabase Only)
const getUserSubscription = async (userId) => {
  if (!supabase) return null;
  try {
    const { data } = await supabase.from('subscriptions').select('*').eq('user_id', userId).maybeSingle();
    return data;
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return null;
  }
};

// Save subscription (Supabase Only)
const saveSubscription = async (userId, tier, expiresAt = null, orderId = null) => {
  if (supabase) {
    try {
      const { error } = await supabase.from('subscriptions').upsert({
        user_id: userId,
        tier,
        expires_at: expiresAt,
        activated_at: new Date().toISOString(),
        midtrans_order_id: orderId
      }, { onConflict: 'user_id' });

      if (!error) {
        console.log(`✅ Supabase: Subscription saved for ${userId}: ${tier}`);
        return true;
      }
    } catch (e) {
      console.warn('Supabase subscription save failed:', e.message);
    }
  }
  return false;
};

// Get user tier (async)
async function getUserTier(userId) {
  if (!userId) return 'free';
  try {
    const subscription = await getUserSubscription(userId);
    if (subscription && subscription.tier === 'pro') {
      if (subscription.expires_at && new Date(subscription.expires_at) < new Date()) {
        return 'free'; // Expired
      }
      return 'pro';
    }
    return 'free';
  } catch (error) {
    return 'free';
  }
}

const MAX_TOKENS = {
  groq: {
    builder: parseInt(process.env.SUMOPOD_MAX_TOKENS_BUILDER) || 2000, // Default to free tier
    tutor: parseInt(process.env.SUMOPOD_MAX_TOKENS_TUTOR) || 2000, // Default to free tier
  },
};

// Initialize SumoPod client only

// SumoPod client already initialized at the top of the file
// Using Gemini 3 Pro for redesign and Flash Lite for chat
if (SUMOPOD_API_KEY && (!SUMOPOD_BASE_URL || !SUMOPOD_MODEL_ID)) {
  console.error('❌ SumoPod Client: Missing configuration! Please set SUMOPOD_BASE_URL and SUMOPOD_MODEL_ID in .env file.');
  console.error('   Get these values from: https://sumopod.com/dashboard/ai/quickstart');
}

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



// Web Search Endpoint
app.post('/api/search', async (req, res) => {
  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  try {
    console.log(`[API] Searching for: ${query}`);
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query: query,
        max_results: 5,
        search_depth: 'basic',
        include_answer: true,
      }),
    });

    if (!response.ok) {
      console.error(`[API] Tavily error: ${response.status} ${response.statusText}`);
      // Fallback or error
      throw new Error(`Tavily API error: ${response.statusText}`);
    }

    const data = await response.json();
    res.json(data);

  } catch (error) {
    console.error('[API] Search error:', error);
    res.status(500).json({ error: 'Failed to perform search', details: error.message });
  }
});

app.post('/api/generate', async (req, res) => {
  // #region agent log
  debugLog({ location: 'server/index.js:132', message: '/api/generate endpoint called', data: { provider: req.body?.provider, mode: req.body?.mode }, sessionId: 'debug-session', runId: 'run1', hypothesisId: 'F' });
  // #endregion

  // Ensure response is always sent, even on unexpected errors
  let responseSent = false;
  let provider = 'groq'; // Default to Gemini Flash Lite (SumoPod)
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
  provider = body.provider || 'groq'; // Default to groq (SumoPod)
  mode = body.mode || 'builder';
  const images = body.images || [];
  const userId = body.userId; // Get userId from request

  console.log(`[${provider}] /api/generate called`, {
    hasPrompt: !!prompt,
    hasSystemPrompt: !!systemPrompt,
    mode,
    historyLength: history?.length || 0,
    imagesCount: images?.length || 0
  });

  // --- TOKEN LIMIT CHECK ---
  if (userId) {
    // Check if deep_dive mode (uses gpt-5, limited to 2/day for free users)
    const isDeepDive = body.deepDive === true || mode === 'deep_dive';
    const featureToCheck = isDeepDive ? 'deep_dive' : 'chat';

    const usageCheck = await checkFeatureUsage(userId, featureToCheck);

    if (!usageCheck.allowed) {
      const limitMessage = isDeepDive
        ? `Deep Dive limit exceeded (${usageCheck.limit} prompts/day). Deep Dive uses GPT-5 for advanced reasoning.`
        : `Daily chat limit exceeded (${usageCheck.limit} prompts/day). Please upgrade to Pro for unlimited access.`;

      console.warn(`[TokenLimit] User ${userId} exceeded ${usageCheck.tier} ${featureToCheck} limit (${usageCheck.used}/${usageCheck.limit})`);
      return sendResponse(403, {
        error: limitMessage,
        code: isDeepDive ? 'DEEP_DIVE_LIMIT_EXCEEDED' : 'TOKEN_LIMIT_EXCEEDED',
        usage: { used: usageCheck.used, limit: usageCheck.limit, tier: usageCheck.tier }
      });
    }

    console.log(`[TokenLimit] User ${userId}: ${usageCheck.used}/${usageCheck.limit} ${featureToCheck} (Tier: ${usageCheck.tier})`);
  }
  // -------------------------

  if (!prompt || !systemPrompt) {
    console.error(`[${provider}] Missing required fields:`, { hasPrompt: !!prompt, hasSystemPrompt: !!systemPrompt });
    return sendResponse(400, { error: 'Missing prompt or systemPrompt' });
  }

  // Normalize ALL providers to groq (SumoPod) - only provider configured
  const effectiveProvider = 'groq';
  console.log(`[SumoPod] Normalized from '${provider}' -> '${effectiveProvider}'`);

  if (!PROVIDER_KEYS[effectiveProvider]) {
    return sendResponse(500, { error: `SumoPod API key not configured. Please set SUMOPOD_API_KEY, SUMOPOD_BASE_URL, and SUMOPOD_MODEL_ID in your environment variables.` });
  }

  // SumoPod supports image input
  if (images.length > 0) {
    // SumoPod supports images via OpenAI-compatible format
  }

  const controller = new AbortController();
  // Timeout for SumoPod
  const timeoutDuration = 180_000; // Increased to 180s (3 mins) for slow vision models
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

    // Enhance system prompt for SumoPod
    let enhancedSystemPrompt = currentDateContext + webSearchContext + systemPrompt;
    if (mode === 'tutor') {
      enhancedSystemPrompt = systemPrompt + `

⚠️ IMPORTANT FOR SUMOPOD IN TUTOR MODE:
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

⚠️ IMPORTANT FOR SUMOPOD:
- You MUST follow all NEVRA guidelines exactly as specified above
- Generate code that matches the exact format and structure required
- Use the same component patterns, styling approach, and architecture
- Ensure your output is production-ready and follows all design system requirements
- Pay special attention to the code structure template and component patterns
- Always include proper error handling and React best practices`;
    }

    const messagesBase = [
      { role: 'system', content: enhancedSystemPrompt },
      ...formatHistory(truncateHistory(history, 2)), // Truncate history for speed
    ];

    let content;

    // Only SumoPod provider
    if (!sumopodClient) {
      return sendResponse(500, { error: 'SumoPod client not available. Please configure SUMOPOD_API_KEY, SUMOPOD_BASE_URL, and SUMOPOD_MODEL_ID.' });
    }

    // Get user tier and calculate max tokens
    const userTier = await getUserTier(userId);
    const baseMaxTokens = getMaxTokensForTier(userTier, mode);

    console.log(`[${provider}] Using SumoPod ⚡ with model: ${MODELS.groq}, tier: ${userTier}, max_tokens: ${baseMaxTokens}`);

    const messages = [
      ...messagesBase,
      { role: 'user', content: buildOpenAIUserContent(prompt, images) },
    ];

    try {
      // Verify Sumopod configuration
      const baseUrl = process.env.SUMOPOD_BASE_URL?.trim() || 'https://api.sumopod.com';

      // Smart Model Routing per Tech Spec
      // - Deep Dive: gpt-5 (advanced reasoning)
      // - Tutor: gpt-5-mini (complex reasoning)
      // - Default: gemini-2.5-flash-lite (fast, cost-effective)
      const isDeepDive = body.deepDive === true || mode === 'deep_dive';
      let modelId;

      if (isDeepDive) {
        modelId = 'gpt-5'; // Deep Dive uses GPT-5 for advanced reasoning
        console.log(`[DeepDive] 🧠 Using GPT-5 for deep reasoning`);
      } else if (mode === 'tutor') {
        modelId = SUMOPOD_MODELS.tutor || 'gpt-5-mini';
      } else {
        modelId = process.env.SUMOPOD_MODEL_ID?.trim() || 'gemini-2.5-flash-lite';
      }

      // Re-initialize client if needed or ensure it uses the correct base URL
      // Note: defined globally, but let's ensure we use the right config here if we were properly re-instantiating.
      // For now, we trust the global client but we should have initialized it with api.sumopod.com if that was the intent.
      // Since we are editing this file, we should fix the global initialization too (done in next step). 

      // GPT-5 models only support temperature=1
      const temperature = modelId.includes('gpt-5') ? 1 : (mode === 'tutor' ? 0.7 : 0.5);

      const completion = await sumopodClient.chat.completions.create({
        model: modelId,
        messages,
        temperature,
        max_tokens: baseMaxTokens,
      }, {
        signal: controller.signal,
      });

      content = completion.choices[0]?.message?.content;
    } catch (sdkErr) {
      const errorStatus = sdkErr?.status || sdkErr?.response?.status || 500;
      const errorMsg = sdkErr?.error?.message || sdkErr?.message || String(sdkErr);

      console.error(`[${provider}] SumoPod SDK error:`, sdkErr);
      return sendResponse(errorStatus, {
        error: `SumoPod API Error: ${errorMsg}`,
        detail: sdkErr?.error || errorMsg,
      });
    }

    if (!content) {
      console.error(`[${provider}] No content in response`);
      return sendResponse(500, {
        error: `${provider.toUpperCase()} response missing content`
      });
    }

    if (userId) {
      // Increment the correct feature usage (deep_dive or chat)
      const isDeepDive = body.deepDive === true || mode === 'deep_dive';
      const featureUsed = isDeepDive ? 'deep_dive' : 'chat';
      await incrementFeatureUsage(userId, featureUsed);
      console.log(`[TokenLimit] Incremented ${featureUsed} usage for User ${userId}`);
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
      error: 'An unexpected error occurred. Please check server logs.',
      // detail: err?.message || String(err)
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
      error: 'Web search failed. Please check server logs.',

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
    const userId = req.headers['x-user-id'] || req.body.userId;
    // Check limit (3/month default for free)
    if (userId) {
      const usageResult = await checkFeatureUsage(userId, 'convert'); // 'convert' fits document parsing
      if (!usageResult.allowed) {
        // If file was uploaded, delete it
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(403).json({ error: 'Monthly document limit reached', upgrade: true });
      }
    }

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

      // Increment usage on success
      if (userId) await incrementFeatureUsage(userId, 'convert');

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

// YouTube Transcript endpoint
app.post('/api/transcript', async (req, res) => {
  const { url, userId: bodyUserId } = req.body;
  const userId = req.headers['x-user-id'] || bodyUserId;

  if (userId) {
    const usageResult = await checkFeatureUsage(userId, 'youtube');
    if (!usageResult.allowed) {
      return res.status(403).json({ error: 'Monthly YouTube limit reached', upgrade: true });
    }
  }

  if (!url) {
    return res.status(400).json({ error: 'YouTube URL is required' });
  }

  try {
    const transcript = await YoutubeTranscript.fetchTranscript(url);

    // Combine transcript into a single text
    const fullText = transcript.map(item => item.text).join(' ');

    // Increment usage
    if (userId) await incrementFeatureUsage(userId, 'youtube');

    res.json({
      transcript: fullText,
      duration: transcript[transcript.length - 1].offset + transcript[transcript.length - 1].duration
    });

  } catch (error) {
    console.error('YouTube Transcript Error:', error);
    res.status(500).json({
      error: 'Failed to fetch transcript',
      details: error.message
    });
  }
});

// Waitlist API
// Verification codes store (in-memory for MVP)
const verificationCodes = new Map();

// Configure Nodemailer (ensure env vars are set)
const transporter = nodemailer.createTransport({
  service: 'gmail', // Or use SMTP settings
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Waitlist API - Step 1: Request Code
app.post('/api/waitlist', async (req, res) => {
  const { email, name } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email is required' });
  }

  // Generate 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  verificationCodes.set(email, { code, timestamp: Date.now() });

  // Log to console for dev/testing (in case email fails or isn't set up)
  console.log(`[Waitlist] 🔐 Verification Code for ${email}: ${code}`);

  // Log to console only (Vercel serverless compatible)
  console.log(`[Waitlist] ${new Date().toISOString()} - ${email} - Code: ${code}`);
  // TODO: Store in Supabase waitlist table for persistence


  // Attempt to send email
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    try {
      await transporter.sendMail({
        from: '"Nevra AI" <noreply@nevra.ai>',
        to: email,
        subject: 'Your Nevra Verification Code',
        text: `Hello ${name || 'User'},\n\nYour verification code for Nevra is: ${code}\n\nThis code will expire in 10 minutes.\n\nWelcome to the future of neural automation.`,
        html: `<div style="font-family: sans-serif; padding: 20px;">
                      <h1>Welcome to Nevra</h1>
                      <p>Hello ${name || 'User'},</p>
                      <p>Your verification code is:</p>
                      <h2 style="background: #eee; padding: 10px; display: inline-block; letter-spacing: 5px;">${code}</h2>
                      <p>This code will expire in 10 minutes.</p>
                     </div>`
      });
      console.log(`[Waitlist] Email sent to ${email}`);
    } catch (err) {
      console.error('[Waitlist] Email send failed:', err);
      // Return success anyway so user can manually get code from logs if testing local
    }
  } else {
    console.warn('[Waitlist] Email credentials not set. Code logged to console.');
  }

  res.json({ success: true, message: 'Verification code sent' });
});

// Waitlist API - Step 2: Verify Code
app.post('/api/verify-waitlist', async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) return res.status(400).json({ error: 'Email and code required' });

  const record = verificationCodes.get(email);

  if (!record) {
    return res.status(400).json({ error: 'No verification request found' });
  }

  if (record.code !== code) {
    return res.status(400).json({ error: 'Invalid verification code' });
  }

  // Check expiration (10 mins)
  if (Date.now() - record.timestamp > 10 * 60 * 1000) {
    return res.status(400).json({ error: 'Code expired' });
  }

  // Success
  verificationCodes.delete(email); // Consume code
  console.log(`[Waitlist] Verified: ${email}`);

  res.json({ success: true, verified: true });
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

    // Create temporary Python file in /tmp (Vercel serverless compatible)
    // WARNING: /tmp is ephemeral and files will be deleted after function execution
    const tempDir = process.env.VERCEL ? '/tmp' : path.join(__dirname, 'temp');
    if (!process.env.VERCEL && !fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const tempFile = path.join(tempDir, `exec_${Date.now()}_${Math.random().toString(36).substring(7)}.py`);

    try {
      // Write code to temporary file (read-only filesystem outside /tmp will fail)
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
  const { prompt, provider = 'groq' } = req.body || {}; // Default to Gemini Flash Lite (SumoPod)

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

    // Use SumoPod for planning
    let completion;
    try {
      if (!sumopodClient) {
        throw new Error('SumoPod client not available');
      }
      const planningPromise = sumopodClient.chat.completions.create({
        model: MODELS.groq,
        messages,
        temperature: 0.7,
        max_tokens: 2000,
      });
      completion = await Promise.race([planningPromise, timeoutPromise]);
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

// --- Feature Usage / Credit System Endpoints ---

// Get current usage and credit status
app.get('/api/user/feature-usage', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'User ID required' });

  try {
    const usageData = await getUserUsage(userId);
    const tier = await getUserTier(userId);

    // Calculate remaining credits
    let remaining = usageData.limit - usageData.used;
    if (remaining < 0) remaining = 0;
    if (tier === 'pro') remaining = 999999; // effectively unlimited

    res.json({
      used: usageData.used,
      limit: usageData.limit,
      remaining,
      tier,
      credits: remaining // explicit credit count
    });
  } catch (error) {
    console.error('Error fetching feature usage:', error);
    res.status(500).json({ error: 'Failed to fetch usage' });
  }
});

// Increment usage (deduct credits)
app.post('/api/user/feature-usage/increment', abuseLimiter, async (req, res) => {
  const { userId, featureType } = req.body;
  if (!userId || !featureType) return res.status(400).json({ error: 'Missing parameters' });

  try {
    const cost = FEATURE_COSTS[featureType] || 1; // Default to 1 if unknown (chat)

    // Check if user has enough credits
    const tier = await getUserTier(userId);
    const usageData = await getUserUsage(userId);

    if (tier !== 'pro' && (usageData.used + cost > usageData.limit)) {
      return res.status(403).json({
        error: 'Daily credit limit exceeded',
        code: 'CREDIT_LIMIT_EXCEEDED',
        upgradeUrl: '/pricing'
      });
    }

    updateUserUsage(userId, cost);

    res.json({
      success: true,
      cost,
      newUsage: usageData.used + cost,
      remaining: tier === 'pro' ? 999999 : Math.max(0, usageData.limit - (usageData.used + cost))
    });
  } catch (error) {
    console.error('Error incrementing usage:', error);
    res.status(500).json({ error: 'Failed to update usage' });
  }
});

app.post('/api/payment/checkout', async (req, res) => {
  const { plan, currency, amount, userId } = req.body || {};

  console.log('💳 Payment checkout request:', { plan, currency, amount, userId });

  if (!plan || plan !== 'premium') {
    return res.status(400).json({ error: 'Invalid plan' });
  }

  if (!userId) {
    return res.status(401).json({ error: 'User ID is required. Please sign in.' });
  }

  if (!snap || !process.env.MIDTRANS_SERVER_KEY) {
    console.error('❌ Midtrans not configured! MIDTRANS_SERVER_KEY:', process.env.MIDTRANS_SERVER_KEY ? 'SET' : 'NOT SET');
    return res.status(500).json({ error: 'Payment system is not configured. Please contact support.' });
  }

  try {
    // Generate unique order ID
    const orderId = `NEVRA-${userId.substring(0, 8)}-${Date.now()}`;

    // Midtrans Snap parameter
    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: Math.round(amount) // Midtrans expects integer (no decimals)
      },
      credit_card: {
        secure: true
      },
      customer_details: {
        // Add customer details if available from userId
      },
      item_details: [{
        id: 'nevra-premium',
        price: Math.round(amount),
        quantity: 1,
        name: 'Nevra Premium Subscription - Monthly'
      }],
      callbacks: {
        finish: `${process.env.FRONTEND_URL || req.headers.origin || 'http://localhost:5173'}/pricing?success=true`,
        error: `${process.env.FRONTEND_URL || req.headers.origin || 'http://localhost:5173'}/pricing?canceled=true`,
        pending: `${process.env.FRONTEND_URL || req.headers.origin || 'http://localhost:5173'}/pricing?pending=true`
      }
    };

    // Create Snap transaction
    const transaction = await snap.createTransaction(parameter);

    console.log('✅ Midtrans Snap transaction created:', orderId);

    res.json({
      checkout_url: transaction.redirect_url,
      token: transaction.token,
      order_id: orderId
    });
  } catch (error) {
    console.error('❌ Payment checkout error:', {
      message: error?.message,
      stack: error?.stack,
      response: error?.response?.data
    });
    res.status(500).json({
      error: error?.message || 'Payment checkout failed',
      details: error?.response?.data || 'Unknown error'
    });
  }
});

// Midtrans notification webhook endpoint 
app.post('/api/payment/webhook', async (req, res) => {
  try {
    const notification = req.body;

    console.log('📬 Midtrans notification received:', {
      order_id: notification.order_id,
      transaction_status: notification.transaction_status,
      fraud_status: notification.fraud_status
    });

    // Verify notification (optional but recommended)
    // const statusResponse = await snap.transaction.notification(notification);

    const orderId = notification.order_id;
    const transactionStatus = notification.transaction_status;
    const fraudStatus = notification.fraud_status;

    // Handle payment status
    let isSuccess = false;
    if (transactionStatus === 'capture') {
      if (fraudStatus === 'accept') {
        // Payment successful
        isSuccess = true;
      }
    } else if (transactionStatus === 'settlement') {
      // Payment settled
      isSuccess = true;
    } else if (transactionStatus === 'pending') {
      // Payment pending
      console.log('⏳ Payment pending for order:', orderId);
    } else if (transactionStatus === 'deny' || transactionStatus === 'cancel' || transactionStatus === 'expire') {
      // Payment failed
      console.log('❌ Payment failed for order:', orderId);
    }

    if (isSuccess) {
      // Extract userId from orderId (format: NEVRA-{userId}-{timestamp})
      const userId = orderId.split('-')[1];

      // Calculate expiry (30 days from now for monthly subscription)
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);

      // Activate subscription immediately
      const activated = saveSubscription(userId, 'pro', expiryDate.toISOString());

      if (activated) {
        console.log(`✅ Subscription activated for user ${userId}`);
        console.log(`   Order ID: ${orderId}`);
        console.log(`   Transaction ID: ${notification.transaction_id}`);
        console.log(`   Expires: ${expiryDate.toISOString()}`);
      } else {
        console.error(`❌ Failed to activate subscription for user ${userId}`);
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error processing Midtrans notification:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Secure activation endpoint - Verifies payment with Midtrans before activating
// IMPORTANT: This endpoint is called by PricingPage after successful Midtrans payment
app.post('/api/payment/activate', async (req, res) => {
  const { userId, orderId } = req.body;

  console.log('📥 Activation request received:', { userId, orderId });

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  if (!orderId) {
    return res.status(400).json({ error: 'Order ID is required for verification' });
  }

  try {
    // Step 1: Verify payment status with Midtrans
    console.log('🔍 Verifying payment with Midtrans for order:', orderId);

    if (!snap) {
      console.error('❌ Midtrans not configured!');
      return res.status(500).json({ error: 'Payment system not configured' });
    }

    let paymentVerified = false;
    let transactionStatus = 'unknown';

    try {
      // Verify transaction with Midtrans API
      const midtransServerKey = process.env.MIDTRANS_SERVER_KEY?.trim();
      const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';
      const baseUrl = isProduction
        ? 'https://api.midtrans.com'
        : 'https://api.sandbox.midtrans.com';

      const authHeader = Buffer.from(midtransServerKey + ':').toString('base64');

      const statusResponse = await fetch(`${baseUrl}/v2/${orderId}/status`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Basic ${authHeader}`
        }
      });

      if (!statusResponse.ok) {
        throw new Error(`Midtrans API error: ${statusResponse.status}`);
      }

      const statusData = await statusResponse.json();
      transactionStatus = statusData.transaction_status;
      const fraudStatus = statusData.fraud_status;

      console.log('📊 Midtrans verification result:', {
        order_id: orderId,
        transaction_status: transactionStatus,
        fraud_status: fraudStatus
      });

      // Verify payment is successful
      if (transactionStatus === 'settlement' ||
        (transactionStatus === 'capture' && fraudStatus === 'accept')) {
        paymentVerified = true;
        console.log('✅ Payment verified successfully');
      } else if (transactionStatus === 'pending') {
        return res.status(402).json({
          error: 'Payment is still pending',
          status: 'pending',
          message: 'Please wait for payment confirmation'
        });
      } else {
        console.warn('⚠️ Payment not successful:', transactionStatus);
        return res.status(403).json({
          error: 'Payment verification failed',
          status: transactionStatus,
          message: 'Payment was not successful or is still being processed'
        });
      }
    } catch (verifyError) {
      console.error('❌ Midtrans verification error:', verifyError);

      // In development/testing, allow activation without strict verification
      // Remove this in production!
      if (process.env.NODE_ENV === 'development' && orderId.startsWith('TEST-')) {
        console.warn('⚠️ Development mode: Allowing test order without verification');
        paymentVerified = true;
      } else {
        return res.status(500).json({
          error: 'Failed to verify payment',
          message: 'Could not verify payment status with Midtrans. Please contact support.'
        });
      }
    }

    // Step 2: Activate subscription only if payment verified
    if (!paymentVerified) {
      return res.status(403).json({
        error: 'Payment not verified',
        message: 'Unable to verify successful payment'
      });
    }

    // Calculate expiry (30 days from now for monthly subscription)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);

    // Activate subscription
    const activated = saveSubscription(userId, 'pro', expiryDate.toISOString());

    if (activated) {
      console.log(`✅ [Verified] Subscription activated for user ${userId}`);
      console.log(`   Order ID: ${orderId}`);
      console.log(`   Transaction Status: ${transactionStatus}`);
      console.log(`   Expires: ${expiryDate.toISOString()}`);

      res.json({
        success: true,
        subscription: 'pro',
        expiresAt: expiryDate.toISOString(),
        verified: true
      });
    } else {
      throw new Error('Failed to save subscription');
    }
  } catch (error) {
    console.error('Activation error:', error);
    res.status(500).json({ error: 'Failed to activate subscription' });
  }
});

// Get subscription status endpoint
app.get('/api/payment/subscription', async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    const subscription = await getUserSubscription(userId);

    if (subscription && subscription.tier === 'pro') {
      res.json({
        subscription: 'pro',
        isActive: true,
        subscribedAt: subscription.activatedAt,
        expiresAt: subscription.expiresAt,
      });
    } else {
      res.json({
        subscription: 'free',
        isActive: false,
        subscribedAt: null,
        expiresAt: null,
      });
    }
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
    provider = 'groq',
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

// Subscription management endpoint (replaced Stripe portal)
app.post('/api/payment/portal', async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    // For Midtrans, we don't have a customer portal like Stripe
    // Instead, return subscription info
    const subscription = await getUserSubscription(userId);

    if (subscription && subscription.tier === 'pro') {
      res.json({
        message: 'Subscription is active',
        subscription: {
          tier: 'pro',
          expiresAt: subscription.expiresAt,
          activatedAt: subscription.activatedAt
        }
      });
    } else {
      res.status(404).json({ error: 'No active subscription found' });
    }
  } catch (error) {
    console.error('Error fetching subscription info:', error);
    res.status(500).json({ error: 'Failed to fetch subscription info' });
  }
});


// Canvas AI Analyze endpoint (Redesign) - Vercel Consistent
app.post('/api/canvas/analyze', async (req, res) => {
  const { userId, imageData } = req.body;
  if (!userId) return res.status(400).json({ error: 'User ID is required' });
  if (!imageData) return res.status(400).json({ error: 'Image data is required' });

  try {
    // Check Limits (Redesign)
    const usageCheck = await checkFeatureUsage(userId, 'redesign');

    if (!usageCheck.allowed) {
      return res.status(403).json({
        error: 'Redesign limit exceeded',
        code: 'CANVAS_ANALYZE_LIMIT',
        message: `Free users are limited to ${usageCheck.limit} redesigns per month. Upgrade to Pro for unlimited access.`,
        usage: { used: usageCheck.used, limit: usageCheck.limit, tier: usageCheck.tier },
        upgradeUrl: '/pricing'
      });
    }

    // Increment usage
    await incrementFeatureUsage(userId, 'redesign');

    res.json({
      success: true,
      tier: usageCheck.tier,
      remaining: usageCheck.tier === 'pro' ? 'unlimited' : Math.max(0, usageCheck.limit - usageCheck.used - 1)
    });

  } catch (error) {
    console.error('Canvas analyze error:', error);
    res.status(500).json({ error: 'Failed to analyze canvas' });
  }
});

// Get Canvas analyze usage
app.get('/api/canvas/usage', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'User ID is required' });

  try {
    const usageCheck = await checkFeatureUsage(userId, 'redesign');
    res.json({
      tier: usageCheck.tier,
      usage: {
        used: usageCheck.used,
        limit: usageCheck.tier === 'pro' ? 'unlimited' : usageCheck.limit,
        remaining: usageCheck.tier === 'pro' ? 'unlimited' : Math.max(0, usageCheck.limit - usageCheck.used)
      }
    });
  } catch (error) {
    console.error('Error getting canvas usage:', error);
    res.status(500).json({ error: 'Failed to get usage' });
  }
});

// Export app for Vercel serverless functions


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


  // =====================================================
  // PAYMENT ENDPOINTS (Midtrans Integration)
  // =====================================================

  // Create Midtrans transaction token
  app.post('/api/payment/create-transaction', async (req, res) => {
    try {
      const { userId, userEmail, userName, plan, amount } = req.body;

      if (!userId || !plan || !amount) {
        return res.status(400).json({ error: 'userId, plan, and amount are required' });
      }

      if (!snap) {
        return res.status(500).json({ error: 'Payment service not configured' });
      }

      const orderId = `NEVRA-PRO-${Date.now()}-${userId.slice(-6)}`;

      const parameter = {
        transaction_details: {
          order_id: orderId,
          gross_amount: amount
        },
        customer_details: {
          email: userEmail || 'user@nevra.app',
          first_name: userName || 'Nevra User'
        },
        item_details: [{
          id: 'nevra-pro-monthly',
          price: amount,
          quantity: 1,
          name: 'Nevra Pro Monthly Subscription'
        }],
        custom_field1: userId,
        callbacks: {
          finish: process.env.VITE_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
        }
      };

      const transaction = await snap.createTransaction(parameter);

      console.log('✅ Midtrans transaction created:', orderId);

      res.json({
        token: transaction.token,
        orderId: orderId,
        redirect_url: transaction.redirect_url
      });
    } catch (error) {
      console.error('❌ Error creating transaction:', error);
      res.status(500).json({ error: 'Failed to create transaction', details: error.message });
    }
  });

  // Activate subscription after successful payment
  app.post('/api/payment/activate', async (req, res) => {
    try {
      const { userId, orderId } = req.body;

      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }

      console.log('🔓 Activating Pro subscription for:', userId, 'Order:', orderId);

      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1); // 1 month subscription

      // Update subscription in Supabase
      if (supabase) {
        const { data, error } = await supabase
          .from('subscriptions')
          .upsert({
            user_id: userId,
            tier: 'pro',
            activated_at: new Date().toISOString(),
            expires_at: expiresAt.toISOString(),
            midtrans_order_id: orderId || null,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' })
          .select()
          .single();

        if (error) {
          console.error('❌ Supabase error:', error);
          return res.status(500).json({ error: 'Failed to update subscription in database', details: error.message });
        }

        console.log('✅ Subscription activated in Supabase:', data);

        res.json({
          success: true,
          tier: 'pro',
          message: 'Subscription activated successfully',
          expiresAt: expiresAt.toISOString()
        });
      } else {
        // Supabase not available - still return success but log warning
        console.warn('⚠️ Supabase not configured - subscription activation may not persist');
        res.json({
          success: true,
          tier: 'pro',
          message: 'Subscription activated (warning: database not configured)',
          expiresAt: expiresAt.toISOString()
        });
      }
    } catch (error) {
      console.error('❌ Error activating subscription:', error);
      res.status(500).json({ error: 'Failed to activate subscription', details: error.message });
    }
  });

  // Midtrans Webhook Notification
  app.post('/api/payment/notification', async (req, res) => {
    try {
      const notification = req.body;
      const { order_id, status_code, gross_amount, transaction_status, signature_key, custom_field1 } = notification;

      console.log('🔔 Received Midtrans Notification:', order_id, transaction_status);

      // Verify Signature
      const serverKey = process.env.MIDTRANS_SERVER_KEY;
      const input = order_id + status_code + gross_amount + serverKey;
      const signature = crypto.createHash('sha512').update(input).digest('hex');

      if (signature !== signature_key) {
        console.error('❌ Invalid Midtrans Signature');
        return res.status(400).json({ status: 'error', message: 'Invalid signature' });
      }

      let isPaid = false;
      if (transaction_status == 'capture') {
        if (notification.fraud_status == 'challenge') {
          // Deny handled elsewhere or manual
        } else if (notification.fraud_status == 'accept') {
          isPaid = true;
        }
      } else if (transaction_status == 'settlement') {
        isPaid = true;
      }

      if (isPaid && supabase) {
        const userId = custom_field1;
        if (userId) {
          const expiresAt = new Date();
          expiresAt.setMonth(expiresAt.getMonth() + 1);

          const { error } = await supabase
            .from('subscriptions')
            .upsert({
              user_id: userId,
              tier: 'pro',
              activated_at: new Date().toISOString(),
              expires_at: expiresAt.toISOString(),
              midtrans_order_id: order_id,
              updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });

          if (error) {
            console.error('❌ Supabase Update Error:', error);
          } else {
            console.log(`✅ Subscription activated/renewed for ${userId}`);
          }
        } else {
          console.warn('⚠️ No userId found in custom_field1');
        }
      }

      res.status(200).json({ status: 'ok' });
    } catch (error) {
      console.error('Webhook Error:', error);
      res.status(500).json({ status: 'error' });
    }
  });

  // Get subscription status
  app.get('/api/payment/status', async (req, res) => {
    try {
      const { userId } = req.query;

      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }

      const tier = await getUserTier(userId);

      res.json({
        tier,
        isSubscribed: tier === 'pro'
      });
    } catch (error) {
      console.error('Error getting payment status:', error);
      res.status(500).json({ error: 'Failed to get subscription status' });
    }
  });

  // Start server locally (not on Vercel)
  if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    app.listen(PORT, () => {
      console.log(`API proxy listening on ${PORT}`);
    });
  }
}

// Export the Express app for Vercel Serverless Functions
export default app;
