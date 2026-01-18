export type AppMode = 'builder' | 'tutor' | 'canvas' | null;

export const detectMode = (text: string): AppMode => {
    if (!text || text.trim().length === 0) return 'tutor';

    const lowerText = text.toLowerCase().trim();

    // Canvas/Orak-orek patterns (Replacing Builder intent for visual tasks)
    const canvasPatterns = [
        /orak[ -]orek/i,
        /rak[ -]orek/i, // Loose match for typos
        /canvas/i,
        /whiteboard/i,
        /papan tulis/i,
        /gambar/i,
        /sketch/i,
        /coret/i,
        /matematika/i, // Math often needs scratchpad
        /rumus/i,
        /draw/i
    ];

    if (canvasPatterns.some(p => p.test(text))) {
        return 'canvas';
    }

    // Exclusion patterns - these should NOT trigger builder mode even if they contain builder keywords
    // HIGHEST PRIORITY: Clear question patterns that should always be tutor mode
    const clearQuestionPatterns = [
        // Question words at the start (highest priority)
        /^(apa|what|why|how|when|where|who|which|mengapa|kenapa|bagaimana|kapan|dimana|siapa)\s+/i,
        // Specific question patterns
        /^(apa itu|apa ini|apa artinya|apa maksudnya|what is|what are|what does|what do)/i,
        /^(bagaimana cara|bagaimana untuk|how to|how do|how does|how can)/i,
        /^(jelaskan|terangkan|explain|describe|tell me|teach me)/i,
        // Learning intent
        /^(saya ingin belajar|saya perlu belajar|saya ingin tahu|saya perlu tahu|i want to learn|i need to learn)/i,
    ];

    // Check clear question patterns FIRST (highest priority)
    const isClearQuestion = clearQuestionPatterns.some(pattern => pattern.test(text));
    if (isClearQuestion) {
        return 'tutor';
    }

    const tutorOnlyPatterns = [
        // Schedule/Planning related (should be tutor mode)
        /jadwal|schedule|routine|plan|rencana|agenda|kalender|calendar/i,
        // Learning/Education related
        /belajar|learn|study|tutorial|panduan|guide|explain|jelaskan/i,
        // Question patterns
        /^buatkan\s+(jadwal|schedule|routine|plan|rencana|agenda)/i,
        /^buat\s+(jadwal|schedule|routine|plan|rencana|agenda)/i,
        /^tolong\s+(buatkan|buat)\s+(jadwal|schedule|routine|plan)/i,
        // General help requests (but not edit commands)
        /^tolong\s+(bantu|help|jelaskan|explain|ajarkan)/i,
        /^bantu\s+(saya|aku|me|i)/i,
    ];

    // Check if text matches tutor-only patterns (second priority)
    const matchesTutorOnly = tutorOnlyPatterns.some(pattern => pattern.test(text));
    if (matchesTutorOnly) {
        return 'tutor';
    }

    // Builder keywords - English and Indonesian (only for web/app development)
    // Note: Removed generic words like 'buat', 'buatkan', 'create', 'make' to avoid false positives
    // Only include specific tech-related phrases
    const builderKeywords = [
        // English - specific tech phrases only
        'build web', 'build website', 'build app', 'build application', 'build page', 'build site',
        'create web', 'create website', 'create app', 'create application', 'create page', 'create site',
        'make web', 'make website', 'make app', 'make application',
        'generate code', 'generate app', 'generate website',
        'code', 'app', 'website', 'web app', 'webapp',
        'landing page', 'landing', 'dashboard', 'component', 'react', 'html', 'css', 'javascript', 'js',
        'style', 'design', 'ui', 'ux', 'page', 'site', 'application', 'program', 'project',
        'frontend', 'front-end', 'ui component', 'template', 'layout', 'interface',
        // Indonesian - specific tech phrases only
        'buat web', 'buat website', 'buat aplikasi', 'buat app',
        'buat landing page', 'buat dashboard', 'buat halaman web', 'buat situs', 'buat program',
        'generate kode', 'kode', 'coding', 'program aplikasi', 'aplikasi web', 'web', 'website', 'situs',
        'halaman web', 'komponen', 'template web', 'desain web', 'ui', 'frontend',
        // Edit/Modification commands - these should stay in builder mode
        'ubah', 'edit', 'ganti', 'modify', 'change', 'update', 'ubah warna', 'ganti warna', 'buat warna',
        'ubah warna', 'ubah style', 'ubah desain', 'ubah layout', 'ubah background', 'ubah font',
        'change color', 'change style', 'change design', 'change background', 'change font',
        'make it', 'make the', 'buat jadi', 'buat menjadi', 'jadikan', 'jadikan warna',
        'warna kuning', 'warna merah', 'warna biru', 'yellow', 'red', 'blue', 'green', 'warna hijau',
        'add', 'tambah', 'hapus', 'remove', 'delete', 'tambah button', 'add button', 'tambah gambar'
    ];

    // Tutor keywords - Questions and learning intent
    // NOTE: 'tolong' is removed from tutor keywords to prevent false positives in builder mode
    const tutorKeywords = [
        // English question words
        'what', 'why', 'how', 'when', 'where', 'who', 'which', 'explain', 'describe', 'tell me',
        'teach', 'learn', 'understand', 'help', 'help me', 'can you', 'could you', 'please explain',
        'what is', 'what are', 'what does', 'what do', 'how to', 'how do', 'how does', 'how can',
        'why is', 'why are', 'why does', 'why do', 'when is', 'when are', 'when does', 'when do',
        'where is', 'where are', 'where does', 'where do', 'who is', 'who are', 'who does', 'who do',
        'which is', 'which are', 'which does', 'which do',
        // Learning phrases
        'i want to learn', 'i need to learn', 'i want to know', 'i need to know',
        'teach me', 'show me', 'guide me', 'tutorial', 'example', 'examples',
        // Indonesian question words (removed 'tolong' to avoid conflict with edit commands)
        'apa', 'mengapa', 'kenapa', 'bagaimana', 'kapan', 'dimana', 'dimana', 'siapa', 'yang mana',
        'jelaskan', 'terangkan', 'bantu', 'tolong jelaskan', 'tolong bantu', 'tolong ajarkan',
        'apa itu', 'apa ini', 'apa artinya', 'apa maksudnya', 'bagaimana cara', 'bagaimana untuk',
        'kenapa', 'mengapa', 'kapan', 'dimana', 'siapa', 'yang mana',
        // Indonesian learning phrases
        'saya ingin belajar', 'saya perlu belajar', 'saya ingin tahu', 'saya perlu tahu',
        'ajarkan', 'tunjukkan', 'panduan', 'tutorial', 'contoh', 'contohnya',
        // Schedule/Planning related (should be tutor)
        'jadwal', 'schedule', 'routine', 'plan', 'rencana', 'agenda', 'kalender', 'calendar',
        'buatkan jadwal', 'buat jadwal', 'jadwal harian', 'daily schedule', 'morning routine',
        'evening routine', 'rutinitas', 'rutinitas pagi', 'rutinitas sore'
    ];

    // Check for builder intent (only count if NOT in exclusion patterns)
    const builderScore = builderKeywords.reduce((score, keyword) => {
        if (lowerText.includes(keyword)) {
            // Skip if this keyword is part of a tutor-only pattern
            const isExcluded = tutorOnlyPatterns.some(pattern => {
                const match = text.match(pattern);
                return match && match[0].toLowerCase().includes(keyword);
            });
            if (isExcluded) return score;

            // Give higher weight to more specific keywords
            if (['buat web', 'buat website', 'buat aplikasi', 'build web', 'create website', 'make app'].includes(keyword)) {
                return score + 3;
            }
            return score + 1;
        }
        return score;
    }, 0);

    // Check for tutor intent (questions)
    const tutorScore = tutorKeywords.reduce((score, keyword) => {
        if (lowerText.includes(keyword)) {
            // Give higher weight to question words at the start
            if (lowerText.startsWith(keyword) || lowerText.startsWith(keyword + ' ')) {
                return score + 3;
            }
            // Give higher weight to specific question patterns
            if (['what is', 'what are', 'how to', 'bagaimana cara', 'apa itu'].includes(keyword)) {
                return score + 2;
            }
            // Give higher weight to schedule/routine related keywords
            if (['jadwal', 'schedule', 'routine', 'plan', 'rencana', 'agenda', 'morning routine', 'evening routine'].includes(keyword)) {
                return score + 3;
            }
            return score + 1;
        }
        return score;
    }, 0);

    // Check for question mark (strong indicator of tutor mode)
    const hasQuestionMark = text.includes('?');
    if (hasQuestionMark && tutorScore > 0) {
        return 'tutor';
    }

    // Check for imperative builder commands - NOW MAP TO CANVAS if ambiguous, or keep builder for pure code gen? 
    // User wants to REPLACE builder with canvas. So if it's builder intent, we can Default to Canvas for now?
    // User said "hapus mode nevra builder ganti dengan canvas orak orek".
    // So I will return 'canvas' where I would have returned 'builder' for now, OR I will rely on the canvas patterns above.
    // Let's keep builder for strictly code generation requests if they don't match canvas patterns, but maybe prompt user to use canvas?
    // Actually, I'll modify the below to prefer canvas if there is any ambiguity.

    const imperativeBuilderPatterns = [
        /^buat\s+(web|website|aplikasi|app|halaman|situs)/i,
        /^build\s+(web|website|app|application|page|site)/i,
        /^create\s+(web|website|app|application|page|site)/i,
        /^make\s+(web|website|app|application|page|site)/i,
        /^generate\s+(web|website|app|application|page|site)/i
    ];

    const hasImperativeBuilder = imperativeBuilderPatterns.some(pattern => pattern.test(text));
    if (hasImperativeBuilder) {
        return 'canvas'; // Redirect builder commands to Canvas for now per user request
    }

    // Decision logic
    if (builderScore > tutorScore && builderScore > 0) {
        return 'canvas'; // Redirect builder to canvas
    }

    if (tutorScore > builderScore && tutorScore > 0) {
        return 'tutor';
    }

    // If scores are equal or both zero, check for specific patterns
    if (builderScore === tutorScore) {
        // If text contains both, prioritize based on context
        if (hasQuestionMark) {
            return 'tutor';
        }
        // If starts with builder command, it's builder -> canvas
        if (hasImperativeBuilder) {
            return 'canvas';
        }
    }

    // Default to tutor mode for general queries
    return 'tutor';
};
