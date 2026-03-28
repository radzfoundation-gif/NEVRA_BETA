/**
 * Deep Research Mode - Multi-step research flow using SumoPod API
 * 
 * Steps:
 * 1. Planning: Break query into 3-5 search angles
 * 2. Execution: Run each sub-query with web search (via SumoPod)
 * 3. Synthesis: Compile findings into a structured report
 */

export interface ResearchStep {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'done' | 'error';
  detail?: string;
}

export interface DeepResearchResult {
  report: string;
  sources: { title: string; url: string }[];
  subQueries: string[];
}

const SUMOPOD_BASE = 'https://api.sumopod.com/v1';

async function callSumoPod(
  messages: { role: string; content: string }[],
  model: string = 'gpt-5-mini',
  options?: { signal?: AbortSignal }
): Promise<string> {
  const apiKey = import.meta.env.VITE_SUMOPOD_API_KEY;
  if (!apiKey) throw new Error('SumoPod API Key not configured');

  const response = await fetch(`${SUMOPOD_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.4,
      max_tokens: 4096,
    }),
    signal: options?.signal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`SumoPod API Error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

export async function runDeepResearch(
  query: string,
  onProgress: (steps: ResearchStep[]) => void,
  options?: { signal?: AbortSignal }
): Promise<DeepResearchResult> {
  const steps: ResearchStep[] = [
    { id: 'plan', label: 'Planning research angles...', status: 'pending' },
  ];

  const updateStep = (id: string, update: Partial<ResearchStep>) => {
    const step = steps.find(s => s.id === id);
    if (step) Object.assign(step, update);
    onProgress([...steps]);
  };

  // ─── Step 1: Planning ───
  updateStep('plan', { status: 'active' });

  const planPrompt = `You are a research assistant. Break the following query into 3-5 specific, distinct search angles that would help produce a comprehensive research report. Return ONLY a JSON array of strings (search queries), no explanation.

Query: "${query}"

Example output: ["angle 1", "angle 2", "angle 3"]`;

  let subQueries: string[] = [];
  try {
    const planResult = await callSumoPod(
      [{ role: 'user', content: planPrompt }],
      'gpt-5-mini',
      options
    );

    // Parse JSON array from response
    const jsonMatch = planResult.match(/\[[\s\S]*?\]/);
    if (jsonMatch) {
      subQueries = JSON.parse(jsonMatch[0]);
    }
    if (!Array.isArray(subQueries) || subQueries.length === 0) {
      subQueries = [query]; // fallback to original query
    }
  } catch (e) {
    updateStep('plan', { status: 'error', detail: String(e) });
    throw e;
  }

  updateStep('plan', { status: 'done', detail: `${subQueries.length} angles identified` });

  // Create step entries for each sub-query
  subQueries.forEach((sq, i) => {
    steps.push({
      id: `search-${i}`,
      label: `Searching: "${sq.length > 60 ? sq.slice(0, 57) + '...' : sq}"`,
      status: 'pending',
    });
  });
  steps.push({ id: 'synthesis', label: 'Synthesizing findings...', status: 'pending' });
  onProgress([...steps]);

  // ─── Step 2: Execute each sub-query ───
  const findings: string[] = [];

  for (let i = 0; i < subQueries.length; i++) {
    const sq = subQueries[i];
    const stepId = `search-${i}`;
    updateStep(stepId, { status: 'active' });

    try {
      const searchPrompt = `Research the following topic thoroughly and provide detailed, factual findings with specific data points, dates, and examples where possible. Include any relevant URLs or sources you reference.

Topic: "${sq}"

Provide a comprehensive answer in markdown format.`;

      const result = await callSumoPod(
        [{ role: 'user', content: searchPrompt }],
        'gpt-5-mini',
        options
      );

      findings.push(`### Research Angle ${i + 1}: ${sq}\n\n${result}`);
      updateStep(stepId, { status: 'done' });
    } catch (e) {
      updateStep(stepId, { status: 'error', detail: String(e) });
      findings.push(`### Research Angle ${i + 1}: ${sq}\n\n*Error: Could not complete this research angle.*`);
    }
  }

  // ─── Step 3: Synthesis ───
  updateStep('synthesis', { status: 'active' });

  const synthesisPrompt = `You are a research analyst. Synthesize the following research findings into a comprehensive, well-structured report. Use markdown formatting with clear sections, headers, bullet points, and key takeaways.

Original Query: "${query}"

Research Findings:
${findings.join('\n\n---\n\n')}

Requirements:
1. Start with an Executive Summary
2. Organize by themes/topics, not by search angle
3. Include a "Key Takeaways" section at the end
4. Be thorough but concise
5. Use proper markdown formatting with ## headers`;

  let report = '';
  try {
    report = await callSumoPod(
      [{ role: 'user', content: synthesisPrompt }],
      'gpt-5-mini',
      options
    );
    updateStep('synthesis', { status: 'done' });
  } catch (e) {
    updateStep('synthesis', { status: 'error', detail: String(e) });
    report = `# Research Report\n\n*Synthesis failed. Raw findings below:*\n\n${findings.join('\n\n---\n\n')}`;
  }

  // Extract any URLs from the report as sources
  const urlRegex = /https?:\/\/[^\s\)>\]]+/g;
  const urls = report.match(urlRegex) || [];
  const sources = [...new Set(urls)].map(url => ({
    title: new URL(url).hostname.replace('www.', ''),
    url,
  }));

  return {
    report,
    sources,
    subQueries,
  };
}
