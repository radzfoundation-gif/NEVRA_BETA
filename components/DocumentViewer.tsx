import React, { useState } from 'react';
import { FileText, X, Search, Download, BookOpen } from 'lucide-react';
import { ParsedDocument, searchInDocument, getDocumentSummary } from '@/lib/documentParser';
import clsx from 'clsx';

interface DocumentViewerProps {
  document: ParsedDocument;
  onClose: () => void;
  onSearch?: (query: string) => void;
  className?: string;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({
  document,
  onClose,
  onSearch,
  className,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(true);

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const results = searchInDocument(document, searchQuery);
    setSearchResults(results);
    onSearch?.(searchQuery);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className={clsx("flex flex-col h-full bg-[#0a0a0a] border border-white/10 rounded-xl overflow-hidden", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#111] shrink-0">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center shrink-0">
            <FileText size={20} className="text-purple-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-white truncate">
              {document.title}
            </h3>
            {document.metadata?.wordCount && (
              <p className="text-xs text-gray-400">
                {document.metadata.wordCount} words
                {document.pages && ` • ${document.pages} pages`}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors shrink-0"
        >
          <X size={18} />
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-4 border-b border-white/10 shrink-0">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Search in document..."
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-colors"
          />
        </div>
        {searchResults.length > 0 && (
          <div className="mt-2 text-xs text-purple-400">
            Found {searchResults.length} result{searchResults.length > 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Summary Toggle */}
        {showSummary && (
          <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BookOpen size={16} className="text-purple-400" />
                <h4 className="text-sm font-semibold text-white">Summary</h4>
              </div>
              <button
                onClick={() => setShowSummary(false)}
                className="text-xs text-gray-400 hover:text-white"
              >
                Hide
              </button>
            </div>
            <div className="text-xs text-gray-300 whitespace-pre-wrap">
              {getDocumentSummary(document)}
            </div>
          </div>
        )}

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-white">Search Results</h4>
            {searchResults.map((result, index) => (
              <div
                key={index}
                className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg cursor-pointer hover:bg-purple-500/20 transition-colors"
                onClick={() => {
                  // Scroll to section or highlight
                  setActiveSection(result.title);
                }}
              >
                <p className="text-xs font-medium text-purple-400 mb-1">
                  {result.title}
                </p>
                <p className="text-xs text-gray-300 line-clamp-2">
                  {result.content}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Document Sections */}
        {document.sections && document.sections.length > 0 ? (
          <div className="space-y-4">
            {document.sections.map((section, index) => (
              <div
                key={index}
                className={clsx(
                  "p-4 rounded-lg border transition-colors",
                  activeSection === section.title
                    ? "bg-purple-500/20 border-purple-500/50"
                    : "bg-white/5 border-white/10"
                )}
              >
                <h4 className="text-sm font-semibold text-white mb-2">
                  {section.title}
                </h4>
                <div className="text-xs text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {section.content}
                </div>
                {section.pageNumber && (
                  <div className="mt-2 text-xs text-gray-500">
                    Page {section.pageNumber}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          /* Full Content */
          <div className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
            {document.content}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between p-4 border-t border-white/10 bg-[#111] shrink-0">
        <button
          onClick={() => {
            const blob = new Blob([document.content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${document.title}.txt`;
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
        >
          <Download size={14} />
          Download
        </button>
        {!showSummary && (
          <button
            onClick={() => setShowSummary(true)}
            className="text-xs text-gray-400 hover:text-white"
          >
            Show Summary
          </button>
        )}
      </div>
    </div>
  );
};

export default DocumentViewer;
