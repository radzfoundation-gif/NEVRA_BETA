# Knowledge Management System

Sistem otomatis untuk mengumpulkan, memproses, dan menyimpan knowledge dari berbagai sumber teknologi.

## Arsitektur

```
CRON / SCHEDULER
   ↓
SOURCE REGISTRY
   ↓
FETCHER
   ↓
PRE-FILTER
   ↓
TECH WATCHER AGENT
   ↓
CURATION AGENT
   ↓
DEDUPLICATION
   ↓
KNOWLEDGE NORMALIZER
   ↓
VECTOR STORE
   ↓
METADATA INDEX
```

## Komponen

### 1. Source Registry
Mengelola daftar sumber knowledge (GitHub, blogs, docs, dll).

```typescript
import { SourceRegistry } from './lib/knowledge';

// Initialize default sources
SourceRegistry.initializeDefaults();

// Register custom source
SourceRegistry.register({
  id: 'custom-blog',
  name: 'Custom Blog',
  type: 'blog',
  url: 'https://example.com/blog',
  enabled: true,
  priority: 'high',
  schedule: '0 */12 * * *', // Every 12 hours
  metadata: {
    tags: ['react', 'frontend'],
    categories: ['tutorial'],
  },
});
```

### 2. Fetcher
Mengambil konten dari sumber.

- **GitHubFetcher**: Fetch dari GitHub repositories
- **BlogFetcher**: Fetch dari blog/RSS
- **DocsFetcher**: Fetch dari dokumentasi

### 3. Pre-Filter
Filter awal untuk menghilangkan spam dan konten berkualitas rendah.

### 4. Tech Watcher Agent
Menganalisis konten untuk:
- Relevance score
- Tech trends
- Key insights
- Importance level
- Should curate decision

### 5. Curation Agent
Mengkurasi konten menjadi format standar:
- Curated title
- Summary
- Key points
- Tags & categories
- Related topics

### 6. Deduplication
Menghapus konten duplikat berdasarkan similarity.

### 7. Knowledge Normalizer
Menormalisasi konten menjadi format standar untuk storage.

### 8. Vector Store
Menyimpan knowledge dengan vector embeddings untuk semantic search.

### 9. Metadata Index
Mengindex metadata untuk pencarian cepat berdasarkan tags/categories.

## Penggunaan

### Start Scheduler

```typescript
import { KnowledgeScheduler } from './lib/knowledge';

// Start scheduler (runs every 60 minutes by default)
KnowledgeScheduler.start(60);

// Or trigger manually
await KnowledgeScheduler.runPipeline();

// Process specific source
await KnowledgeScheduler.runForSource('github-react');
```

### API Endpoints

```bash
# Trigger knowledge pipeline manually
POST /api/knowledge/trigger

# Process specific source
POST /api/knowledge/source/:sourceId

# Get all sources
GET /api/knowledge/sources
```

### Environment Variables

```env
# Enable knowledge scheduler
ENABLE_KNOWLEDGE_SCHEDULER=true

# Scheduler interval (minutes)
KNOWLEDGE_SCHEDULER_INTERVAL=60
```

## Database Schema

Sistem membutuhkan tabel berikut di Supabase:

```sql
-- Knowledge base table
CREATE TABLE IF NOT EXISTS knowledge_base (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  tags TEXT[],
  categories TEXT[],
  metadata JSONB,
  embeddings vector(1536), -- For vector search (if using pgvector)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Metadata index table
CREATE TABLE IF NOT EXISTS metadata_index (
  id SERIAL PRIMARY KEY,
  knowledge_id TEXT REFERENCES knowledge_base(id),
  tags TEXT[],
  categories TEXT[],
  source_id TEXT,
  source_name TEXT,
  quality_score FLOAT,
  relevance FLOAT,
  published_at TIMESTAMP WITH TIME ZONE,
  indexed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_knowledge_tags ON knowledge_base USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_knowledge_categories ON knowledge_base USING GIN(categories);
CREATE INDEX IF NOT EXISTS idx_metadata_tags ON metadata_index USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_metadata_categories ON metadata_index USING GIN(categories);
```

## Fitur

- ✅ Automatic scheduling dengan CRON
- ✅ Multi-source support (GitHub, blogs, docs)
- ✅ AI-powered curation dengan Tech Watcher & Curation Agents
- ✅ Deduplication untuk menghindari duplikat
- ✅ Vector storage untuk semantic search
- ✅ Metadata indexing untuk fast retrieval
- ✅ Quality filtering
- ✅ Relevance scoring

## Integrasi dengan Workflow

Knowledge yang dikumpulkan dapat digunakan oleh workflow untuk:
- Context awareness
- Better planning
- Improved code generation
- Up-to-date best practices
