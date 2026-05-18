import React, { useEffect, useState } from 'react';
import { AlertCircle, Check, ExternalLink, Loader2, Trash2 } from 'lucide-react';
import { GLASS_CONNECTORS, GlassConnector } from '@/components/ResearchWelcome';
import { useUser } from '@/lib/authContext';

interface ConnectorsListProps {
  variant?: 'modal' | 'page';
}

const PROVIDERS: Record<string, string | null> = {
  'google-drive': 'google_drive',
  github: 'github',
  gmail: 'gmail',
  'google-calendar': 'google_calendar',
  notion: 'notion',
  slack: 'slack',
  discord: 'discord',
  'firebase-firestore': 'firebase_firestore',
  'web-search': null,
  'local-documents': null,
};

const ConnectorsList: React.FC<ConnectorsListProps> = ({ variant = 'modal' }) => {
  const { user } = useUser();
  const [connected, setConnected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) fetchConnected();
  }, [user?.id]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connectedProvider = params.get('connected');
    if (!connectedProvider) return;
    setConnected(prev => prev.includes(connectedProvider) ? prev : [...prev, connectedProvider]);
    window.history.replaceState({}, '', window.location.pathname);
  }, []);

  const fetchConnected = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/philos/integrations?userId=${user.id}`);
      const data = await res.json();
      setConnected((data.integrations || []).map((integration: any) => integration.provider));
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const providerFor = (connector: GlassConnector) => PROVIDERS[connector.id] ?? connector.id.replace(/-/g, '_');

  const isConnectorConnected = (connector: GlassConnector) => {
    const provider = providerFor(connector);
    return connector.status === 'connected' || Boolean(provider && connected.includes(provider));
  };

  const handleConnect = async (connector: GlassConnector) => {
    const provider = providerFor(connector);
    if (!user?.id || !provider || connector.status === 'coming soon') return;
    setConnecting(connector.id);
    try {
      const res = await fetch(`/api/philos/integrations/${provider}/auth?userId=${user.id}`);
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
    } finally {
      setConnecting(null);
    }
  };

  const handleDisconnect = async (connector: GlassConnector) => {
    const provider = providerFor(connector);
    if (!user?.id || !provider) return;
    setDisconnecting(connector.id);
    try {
      await fetch(`/api/philos/integrations/${provider}?userId=${user.id}`, { method: 'DELETE' });
      setConnected(prev => prev.filter(item => item !== provider));
    } catch {
    } finally {
      setDisconnecting(null);
    }
  };

  const gridClass = variant === 'page'
    ? 'grid grid-cols-1 md:grid-cols-2 gap-3'
    : 'space-y-1.5';

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 size={20} className="animate-spin text-zinc-300" />
      </div>
    );
  }

  return (
    <div className={gridClass}>
      {GLASS_CONNECTORS.map((connector) => {
        const Icon = connector.icon;
        const connectedNow = isConnectorConnected(connector);
        const isComingSoon = connector.status === 'coming soon';
        const isConnecting = connecting === connector.id;
        const isDisconnecting = disconnecting === connector.id;
        const canDisconnect = connectedNow && connector.status !== 'connected' && Boolean(providerFor(connector));

        return (
          <div key={connector.id} className="flex items-start gap-3 rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm transition hover:border-zinc-300">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-700">
              <Icon size={18} strokeWidth={1.8} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold text-zinc-950">{connector.name}</h3>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  connectedNow
                    ? 'bg-green-50 text-green-700 ring-1 ring-green-200'
                    : isComingSoon
                      ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
                      : 'bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200'
                }`}>
                  {connectedNow ? 'connected' : isComingSoon ? 'coming soon' : 'disconnected'}
                </span>
              </div>
              <p className="mt-1 text-xs text-zinc-500">{connector.description}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {connector.capabilities.map((capability) => (
                  <span key={capability} className="rounded-full bg-zinc-50 px-2 py-0.5 text-[10px] font-medium text-zinc-500 ring-1 ring-zinc-200">
                    {capability}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {connectedNow ? (
                <>
                  <span className="hidden items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-[10px] font-semibold text-green-700 ring-1 ring-green-200 sm:flex">
                    <Check size={11} strokeWidth={3} /> Connected
                  </span>
                  {canDisconnect && (
                    <button onClick={() => handleDisconnect(connector)} disabled={isDisconnecting} className="rounded-xl p-2 text-zinc-300 transition hover:bg-red-50 hover:text-red-500 disabled:opacity-50" title="Disconnect">
                      {isDisconnecting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                  )}
                </>
              ) : isComingSoon ? (
                <button disabled className="rounded-xl bg-zinc-100 px-3 py-1.5 text-[11px] font-medium text-zinc-400">
                  Soon
                </button>
              ) : connector.id === 'local-documents' ? (
                <button disabled className="rounded-xl bg-zinc-100 px-3 py-1.5 text-[11px] font-medium text-zinc-400" title="Upload documents from chat input">
                  Upload
                </button>
              ) : (
                <button onClick={() => handleConnect(connector)} disabled={isConnecting || !user?.id} className="flex items-center gap-1.5 rounded-xl bg-zinc-950 px-3 py-1.5 text-[11px] font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50">
                  {isConnecting ? <Loader2 size={12} className="animate-spin" /> : <ExternalLink size={12} />}
                  Connect
                </button>
              )}
            </div>
          </div>
        );
      })}
      {!user?.id && (
        <div className="flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
          <AlertCircle size={14} /> Login required to connect apps.
        </div>
      )}
    </div>
  );
};

export default ConnectorsList;
