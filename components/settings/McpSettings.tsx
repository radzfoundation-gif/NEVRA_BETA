import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Globe, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface McpServer {
    id: string;
    name: string;
    url: string;
    enabled: boolean;
    connected: boolean;
}

const McpSettings: React.FC = () => {
    const [servers, setServers] = useState<McpServer[]>([]);
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);
    const [newName, setNewName] = useState('');
    const [newUrl, setNewUrl] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchServers();
    }, []);

    const fetchServers = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/mcp/servers');
            const data = await res.json();
            setServers(data);
        } catch (err) {
            console.error('Failed to fetch MCP servers:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddServer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName || !newUrl) return;

        try {
            setAdding(true);
            setError(null);
            const res = await fetch('/api/mcp/servers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName, url: newUrl })
            });

            if (!res.ok) throw new Error('Failed to add server');

            setNewName('');
            setNewUrl('');
            setAdding(false);
            fetchServers();
        } catch (err: any) {
            setError(err.message);
            setAdding(false);
        }
    };

    const handleRemoveServer = async (id: string) => {
        try {
            await fetch(`/api/mcp/servers/${id}`, { method: 'DELETE' });
            fetchServers();
        } catch (err) {
            console.error('Failed to remove server:', err);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium text-zinc-900 mb-1">MCP Connectors</h3>
                <p className="text-sm text-zinc-500">
                    Connect to external Model Context Protocol (MCP) servers to give Noir AI new capabilities and access to your data.
                </p>
            </div>

            {/* Add Server Form */}
            <form onSubmit={handleAddServer} className="bg-zinc-50 border border-zinc-200 rounded-xl p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-zinc-700">Server Name</label>
                        <input
                            type="text"
                            placeholder="e.g. My Database Server"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-zinc-700">SSE URL</label>
                        <input
                            type="url"
                            placeholder="http://localhost:3000/mcp"
                            value={newUrl}
                            onChange={(e) => setNewUrl(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                        />
                    </div>
                </div>
                {error && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12} /> {error}</p>}
                <button
                    type="submit"
                    disabled={adding || !newName || !newUrl}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                    {adding ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
                    Add MCP Server
                </button>
            </form>

            {/* Server List */}
            <div className="space-y-3">
                <h4 className="text-sm font-medium text-zinc-700 uppercase tracking-wider">Connected Servers</h4>
                {loading ? (
                    <div className="flex justify-center p-8"><Loader2 className="animate-spin text-zinc-400" /></div>
                ) : servers.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-zinc-100 rounded-xl">
                        <Globe className="mx-auto text-zinc-300 mb-2" size={32} />
                        <p className="text-sm text-zinc-400">No MCP servers connected yet.</p>
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {servers.map((server) => (
                            <div key={server.id} className="flex items-center justify-between p-4 bg-white border border-zinc-200 rounded-xl shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${server.connected ? 'bg-green-50 text-green-600' : 'bg-zinc-50 text-zinc-400'}`}>
                                        <Globe size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-zinc-900">{server.name}</h4>
                                        <p className="text-xs text-zinc-500 truncate max-w-[200px] md:max-w-md">{server.url}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-zinc-50 border border-zinc-100">
                                        {server.connected ? (
                                            <>
                                                <CheckCircle2 size={12} className="text-green-500" />
                                                <span className="text-[10px] font-bold text-green-700 uppercase">Connected</span>
                                            </>
                                        ) : (
                                            <>
                                                <AlertCircle size={12} className="text-zinc-400" />
                                                <span className="text-[10px] font-bold text-zinc-500 uppercase">Offline</span>
                                            </>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => handleRemoveServer(server.id)}
                                        className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default McpSettings;
