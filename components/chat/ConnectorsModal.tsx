import React from 'react';
import { X, Plug } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ConnectorsList from '@/components/connectors/ConnectorsList';

interface ConnectorsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ConnectorsModal: React.FC<ConnectorsModalProps> = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-end justify-center bg-black/30 p-4 backdrop-blur-sm sm:items-center"
          onClick={(event) => event.target === event.currentTarget && onClose()}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-100">
                  <Plug size={16} className="text-zinc-600" strokeWidth={1.8} />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-zinc-900">Glass Connectors</h2>
                  <p className="text-[11px] text-zinc-400">Connect UseGlass AI to your tools.</p>
                </div>
              </div>
              <button onClick={onClose} className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100">
                <X size={16} />
              </button>
            </div>

            <div className="max-h-[520px] overflow-y-auto p-3">
              <ConnectorsList variant="modal" />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConnectorsModal;
