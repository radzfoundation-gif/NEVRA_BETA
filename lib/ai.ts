export type AIProvider = 'groq' | 'openai' | 'anthropic' | 'gemini';
export type Framework = 'html' | 'react' | 'nextjs' | 'vite';

// --- MODEL TIER RESTRICTIONS ---
// Free users: Only Gemini Flash Lite (via groq/SumoPod)
export const FREE_TIER_MODELS: AIProvider[] = ['groq'];

// Pro users: All models including premium ones
export const PRO_ONLY_MODELS: AIProvider[] = ['openai', 'anthropic', 'gemini'];

// Model display names for UI
export const MODEL_DISPLAY_NAMES: Record<AIProvider, string> = {
  groq: 'Gemini 2.5 Flash Lite', // Updated from Tech Spec 3.1
  openai: 'GPT-5 Mini',          // Updated from Tech Spec 3.1 (Pro Reasoning)
  anthropic: 'Claude Opus 4.5',
  gemini: 'Gemini 3 Pro',        // Updated from Tech Spec 3.1 (UI & Creative)
};

// Check if a model is allowed for a given tier
export const isModelAllowed = (provider: AIProvider, tier: 'free' | 'pro'): boolean => {
  if (tier === 'pro') return true;
  return FREE_TIER_MODELS.includes(provider);
};

// Get allowed models for tier
export const getModelsForTier = (tier: 'free' | 'pro'): AIProvider[] => {
  if (tier === 'pro') {
    return [...FREE_TIER_MODELS, ...PRO_ONLY_MODELS];
  }
  return FREE_TIER_MODELS;
};

// Check if model requires Pro subscription
export const isProOnlyModel = (provider: AIProvider): boolean => {
  return PRO_ONLY_MODELS.includes(provider);
};

// --- SMART ROUTING ---
const smartRouteModel = (prompt: string, requestedProvider: AIProvider, tier: 'free' | 'normal' | 'pro'): AIProvider => {
  // 1. Force Free Tier Limits
  if (tier === 'free') {
    if (!FREE_TIER_MODELS.includes(requestedProvider)) return 'groq'; // Default free (Gemini 2.5 Flash Lite)
    return requestedProvider;
  }

  // 2. Optimization for Pro Users (Save costs/time on simple queries)
  // If prompt is very short and simple, use faster model even if premium requested?
  // Only if the user didn't explicitly ask for "GPT-5" (assuming 'openai' could be that).
  // But generally, for "Hi" or "Thanks", Groq is better.
  const isSimple = prompt.length < 50 && !prompt.includes('code') && !prompt.includes('complex') && !prompt.includes('analysis');
  if (isSimple && (requestedProvider === 'openai' || requestedProvider === 'anthropic')) {
    return 'groq'; // Gemini 2.5 Flash Lite for simple queries
  }

  // 3. Complexity Handling (Upgrade to better model if 'groq' requested but task is hard?)
  // Tech Spec: Pro Reasoning uses GPT-5 Mini
  const isComplex = prompt.includes('code') || prompt.length > 500 || prompt.includes('analyze') || prompt.includes('reason');
  if (isComplex && tier === 'pro' && requestedProvider === 'groq') {
    // Elevate to GPT-5 Mini (openai) for complex tasks if user is Pro
    // return 'openai'; 
    // Commented out for now to respect explicit user choice, but this is where the routing rule would live.
    // For now, we trust the user or the default.
  }

  return requestedProvider;
};

// --- ENHANCED SYSTEM PROMPTS (Bolt.new / v0.app Level) ---
export const BUILDER_PROMPT = `
You are NOIR BUILDER, an elite Frontend Engineer/UX Architect inspired by bolt.new and v0.app. Your mission is to generate production-ready, modern web applications that are beautiful, functional, and follow best practices.

🎯 CORE PRINCIPLES:
1. **Production Quality**: Code must be production-ready, not prototypes
2. **Modern Design**: Follow design systems from Vercel, Linear, Stripe, V0, Bolt
3. **Component-Based**: Break down into reusable, well-structured components
4. **Responsive First**: Mobile-first approach, perfect on all screen sizes
5. **Performance**: Optimize for speed, use proper React patterns
6. **Accessibility**: Follow WCAG guidelines, semantic HTML, proper ARIA

📐 ARCHITECTURE REQUIREMENTS:
- **Component Structure**: Break UI into logical, reusable components
- **State Management**: Use React hooks (useState, useEffect, useMemo, useCallback) appropriately
- **Props Interface**: Define clear prop types and default values
- **Separation of Concerns**: Separate presentation, logic, and data
- **Error Boundaries**: Include error handling where appropriate

🎨 DESIGN SYSTEM (Bolt.new / V0.app Style):
- **Color Palette**: 
  - Background: Dark (#0a0a0a, #050505) with subtle gradients
  - Primary: Pure Black (#0a0a0a)
  - Accent: Electric Blue (#2f80ff)
  - Text: High contrast (#ffffff, #e5e5e5, #a3a3a3)
  - Accents: Subtle glows, borders with opacity (border-white/10)
- **Typography**: 
  - Headings: Bold, large, with gradient text effects
  - Body: Inter/System font, readable line-height (1.6-1.8)
  - Code: Monospace, proper syntax highlighting
- **Spacing**: Generous padding (p-6, p-8), consistent gaps (gap-4, gap-6)
- **Effects**:
  - Glassmorphism: backdrop-blur-xl, bg-white/5
  - Gradients: from-zinc-900 to-black
  - Accent Gradients: from-blue-600 to-blue-400
  - Shadows: shadow-2xl, shadow-purple-500/20
  - Animations: Smooth transitions, hover effects, micro-interactions

🔧 TECH STACK (Single-File HTML):
- React 18 (via CDN)
- TailwindCSS (via CDN)
- Framer Motion v11 (via CDN) - use sparingly, prefer CSS for simple animations
- Lucide Icons (via CDN) - access via window.lucide
- Babel Standalone for JSX transformation

⚠️ IMPORTANT CDN NOTES:
- Framer Motion: Use window.framerMotion or window.Motion (check both)
- Lucide: Use window.lucide object to access icons
- Always use SafeIcon component, never access lucide icons directly
- Test that all CDN scripts load before using their APIs

📋 CODE STRUCTURE TEMPLATE:
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Generated App</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <!-- Framer Motion - use only if complex animations needed, prefer CSS transitions -->
  <script>
    // Load Framer Motion with error handling
    (function() {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/framer-motion@11/dist/framer-motion.umd.js';
      script.onerror = function() {
        console.warn('Framer Motion failed to load, using CSS animations instead');
        window.framerMotion = null;
      };
      document.head.appendChild(script);
    })();
  </script>
  <script src="https://unpkg.com/lucide-react@latest/dist/umd/lucide-react.js"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <script>
    window.onerror = function(msg, url, line, col, error) {
      const div = document.createElement('div');
      div.style = "position:fixed;top:0;left:0;right:0;background:red;color:white;padding:12px;z-index:9999;font-family:monospace;font-size:12px;";
      div.textContent = "ERROR: " + msg + " (Line " + line + ")";
      document.body.appendChild(div);
      return false;
    };
  </script>
  <style>
    * { box-sizing: border-box; }
    body { 
      margin: 0; 
      padding: 0;
      background-color: #050505; 
      color: #fff; 
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    #root { min-height: 100vh; }
    ::-webkit-scrollbar { width: 8px; height: 8px; }
    ::-webkit-scrollbar-track { background: #0a0a0a; }
    ::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: #444; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    const { useState, useEffect, useRef, useMemo, useCallback } = React;
    
    // Framer Motion - handle different CDN formats with proper fallback
    let motion, AnimatePresence;
    try {
      // Try to access Framer Motion from CDN
      const fm = window.framerMotion || window.Motion || window.motion;
      if (fm && fm.motion) {
        motion = fm.motion;
        AnimatePresence = fm.AnimatePresence || (({ children }) => children);
      } else if (fm && typeof fm === 'object') {
        motion = fm;
        AnimatePresence = ({ children }) => children;
      } else {
        // Fallback: create simple motion wrapper
        motion = {
          div: ({ children, ...props }) => React.createElement('div', props, children),
          span: ({ children, ...props }) => React.createElement('span', props, children),
          button: ({ children, ...props }) => React.createElement('button', props, children),
        };
        AnimatePresence = ({ children }) => children;
      }
    } catch (e) {
      // If Framer Motion fails, use fallback
      motion = {
        div: ({ children, ...props }) => React.createElement('div', props, children),
        span: ({ children, ...props }) => React.createElement('span', props, children),
        button: ({ children, ...props }) => React.createElement('button', props, children),
      };
      AnimatePresence = ({ children }) => children;
    }
    
    // Safe Icon Component - MUST use string literal name prop
    // Usage: <SafeIcon name="Zap" /> NOT <SafeIcon name={variable} />
    const SafeIcon = ({ name, className = "", size = 24, ...props }) => {
      try {
        // Validate name is a string
        if (!name || typeof name !== 'string') {
          console.warn('SafeIcon: name must be a string, got:', typeof name, name);
          return React.createElement('span', { className: className + ' text-gray-500', ...props }, '?');
        }
        
        // Get lucide library
        const lucideLib = window.lucide || {};
        
        // Try to get icon by name
        const IconComponent = lucideLib[name];
        
        // If icon not found, use fallback
        if (!IconComponent || typeof IconComponent !== 'function') {
          const FallbackIcon = lucideLib.HelpCircle || lucideLib.AlertCircle || (() => React.createElement('span', null));
          return React.createElement(FallbackIcon, { className, size, ...props });
        }
        
        // Render icon
        return React.createElement(IconComponent, { className, size, ...props });
      } catch (error) {
        console.warn('SafeIcon error for name "' + name + '":', error);
        return React.createElement('span', { className: className + ' text-gray-500', ...props }, '?');
      }
    };
    
    // Component definitions here...
    // - Break into logical components
    // - Use proper React patterns
    // - Include proper prop types
    // - Add error handling
    
    // EXAMPLE: Feature component with icons (CORRECT usage)
    // const FeatureCard = ({ title, description, iconName }) => {
    //   // Use conditional to map iconName to string literal
    //   const iconMap = {
    //     'zap': 'Zap',
    //     'heart': 'Heart',
    //     'star': 'Star'
    //   };
    //   const iconString = iconMap[iconName] || 'HelpCircle';
    //   return (
    //     <div className="p-6 bg-white/5 rounded-lg">
    //       <SafeIcon name={iconString} className="text-purple-400" size={32} />
    //       <h3>{title}</h3>
    //       <p>{description}</p>
    //     </div>
    //   );
    // };
    // 
    // OR BETTER: Use direct string literals
    // const features = [
    //   { title: "Fast", icon: "Zap" },
    //   { title: "Secure", icon: "Shield" }
    // ];
    // {features.map(f => <SafeIcon name={f.icon} />)} // This works if f.icon is string literal
    //
    // CRITICAL: Always ensure icon name is a STRING, never a variable reference
    
    const App = () => {
      return (
        <div className="min-h-screen bg-gradient-to-br from-[#050505] via-[#0a0a0a] to-[#050505]">
          {/* Your components here */}
        </div>
      );
    };
    
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(<App />);
  </script>
</body>
</html>

✅ QUALITY CHECKLIST (MUST FOLLOW):
1. ✅ All components are properly structured and reusable
2. ✅ Responsive design works on mobile, tablet, desktop
3. ✅ Proper semantic HTML (header, nav, main, section, footer)
4. ✅ Accessible (keyboard navigation, screen readers)
5. ✅ Smooth animations and transitions
6. ✅ No console errors or warnings
7. ✅ Clean, readable, well-commented code
8. ✅ Proper error handling
9. ✅ Loading states where appropriate
10. ✅ Modern UI patterns (hover effects, focus states, etc.)

🎯 COMMON PATTERNS TO INCLUDE:
- **Hero Section**: Large headline, CTA buttons, animated background
- **Feature Grid**: Icons, titles, descriptions in responsive grid
- **Stats/Metrics**: Numbers with animations, progress indicators
- **Testimonials**: Cards with avatars, quotes, names
- **Pricing**: Tiered pricing cards with comparisons
- **Footer**: Links, social media, copyright
- **Navigation**: Sticky header, smooth scroll, mobile menu

🚫 COMMON MISTAKES TO AVOID:
- ❌ Don't use inline styles (use Tailwind classes)
- ❌ Don't create overly complex nested components
- ❌ Don't forget mobile responsiveness
- ❌ Don't use deprecated React patterns
- ❌ Don't forget error boundaries
- ❌ Don't hardcode values that should be dynamic
- ❌ Don't skip accessibility features
- ❌ **CRITICAL**: Always use SafeIcon with string name prop: <SafeIcon name="Zap" /> NOT <SafeIcon name={feature.icon} />
- ❌ **CRITICAL**: Don't use Framer Motion if not needed - prefer CSS transitions for simple animations
- ❌ **CRITICAL**: Always close JSX tags properly - check for missing closing brackets

📝 OUTPUT FORMAT:

**Option 1: Multi-File Project (Preferred for complex projects)**
If the user requests a project with multiple components/files, return JSON:
\`\`\`json
{
  "type": "multi-file",
  "files": [
    { "path": "src/components/Hero.tsx", "content": "...", "type": "component" },
    { "path": "src/App.tsx", "content": "...", "type": "page" },
    { "path": "src/styles.css", "content": "...", "type": "style" }
  ],
  "entry": "src/App.tsx",
  "framework": "react"
}
\`\`\`

**Option 2: Single-File HTML (For simple projects)**
For simple single-page applications, return ONLY the complete HTML string:
- NO markdown code fences (\`\`\`html or \`\`\`)
- NO explanations or comments outside the code
- The HTML must be complete and runnable immediately
- Include all necessary CDN links
- Ensure all components are properly defined

**Decision Rule:**
- **ALWAYS use multi-file format for React/Next.js/Vite projects** - these frameworks require proper file structure
- Use multi-file format if: user requests React/Next.js/Vite, project has 3+ components, needs separate styles, or user explicitly requests multi-file
- Use single-file format ONLY for: simple HTML landing pages without framework requirements (when framework is "html")

🔧 CRITICAL ICON USAGE RULES (MUST FOLLOW - NO EXCEPTIONS):
- **ALWAYS** use SafeIcon with STRING literal name: <SafeIcon name="Zap" />
- **NEVER** use dynamic/variable: <SafeIcon name={iconName} /> or <SafeIcon name={feature.icon} />
- **NEVER** use incomplete syntax: <SafeIcon name={feature.icon (MISSING CLOSING BRACKET)
- **ALWAYS** use string directly: <SafeIcon name="Heart" />, <SafeIcon name="Star" />, etc.

✅ CORRECT Patterns:
  // Direct string literal
  <SafeIcon name="Zap" className="text-yellow-400" size={24} />
  
  // Array with string literals (CORRECT)
  const features = [
    { title: "Fast", icon: "Zap" },      // icon is STRING "Zap"
    { title: "Secure", icon: "Shield" }  // icon is STRING "Shield"
  ];
  {features.map(f => <SafeIcon name={f.icon} />)} // OK because f.icon is string literal
  
  // Conditional with string literals
  {type === 'heart' ? <SafeIcon name="Heart" /> : <SafeIcon name="Star" />}

❌ WRONG Patterns (DO NOT USE):
  <SafeIcon name={iconName} />           // ❌ Variable reference
  <SafeIcon name={feature.icon} />       // ❌ Variable reference (if icon is not string literal)
  <SafeIcon name={getIcon()} />          // ❌ Function call
  <SafeIcon name={icon}                  // ❌ Incomplete syntax

Valid icon names (use exact strings): Zap, Heart, Star, ArrowRight, CheckCircle, X, Menu, Sparkles, Code, Play, Shield, Lock, Globe, etc.

🔧 FRAMER MOTION USAGE:
- Only use Framer Motion for complex animations (fade in, slide, etc.)
- For simple animations, ALWAYS use CSS transitions instead (hover, focus, etc.)
- Prefer CSS classes: transition-all, hover:scale-105, animate-pulse, etc.
- If using motion, wrap with: {motion && motion.div ? <motion.div>...</motion.div> : <div>...</div>}
- Common CSS animations to use instead:
  * transition-all duration-300
  * hover:scale-105 hover:shadow-lg
  * animate-pulse, animate-bounce
  * transform transition-transform

💡 REMEMBER:
- Think like a senior frontend engineer
- Quality over speed
- User experience is paramount
- Code should be maintainable
- Follow React best practices
- Make it beautiful AND functional
`;

export const TUTOR_PROMPT = `
You are NOIR TUTOR, a world-class AI Educator and Mentor. You can reason over text AND images (when provided).

📅 CURRENT DATE CONTEXT:
- Today's date: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
- Year: ${new Date().getFullYear()}

🌍 CURRENT WORLD KNOWLEDGE (December 2024):
- President of Indonesia: Prabowo Subianto (inaugurated October 20, 2024)
- Vice President of Indonesia: Gibran Rakabuming Raka
- Previous President: Joko Widodo (Jokowi) served 2014-2024

MISSION:
- Help users learn any subject: explain, solve, and guide step-by-step.
- ALWAYS use the current date context above when answering about current events or leaders.

CORE IDENTITY:
- Tone: patient, encouraging, clear, conversational.
- Method: Socratic questions, analogies, step-by-step reasoning.
- Goal: deep understanding, not rote answers.

CAPABILITIES:
1) Explain ELI5 or deep dive when asked.
2) Math/Science: show full working; verify final answer.
3) Code Tutor: explain line-by-line; propose fixes ONLY when the user asks about code.
4) Images: if images are provided, describe key elements, extract text if possible, and use them to answer the question.
5) Current Events: use the date context above to answer questions about current leaders, events, etc.

⚠️ CRITICAL OUTPUT RULES:
1. **DO NOT generate HTML, React, or any full application code** - you are NOT in builder mode.
2. **Use code blocks ONLY for**:
   - Programming questions (e.g., "how to loop in Python")
   - Small code snippets to illustrate concepts
   - Terminal commands
3. **For general knowledge questions** (history, science, news, definitions, explanations):
   - Use plain text with markdown formatting
   - Use bullet points, bold text, and headers for clarity
   - NO code blocks unless showing actual code
4. **Response should be conversational and human-like**, not technical/robotic.


FORMATTING:
- **Bold** for key concepts
- Bullet points for lists
- Numbered steps for procedures
- > Blockquotes for important takeaways
- \`inline code\` only for technical terms, commands, or short code
- Code blocks ONLY for actual programming code snippets

📐 **MATHEMATICAL FORMULAS - CRITICAL:**
When writing mathematical formulas, ALWAYS use LaTeX notation with dollar signs:
- Inline: $E = mc^2$, $v = \\frac{d}{t}$, $\\sqrt{x^2 + y^2}$
- Display: $$v_{AB} = \\frac{v_{AO} + v_{OB}}{1 + \\frac{v_{AO} \\cdot v_{OB}}{c^2}}$$
- Syntax: Use \\frac{}{}, ^{}, _{}, \\sqrt{}, \\cdot, Greek letters (\\alpha, \\beta, etc.)
- Example: WRONG "v_AB = (v_A + v_B) / (1 + v_A*v_B/c²)" | RIGHT "$v_{AB} = \\frac{v_A + v_B}{1 + \\frac{v_A \\cdot v_B}{c^2}}$"

- Only use code blocks when the question is specifically about programming/code.
- ALWAYS use LaTeX for math formulas.

🧠 HIERARCHICAL THINKING:
- You should output your thinking process before your final answer.
- Wrap your thinking in <thought> tags.
- This allows the user to see how you arrived at the answer if they want to.
- Example:
<thought>
The user is asking about quantum entanglement. I should explain the basic concept first, then provide an analogy...
</thought>
Quantum entanglement is...
`;


// --- NEXT.JS BUILDER PROMPT (v0.app Level - Compact Version) ---
const NEXTJS_BUILDER_PROMPT = `
You are NOIR BUILDER, an elite Next.js Engineer. Generate production-ready Next.js 14+ apps with App Router.

REQUIREMENTS:
- Next.js 14+ App Router (NOT Pages Router)
- File structure: app/ for routes, components/ for components, lib/ for utilities
- Server Components by default, add "use client" only when needed
- TypeScript (.tsx) with proper types
- Tailwind CSS for styling
- Use next/image, next/font, Metadata API

OUTPUT FORMAT:
Return multi-file JSON:
\`\`\`json
{
  "type": "multi-file",
  "framework": "next",
  "files": [
    {"path": "package.json", "content": "{...}", "type": "config"},
    {"path": "tsconfig.json", "content": "{...}", "type": "config"},
    {"path": "next.config.js", "content": "...", "type": "config"},
    {"path": "tailwind.config.js", "content": "...", "type": "config"},
    {"path": "app/layout.tsx", "content": "...", "type": "page"},
    {"path": "app/globals.css", "content": "@tailwind...", "type": "style"},
    {"path": "app/page.tsx", "content": "...", "type": "page"}
  ],
  "entry": "app/page.tsx"
}
\`\`\`

ESSENTIAL FILES:
- package.json: Next.js 14+, React 18+, TypeScript, Tailwind
- tsconfig.json: Next.js config with @/* paths
- next.config.js: reactStrictMode: true
- tailwind.config.js: content paths for app/, components/
- app/layout.tsx: RootLayout with Metadata
- app/globals.css: @tailwind directives
- app/page.tsx: Main page component

RULES:
- Server Components by default
- "use client" only for interactivity/hooks
- TypeScript types required
- App Router structure only
`;

// React/Vite Builder Prompt
const REACT_VITE_BUILDER_PROMPT = `
You are NOIR BUILDER, an elite React/Vite Engineer. Generate production-ready React apps with Vite.

REQUIREMENTS:
- React 18+ with TypeScript (.tsx)
- Vite for build tooling
- File structure: src/components/, src/App.tsx, src/main.tsx, src/index.css
- Tailwind CSS for styling
- Proper component structure with TypeScript types

OUTPUT FORMAT - MUST return multi-file JSON:
\`\`\`json
{
  "type": "multi-file",
  "framework": "vite",
  "files": [
    {"path": "package.json", "content": "{...}", "type": "config"},
    {"path": "vite.config.ts", "content": "...", "type": "config"},
    {"path": "tsconfig.json", "content": "{...}", "type": "config"},
    {"path": "tailwind.config.js", "content": "...", "type": "config"},
    {"path": "index.html", "content": "...", "type": "config"},
    {"path": "src/main.tsx", "content": "...", "type": "config"},
    {"path": "src/App.tsx", "content": "...", "type": "page"},
    {"path": "src/index.css", "content": "@tailwind...", "type": "style"},
    {"path": "src/components/Hero.tsx", "content": "...", "type": "component"}
  ],
  "entry": "src/App.tsx"
}
\`\`\`

ESSENTIAL FILES:
- package.json: React 18+, Vite, TypeScript, Tailwind CSS dependencies
- vite.config.ts: Vite configuration with React plugin
- tsconfig.json: TypeScript config for React/Vite
- tailwind.config.js: Tailwind with content paths for src/
- index.html: Vite entry HTML
- src/main.tsx: React entry point with ReactDOM.createRoot
- src/App.tsx: Main App component
- src/index.css: Tailwind directives and global styles

RULES:
- Use functional components with hooks
- TypeScript types required
- Proper imports and exports
- Component-based architecture
- Export components properly
`;

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

const formatErrorHtml = (provider: AIProvider, message: string) => {
  const isCreditError = message.toLowerCase().includes('credit') || message.toLowerCase().includes('afford') || message.toLowerCase().includes('insufficient');
  const isTokenLimitError = message.toLowerCase().includes('prompt tokens') || message.toLowerCase().includes('token limit exceeded');

  // All OpenRouter providers (anthropic, gemini, openai) can have credit errors
  const isOpenRouterProvider = provider === 'openai' || provider === 'anthropic' || provider === 'gemini';

  if (isOpenRouterProvider && (isCreditError || isTokenLimitError)) {
    const providerName = provider === 'openai' ? 'GPT-5-Nano' : provider === 'anthropic' ? 'GPT OSS 20B' : provider === 'gemini' ? 'Gemini 2.0' : 'External Provider';
    return `<!-- Error Generating Code --> 
      <div class="text-red-500 bg-red-900/20 p-4 rounded-lg border border-red-500/50">
        <strong>⚠️ OpenRouter ${isTokenLimitError ? 'Prompt Token Limit' : 'Credits'} Exceeded</strong>
        <br/><br/>
        <p class="text-sm mb-2">${message}</p>
        <p class="text-sm mb-3"><strong>Quick Solutions:</strong></p>
        <ul class="text-sm list-disc list-inside space-y-1 mb-3">
          <li><strong>Switch to Groq/SumoPod</strong> - Free alternative that doesn't require OpenRouter credits</li>
          <li>Use a shorter, more concise prompt to reduce token usage</li>
          <li>Add credits at <a href="https://openrouter.ai/settings/credits" target="_blank" class="text-blue-400 underline">openrouter.ai/settings/credits</a></li>
          ${provider === 'openai' ? '<li>Puter.js uses User-Pays model - no API key needed</li>' : '<li>Note: ' + providerName + ' is free and does not require credits</li>'}
        </ul>
        <div class="text-xs opacity-70 bg-blue-900/20 p-2 rounded mt-2">
          💡 <strong>Tip:</strong> Most models use OpenRouter. Mistral Devstral, GPT OSS 20B, and GPT-5-Nano (via Puter.js) are available. Try <strong>Mistral Devstral</strong>, <strong>GPT OSS 20B</strong>, or <strong>GPT-5-Nano</strong> for alternatives.
        </div>
      </div>`;
  }

  // Special handling for GPT OSS 20B (anthropic) errors
  if (provider === 'anthropic' || provider === 'gemini') {
    const isHtmlError = message.toLowerCase().includes('html') || message.toLowerCase().includes('doctype') ||
      message.toLowerCase().includes('server returned html instead of json');
    const isModelError = message.toLowerCase().includes('model') && message.toLowerCase().includes('not found');
    const isKeyError = message.toLowerCase().includes('invalid') && message.toLowerCase().includes('key') ||
      message.toLowerCase().includes('authentication failed');
    const is500Error = message.toLowerCase().includes('api error (500)') || message.toLowerCase().includes('500');

    if (isHtmlError || isModelError || isKeyError || is500Error) {
      return `<!-- Error Generating Code --> 
        <div class="text-red-500 bg-red-900/20 p-4 rounded-lg border border-red-500/50">
          <strong>🚫 GPT OSS 20B Error</strong>
          <br/><br/>
          <p class="text-sm mb-2">${message}</p>
          <p class="text-sm mb-3"><strong>Possible Causes & Solutions:</strong></p>
          <ul class="text-sm list-disc list-inside space-y-1 mb-3">
            ${isModelError ? '<li><strong>Model not available:</strong> The GPT OSS 20B model may not be accessible with your OpenRouter API key. Try using Mistral Devstral instead.</li>' : ''}
            ${isKeyError ? '<li><strong>Invalid API Key:</strong> Check your OPENROUTER_API_KEY in backend environment variables.</li>' : ''}
            ${isHtmlError || is500Error ? '<li><strong>API Endpoint Error:</strong> The API returned HTML instead of JSON. This usually means the endpoint is incorrect, API key is invalid, or the service is unavailable.</li>' : ''}
            <li>Verify your <code class="bg-black/30 px-1 rounded">OPENROUTER_API_KEY</code> is set correctly in backend</li>
            <li>Check if the model <code class="bg-black/30 px-1 rounded">openai/gpt-oss-20b:free</code> is available in your OpenRouter account</li>
            <li>Try switching to <strong>Mistral Devstral</strong> provider as an alternative</li>
            <li>Check backend logs for detailed error information</li>
          </ul>
          <span class="text-xs opacity-70">Note: GPT OSS 20B uses OpenRouter API. Make sure your API key has access to the model.</span>
        </div>`;
    }
  }

  // Special handling for API key not configured errors
  if (message.toLowerCase().includes('api key not configured') || message.toLowerCase().includes('not configured')) {
    const isOpenRouterProvider = provider === 'openai' || provider === 'anthropic' || provider === 'gemini';
    if (isOpenRouterProvider) {
      const providerName = provider === 'openai' ? 'GPT-5-Nano' : provider === 'anthropic' ? 'GPT OSS 20B' : provider === 'gemini' ? 'Gemini 3 Pro' : 'Unknown Provider';
      return `<!-- Error Generating Code --> 
        <div class="text-red-500 bg-red-900/20 p-4 rounded-lg border border-red-500/50">
          <strong>⚠️ OpenRouter API Key Not Configured</strong>
          <br/><br/>
          <p class="text-sm mb-2">${providerName} uses OpenRouter API and requires OPENROUTER_API_KEY to be set in your backend environment variables.</p>
          <p class="text-sm mb-3"><strong>Solutions:</strong></p>
          <ul class="text-sm list-disc list-inside space-y-1 mb-3">
            <li>Add <code class="bg-black/30 px-1 rounded">OPENROUTER_API_KEY</code> to your backend <code class="bg-black/30 px-1 rounded">.env</code> file</li>
            <li>Get your API key from <a href="https://openrouter.ai/keys" target="_blank" class="text-blue-400 underline">openrouter.ai/keys</a></li>
            <li>Restart your backend server after adding the key</li>
          </ul>
          <span class="text-xs opacity-70">Note: ${providerName} requires OpenRouter API key. Make sure it's set in backend environment variables.</span>
        </div>`;
    }
  }

  return `<!-- Error Generating Code --> 
    <div class="text-red-500 bg-red-900/20 p-4 rounded-lg border border-red-500/50">
      <strong>${provider.toUpperCase()} Error:</strong> ${message}
      <br/>
      <span class="text-sm opacity-70">Check console for details or verify API keys.</span>
    </div>`;
};

export interface MultiFileResponse {
  type: 'multi-file';
  files: Array<{
    path: string;
    content: string;
    type: 'component' | 'page' | 'style' | 'config' | 'other';
  }>;
  entry: string;
  framework?: 'react' | 'next' | 'vue' | 'svelte' | 'html';
}

export interface SingleFileResponse {
  type: 'single-file';
  content: string;
}

export type CodeResponse = MultiFileResponse | SingleFileResponse;

export const generateCode = async (
  prompt: string,
  history: any[],
  mode: 'builder' | 'tutor' = 'builder',
  provider: AIProvider = 'groq', // Default to groq (SumoPod/Gemini)
  images: string[] = [],
  framework: Framework = 'html',
  useWorkflow: boolean | { onStatusUpdate?: (status: string, message?: string) => void } = false, // Feature flag or config object
  onChunk?: (chunk: string) => void, // NEW: Streaming callback
  sessionId?: string,
  userId?: string,
  userName?: string, // User's display name from Clerk
  userEmail?: string, // User's email from Clerk
  userTier: 'free' | 'normal' | 'pro' = 'free', // User subscription tier for token limits
  deepDive: boolean = false, // Deep Dive mode - uses GPT-5, limited 2/day
  model?: string, // Generic model ID (e.g. 'gemini-flash', 'claude-sonnet')
  abortSignal?: AbortSignal // Optional signal to cancel request
): Promise<CodeResponse> => {
  // Smart Model Routing
  const effectiveProvider = smartRouteModel(prompt, provider, userTier);
  console.log(`🧠 Smart Routing: ${provider} -> ${effectiveProvider} (Tier: ${userTier}, Length: ${prompt.length})`);

  // Use workflow if enabled
  const workflowEnabled = typeof useWorkflow === 'object' ? true : useWorkflow;
  const statusCallback = typeof useWorkflow === 'object' ? useWorkflow.onStatusUpdate : undefined;

  if (workflowEnabled) {
    try {
      const { executeWorkflow } = await import('./workflow/orchestrator');
      const { WORKFLOW_CONFIG } = await import('./workflow/config');

      // Check if workflow is enabled in config
      if (WORKFLOW_CONFIG.enableWorkflow) {
        const context = {
          prompt,
          history: history.map((msg: any) => ({
            role: msg.role || (msg.parts?.[0]?.text ? 'user' : 'ai'),
            content: msg.parts?.[0]?.text || msg.content || '',
            code: msg.code,
            images: msg.images,
          })),
          mode,
          provider: effectiveProvider,
          images,
          framework,
          sessionId,
          userId,
          userName, // Pass user's name for personalization
          userEmail, // Pass user's email
          onStatusUpdate: statusCallback,
        };

        const result = await executeWorkflow(context);

        // Convert workflow result to CodeResponse
        if (result.files && result.files.length > 0) {
          return {
            type: 'multi-file',
            files: result.files as any,
            entry: result.files[0]?.path || 'src/App.tsx',
            framework: framework === 'nextjs' ? 'next' : framework === 'vite' ? 'react' : framework,
          };
        } else if (result.code) {
          return {
            type: 'single-file',
            content: result.code,
          };
        } else if (result.response) {
          return {
            type: 'single-file',
            content: result.response,
          };
        }
      }
    } catch (error) {
      console.error('Workflow execution failed, falling back to direct generation:', error);
      // Fall through to direct generation
    }
  }

  // Direct generation (existing code)

  // Enhance system prompt based on framework
  let systemPrompt = mode === 'builder' ? BUILDER_PROMPT : TUTOR_PROMPT;

  if (mode === 'builder') {
    switch (framework) {
      case 'nextjs':
        systemPrompt = NEXTJS_BUILDER_PROMPT;
        break;
      case 'react':
      case 'vite':
        systemPrompt = REACT_VITE_BUILDER_PROMPT;
        break;
      case 'html':
      default:
        systemPrompt = BUILDER_PROMPT;
        break;
    }

    // Force multi-file for framework-based projects
    if (framework !== 'html') {
      const frameworkInstruction = `
      
⚠️ CRITICAL FRAMEWORK REQUIREMENT:
You MUST generate code in **multi-file JSON format** for ${framework === 'nextjs' ? 'Next.js' : framework === 'vite' ? 'Vite/React' : 'React'} framework.
- DO NOT return single-file HTML
- Return ONLY the JSON object with type "multi-file" and framework "${framework}"
- Include all necessary config files (package.json, tsconfig.json, vite.config.ts or next.config.js, etc.)
- Follow the framework structure exactly as specified in the requirements above`;
      systemPrompt = systemPrompt + frameworkInstruction;
    }
  }

  // Add personalized greeting for new chats
  console.log(`🎯 Greeting check: history.length=${history.length}, userName="${userName}"`);
  if (history.length === 0) {
    const displayName = (userName && userName !== 'User') ? userName : 'there';
    const greetingInstruction = `

🎯 GREETING INSTRUCTION (FIRST MESSAGE ONLY):
This is the user's first message in this conversation.
You MUST start your response with a warm, friendly greeting: "Halo ${displayName}! 👋" or "Hai ${displayName}!" followed by your answer.
Keep the greeting short and natural, then immediately address their question.
`;
    systemPrompt = systemPrompt + greetingInstruction;
    console.log(`✅ Greeting instruction added for: ${displayName}`);
  }

  if (images && images.length > 0) {
    const visionInstructions = `
    
🖼️ VISION ANALYSIS MODE:
You are now analyzing images provided by the user. When images are present, you MUST follow this strict response hierarchy:

1. **IMAGE ANALYSIS** first:
   - Start your response with "**Image Analysis:**"
   - Descibe the image in high detail (colors, layout, text, key elements).
   - Be objective and thorough.

2. **THINKING PROCESS** second:
   - Wrap your reasoning inside <thought> and </thought> tags.
   - Explain how you interpret the image in relation to the user's request.
   - Plan your code or explanation.

3. **FINAL ANSWER** last:
   - Finally, provide your actual answer/code starting with "**Answer:**"
   - This is where you generate the React code or answer the specific question.

REQUIRED FORMAT:
**Image Analysis:**
[Detailed description...]

<thought>
[Your reasoning steps...]
</thought>

**Answer:**
[Final code or answer...]

Always follow this structure when an image is present.`;

    systemPrompt = systemPrompt + visionInstructions;
  }


  // STREAMING LOGIC REPLACEMENT: OpenRouter Direct Fetch
  if (onChunk) {
    console.log(`[AI] 🌊 Starting SumoPod Streaming for NoirSync routing...`);

    // Helper for exponential backoff
    const fetchWithRetry = async (url: string, options: any, retries = 3, backoff = 1000) => {
      try {
        // Check for SumoPod API Key
        const apiKey = import.meta.env.VITE_SUMOPOD_API_KEY || import.meta.env.SUMOPOD_API_KEY;
        if (!apiKey) {
          throw new Error("SumoPod API Key not configured. Please set VITE_SUMOPOD_API_KEY in your .env file.");
        }

        const response = await fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': window.location.origin,
            'X-Title': 'Noir AI',
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          // Don't retry 401 (Auth) or 400 (Bad Request)
          if (response.status === 401 || response.status === 400) {
            throw new Error(`SumoPod API Error (${response.status}): ${errorText}`);
          }
          if (retries > 0) {
            console.warn(`[AI] Request failed (${response.status}), retrying in ${backoff}ms...`);
            await new Promise(r => setTimeout(r, backoff));
            return fetchWithRetry(url, options, retries - 1, backoff * 2);
          }
          throw new Error(`SumoPod API Error (${response.status}): ${errorText}`);
        }
        return response;
      } catch (error: any) {
        if (retries > 0 && !error.message.includes('not configured')) {
          console.warn(`[AI] Connection failed, retrying in ${backoff}ms...`, error);
          await new Promise(r => setTimeout(r, backoff));
          return fetchWithRetry(url, options, retries - 1, backoff * 2);
        }
        throw error;
      }
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      // Link external abort signal if provided
      if (abortSignal) {
        if (abortSignal.aborted) {
          controller.abort();
        } else {
          abortSignal.addEventListener('abort', () => controller.abort());
        }
      }

      // =====================================================
      // NOIRSYNC — Context-Aware Smart Model Routing
      // =====================================================
      const routeNoirSync = (promptText: string, webSearchEnabled: boolean = false): string => {
        const lower = promptText.toLowerCase();

        // 1. PDF / Document generation
        const pdfPatterns = [
          /\b(buatkan|buat|generate|create|bikin)\b.*\b(pdf|dokumen|document)\b/i,
          /\b(pdf|dokumen|document)\b.*\b(buatkan|buat|generate|create|bikin)\b/i,
          /\b(edit|ubah|modify)\b.*\bpdf\b/i,
          /\b(export|download|unduh)\b.*\b(pdf|dokumen)\b/i,
        ];
        if (pdfPatterns.some(p => p.test(promptText))) {
          console.log('📄 [NoirSync] Routed to Claude Opus 4 (PDF/Document)');
          return 'claude-opus-4-6';
        }

        // 2. Visual / Design
        const designKeywords = [
          'design', 'desain', 'ui', 'ux', 'landing page', 'mockup', 'wireframe',
          'visual', 'layout', 'template', 'figma', 'prototype', 'website design',
          'web design', 'buatkan website', 'buat website', 'buat halaman',
          'redesign', 'tata letak',
        ];
        if (designKeywords.some(kw => lower.includes(kw))) {
          console.log('🎨 [NoirSync] Routed to Gemini 3 Pro (Visual/Design)');
          return 'gemini/gemini-3-pro-preview';
        }

        // 3. Coding
        const codingKeywords = [
          'code', 'coding', 'program', 'function', 'class', 'component',
          'debug', 'error', 'syntax', 'algorithm', 'api', 'database',
          'react', 'javascript', 'typescript', 'python', 'java', 'html', 'css',
          'node', 'express', 'next.js', 'vue', 'angular', 'flutter', 'swift',
          'kode', 'buat kode', 'buatkan kode', 'perbaiki kode', 'fix bug',
          'implement', 'refactor', 'deploy', 'server', 'backend', 'frontend',
          'npm', 'git', 'docker', 'sql', 'mongodb', 'firebase', 'supabase',
        ];
        if (codingKeywords.some(kw => lower.includes(kw))) {
          console.log('💻 [NoirSync] Routed to Kimi K2 Thinking (Coding)');
          return 'kimi-k2-thinking';
        }

        // 4. Web Search active
        if (webSearchEnabled) {
          console.log('🔍 [NoirSync] Routed to Gemini 2.5 Flash Lite (Web Search)');
          return 'gemini/gemini-2.5-flash-lite';
        }

        // 5. Default — normal chat
        console.log('💬 [NoirSync] Routed to Seed 2.0 Mini (Default Chat)');
        return 'seed-2-0-lite-free';
      };

      // Determine if web search is active from prompt markers
      const hasWebSearchContext = prompt.includes('[Web Search Results]');
      let targetModel = routeNoirSync(prompt, hasWebSearchContext);

      // Build and normalize messages
      // Prepare user content (Text or Multimodal)
      let userContent: any = prompt;
      if (images && images.length > 0) {
        userContent = [
          { type: 'text', text: prompt },
          ...images.map(img => ({
            type: 'image_url',
            image_url: { url: img }
          }))
        ];
      }

      const rawMessages = [
        ...history.map(msg => ({
          role: msg.role === 'model' ? 'assistant' : msg.role,
          content: msg.parts?.[0]?.text || msg.content || ''
        })).slice(-10),
        { role: 'user', content: userContent }
      ];

      // Coalesce messages to ensure alternating roles (user -> assistant -> user)
      // Note: Coalescing complex content (arrays) is tricky.
      // We will perform coalescing, but if content is array, we might need to merge carefully.
      // However, usually history is text-only from previous turns (unless we persist images in history which is rare in this app's storage).
      // For the FINAL user message (which has images), it will be the last one and unlikely to be merged with previous USER message if we enforce alternating.
      // BUT if we prepend "Context:", that's text.
      // Let's implement robust coalescing that handles string vs array.

      const coalescedMessages: { role: string; content: any }[] = [];
      if (systemPrompt) {
        coalescedMessages.push({ role: 'system', content: systemPrompt });
      }

      for (const msg of rawMessages) {
        // Skip system messages in raw stream (already handled)
        if (msg.role === 'system') continue;

        // Ensure first message after system is user
        if (coalescedMessages.length === (systemPrompt ? 1 : 0) && msg.role === 'assistant') {
          coalescedMessages.push({ role: 'user', content: 'Context:' });
        }

        const currentLast = coalescedMessages[coalescedMessages.length - 1];

        if (currentLast && currentLast.role === msg.role) {
          // Merge content if same role
          const lastContent = currentLast.content;
          const newContent = msg.content;

          if (typeof lastContent === 'string' && typeof newContent === 'string') {
            currentLast.content += '\n\n' + newContent;
          } else {
            // Convert both to arrays and merge
            const lastArray = Array.isArray(lastContent) ? lastContent : [{ type: 'text', text: lastContent }];
            const newArray = Array.isArray(newContent) ? newContent : [{ type: 'text', text: newContent }];
            currentLast.content = [...lastArray, ...newArray];
          }
        } else {
          coalescedMessages.push(msg);
        }
      }

      const requestBody = {
        model: targetModel,
        messages: coalescedMessages,
        stream: true,
        temperature: 0.7,
      };
      const sumopodBaseUrl = import.meta.env.VITE_SUMOPOD_BASE_URL || 'https://ai.sumopod.com';
      console.log(`[AI] SumoPod Request: model=${targetModel}`, JSON.stringify({ ...requestBody, messages: coalescedMessages.map(m => ({ role: m.role, length: typeof m.content === 'string' ? m.content.length : 'multimodal' })) }, null, 2));

      const streamResp = await fetchWithRetry(`${sumopodBaseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!streamResp.body) {
        throw new Error('No response body for stream');
      }

      const reader = streamResp.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine || trimmedLine === 'data: [DONE]') continue;

          if (trimmedLine.startsWith('data: ')) {
            try {
              const data = JSON.parse(trimmedLine.slice(6));
              if (data.choices?.[0]?.delta?.content) {
                const contentChunk = data.choices[0].delta.content;
                fullContent += contentChunk;
                onChunk(contentChunk);
              }
              if (data.error) {
                throw new Error(data.error.message || 'Stream error');
              }
            } catch (e) {
              // Ignore parse errors for partial chunks
            }
          }
        }
      }

      if (!fullContent) {
        throw new Error("Received empty response from SumoPod.");
      }

      return {
        type: 'single-file',
        content: fullContent
      };

    } catch (error: any) {
      console.error('[AI] Stream Error:', error);
      throw error; // Propagate to ChatInterface for handling
    }
  }

  // fallback to legacy non-streaming if no onChunk
  try {
    const resp = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: framework !== 'html' ? `${prompt}\n\nIMPORTANT: Generate as ${framework === 'nextjs' ? 'Next.js' : framework === 'vite' ? 'Vite/React' : 'React'} project with multi-file structure. Return JSON format with type "multi-file".` : prompt,
        history,
        mode,
        provider,
        images,
        systemPrompt,
        userTier, // Send user tier for token limit calculation
        deepDive, // Deep Dive mode flag - uses GPT-5 on backend
        model, // NEW: Specific model selection
      }),
      signal: abortSignal, // Support cancellation
    });

    if (!resp.ok) {
      // Try to parse as JSON first, fallback to text if HTML response
      let errorData: any = {};
      const contentType = resp.headers.get('content-type') || '';

      if (contentType.includes('application/json')) {
        try {
          errorData = await resp.json();
        } catch (e) {
          // If JSON parse fails, try as text
          const text = await resp.text();
          console.error(`[${provider}] Non-JSON error response:`, text.slice(0, 500));
          errorData = { error: `API returned HTML instead of JSON. Status: ${resp.status}` };
        }
      } else {
        // Response is HTML or other non-JSON format
        const text = await resp.text();
        console.error(`[${provider}] HTML error response:`, text.slice(0, 500));
        errorData = {
          error: `API Error (${resp.status}): Server returned HTML instead of JSON. Status: ${resp.status} ${resp.statusText}. Response preview: ${text.slice(0, 100)}`
        };
      }

      const msg = errorData?.error || resp.statusText || 'Unknown error';
      throw new Error(msg);
    }

    // Check content type before parsing
    const contentType = resp.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await resp.text();
      console.error(`[${provider}] Non-JSON response:`, text.slice(0, 500));
      throw new Error(`API returned ${contentType} instead of JSON. Response: ${text.slice(0, 200)}`);
    }

    const data = await resp.json();
    // DEBUG: Log full API response
    console.log(`[${provider}] Raw API Response:`, JSON.stringify(data, null, 2));

    // Support both 'text' (from new /api/generate) and 'content' (legacy) properties
    const content = data.text || data.content || "";

    // Try to parse as multi-file JSON response with better error handling
    try {
      // First, try to extract JSON from markdown code blocks
      const jsonBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonBlockMatch) {
        const jsonContent = jsonBlockMatch[1].trim();
        if (jsonContent.startsWith('{')) {
          try {
            const parsed = JSON.parse(jsonContent);
            if (parsed.type === 'multi-file' && Array.isArray(parsed.files)) {
              // Validate and clean files
              const validFiles = parsed.files
                .filter((f: any) => f && f.path && f.content !== undefined)
                .map((f: any) => ({
                  path: String(f.path || '').trim(),
                  content: String(f.content || '').trim(),
                  type: (f.type || 'other') as 'component' | 'page' | 'style' | 'config' | 'other',
                }));

              if (validFiles.length > 0) {
                return {
                  type: 'multi-file',
                  files: validFiles,
                  entry: parsed.entry || validFiles.find((f: any) => f.path.includes('App.tsx') || f.path.includes('main.tsx') || f.path.includes('index.tsx'))?.path || validFiles[0].path,
                  framework: parsed.framework || 'react',
                } as MultiFileResponse;
              }
            }
          } catch (e) {
            console.warn('Failed to parse JSON from code block:', e);
          }
        }
      }

      // Check if content is direct JSON (starts with {)
      const trimmedContent = content.trim();
      if (trimmedContent.startsWith('{')) {
        try {
          const parsed = JSON.parse(trimmedContent);

          // Check if it's a multi-file response
          if (parsed.type === 'multi-file' && Array.isArray(parsed.files)) {
            // Validate and clean files
            const validFiles = parsed.files
              .filter((f: any) => f && f.path && f.content !== undefined)
              .map((f: any) => ({
                path: String(f.path || '').trim(),
                content: String(f.content || '').trim(),
                type: (f.type || 'other') as 'component' | 'page' | 'style' | 'config' | 'other',
              }));

            if (validFiles.length > 0) {
              return {
                type: 'multi-file',
                files: validFiles,
                entry: parsed.entry || validFiles.find((f: any) => f.path.includes('App.tsx') || f.path.includes('main.tsx') || f.path.includes('index.tsx'))?.path || validFiles[0].path,
                framework: parsed.framework || 'react',
              } as MultiFileResponse;
            }
          }
        } catch (parseError) {
          console.warn('Failed to parse direct JSON:', parseError);
        }
      }
    } catch (parseError) {
      // Not JSON, treat as single-file HTML
      console.log('Response is not multi-file JSON, treating as single-file HTML');
    }

    // Fallback to single-file HTML
    // Ensure content is not empty
    if (!content || content.trim().length === 0) {
      console.warn(`[${provider}] Empty content received, returning error message`);
      return {
        type: 'single-file',
        content: formatErrorHtml(provider, 'Received empty response from API. Please try again or check your API configuration.'),
      } as SingleFileResponse;
    }

    return {
      type: 'single-file',
      content: content,
    } as SingleFileResponse;
  } catch (error) {
    console.error(`${provider} Error:`, error);
    const errorMessage = error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : 'Unknown error occurred';

    // Check if it's a prompt token limit error for OpenRouter providers
    const isPromptTokenError = (provider === 'openai' || provider === 'gemini' || provider === 'anthropic') &&
      (errorMessage.toLowerCase().includes('prompt tokens') ||
        errorMessage.toLowerCase().includes('prompt token limit') ||
        errorMessage.toLowerCase().includes('token limit exceeded'));

    if (isPromptTokenError) {
      // Return error with suggestion to use shorter prompt or switch provider
      const providerName = provider === 'openai' ? 'GPT-5-Nano' : provider === 'anthropic' ? 'GPT OSS 20B' : provider === 'gemini' ? 'Gemini 2.0' : 'External Provider';
      return {
        type: 'single-file',
        content: formatErrorHtml(provider, errorMessage + ` - Try using a shorter prompt or switch to a different provider.`),
      } as SingleFileResponse;
    }

    // Check if it's a timeout/abort error
    const isTimeoutError = errorMessage.toLowerCase().includes('timeout') ||
      errorMessage.toLowerCase().includes('aborted') ||
      errorMessage.toLowerCase().includes('took too long');


    // Always return a valid response, even on error
    const errorContent = formatErrorHtml(provider, errorMessage);

    // Ensure error content is not empty
    if (!errorContent || errorContent.trim().length === 0) {
      return {
        type: 'single-file',
        content: formatErrorHtml(provider, 'Unknown error occurred. Please try again or check your API configuration.'),
      } as SingleFileResponse;
    }

    return {
      type: 'single-file',
      content: errorContent,
    } as SingleFileResponse;
  }
};
