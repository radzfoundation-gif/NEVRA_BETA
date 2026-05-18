/**
 * Auto Pilot — Express Routes
 *
 * Wires three endpoints into an Express router that the main server mounts
 * under /api/auto-pilot:
 *   POST /route         → routing decision only (no AI generation)
 *   POST /generate      → routing + AI generation (chat or canvas response)
 *   POST /save-output   → persist a finished artifact to the Firestore project
 */

import express from 'express';
import { runAutoPilot, fallbackRouting } from './router.js';
import { composeSystemPrompt, composeChatSummaryHint } from './promptComposer.js';
import { formatGenerationResponse, buildErrorResponse } from './responseFormatter.js';
import { detectTeamActivation, composeTeamAddendum } from './team.js';

/**
 * Factory so the main server can inject AI clients + persistence helpers
 * without us reaching into its internals.
 *
 * @param {Object} deps
 * @param {Object} [deps.ninerouterClient]      OpenAI-compatible client (preferred for dev)
 * @param {Object} [deps.openrouterClient]      OpenAI-compatible client (prod fallback)
 * @param {Object} [deps.sumopodClient]         OpenAI-compatible client (legacy)
 * @param {string} [deps.defaultModel]          Model name for generation
 * @param {Function} [deps.saveOutput]          (userId, input) => savedOutput
 */
export function createAutoPilotRouter(deps = {}) {
  const router = express.Router();
  const {
    openrouterClient = null,
    sumopodClient = null,
    ninerouterClient = null,
    defaultModel = 'kr/claude-opus-4.7',
    saveOutput = null,
  } = deps;

  function logRouting(label, routing, extra = {}) {
    try {
      console.log('[AutoPilot]', label, JSON.stringify({
        intent: routing.detectedIntent,
        tool: routing.selectedTool,
        mode: routing.selectedWorkflowMode,
        style: routing.selectedStyle,
        skill: routing.selectedSkill,
        connector: routing.selectedConnector,
        canvas: routing.canvasType,
        format: routing.outputFormat,
        confidence: routing.confidence,
        ...extra,
      }));
    } catch {
      // never fail a request because of a log
    }
  }

  function pickClient() {
    const preferred = (process.env.AUTO_PILOT_PROVIDER || '').trim().toLowerCase();

    const candidates = {
      '9router': ninerouterClient && {
        client: ninerouterClient,
        model: process.env.NINEROUTER_DEFAULT_MODEL || 'kr/claude-opus-4.7',
        name: '9router',
      },
      ninerouter: ninerouterClient && {
        client: ninerouterClient,
        model: process.env.NINEROUTER_DEFAULT_MODEL || 'kr/claude-opus-4.7',
        name: '9router',
      },
      openrouter: openrouterClient && {
        client: openrouterClient,
        model: process.env.OPENROUTER_MODEL || defaultModel,
        name: 'openrouter',
      },
      sumopod: sumopodClient && {
        client: sumopodClient,
        model: process.env.SUMOPOD_MODEL_ID || defaultModel,
        name: 'sumopod',
      },
    };

    if (preferred && candidates[preferred]) {
      return candidates[preferred];
    }

    // Default priority: 9router (local/dev) → openrouter → sumopod
    return candidates['9router'] || candidates.openrouter || candidates.sumopod || null;
  }

  // ── POST /route ────────────────────────────────────────────────────────
  router.post('/route', (req, res) => {
    try {
      const { prompt = '', context = {}, manualOverride = {} } = req.body || {};

      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'prompt is required',
        });
      }

      const routing = runAutoPilot({ prompt, context, manualOverride });
      logRouting('route', routing);

      const team = detectTeamActivation({
        promptLower: (prompt || '').toLowerCase(),
        routing,
      });

      return res.json({ success: true, routing, team });
    } catch (error) {
      const fallback = fallbackRouting('Auto Pilot routing crashed; using safe fallback.');
      console.error('[AutoPilot] /route failed:', error?.message || error);
      return res.status(200).json({ success: true, routing: fallback, warning: 'fallback' });
    }
  });

  // ── POST /generate ─────────────────────────────────────────────────────
  router.post('/generate', async (req, res) => {
    let routing;
    try {
      const { prompt = '', context = {}, manualOverride = {} } = req.body || {};

      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'prompt is required',
        });
      }

      routing = runAutoPilot({ prompt, context, manualOverride });
      logRouting('generate:routed', routing);

      const picked = pickClient();
      if (!picked) {
        return res.status(503).json({
          success: false,
          error: 'AI provider is not configured',
          message: 'No AI client (OpenRouter / SumoPod / 9Router) is available on the server.',
          routing,
        });
      }

      const systemPrompt = composeSystemPrompt({
        routing,
        userPrompt: prompt,
        projectContext: context.projectContext,
        canvasContent: context.canvasContent,
        manualOverrideApplied: routing.manualOverrideApplied,
      });

      const summaryHint = composeChatSummaryHint(routing);

      const messages = [
        { role: 'system', content: systemPrompt },
      ];

      if (Array.isArray(context.messages)) {
        for (const m of context.messages.slice(-10)) {
          if (!m || typeof m !== 'object') continue;
          if (m.role && typeof m.content === 'string') {
            messages.push({ role: m.role, content: m.content });
          }
        }
      }

      if (summaryHint) {
        messages.push({ role: 'system', content: summaryHint });
      }
      messages.push({ role: 'user', content: prompt });

      const completion = await picked.client.chat.completions.create({
        model: picked.model,
        messages,
        temperature: routing.canvasType ? 0.55 : 0.7,
      });

      const text = completion?.choices?.[0]?.message?.content || '';

      const response = formatGenerationResponse({
        routing,
        completion: text,
      });

      if (routing.connectorNeeded && !routing.selectedConnector) {
        response.connectorNeeded = true;
        response.missingConnector = routing.missingConnector;
      }

      logRouting('generate:done', routing, {
        provider: picked.name,
        model: picked.model,
        chars: text.length,
        hasCanvas: !!response.canvas,
      });

      return res.json({ success: true, routing, response });
    } catch (error) {
      console.error('[AutoPilot] /generate failed:', error?.message || error);
      const safe = routing || fallbackRouting('Generation crashed; using safe fallback.');
      return res.status(200).json(buildErrorResponse({ routing: safe, error }));
    }
  });

  // ── POST /save-output ──────────────────────────────────────────────────
  router.post('/save-output', async (req, res) => {
    try {
      const {
        userId,
        projectId,
        title,
        type = 'chat',
        content = '',
        routing = null,
        sourcePrompt = '',
      } = req.body || {};

      if (!userId || typeof userId !== 'string') {
        return res.status(400).json({ success: false, error: 'userId is required' });
      }
      if (!content) {
        return res.status(400).json({ success: false, error: 'content is required' });
      }

      if (typeof saveOutput !== 'function') {
        return res.status(200).json({
          success: false,
          error: 'save_to_project_unavailable',
          message: 'Save to Project is not yet wired into this server build.',
        });
      }

      const saved = await saveOutput(userId, {
        projectId: projectId || null,
        outputType: type,
        title: title || 'Auto Pilot output',
        content,
        metadata: {
          source: 'auto_pilot',
          routing,
          sourcePrompt,
        },
      });

      return res.json({ success: true, savedOutputId: saved?.id || null });
    } catch (error) {
      console.error('[AutoPilot] /save-output failed:', error?.message || error);
      return res.status(500).json({
        success: false,
        error: 'save_failed',
        message: 'Could not save the output to the project.',
      });
    }
  });

  // ── POST /team ─────────────────────────────────────────────────────────
  // Multi-workstream generation. Falls back to single-pass /generate when
  // the prompt does not warrant team mode.
  router.post('/team', async (req, res) => {
    let routing;
    try {
      const { prompt = '', context = {}, manualOverride = {} } = req.body || {};
      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ success: false, error: 'prompt is required' });
      }

      routing = runAutoPilot({ prompt, context, manualOverride });
      const team = detectTeamActivation({
        promptLower: prompt.toLowerCase(),
        routing,
      });
      logRouting('team:routed', routing, { teamActive: team.activate });

      const picked = pickClient();
      if (!picked) {
        return res.status(503).json({
          success: false,
          error: 'AI provider is not configured',
          routing,
          team,
        });
      }

      const baseSystem = composeSystemPrompt({
        routing,
        userPrompt: prompt,
        projectContext: context.projectContext,
        canvasContent: context.canvasContent,
        manualOverrideApplied: routing.manualOverrideApplied,
      });

      const systemPrompt = team.activate
        ? `${baseSystem}\n${composeTeamAddendum({ workstreams: team.workstreams, routing })}`
        : baseSystem;

      const summaryHint = composeChatSummaryHint(routing);

      const messages = [{ role: 'system', content: systemPrompt }];
      if (Array.isArray(context.messages)) {
        for (const m of context.messages.slice(-10)) {
          if (!m || typeof m !== 'object') continue;
          if (m.role && typeof m.content === 'string') {
            messages.push({ role: m.role, content: m.content });
          }
        }
      }
      if (summaryHint) messages.push({ role: 'system', content: summaryHint });
      messages.push({ role: 'user', content: prompt });

      const completion = await picked.client.chat.completions.create({
        model: picked.model,
        messages,
        temperature: routing.canvasType ? 0.55 : 0.7,
      });

      const text = completion?.choices?.[0]?.message?.content || '';
      const response = formatGenerationResponse({ routing, completion: text });

      logRouting('team:done', routing, {
        provider: picked.name,
        model: picked.model,
        chars: text.length,
        teamActive: team.activate,
        workstreams: team.workstreams,
      });

      return res.json({ success: true, routing, response, team });
    } catch (error) {
      console.error('[AutoPilot] /team failed:', error?.message || error);
      const safe = routing || fallbackRouting('Team generation crashed; using safe fallback.');
      return res.status(200).json(buildErrorResponse({ routing: safe, error }));
    }
  });

  return router;
}
