/**
 * Input Normalizer
 * Normalizes and cleans user input before processing
 */
export interface NormalizedInput {
  original: string;
  normalized: string;
  cleaned: string;
  language: 'id' | 'en' | 'mixed';
  hasCodeBlocks: boolean;
  hasUrls: boolean;
  hasImages: boolean;
  wordCount: number;
  charCount: number;
  metadata: {
    mentions: string[];
    commands: string[];
    questions: string[];
  };
}

export class InputNormalizer {
  /**
   * Normalize user input
   */
  static normalize(input: string, images?: string[]): NormalizedInput {
    const original = input;
    
    // Step 1: Basic cleaning
    let cleaned = input
      .trim()
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\r/g, '\n')
      .replace(/\n{3,}/g, '\n\n') // Max 2 consecutive newlines
      .replace(/[ \t]+/g, ' ') // Normalize spaces
      .replace(/[ \t]+$/gm, ''); // Trim trailing spaces

    // Step 2: Detect language
    const language = this.detectLanguage(cleaned);

    // Step 3: Extract metadata
    const codeBlocks = this.extractCodeBlocks(cleaned);
    const urls = this.extractUrls(cleaned);
    const mentions = this.extractMentions(cleaned);
    const commands = this.extractCommands(cleaned);
    const questions = this.extractQuestions(cleaned);

    // Step 4: Create normalized version (for processing)
    const normalized = this.createNormalizedVersion(cleaned, codeBlocks);

    return {
      original,
      normalized,
      cleaned,
      language,
      hasCodeBlocks: codeBlocks.length > 0,
      hasUrls: urls.length > 0,
      hasImages: (images?.length || 0) > 0,
      wordCount: this.countWords(cleaned),
      charCount: cleaned.length,
      metadata: {
        mentions,
        commands,
        questions,
      },
    };
  }

  /**
   * Detect language
   */
  private static detectLanguage(text: string): 'id' | 'en' | 'mixed' {
    const indonesianPatterns = [
      /\b(apa|yang|dengan|untuk|dari|pada|adalah|akan|sudah|belum|tolong|bantu|buat|ubah|ganti)\b/gi,
      /\b(jelaskan|terangkan|bagaimana|mengapa|dimana|kapan|siapa)\b/gi,
    ];

    const englishPatterns = [
      /\b(what|how|why|when|where|who|which|can|could|should|would|please|help|create|make|change|update)\b/gi,
      /\b(explain|describe|tell|show|build|generate|modify)\b/gi,
    ];

    const idMatches = indonesianPatterns.reduce((sum, pattern) => 
      sum + (text.match(pattern)?.length || 0), 0
    );
    const enMatches = englishPatterns.reduce((sum, pattern) => 
      sum + (text.match(pattern)?.length || 0), 0
    );

    if (idMatches > 0 && enMatches > 0) {
      return 'mixed';
    } else if (idMatches > enMatches) {
      return 'id';
    } else if (enMatches > idMatches) {
      return 'en';
    }

    // Default based on common patterns
    return /[a-z]+\s+(yang|dengan|untuk|dari|pada|adalah)/i.test(text) ? 'id' : 'en';
  }

  /**
   * Extract code blocks
   */
  private static extractCodeBlocks(text: string): string[] {
    const codeBlockRegex = /```[\s\S]*?```/g;
    const matches = text.match(codeBlockRegex) || [];
    return matches.map(block => block.replace(/```[a-z]*\n?/g, '').trim());
  }

  /**
   * Extract URLs
   */
  private static extractUrls(text: string): string[] {
    const urlRegex = /https?:\/\/[^\s]+/gi;
    return text.match(urlRegex) || [];
  }

  /**
   * Extract mentions (@mentions)
   */
  private static extractMentions(text: string): string[] {
    const mentionRegex = /@(\w+)/g;
    const matches = text.matchAll(mentionRegex);
    return Array.from(matches, m => m[1]);
  }

  /**
   * Extract commands
   */
  private static extractCommands(text: string): string[] {
    const commandPatterns = [
      /^(buat|create|generate|build|make)\s+/i,
      /^(ubah|edit|change|modify|update)\s+/i,
      /^(hapus|delete|remove)\s+/i,
      /^(tambah|add|insert)\s+/i,
    ];

    const commands: string[] = [];
    commandPatterns.forEach(pattern => {
      const match = text.match(pattern);
      if (match) {
        commands.push(match[0].trim().toLowerCase());
      }
    });

    return commands;
  }

  /**
   * Extract questions
   */
  private static extractQuestions(text: string): string[] {
    const questionRegex = /[^.!?]*\?/g;
    const matches = text.match(questionRegex);
    return matches ? matches.map(q => q.trim()) : [];
  }

  /**
   * Create normalized version for processing
   */
  private static createNormalizedVersion(text: string, codeBlocks: string[]): string {
    let normalized = text;

    // Replace code blocks with placeholders
    codeBlocks.forEach((block, index) => {
      normalized = normalized.replace(/```[\s\S]*?```/g, `[CODE_BLOCK_${index}]`);
    });

    // Normalize whitespace
    normalized = normalized
      .replace(/\s+/g, ' ')
      .trim();

    return normalized;
  }

  /**
   * Count words
   */
  private static countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }
}
