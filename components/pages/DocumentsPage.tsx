import React, { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, FileText, Loader2, Plus, Search, Sparkles } from 'lucide-react';
import Sidebar from '../Sidebar';
import { useUser } from '@/lib/authContext';

interface DocumentRecord {
    id: string;
    title: string;
    file_name?: string;
    content?: string;
    summary?: string;
    created_at: string;
}

const DocumentsPage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useUser();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [documents, setDocuments] = useState<DocumentRecord[]>([]);
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    React.useEffect(() => {
        if (!user?.id) return;
        setLoading(true);
        fetch(`/api/turso/documents?userId=${encodeURIComponent(user.id)}`)
            .then((res) => res.json())
            .then((data) => setDocuments((data.documents || []) as DocumentRecord[]))
            .catch(() => setError('Turso documents API is not available. Check TURSO_DATABASE_URL and TURSO_AUTH_TOKEN.'))
            .finally(() => setLoading(false));
    }, [user?.id]);

    const filtered = useMemo(() => {
        return documents.filter((doc) => `${doc.title} ${doc.file_name}`.toLowerCase().includes(query.toLowerCase()));
    }, [documents, query]);

    const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !user?.id) return;
        setLoading(true);
        setError(null);
        try {
            const { parseDocument } = await import('@/lib/documentParser');
            const parsed = await parseDocument(file);
            const record = {
                userId: user.id,
                title: parsed.title || file.name,
                fileName: file.name,
                mimeType: file.type || 'text/plain',
                content: parsed.content,
                summary: parsed.content.slice(0, 420),
                metadata: { size: file.size },
            };
            const res = await fetch('/api/turso/documents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(record),
            });
            if (!res.ok) throw new Error('Unable to save document to Turso.');
            const data = await res.json();
            setDocuments((prev) => [data as DocumentRecord, ...prev]);
        } catch (err: any) {
            setError(err?.message || 'Unable to upload document.');
        } finally {
            setLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const chatWithDocument = (doc: DocumentRecord) => {
        navigate('/chat', {
            state: {
                initialPrompt: `Use this document context and help me summarize, extract key points, create action items, and answer questions.\n\nDocument: ${doc.title}\n\n${doc.content || doc.summary || ''}`,
                mode: 'tutor',
                autoSend: true,
                glassMode: 'documents',
                reasoning: true,
            },
        });
    };

    return (
        <div className="flex h-screen overflow-hidden bg-[linear-gradient(135deg,#f8fbff_0%,#ffffff_48%,#eef6ff_100%)]">
            <Sidebar />
            <main className="flex-1 overflow-y-auto p-5 md:p-8">
                <div className="mx-auto max-w-6xl">
                    <section className="rounded-[32px] border border-white/80 bg-white/65 p-6 shadow-2xl shadow-blue-900/5 backdrop-blur-2xl md:p-8">
                        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                            <div>
                                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/80 px-3 py-1 text-sm font-medium text-blue-700">
                                    <FileText size={15} /> Documents
                                </div>
                                <h1 className="text-4xl font-semibold tracking-tight text-zinc-950 md:text-5xl">Claude-style document workspace.</h1>
                                <p className="mt-4 max-w-2xl text-zinc-600">
                                    Upload, summarize, extract key points, generate outlines, and chat with long documents inside UseGlass AI.
                                </p>
                            </div>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-zinc-900/10"
                            >
                                <Plus size={16} /> Upload document
                            </button>
                            <input ref={fileInputRef} onChange={handleUpload} type="file" className="hidden" accept=".pdf,.docx,.txt,.md,.csv,.doc" />
                        </div>
                    </section>

                    <div className="mt-6 flex items-center gap-3 rounded-3xl border border-white/80 bg-white/70 px-4 py-3 shadow-sm backdrop-blur-xl">
                        <Search size={16} className="text-zinc-400" />
                        <input
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Search documents..."
                            className="w-full bg-transparent text-sm outline-none"
                        />
                    </div>

                    {error && (
                        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{error}</div>
                    )}

                    <section className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {loading && documents.length === 0 ? (
                            <div className="col-span-full flex h-56 items-center justify-center text-zinc-400">
                                <Loader2 className="animate-spin" />
                            </div>
                        ) : filtered.length > 0 ? (
                            filtered.map((doc) => (
                                <article key={doc.id} className="rounded-[26px] border border-white/80 bg-white/70 p-5 shadow-sm backdrop-blur-xl">
                                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                                        <FileText size={19} />
                                    </div>
                                    <h3 className="truncate font-semibold text-zinc-950">{doc.title}</h3>
                                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-zinc-500">{doc.summary || doc.content || 'Ready for document intelligence.'}</p>
                                    <button onClick={() => chatWithDocument(doc)} className="mt-4 flex items-center gap-2 text-sm font-medium text-blue-600">
                                        Chat with document <ArrowRight size={14} />
                                    </button>
                                </article>
                            ))
                        ) : (
                            <div className="col-span-full rounded-[28px] border border-dashed border-zinc-200 bg-white/55 p-10 text-center backdrop-blur-xl">
                                <Sparkles className="mx-auto mb-4 text-blue-600" />
                                <h3 className="text-lg font-semibold text-zinc-950">No documents yet</h3>
                                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
                                    Upload a PDF, DOCX, TXT, Markdown, or CSV file to start document chat and long-context reading.
                                </p>
                            </div>
                        )}
                    </section>
                </div>
            </main>
        </div>
    );
};

export default DocumentsPage;
