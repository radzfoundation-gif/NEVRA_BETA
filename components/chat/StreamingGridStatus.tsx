import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import GridNLoader, { GridLoaderTone } from './GridNLoader';
import { getApiUrl } from '@/lib/utils';

interface StreamingGridStatusProps {
  prompt: string;
  active: boolean;
  tone?: GridLoaderTone;
}

const fallbackText = 'Understanding your request';

export default function StreamingGridStatus({ prompt, active, tone = 'default' }: StreamingGridStatusProps) {
  const [status, setStatus] = useState('');
  const abortRef = useRef<AbortController | null>(null);
  const lastPromptRef = useRef('');

  useEffect(() => {
    if (!active || !prompt.trim()) return;
    if (lastPromptRef.current === prompt) return;
    lastPromptRef.current = prompt;

    const controller = new AbortController();
    abortRef.current?.abort();
    abortRef.current = controller;
    setStatus('');

    (async () => {
      try {
        const response = await fetch(`${getApiUrl()}/api/status-narrate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt }),
          signal: controller.signal,
        });

        if (!response.ok || !response.body) return;

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
                setStatus((prev) => (prev + payload.content).replace(/\s+/g, ' ').trimStart());
              }
            } catch {
              // ignore malformed stream events
            }
          }
        }
      } catch (err: any) {
        if (err?.name !== 'AbortError') setStatus('');
      }
    })();

    return () => controller.abort();
  }, [active, prompt]);

  return (
    <div className="inline-flex max-w-full items-center gap-3 rounded-full border border-zinc-200/70 bg-white/70 px-3 py-2 shadow-sm backdrop-blur-xl">
      <GridNLoader tone={tone} label="" />
      <motion.span
        animate={{ opacity: [0.55, 1, 0.55] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        className="truncate text-xs font-medium text-zinc-500"
      >
        {status || fallbackText}
      </motion.span>
    </div>
  );
}
