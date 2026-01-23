// CommonJS version for Passenger compatibility - SumoPod Only
require('dotenv/config');
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');

const app = express();
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const PORT = process.env.PORT || 8788;

// Security Headers
app.use(helmet());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || true,
  })
);
app.use(express.json({ limit: '12mb' }));

// =====================================================
// SUMOPOD CONFIGURATION (ONLY PROVIDER)
// =====================================================
const SUMOPOD_API_KEY = process.env.SUMOPOD_API_KEY?.trim();
const SUMOPOD_BASE_URL = process.env.SUMOPOD_BASE_URL?.trim() || 'https://ai.sumopod.com';
const SUMOPOD_MODEL_ID = process.env.SUMOPOD_MODEL_ID?.trim() || 'gemini/gemini-2.5-flash-lite';

// Initialize SumoPod client (OpenAI-compatible)
const sumopodClient = SUMOPOD_API_KEY ? new OpenAI({
  baseURL: SUMOPOD_BASE_URL,
  apiKey: SUMOPOD_API_KEY,
}) : null;

// Log configuration status
console.log('🔑 SumoPod Configuration:', {
  API_KEY: SUMOPOD_API_KEY ? `✅ Set (${SUMOPOD_API_KEY.substring(0, 12)}...)` : '❌ NOT SET',
  BASE_URL: SUMOPOD_BASE_URL,
  MODEL_ID: SUMOPOD_MODEL_ID,
  CLIENT: sumopodClient ? '✅ Initialized' : '❌ Not available',
});

// =====================================================
// TOKEN LIMITS BY TIER
// =====================================================
function getMaxTokensForTier(tier = 'free') {
  const tierLimits = {
    free: 150,
    normal: 300,
    pro: 500,
  };
  return tierLimits[tier.toLowerCase()] || tierLimits.free;
}

// =====================================================
// HELPERS
// =====================================================
const formatHistory = (history = []) =>
  history
    .slice(-3) // Keep last 3 messages for faster processing
    .map((msg) => ({
      role: msg.role === 'model' ? 'assistant' : 'user',
      content: msg.parts?.[0]?.text ?? '',
    }))
    .filter((msg) => msg.content);

const buildUserContent = (prompt, images = []) => {
  if (images.length === 0) return prompt;

  const content = [{ type: 'text', text: prompt }];
  images.forEach((img) => {
    content.push({
      type: 'image_url',
      image_url: { url: img },
    });
  });
  return content;
};

// =====================================================
// API ENDPOINT
// =====================================================
app.post('/api/generate', async (req, res) => {
  const {
    prompt,
    history = [],
    systemPrompt,
    mode = 'builder',
    images = [],
    userTier = 'free',
  } = req.body || {};

  if (!prompt || !systemPrompt) {
    return res.status(400).json({ error: 'Missing prompt or systemPrompt' });
  }

  if (!sumopodClient) {
    return res.status(500).json({
      error: 'SumoPod not configured. Please set SUMOPOD_API_KEY in .env file.',
      help: 'Get your API key from https://sumopod.com/dashboard/ai/quickstart'
    });
  }

  // Get tier-based max tokens
  const maxTokens = getMaxTokensForTier(userTier);
  console.log(`[SumoPod] Mode: ${mode}, Tier: ${userTier}, MaxTokens: ${maxTokens}, Model: ${SUMOPOD_MODEL_ID}`);

  try {
    const messages = [
      { role: 'system', content: systemPrompt },
      ...formatHistory(history),
      { role: 'user', content: buildUserContent(prompt, images) },
    ];

    const completion = await sumopodClient.chat.completions.create({
      model: SUMOPOD_MODEL_ID,
      messages,
      temperature: mode === 'tutor' ? 0.7 : 0.5,
      max_tokens: maxTokens,
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      console.error('[SumoPod] No content in response');
      return res.status(500).json({ error: 'No content in response from SumoPod' });
    }

    console.log(`[SumoPod] ✅ Response received (${content.length} chars)`);
    return res.json({ content });

  } catch (err) {
    const errorMsg = err?.error?.message || err?.message || String(err);
    console.error('[SumoPod] Error:', errorMsg);

    return res.status(err?.status || 500).json({
      error: 'An internal error occurred. Please check server logs.',
      // Only show detailed error in development if needed, but for security scan compliance, hide it.
      // detail: err?.error || errorMsg 
    });
  }
});

// =====================================================
// HEALTH CHECK
// =====================================================
app.get('/', (_req, res) => {
  res.type('text/html').send('<h1>Noir AI API OK (SumoPod)</h1>');
});

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    provider: 'SumoPod',
    model: SUMOPOD_MODEL_ID,
    configured: !!sumopodClient
  });
});

// =====================================================
// START SERVER
// =====================================================
app.listen(PORT, () => {
  console.log(`\n🚀 Noir AI API Server (SumoPod Only)`);
  console.log(`   Port: ${PORT}`);
  console.log(`   Model: ${SUMOPOD_MODEL_ID}`);
  console.log(`   Status: ${sumopodClient ? '✅ Ready' : '❌ API Key Required'}\n`);
});

module.exports = app;
