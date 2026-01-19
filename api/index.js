// Vercel Serverless Function wrapper for Express server
// This file imports the Express app from server/index.js and exports it for Vercel

let app;
let initError = null;

// Try to import the app - catch any initialization errors
try {
    // Dynamic import to catch initialization errors
    const module = await import('../server/index.js');
    app = module.default;
} catch (error) {
    console.error('[Vercel] Failed to initialize Express app:', error);
    initError = error;
}

// Export as Vercel serverless function handler
// The app handles all routes mounted on it
export default function handler(req, res) {
    // If initialization failed, return error
    if (initError) {
        return res.status(500).json({
            error: 'Server initialization failed',
            message: initError.message,
            stack: process.env.NODE_ENV !== 'production' ? initError.stack : undefined
        });
    }

    if (!app) {
        return res.status(500).json({
            error: 'App not initialized',
            message: 'Express app failed to load'
        });
    }

    // Forward request to Express app
    return app(req, res);
}

// Also export the app for local development
export { app };
