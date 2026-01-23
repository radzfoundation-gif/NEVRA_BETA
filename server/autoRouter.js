/**
 * NOIR AI AUTO ROUTER
 * Intelligent Model Selection Logic
 */

class AutoRouter {
    constructor() {
        this.models = {
            // Tier 1: Fast & Cheap (Free/Default)
            'nano': 'gpt-5-nano',
            'mini': 'gpt-5-mini',

            // Tier 2: Competent (Pro)
            'standard': 'gpt-5-turbo',
            'coder': 'gpt-5.1-codex-mini',

            // Tier 3: Premium (Creator/Deep Dive)
            'reasoning': 'claude-3-7-sonnet',
            'vision': 'gemini-3-pro-preview',
            'context': 'gemini-2.0-flash'
        };

        this.fallbackOrder = {
            'gpt-5-turbo': ['gpt-5-mini', 'gpt-5-nano'],
            'claude-3-7-sonnet': ['gpt-5-turbo', 'gpt-5-mini'],
            'gemini-3-pro-preview': ['gpt-image-1', 'dall-e-3']
        };
    }

    /**
     * Determines the best model for a given request
     * @param {Object} params
     * @param {string} params.tier - User Tier ('free', 'pro', 'creator')
     * @param {string} params.mode - usage mode ('chat', 'code', 'redesign', 'rag', 'deep_dive')
     * @param {number} [params.contextLength] - Estimated context length (optional)
     * @returns {string} Model ID
     */
    route({ tier = 'free', mode = 'chat', contextLength = 0 }) {
        // 1. Force Upgrade Rejection (Safety check, should be handled by limiter too)
        if (tier === 'free') {
            if (mode === 'redesign') return null; // Free users can't use redesign? (Or maybe limited)
            if (mode === 'deep_dive') return this.models.mini; // Downgrade deep dive
        }

        // 2. Logic Matrix through Switch
        switch (mode) {
            case 'code':
                if (tier === 'creator') return this.models.reasoning; // Claude is great at code
                if (tier === 'pro') return this.models.coder;
                return this.models.nano; // Basic help for free

            case 'redesign':
            case 'ui':
                // Visual tasks need vision models
                if (tier === 'free') return null; // Or some basic model
                return this.models.vision; // Gemini 3 Pro

            case 'deep_dive':
            case 'reasoning':
                if (tier === 'creator') return this.models.reasoning;
                if (tier === 'pro') return this.models.standard;
                return this.models.mini;

            case 'rag':
                // Large context handling
                if (contextLength > 30000) return this.models.context; // Gemini 2 Flash
                return this.models.mini;

            case 'chat':
            default:
                if (tier === 'creator') return this.models.standard;
                if (tier === 'pro') return this.models.mini;
                return this.models.nano;
        }
    }

    /**
     * Get fallback model if primary fails
     * @param {string} failedModelId 
     * @returns {string|null} Fallback model ID or null
     */
    getFallback(failedModelId) {
        // Find key in models map
        let modelKey = Object.keys(this.models).find(key => this.models[key] === failedModelId);

        // Simple manual mappings
        if (failedModelId.includes('claude')) return this.models.standard;
        if (failedModelId.includes('gpt-5-turbo')) return this.models.mini;
        if (failedModelId.includes('gemini-3')) return this.models.mini; // Vision fallback might fail if text-only, but acceptable for generic errors

        return this.models.nano;
    }
}

export default new AutoRouter();
