/**
 * Knowledge Management System Exports
 * 
 * Architecture:
 * CRON / SCHEDULER
 *   ↓
 * SOURCE REGISTRY
 *   ↓
 * FETCHER
 *   ↓
 * PRE-FILTER
 *   ↓
 * TECH WATCHER AGENT
 *   ↓
 * CURATION AGENT
 *   ↓
 * DEDUPLICATION
 *   ↓
 * KNOWLEDGE NORMALIZER
 *   ↓
 * VECTOR STORE
 *   ↓
 * METADATA INDEX
 */

export { SourceRegistry } from './sources/SourceRegistry';
export type { KnowledgeSource } from './sources/SourceRegistry';
export { FetcherFactory } from './fetchers/Fetcher';
export type { IFetcher, FetchedContent } from './fetchers/Fetcher';
export { PreFilter } from './filters/PreFilter';
export { TechWatcherAgent } from './agents/TechWatcherAgent';
export type { TechWatcherResult } from './agents/TechWatcherAgent';
export { CurationAgent } from './agents/CurationAgent';
export type { CuratedContent } from './agents/CurationAgent';
export { Deduplication } from './processors/Deduplication';
export { KnowledgeNormalizer } from './processors/KnowledgeNormalizer';
export type { NormalizedKnowledge } from './processors/KnowledgeNormalizer';
export { VectorStore } from './storage/VectorStore';
export { MetadataIndexService } from './indexing/MetadataIndex';
export type { MetadataIndex } from './indexing/MetadataIndex';
export { KnowledgeScheduler } from './scheduler/KnowledgeScheduler';
