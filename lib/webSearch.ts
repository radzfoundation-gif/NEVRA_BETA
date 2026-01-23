/**
 * Web Search Integration for NOIR AI Tutor
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
 * Format search results as clean markdown with citations
 */
export function formatSearchResults(results: SearchResult[]): string {
  if (results.length === 0) {
    return '';
  }

  // Simple inline citations format - cleaner than raw URLs
  let formatted = '\n\n---\n\n**📚 Sources:**\n';

  results.forEach((result, index) => {
    const domain = getDomainFromUrl(result.url);
    formatted += `\n[${index + 1}] **${result.title}** - *${domain}*`;
  });

  return formatted;
}

/**
 * Get clean domain from URL
 */
function getDomainFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}

/**
 * Extract citations for AI context (not shown to user directly)
 */
export function extractCitations(results: SearchResult[]): string {
  return results
    .map((result, index) => `[${index + 1}] ${result.title} (${getDomainFromUrl(result.url)}): ${result.snippet}`)
    .join('\n');
}

/**
 * Combine search results with AI response - cleaner output
 */
export function combineSearchAndResponse(
  searchResults: SearchResult[],
  aiResponse: string
): string {
  if (searchResults.length === 0) {
    return aiResponse;
  }

  const formattedSources = formatSearchResults(searchResults);

  // Return AI response with clean source list at the end
  return `${aiResponse}${formattedSources}`;
}

