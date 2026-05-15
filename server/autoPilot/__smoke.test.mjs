/**
 * Auto Pilot — routing smoke tests.
 * Run with: node server/autoPilot/__smoke.test.mjs
 *
 * Asserts the acceptance-criteria prompts route to the expected
 * tool / mode / style / skill / canvas / output combinations.
 */

import { runAutoPilot } from './router.js';
import { detectTeamActivation } from './team.js';

const cases = [
  {
    name: 'PDF proposal bisnis',
    prompt: 'tolong buatkan PDF proposal bisnis UseGlass AI',
    expect: {
      selectedTool: 'Glass Chat',
      selectedWorkflowMode: 'Create',
      selectedStyle: 'Professional',
      canvasType: 'document',
      outputFormat: 'pdf',
      skillIn: ['Business Analyst', 'PRD Writer', 'Academic Writer'],
    },
  },
  {
    name: 'Strategy launching',
    prompt: 'buatkan strategy launching UseGlass AI untuk Q3',
    expect: {
      selectedTool: 'Glass Omni',
      selectedWorkflowMode: 'Launch',
      selectedStyle: 'Startup Founder',
      skillIn: ['SaaS Planner', 'Business Analyst'],
    },
  },
  {
    name: 'Fix npm error',
    prompt: 'fix error npm run build di project saya',
    expect: {
      selectedTool: 'Glass Code',
      selectedWorkflowMode: 'Code',
      selectedStyle: 'Senior Engineer',
      selectedSkill: 'Code Debugger',
    },
  },
  {
    name: 'Riset kompetitor',
    prompt: 'riset kompetitor AI workspace seperti Cursor dan Lovable',
    expect: {
      selectedTool: 'Glass Search',
      selectedWorkflowMode: 'Research',
      selectedStyle: 'Research Analyst',
      skillIn: ['Business Analyst', 'Academic Writer'],
    },
  },
  {
    name: 'Landing page',
    prompt: 'buat landing page UseGlass AI dengan glassmorphism',
    expect: {
      selectedTool: 'Glass Build',
      selectedWorkflowMode: 'Build',
      canvasType: 'web',
      outputFormat: 'ui',
    },
  },
  {
    name: 'Fallback general chat',
    prompt: 'halo apa kabar?',
    expect: {
      selectedTool: 'Glass Chat',
      selectedWorkflowMode: 'Think',
      canvasType: null,
      outputFormat: 'chat',
    },
  },
  {
    name: 'Manual override style',
    prompt: 'fix error npm run build',
    manualOverride: { selectedStyle: 'Concise' },
    expect: {
      selectedTool: 'Glass Code',
      selectedStyle: 'Concise',
    },
  },
  {
    name: 'Connector needed but not connected',
    prompt: 'cari informasi terbaru tentang harga GPU H100',
    context: { availableConnectors: [{ name: 'Web Search', connected: false }] },
    expect: {
      selectedConnector: null,
      connectorNeeded: true,
      missingConnector: 'Web Search',
    },
  },
  {
    name: 'Coming-soon connector ignored',
    prompt: 'cari notes tentang OKR di Notion saya',
    context: { availableConnectors: [{ name: 'Notion', connected: true, status: 'coming_soon' }] },
    expect: {
      selectedConnector: null,
    },
  },
  {
    name: 'PRD prompt routes to PRD Writer',
    prompt: 'buatkan PRD untuk fitur Auto Pilot',
    expect: {
      selectedSkill: 'PRD Writer',
      canvasType: 'document',
    },
  },
];

let pass = 0;
let fail = 0;
const failures = [];

for (const c of cases) {
  const routing = runAutoPilot({
    prompt: c.prompt,
    context: c.context || {},
    manualOverride: c.manualOverride || {},
  });

  const errors = [];
  for (const [key, expected] of Object.entries(c.expect)) {
    if (key === 'skillIn') {
      if (!expected.includes(routing.selectedSkill)) {
        errors.push(`selectedSkill expected one of [${expected.join(', ')}], got ${routing.selectedSkill}`);
      }
      continue;
    }
    if (routing[key] !== expected) {
      errors.push(`${key} expected ${JSON.stringify(expected)}, got ${JSON.stringify(routing[key])}`);
    }
  }

  if (errors.length === 0) {
    pass += 1;
    console.log(`  ✓ ${c.name}`);
  } else {
    fail += 1;
    failures.push({ name: c.name, errors, routing });
    console.log(`  ✗ ${c.name}`);
    for (const e of errors) console.log(`      - ${e}`);
  }
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) {
  console.log('\nFailures:');
  for (const f of failures) {
    console.log(`\n[${f.name}]`);
    console.log(JSON.stringify(f.routing, null, 2));
  }
  process.exit(1);
}

// ── Team activation tests ──────────────────────────────────────────────
console.log('\nTeam detector smoke tests:');
const teamCases = [
  {
    name: 'Simple chat does NOT activate team',
    prompt: 'halo apa kabar',
    expectActivate: false,
  },
  {
    name: 'Simple PDF request does NOT activate team',
    prompt: 'buatkan pdf proposal singkat',
    expectActivate: false,
  },
  {
    name: 'Long comprehensive strategy activates team',
    prompt:
      'buatkan strategy launching UseGlass AI yang lengkap menyeluruh — PRD, roadmap, GTM channels, pricing tiers, hingga retention loops dan launch milestones bulan pertama, plus copywriting hero',
    expectActivate: true,
  },
  {
    name: 'Explicit team request activates team',
    prompt: 'jalankan auto pilot team untuk audit produk lengkap saya',
    expectActivate: true,
  },
  {
    name: 'Long but trivial chat does NOT activate team',
    prompt:
      'halo, saya cuma mau ngobrol panjang lebar tentang cuaca hari ini dan rencana akhir pekan tanpa intent khusus apapun, hanya ingin teman cerita yang ramah dan santai saja yaa, bisa ya',
    expectActivate: false,
  },
];

let teamPass = 0;
let teamFail = 0;
for (const tc of teamCases) {
  const routing = runAutoPilot({ prompt: tc.prompt });
  const team = detectTeamActivation({
    promptLower: tc.prompt.toLowerCase(),
    routing,
  });
  if (team.activate === tc.expectActivate) {
    teamPass += 1;
    console.log(`  ✓ ${tc.name}`);
  } else {
    teamFail += 1;
    console.log(`  ✗ ${tc.name}`);
    console.log(`      - expected activate=${tc.expectActivate}, got ${team.activate}`);
    console.log(`      - workstreams=${team.workstreams.join(', ')}`);
  }
}

console.log(`\n${teamPass} team tests passed, ${teamFail} failed`);
if (teamFail > 0) process.exit(1);
