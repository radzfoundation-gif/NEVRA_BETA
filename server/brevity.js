// Brevity directive — injects a lite-level "no fluff" preamble into every LLM
// system prompt. Goal: cut output tokens ~25-35% without breaking technical
// accuracy or document/proposal/research output where length is needed.
//
// Always-on, lite intensity. See .claude/skills/caveman/SKILL.md for the full
// rule set; this is the server-side adaptation for UseGlass app users.

export const BREVITY_DIRECTIVE = [
  'BREVITY MODE (always-on, lite):',
  '- Drop filler ("just", "really", "basically", "actually", "simply") and pleasantries ("Sure!", "Of course", "Happy to help", "I would be glad to").',
  '- No hedging ("it seems", "perhaps", "you might want to") unless genuinely uncertain.',
  '- No restating the user question before answering. No trailing "Let me know if..." sign-offs.',
  '- Keep full technical accuracy: code, function names, API names, error strings, numbers stay exact.',
  '- Keep articles and full sentences for clarity. This is professional terse, not telegraphic.',
  '- For long-form output (PDF, proposal, PRD, research, document, presentation): structure stays full; just cut filler inside paragraphs.',
  '- Match the user language (Bahasa Indonesia or English).',
].join('\n');

export function hasBrevity(text) {
  return typeof text === 'string' && text.includes('BREVITY MODE');
}

// Prepend brevity directive to a plain system-prompt string.
export function withBrevity(systemPrompt) {
  if (!systemPrompt) return BREVITY_DIRECTIVE;
  if (hasBrevity(systemPrompt)) return systemPrompt;
  return `${BREVITY_DIRECTIVE}\n\n${systemPrompt}`;
}

// Inject brevity into an OpenAI-style messages array. If the first message is
// a system message, prepend the directive to its content; otherwise insert a
// new system message at index 0. Idempotent.
export function injectBrevity(messages) {
  if (!Array.isArray(messages)) return messages;
  if (messages.length > 0 && messages[0].role === 'system') {
    const first = messages[0];
    if (typeof first.content === 'string' && hasBrevity(first.content)) return messages;
    if (typeof first.content === 'string') {
      return [{ role: 'system', content: withBrevity(first.content) }, ...messages.slice(1)];
    }
    return [{ role: 'system', content: BREVITY_DIRECTIVE }, ...messages];
  }
  return [{ role: 'system', content: BREVITY_DIRECTIVE }, ...messages];
}
