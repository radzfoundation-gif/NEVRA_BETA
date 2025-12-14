/**
 * Source Registry
 * Manages knowledge sources for Tech Watcher
 */
export interface KnowledgeSource {
  id: string;
  name: string;
  type: 'github' | 'blog' | 'docs' | 'news' | 'forum' | 'rss' | 'api';
  url: string;
  enabled: boolean;
  priority: 'low' | 'medium' | 'high';
  schedule: string; // Cron expression
  lastFetched?: Date;
  metadata: {
    tags?: string[];
    categories?: string[];
    language?: string;
    framework?: string[];
    [key: string]: any;
  };
}

/**
 * Source Registry Manager
 */
export class SourceRegistry {
  private static sources: Map<string, KnowledgeSource> = new Map();

  /**
   * Register a knowledge source
   */
  static register(source: KnowledgeSource): void {
    this.sources.set(source.id, source);
  }

  /**
   * Get all enabled sources
   */
  static getEnabledSources(): KnowledgeSource[] {
    return Array.from(this.sources.values()).filter(s => s.enabled);
  }

  /**
   * Get sources by type
   */
  static getSourcesByType(type: KnowledgeSource['type']): KnowledgeSource[] {
    return Array.from(this.sources.values()).filter(s => s.type === type && s.enabled);
  }

  /**
   * Get source by ID
   */
  static getSource(id: string): KnowledgeSource | undefined {
    return this.sources.get(id);
  }

  /**
   * Update source last fetched time
   */
  static updateLastFetched(id: string, date: Date = new Date()): void {
    const source = this.sources.get(id);
    if (source) {
      source.lastFetched = date;
      this.sources.set(id, source);
    }
  }

  /**
   * Initialize default sources
   */
  static initializeDefaults(): void {
    // GitHub sources
    this.register({
      id: 'github-react',
      name: 'React GitHub',
      type: 'github',
      url: 'https://github.com/facebook/react',
      enabled: true,
      priority: 'high',
      schedule: '0 */6 * * *', // Every 6 hours
      metadata: {
        tags: ['react', 'frontend', 'ui'],
        categories: ['framework'],
        framework: ['react'],
      },
    });

    this.register({
      id: 'github-nextjs',
      name: 'Next.js GitHub',
      type: 'github',
      url: 'https://github.com/vercel/next.js',
      enabled: true,
      priority: 'high',
      schedule: '0 */6 * * *',
      metadata: {
        tags: ['nextjs', 'react', 'ssr'],
        categories: ['framework'],
        framework: ['nextjs'],
      },
    });

    // Blog sources
    this.register({
      id: 'vercel-blog',
      name: 'Vercel Blog',
      type: 'blog',
      url: 'https://vercel.com/blog',
      enabled: true,
      priority: 'high',
      schedule: '0 */12 * * *', // Every 12 hours
      metadata: {
        tags: ['vercel', 'nextjs', 'deployment'],
        categories: ['blog', 'tutorial'],
      },
    });

    // Docs sources
    this.register({
      id: 'react-docs',
      name: 'React Documentation',
      type: 'docs',
      url: 'https://react.dev',
      enabled: true,
      priority: 'high',
      schedule: '0 0 * * *', // Daily
      metadata: {
        tags: ['react', 'documentation'],
        categories: ['docs'],
        framework: ['react'],
      },
    });

    this.register({
      id: 'nextjs-docs',
      name: 'Next.js Documentation',
      type: 'docs',
      url: 'https://nextjs.org/docs',
      enabled: true,
      priority: 'high',
      schedule: '0 0 * * *', // Daily
      metadata: {
        tags: ['nextjs', 'documentation'],
        categories: ['docs'],
        framework: ['nextjs'],
      },
    });
  }

  /**
   * Get all sources
   */
  static getAllSources(): KnowledgeSource[] {
    return Array.from(this.sources.values());
  }
}
