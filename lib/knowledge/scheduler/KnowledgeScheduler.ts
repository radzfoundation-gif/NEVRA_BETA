import { SourceRegistry } from '../sources/SourceRegistry';
import { FetcherFactory } from '../fetchers/Fetcher';
import { PreFilter } from '../filters/PreFilter';
import { Deduplication } from '../processors/Deduplication';
import { KnowledgeNormalizer } from '../processors/KnowledgeNormalizer';
import { VectorStore } from '../storage/VectorStore';
import { MetadataIndex } from '../indexing/MetadataIndex';
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
      console.warn('KnowledgeScheduler: Already running');
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
    console.log(`📅 KnowledgeScheduler: Started (runs every ${intervalMinutes} minutes)`);
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
    console.log('📅 KnowledgeScheduler: Stopped');
  }

  /**
   * Run the complete knowledge pipeline
   */
  static async runPipeline(): Promise<void> {
    if (!WORKFLOW_CONFIG.enableMemory) {
      return;
    }

    console.log('🚀 KnowledgeScheduler: Starting pipeline...');
    const startTime = Date.now();

    try {
      // Step 1: Get sources to fetch
      const sources = SourceRegistry.getEnabledSources();
      console.log(`📚 Found ${sources.length} enabled sources`);

      // Step 2: FETCH content from sources
      const allFetched: any[] = [];
      for (const source of sources) {
        try {
          const fetcher = FetcherFactory.createFetcher(source);
          const fetched = await fetcher.fetch(source);
          allFetched.push(...fetched);
          
          // Update last fetched time
          SourceRegistry.updateLastFetched(source.id);
          
          console.log(`✅ Fetched ${fetched.length} items from ${source.name}`);
        } catch (error) {
          console.error(`❌ Error fetching from ${source.name}:`, error);
        }
      }

      if (allFetched.length === 0) {
        console.log('⚠️ No content fetched, skipping pipeline');
        return;
      }

      // Step 3: PRE-FILTER content
      const filtered = PreFilter.filterBatch(allFetched);
      console.log(`🔍 Pre-filtered: ${filtered.length}/${allFetched.length} passed`);

      if (filtered.length === 0) {
        console.log('⚠️ No content passed pre-filter, skipping pipeline');
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
            console.log(`⏭️ Skipping ${content.title.substring(0, 50)} - not relevant`);
            continue;
          }
        } catch (error) {
          console.error(`❌ TechWatcher error for ${content.title}:`, error);
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
          console.log(`📚 Curated: ${curated.curatedTitle.substring(0, 50)}`);
        } catch (error) {
          console.error(`❌ Curation error for ${content.title}:`, error);
        }
      }

      if (curatedContents.length === 0) {
        console.log('⚠️ No content curated, skipping pipeline');
        return;
      }

      // Step 6: DEDUPLICATION
      const unique = Deduplication.removeDuplicates(curatedContents);
      console.log(`🔗 Deduplication: ${unique.length}/${curatedContents.length} unique`);

      // Step 7: KNOWLEDGE NORMALIZER
      const relevanceMap = new Map<string, number>();
      watcherResults.forEach((result, url) => {
        const curated = unique.find(c => c.originalContent.url === url);
        if (curated) {
          relevanceMap.set(curated.id, result.relevance);
        }
      });

      const normalized = KnowledgeNormalizer.normalizeBatch(unique, relevanceMap);
      console.log(`📝 Normalized: ${normalized.length} knowledge entries`);

      // Step 8: VECTOR STORE
      await VectorStore.storeBatch(normalized);
      console.log(`💾 Stored ${normalized.length} entries in vector store`);

      // Step 9: METADATA INDEX
      await MetadataIndex.indexBatch(normalized);
      console.log(`📇 Indexed ${normalized.length} entries in metadata index`);

      const executionTime = Date.now() - startTime;
      console.log(`✅ KnowledgeScheduler: Pipeline completed in ${executionTime}ms`, {
        fetched: allFetched.length,
        filtered: filtered.length,
        curated: curatedContents.length,
        unique: unique.length,
        stored: normalized.length,
      });
    } catch (error) {
      console.error('❌ KnowledgeScheduler: Pipeline error', error);
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
    console.log(`✅ Processed ${filtered.length} items from ${source.name}`);
  }
}
