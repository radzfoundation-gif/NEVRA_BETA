import React, { useEffect, useRef, useState } from 'react';
import { Brain, Loader2 } from 'lucide-react';
import { getApiUrl } from '@/lib/utils';

interface GlassThinkingStreamProps {
  prompt: string;
  active: boolean;
}

interface ParsedThinking {
  goal: string;
  steps: string[];
  strategy: string;
}

const parseThinking = (raw: string): ParsedThinking => {
  const goalMatch = raw.match(/\[GOAL\]\s*([\s\S]*?)(?=\[STEPS\]|\[STRATEGY\]|$)/i);
  const stepsMatch = raw.match(/\[STEPS\]\s*([\s\S]*?)(?=\[STRATEGY\]|$)/i);
  const strategyMatch = raw.match(/\[STRATEGY\]\s*([\s\S]*?)$/i);

  const goal = (goalMatch?.[1] || '').trim();
  const stepsBlock = (stepsMatch?.[1] || '').trim();
  const strategy = (strategyMatch?.[1] || '').trim();

  const steps = stepsBlock
    .split(/\n+/)
    .map((line) => line.replace(/^[-*•\d.)\s]+/, '').trim())
    .filter(Boolean);

  return { goal, steps, strategy };
};

const GlassThinkingStream: React.FC<GlassThinkingStreamProps> = ({ prompt, active }) => {
  const [raw, setRaw] = useState('');
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const lastPromptRef = useRef<string>('');

  useEffect(() => {
    if (!active || !prompt.trim()) return;
    if (lastPromptRef.current === prompt) return;
    lastPromptRef.current = prompt;

    const controller = new AbortController();
    abortRef.current?.abort();
    abortRef.current = controller;
    setRaw('');
    setError(null);

    (async () => {
      try {
        const response = await fetch(`${getApiUrl()}/api/thinking-stream`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt }),
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          throw new Error(`thinking stream failed (${response.status})`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const events = buffer.split('\n\n');
          buffer = events.pop() || '';

          for (const evt of events) {
            const lines = evt.split('\n');
            let eventName = 'message';
            let dataLine = '';
            for (const line of lines) {
              if (line.startsWith('event:')) eventName = line.slice(6).trim();
              else if (line.startsWith('data:')) dataLine = line.slice(5).trim();
            }
            if (!dataLine || dataLine === '[DONE]') continue;
            try {
              const payload = JSON.parse(dataLine);
              if (eventName === 'delta' && payload.content) {
                setRaw((prev) => prev + payload.content);
              } else if (eventName === 'error') {
                setError(payload.message || 'thinking failed');
              }
            } catch {
              // ignore bad json
            }
          }
        }
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          setError(err?.message || 'thinking stream failed');
        }
      }
    })();

    return () => {
      controller.abort();
    };
  }, [prompt, active]);

  const parsed = parseThinking(raw);
  const hasAny = parsed.goal || parsed.steps.length > 0 || parsed.strategy;

  return (
    <div className="rounded-[24px] border border-white/80 bg-white/70 p-4 shadow-xl shadow-blue-900/5 backdrop-blur-2xl">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-900">
        <Brain size={16} className="text-blue-600" />
        Glass Thinking Mode
        {!hasAny && !error && (
          <Loader2 size={14} className="ml-1 animate-spin text-blue-500" />
        )}
      </div>

      {error ? (
        <div className="rounded-2xl bg-red-50 p-3 text-sm text-red-600">{error}</div>
      ) : (
        <div className="grid gap-2 text-sm text-zinc-600 md:grid-cols-3">
          <div className="rounded-2xl bg-blue-50/70 p-3">
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-blue-600">Goal</div>
            <div className="min-h-[1.25rem]">
              {parsed.goal || <span className="text-zinc-400">Memahami tujuan…</span>}
            </div>
          </div>
          <div className="rounded-2xl bg-zinc-50 p-3">
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Steps</div>
            {parsed.steps.length === 0 ? (
              <div className="text-zinc-400">Memecah jadi langkah…</div>
            ) : (
              <ul className="space-y-1">
                {parsed.steps.map((step, i) => (
                  <li key={i} className="flex gap-1.5">
                    <span className="text-zinc-400">{i + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="rounded-2xl bg-white p-3 ring-1 ring-zinc-100">
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Strategy</div>
            <div className="min-h-[1.25rem]">
              {parsed.strategy || <span className="text-zinc-400">Menyusun strategi jawaban…</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GlassThinkingStream;
