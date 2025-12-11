import React from 'react';
import { ExternalLink, Globe, Clock } from 'lucide-react';
import { SearchResult } from '@/lib/webSearch';
import clsx from 'clsx';

interface SearchResultsProps {
  results: SearchResult[];
  searchTime?: number;
  onSelectResult?: (result: SearchResult) => void;
  className?: string;
}

const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  searchTime,
  onSelectResult,
  className,
}) => {
  if (results.length === 0) {
    return (
      <div className={clsx("p-4 text-center text-gray-400", className)}>
        <p>No search results found.</p>
      </div>
    );
  }

  return (
    <div className={clsx("space-y-4", className)}>
      <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
        <span className="flex items-center gap-2">
          <Globe size={14} />
          {results.length} result{results.length > 1 ? 's' : ''} found
        </span>
        {searchTime !== undefined && (
          <span className="flex items-center gap-2">
            <Clock size={14} />
            {searchTime.toFixed(2)}s
          </span>
        )}
      </div>

      <div className="space-y-3">
        {results.map((result, index) => (
          <div
            key={index}
            className="p-4 bg-white/5 border border-white/10 rounded-xl hover:border-purple-500/30 transition-all cursor-pointer group"
            onClick={() => onSelectResult?.(result)}
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <h3 className="text-sm font-semibold text-white group-hover:text-purple-400 transition-colors line-clamp-2 flex-1">
                {result.title}
              </h3>
              <a
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-purple-400 transition-colors shrink-0"
                title="Open in new tab"
              >
                <ExternalLink size={14} />
              </a>
            </div>
            
            <p className="text-xs text-gray-400 line-clamp-2 mb-2">
              {result.snippet}
            </p>
            
            <div className="flex items-center justify-between">
              <a
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-xs text-purple-400 hover:text-purple-300 truncate max-w-[80%]"
              >
                {result.source || new URL(result.url).hostname}
              </a>
              {result.relevanceScore !== undefined && (
                <span className="text-xs text-gray-500">
                  {Math.round(result.relevanceScore * 100)}% relevant
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SearchResults;
