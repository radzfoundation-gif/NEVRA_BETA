import { KnowledgeSource } from '../sources/SourceRegistry';

/**
 * Fetched Content
 */
export interface FetchedContent {
  sourceId: string;
  sourceName: string;
  url: string;
  title: string;
  content: string;
  excerpt?: string;
  author?: string;
  publishedAt?: Date;
  fetchedAt: Date;
  metadata: {
    tags?: string[];
    categories?: string[];
    language?: string;
    framework?: string[];
    [key: string]: any;
  };
}

/**
 * Fetcher Interface
 */
export interface IFetcher {
  fetch(source: KnowledgeSource): Promise<FetchedContent[]>;
}

/**
 * Base Fetcher
 */
export abstract class BaseFetcher implements IFetcher {
  abstract fetch(source: KnowledgeSource): Promise<FetchedContent[]>;

  /**
   * Extract text from HTML
   */
  protected extractTextFromHtml(html: string): string {
    // Remove script and style tags
    let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    
    // Remove HTML tags
    text = text.replace(/<[^>]+>/g, ' ');
    
    // Decode HTML entities
    text = text
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
    
    // Clean up whitespace
    text = text.replace(/\s+/g, ' ').trim();
    
    return text;
  }

  /**
   * Extract title from HTML
   */
  protected extractTitle(html: string): string {
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
      return titleMatch[1].trim();
    }

    const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    if (h1Match) {
      return h1Match[1].trim();
    }

    return 'Untitled';
  }
}

/**
 * GitHub Fetcher
 */
export class GitHubFetcher extends BaseFetcher {
  async fetch(source: KnowledgeSource): Promise<FetchedContent[]> {
    try {
      // Fetch GitHub repository information
      const repoMatch = source.url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (!repoMatch) {
        return [];
      }

      const [, owner, repo] = repoMatch;
      const apiUrl = `https://api.github.com/repos/${owner}/${repo}`;

      // Fetch repository info
      const repoResponse = await fetch(apiUrl);
      if (!repoResponse.ok) {
        return [];
      }

      const repoData = await repoResponse.json();

      // Fetch recent commits
      const commitsResponse = await fetch(`${apiUrl}/commits?per_page=10`);
      const commitsData = commitsResponse.ok ? await commitsResponse.json() : [];

      // Fetch recent releases
      const releasesResponse = await fetch(`${apiUrl}/releases?per_page=5`);
      const releasesData = releasesResponse.ok ? await releasesResponse.json() : [];

      const contents: FetchedContent[] = [];

      // Repository info
      contents.push({
        sourceId: source.id,
        sourceName: source.name,
        url: source.url,
        title: `${repoData.name} - ${repoData.description || 'Repository'}`,
        content: repoData.description || '',
        excerpt: repoData.description?.substring(0, 200),
        publishedAt: new Date(repoData.updated_at),
        fetchedAt: new Date(),
        metadata: {
          ...source.metadata,
          stars: repoData.stargazers_count,
          forks: repoData.forks_count,
          language: repoData.language,
        },
      });

      // Recent commits
      commitsData.forEach((commit: any) => {
        contents.push({
          sourceId: source.id,
          sourceName: source.name,
          url: commit.html_url,
          title: commit.commit.message.split('\n')[0],
          content: commit.commit.message,
          excerpt: commit.commit.message.substring(0, 200),
          author: commit.commit.author.name,
          publishedAt: new Date(commit.commit.author.date),
          fetchedAt: new Date(),
          metadata: {
            ...source.metadata,
            type: 'commit',
            sha: commit.sha,
          },
        });
      });

      // Recent releases
      releasesData.forEach((release: any) => {
        contents.push({
          sourceId: source.id,
          sourceName: source.name,
          url: release.html_url,
          title: release.name || release.tag_name,
          content: release.body || '',
          excerpt: release.body?.substring(0, 200),
          publishedAt: new Date(release.published_at),
          fetchedAt: new Date(),
          metadata: {
            ...source.metadata,
            type: 'release',
            tag: release.tag_name,
          },
        });
      });

      return contents;
    } catch (error) {
      console.error(`GitHubFetcher error for ${source.id}:`, error);
      return [];
    }
  }
}

/**
 * Blog Fetcher
 */
export class BlogFetcher extends BaseFetcher {
  async fetch(source: KnowledgeSource): Promise<FetchedContent[]> {
    try {
      // Fetch blog RSS or HTML
      const response = await fetch(source.url);
      if (!response.ok) {
        return [];
      }

      const html = await response.text();
      const title = this.extractTitle(html);
      const content = this.extractTextFromHtml(html);

      return [{
        sourceId: source.id,
        sourceName: source.name,
        url: source.url,
        title,
        content: content.substring(0, 5000), // Limit content
        excerpt: content.substring(0, 200),
        fetchedAt: new Date(),
        metadata: {
          ...source.metadata,
          type: 'blog',
        },
      }];
    } catch (error) {
      console.error(`BlogFetcher error for ${source.id}:`, error);
      return [];
    }
  }
}

/**
 * Docs Fetcher
 */
export class DocsFetcher extends BaseFetcher {
  async fetch(source: KnowledgeSource): Promise<FetchedContent[]> {
    try {
      // Fetch documentation
      const response = await fetch(source.url);
      if (!response.ok) {
        return [];
      }

      const html = await response.text();
      const title = this.extractTitle(html);
      const content = this.extractTextFromHtml(html);

      return [{
        sourceId: source.id,
        sourceName: source.name,
        url: source.url,
        title,
        content: content.substring(0, 10000), // Limit content
        excerpt: content.substring(0, 300),
        fetchedAt: new Date(),
        metadata: {
          ...source.metadata,
          type: 'documentation',
        },
      }];
    } catch (error) {
      console.error(`DocsFetcher error for ${source.id}:`, error);
      return [];
    }
  }
}

/**
 * Fetcher Factory
 */
export class FetcherFactory {
  static createFetcher(source: KnowledgeSource): IFetcher {
    switch (source.type) {
      case 'github':
        return new GitHubFetcher();
      case 'blog':
        return new BlogFetcher();
      case 'docs':
        return new DocsFetcher();
      default:
        return new BlogFetcher(); // Default fallback
    }
  }
}
