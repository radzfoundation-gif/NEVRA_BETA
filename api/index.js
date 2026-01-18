// Vercel Serverless Function wrapper for Express server
// This file imports the Express app from server/index.js and exports it for Vercel

import app from '../server/index.js';

// Export as Vercel serverless function handler
// The app handles all routes mounted on it
export default function handler(req, res) {
    // Forward request to Express app
    return app(req, res);
}

// Also export the app for local development
export { app };
