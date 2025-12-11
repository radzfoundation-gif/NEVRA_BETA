import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, RotateCcw, Trash2, X, Search, FileCode } from 'lucide-react';
import { Version, getVersionManager } from '@/lib/versionManager';
import clsx from 'clsx';

interface VersionHistoryProps {
  onRestore: (files: Version['files']) => void;
  isOpen: boolean;
  onClose: () => void;
}

const VersionHistory: React.FC<VersionHistoryProps> = ({
  onRestore,
  isOpen,
  onClose,
}) => {
  const [versions, setVersions] = useState<Version[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const manager = getVersionManager();
      setVersions(manager.getAllVersions());
    }
  }, [isOpen]);

  const filteredVersions = searchQuery
    ? versions.filter(v => 
        v.message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.id.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : versions;

  const handleRestore = (version: Version) => {
    if (confirm(`Restore version from ${version.timestamp.toLocaleString()}? This will replace your current files.`)) {
      onRestore(version.files);
      onClose();
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this version?')) {
      const manager = getVersionManager();
      manager.deleteVersion(id);
      setVersions(manager.getAllVersions());
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-2xl max-h-[80vh] bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">Version History</h2>
            <p className="text-sm text-gray-400">{versions.length} version{versions.length !== 1 ? 's' : ''} saved</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-white/10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search versions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
            />
          </div>
        </div>

        {/* Versions List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredVersions.length === 0 ? (
            <div className="text-center py-12">
              <Clock size={48} className="mx-auto mb-4 text-gray-600" />
              <p className="text-gray-400">No versions found</p>
            </div>
          ) : (
            filteredVersions.map((version) => (
              <motion.div
                key={version.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={clsx(
                  "p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all cursor-pointer",
                  selectedVersion === version.id && "border-purple-500/50 bg-purple-500/10"
                )}
                onClick={() => setSelectedVersion(selectedVersion === version.id ? null : version.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock size={14} className="text-gray-400" />
                      <span className="text-sm font-medium text-white">{formatDate(version.timestamp)}</span>
                      <span className="text-xs text-gray-500 font-mono">{version.id}</span>
                    </div>
                    {version.message && (
                      <p className="text-sm text-gray-300 mb-2">{version.message}</p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <FileCode size={12} />
                      <span>{version.files.length} file{version.files.length !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRestore(version);
                      }}
                      className="p-2 hover:bg-purple-500/20 text-purple-400 rounded transition-colors"
                      title="Restore"
                    >
                      <RotateCcw size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(version.id);
                      }}
                      className="p-2 hover:bg-red-500/20 text-red-400 rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {selectedVersion === version.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-3 pt-3 border-t border-white/10"
                    >
                      <div className="space-y-2">
                        {version.files.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 text-xs text-gray-400 font-mono"
                          >
                            <FileCode size={12} />
                            <span className="truncate">{file.path}</span>
                            <span className="text-gray-600">({file.type})</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default VersionHistory;
