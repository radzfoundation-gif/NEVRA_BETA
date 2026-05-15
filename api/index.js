let app;
let initError = null;

try {
  const module = await import('../server/index.js');
  app = module.default;
} catch (error) {
  console.error('[Vercel] Failed to initialize Express app:', error);
  initError = error;
}

export default function handler(req, res) {
  if (initError) {
    return res.status(500).json({
      error: 'Server initialization failed',
      message: initError.message,
      stack: process.env.NODE_ENV !== 'production' ? initError.stack : undefined,
    });
  }

  if (!app) {
    return res.status(500).json({
      error: 'App not initialized',
      message: 'Express app failed to load',
    });
  }

  return app(req, res);
}

export { app };
