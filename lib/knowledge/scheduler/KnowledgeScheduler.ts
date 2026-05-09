import { SourceRegistry } from '../sources/SourceRegistry';
import { FetcherFactory } from '../fetchers/Fetcher';
import { PreFilter } from '../filters/PreFilter';
import { Deduplication } from '../processors/Deduplication';
import { KnowledgeNormalizer } from '../processors/KnowledgeNormalizer';
import { VectorStore } from '../storage/VectorStore';
import { MetadataIndexService } from '../indexing/MetadataIndex';
import { WORKFLOW_CONFIG } from '../../workflow/config';

/**
 * Knowledge Scheduler
 * Orchestrates the knowledge collection and processing pipeline
 */
export class KnowledgeScheduler {
  private static isRunning = false;
  private static intervalId: NodeJS.Timeout | null = null;

  /**
   * Start scheduler
   */
  static start(intervalMinutes: number = 60): void {
    if (this.isRunning) {
      
      return;
    }

    // Initialize default sources
    SourceRegistry.initializeDefaults();

    // Run immediately
    this.runPipeline();

    // Schedule periodic runs
    this.intervalId = setInterval(() => {
      this.runPipeline();
    }, intervalMinutes * 60 * 1000);

    this.isRunning = true;
    
  }

  /**
   * Stop scheduler
   */
  static stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    
  }

  /**
   * Run the complete knowledge pipeline
   */
  static async runPipeline(): Promise<void> {
    if (!WORKFLOW_CONFIG.enableMemory) {
      return;
    }

    
    const startTime = Date.now();

    try {
      // Step 1: Get sources to fetch
      const sources = SourceRegistry.getEnabledSources();
      

      // Step 2: FETCH content from sources
      const allFetched: any[] = [];
      for (const source of sources) {
        try {
          const fetcher = FetcherFactory.createFetcher(source);
          const fetched = await fetcher.fetch(source);
          allFetched.push(...fetched);

          // Update last fetched time
          SourceRegistry.updateLastFetched(source.id);

          
        } catch (error) {
          
        }
      }

      if (allFetched.length === 0) {
        
        return;
      }

      // Step 3: PRE-FILTER content
      const filtered = PreFilter.filterBatch(allFetched);
      

      if (filtered.length === 0) {
        
        return;
      }

      // Step 4: TECH WATCHER AGENT analysis
      const { TechWatcherAgent } = await import('../agents/TechWatcherAgent');
      const techWatcher = new TechWatcherAgent('anthropic');
      const watcherResults = new Map<string, any>();

      for (const content of filtered) {
        try {
          const watcherResult = await techWatcher.execute({}, { content });
          watcherResults.set(content.url, watcherResult);

          // Only process if should curate
          if (!watcherResult.shouldCurate) {
            
            continue;
          }
        } catch (error) {
          
          continue;
        }
      }

      // Step 5: CURATION AGENT
      const { CurationAgent } = await import('../agents/CurationAgent');
      const curationAgent = new CurationAgent('anthropic');
      const curatedContents: any[] = [];

      for (const content of filtered) {
        const watcherResult = watcherResults.get(content.url);
        if (!watcherResult || !watcherResult.shouldCurate) {
          continue;
        }

        try {
          const curated = await curationAgent.execute({}, { content, watcherResult });
          curatedContents.push(curated);
          
        } catch (error) {
          
        }
      }

      if (curatedContents.length === 0) {
        
        return;
      }

      // Step 6: DEDUPLICATION
      const unique = Deduplication.removeDuplicates(curatedContents);
      

      // Step 7: KNOWLEDGE NORMALIZER
      const relevanceMap = new Map<string, number>();
      watcherResults.forEach((result, url) => {
        const curated = unique.find(c => c.originalContent.url === url);
        if (curated) {
          relevanceMap.set(curated.id, result.relevance);
        }
      });

      const normalized = KnowledgeNormalizer.normalizeBatch(unique, relevanceMap);
      

      // Step 8: VECTOR STORE
      await VectorStore.storeBatch(normalized);
      

      // Step 9: METADATA INDEX
      await MetadataIndexService.indexBatch(normalized);
      

      const executionTime = Date.now() - startTime;
      // Pipeline completed silently
    } catch (error) {
      
    }
  }

  /**
   * Run pipeline for specific source
   */
  static async runForSource(sourceId: string): Promise<void> {
    const source = SourceRegistry.getSource(sourceId);
    if (!source) {
      throw new Error(`Source not found: ${sourceId}`);
    }

    // Run pipeline steps for single source
    const fetcher = FetcherFactory.createFetcher(source);
    const fetched = await fetcher.fetch(source);
    const filtered = PreFilter.filterBatch(fetched);

    // Continue with watcher, curation, etc. (simplified for single source)
    
  }
}
