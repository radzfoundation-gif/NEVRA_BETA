import React from 'react';
import { ExternalLink, Globe, Clock, Search, ArrowUpRight } from 'lucide-react';
import { SearchResult } from '@/lib/webSearch';
import clsx from 'clsx';

interface SearchResultsProps {
  results: SearchResult[];
  searchTime?: number;
  onSelectResult?: (result: SearchResult) => void;
  className?: string;
}

// Get favicon from URL using Google's favicon service
const getFaviconUrl = (url: string): string => {
  try {
    const hostname = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
  } catch {
    return '';
  }
};

// Get domain name cleaned up
const getDomain = (url: string): string => {
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace('www.', '');
  } catch {
    return url;
  }
};

const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  searchTime,
  onSelectResult,
  className,
}) => {
  if (results.length === 0) {
    return (
      <div className={clsx("p-6 text-center", className)}>
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-zinc-100 flex items-center justify-center">
          <Search size={20} className="text-zinc-400" />
        </div>
        <p className="text-zinc-500 text-sm">No search results found.</p>
      </div>
    );
  }

  return (
    <div className={clsx("", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-100">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-blue-50 flex items-center justify-center">
            <Globe size={12} className="text-blue-600" />
          </div>
          <span className="text-sm font-medium text-zinc-700">
            {results.length} source{results.length > 1 ? 's' : ''} found
          </span>
        </div>
        {searchTime !== undefined && (
          <span className="flex items-center gap-1.5 text-xs text-zinc-400">
            <Clock size={12} />
            {searchTime.toFixed(2)}s
          </span>
        )}
      </div>

      {/* Results Grid - Compact Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
        {results.slice(0, 4).map((result, index) => (
          <a
            key={index}
            href={result.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 p-3 bg-zinc-50 hover:bg-zinc-100 border border-zinc-100 hover:border-zinc-200 rounded-xl transition-all"
            onClick={(e) => {
              if (onSelectResult) {
                e.preventDefault();
                onSelectResult(result);
              }
            }}
          >
            {/* Favicon/Logo */}
            <div className="w-8 h-8 rounded-lg bg-white border border-zinc-200 flex items-center justify-center overflow-hidden shrink-0">
              <img
                src={getFaviconUrl(result.url)}
                alt=""
                className="w-5 h-5"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                }}
              />
              <Globe size={14} className="text-zinc-400 hidden" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-medium text-zinc-800 group-hover:text-blue-600 truncate transition-colors">
                {result.title}
              </h4>
              <p className="text-[10px] text-zinc-400 truncate">
                {getDomain(result.url)}
              </p>
            </div>

            {/* Arrow */}
            <ArrowUpRight size={14} className="text-zinc-300 group-hover:text-blue-500 shrink-0 transition-colors" />
          </a>
        ))}
      </div>

      {/* Expanded Results List */}
      {results.length > 4 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-zinc-500 mb-2">More sources</p>
          {results.slice(4).map((result, index) => (
            <a
              key={index + 4}
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 py-2 px-3 hover:bg-zinc-50 rounded-lg transition-all"
              onClick={(e) => {
                if (onSelectResult) {
                  e.preventDefault();
                  onSelectResult(result);
                }
              }}
            >
              <img
                src={getFaviconUrl(result.url)}
                alt=""
                className="w-4 h-4 rounded"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '';
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <span className="text-xs text-zinc-600 group-hover:text-blue-600 truncate flex-1 transition-colors">
                {result.title}
              </span>
              <span className="text-[10px] text-zinc-400 shrink-0">
                {getDomain(result.url)}
              </span>
            </a>
          ))}
        </div>
      )}

      {/* Full Details Section (Optional) */}
      <details className="mt-4 group">
        <summary className="text-xs text-zinc-400 hover:text-zinc-600 cursor-pointer select-none">
          View details
        </summary>
        <div className="mt-3 space-y-3 pt-3 border-t border-zinc-100">
          {results.map((result, index) => (
            <div
              key={index}
              className="p-3 bg-white border border-zinc-100 rounded-xl hover:shadow-sm transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-zinc-50 border border-zinc-100 flex items-center justify-center overflow-hidden shrink-0">
                  <img
                    src={getFaviconUrl(result.url)}
                    alt=""
                    className="w-6 h-6"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <a
                    href={result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-zinc-800 hover:text-blue-600 line-clamp-1 transition-colors"
                  >
                    {result.title}
                  </a>
                  <p className="text-xs text-zinc-500 line-clamp-2 mt-1">
                    {result.snippet}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] text-zinc-400">
                      {getDomain(result.url)}
                    </span>
                    {result.relevanceScore !== undefined && (
                      <span className="text-[10px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                        {Math.round(result.relevanceScore * 100)}% match
                      </span>
                    )}
                  </div>
                </div>
                <a
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 hover:bg-zinc-100 rounded-lg transition-colors shrink-0"
                >
                  <ExternalLink size={14} className="text-zinc-400" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
};

export default SearchResults;

