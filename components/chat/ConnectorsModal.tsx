import React, { useState, useEffect } from 'react';
import { X, Check, Loader2, Plug, AlertCircle, ExternalLink, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@/lib/authContext';

interface Connector {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  provider: string;
}

const CONNECTORS: Connector[] = [
  { id: 'gmail', name: 'Gmail', description: 'Baca & kirim email', icon: '📧', color: 'bg-red-50 border-red-200', provider: 'gmail' },
  { id: 'google_drive', name: 'Google Drive', description: 'Akses file & dokumen', icon: '📁', color: 'bg-yellow-50 border-yellow-200', provider: 'google_drive' },
  { id: 'google_calendar', name: 'Google Calendar', description: 'Lihat & buat event', icon: '📅', color: 'bg-blue-50 border-blue-200', provider: 'google_calendar' },
  { id: 'slack', name: 'Slack', description: 'Baca & kirim pesan', icon: '💬', color: 'bg-purple-50 border-purple-200', provider: 'slack' },
  { id: 'notion', name: 'Notion', description: 'Akses halaman & database', icon: '📝', color: 'bg-stone-50 border-stone-200', provider: 'notion' },
  { id: 'github', name: 'GitHub', description: 'Akses repo & kode', icon: '🐙', color: 'bg-zinc-50 border-zinc-200', provider: 'github' },
];

interface ConnectorsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ConnectorsModal: React.FC<ConnectorsModalProps> = ({ isOpen, onClose }) => {
  const { user } = useUser();
  const [connected, setConnected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && user?.id) fetchConnected();
  }, [isOpen, user?.id]);

  // Listen for OAuth callback redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connectedProvider = params.get('connected');
    if (connectedProvider) {
      setConnected(prev => prev.includes(connectedProvider) ? prev : [...prev, connectedProvider]);
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const fetchConnected = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/philos/integrations?userId=${user.id}`);
      const data = await res.json();
      setConnected((data.integrations || []).map((i: any) => i.provider));
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (connector: Connector) => {
    if (!user?.id) return;
    setConnecting(connector.id);
    try {
      const res = await fetch(`/api/philos/integrations/${connector.provider}/auth?userId=${user.id}`);
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      // silent
    } finally {
      setConnecting(null);
    }
  };

  const handleDisconnect = async (connector: Connector) => {
    if (!user?.id) return;
    setDisconnecting(connector.id);
    try {
      await fetch(`/api/philos/integrations/${connector.provider}?userId=${user.id}`, { method: 'DELETE' });
      setConnected(prev => prev.filter(p => p !== connector.provider));
    } catch {
      // silent
    } finally {
      setDisconnecting(null);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-stone-100 flex items-center justify-center">
                  <Plug size={16} className="text-stone-600" strokeWidth={1.8} />
                </div>
                <div>
                  <h2 className="text-[14px] font-semibold text-stone-900">Connectors</h2>
                  <p className="text-[11px] text-stone-400">Hubungkan Noir ke aplikasi kamu</p>
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* List */}
            <div className="p-3 space-y-1.5 max-h-[420px] overflow-y-auto">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 size={20} className="animate-spin text-stone-300" />
                </div>
              ) : (
                CONNECTORS.map((connector) => {
                  const isConnected = connected.includes(connector.provider);
                  const isConnecting = connecting === connector.id;
                  const isDisconnecting = disconnecting === connector.id;
                  return (
                    <div key={connector.id} className={`flex items-center gap-3 p-3 rounded-xl border ${connector.color} transition-all`}>
                      <span className="text-xl w-8 text-center">{connector.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-stone-900">{connector.name}</p>
                        <p className="text-[11px] text-stone-500 truncate">{connector.description}</p>
                      </div>
                      {isConnected ? (
                        <div className="flex items-center gap-1.5">
                          <span className="flex items-center gap-1 text-[10px] font-semibold text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                            <Check size={10} strokeWidth={3} /> Terhubung
                          </span>
                          <button
                            onClick={() => handleDisconnect(connector)}
                            disabled={isDisconnecting}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-stone-300 hover:text-red-400 transition-colors"
                          >
                            {isDisconnecting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleConnect(connector)}
                          disabled={isConnecting}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 text-white text-[11px] font-medium hover:bg-stone-700 transition-colors disabled:opacity-50"
                        >
                          {isConnecting ? <Loader2 size={12} className="animate-spin" /> : <ExternalLink size={12} />}
                          Hubungkan
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {!user?.id && (
              <div className="px-5 pb-4">
                <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-[12px] text-amber-700">
                  <AlertCircle size={14} />
                  Login diperlukan untuk menghubungkan aplikasi.
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConnectorsModal;
