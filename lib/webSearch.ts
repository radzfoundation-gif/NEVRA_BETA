/**
 * Web Search Integration for NEVRA Tutor
 * Provides real-time web search capabilities similar to Perplexity.ai
 */

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
  relevanceScore?: number;
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
  totalResults: number;
  searchTime: number;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Perform web search using backend API
 * Backend will use search APIs like SerpAPI, Google Custom Search, or Tavily
 */
export async function performWebSearch(
  query: string,
  maxResults: number = 10
): Promise<SearchResponse> {
  try {
    const response = await fetch(`${API_BASE}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        maxResults,
      }),
    });

    if (!response.ok) {
      throw new Error(`Search failed: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      query: data.query || query,
      results: data.results || [],
      totalResults: data.totalResults || 0,
      searchTime: data.searchTime || 0,
    };
  } catch (error) {
    console.error('Web search error:', error);
    throw error;
  }
}

/**
 * Format search results as markdown with citations
 */
export function formatSearchResults(results: SearchResult[]): string {
  if (results.length === 0) {
    return 'No search results found.';
  }

  let formatted = '## 🔍 Search Results\n\n';
  
  results.forEach((result, index) => {
    formatted += `### ${index + 1}. [${result.title}](${result.url})\n`;
    formatted += `${result.snippet}\n`;
    formatted += `*Source: ${result.source}*\n\n`;
  });

  return formatted;
}

/**
 * Extract citations from search results for AI context
 */
export function extractCitations(results: SearchResult[]): string {
  return results
    .map((result, index) => `[${index + 1}] ${result.title} - ${result.url}`)
    .join('\n');
}

/**
 * Combine search results with AI response
 */
export function combineSearchAndResponse(
  searchResults: SearchResult[],
  aiResponse: string
): string {
  const citations = extractCitations(searchResults);
  const formattedResults = formatSearchResults(searchResults);
  
  return `${aiResponse}\n\n---\n\n${formattedResults}\n\n### 📚 Sources\n\n${citations}`;
}
