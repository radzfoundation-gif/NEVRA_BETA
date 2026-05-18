import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Bot, Code2, FileSearch, FileText, FolderOpen, LayoutTemplate, Loader2, MessageSquare, Plus, StickyNote } from 'lucide-react';
import Sidebar from '../Sidebar';
import { useChatSessions, useProjectDetail, useWorkspaceProjects } from '@/hooks/useFirestore';

const tabs = ['Overview', 'Chats', 'Research', 'Documents', 'Code', 'Builder', 'Agents', 'Notes'];

const ProjectsPage: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { sessions, loading: sessionsLoading } = useChatSessions();
    const { projects, savedOutputs, loading, createProject } = useWorkspaceProjects();
    const { project, items, loading: detailLoading, addNote } = useProjectDetail(id);
    const [activeTab, setActiveTab] = React.useState('Overview');
    const [note, setNote] = React.useState('');

    const createNewProject = async () => {
        const created = await createProject('Untitled Project', 'Workspace for chats, research, documents, code, builder outputs, and agent results.');
        navigate(`/projects/${created.id}`);
    };

    if (id) {
        const filteredItems = items.filter((item) => {
            if (activeTab === 'Overview') return true;
            if (activeTab === 'Research') return item.metadata?.outputType === 'research' || item.title.toLowerCase().includes('research');
            if (activeTab === 'Builder') return item.item_type === 'builder_output';
            if (activeTab === 'Code') return item.item_type === 'code';
            if (activeTab === 'Notes') return item.item_type === 'note';
            if (activeTab === 'Documents') return item.item_type === 'document';
            if (activeTab === 'Agents') return item.metadata?.outputType === 'agent';
            if (activeTab === 'Chats') return item.item_type === 'chat' || item.metadata?.source === 'chat';
            return true;
        });

        return (
            <div className="flex h-screen overflow-hidden bg-[linear-gradient(135deg,#f8fbff_0%,#ffffff_45%,#edf6ff_100%)]">
                <Sidebar />
                <main className="flex-1 overflow-y-auto p-6">
                    {detailLoading ? <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin text-zinc-400" /></div> : (
                        <div className="mx-auto max-w-7xl">
                            <button onClick={() => navigate('/projects')} className="mb-5 text-sm font-medium text-zinc-500 hover:text-zinc-900">? Back to projects</button>
                            <section className="rounded-[32px] border border-white/80 bg-white/75 p-7 shadow-xl shadow-blue-900/5 backdrop-blur-2xl">
                                <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-blue-600">Project Workspace</p>
                                        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-zinc-950">{project?.name || 'Project not found'}</h1>
                                        <p className="mt-3 max-w-2xl text-zinc-600">{project?.description || 'Collect saved chats, research, documents, code, builder outputs, agent results, and notes.'}</p>
                                    </div>
                                    <button onClick={() => navigate('/chat', { state: { initialPrompt: `Continue working on project: ${project?.name || ''}` } })} className="rounded-2xl bg-zinc-950 px-5 py-3 text-sm font-semibold text-white">Continue with AI</button>
                                </div>
                            </section>

                            <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
                                {tabs.map(tab => <button key={tab} onClick={() => setActiveTab(tab)} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium ${activeTab === tab ? 'bg-zinc-950 text-white' : 'border border-zinc-200 bg-white/70 text-zinc-600'}`}>{tab}</button>)}
                            </div>

                            <section className="mt-6 grid gap-5 lg:grid-cols-[1fr_340px]">
                                <div className="rounded-3xl border border-white/80 bg-white/70 p-5 backdrop-blur-xl">
                                    <h2 className="mb-4 font-semibold text-zinc-950">{activeTab} items</h2>
                                    {filteredItems.length === 0 ? <div className="rounded-2xl border border-dashed border-zinc-200 p-8 text-center text-sm text-zinc-500">No saved items yet. Use Save to Project from AI outputs.</div> : filteredItems.map(item => <article key={item.id} className="mb-3 rounded-2xl border border-zinc-100 bg-white/80 p-4"><div className="flex items-center justify-between gap-3"><h3 className="font-semibold text-zinc-950">{item.title}</h3><span className="rounded-full bg-blue-50 px-2 py-1 text-[11px] font-medium text-blue-600">{item.item_type}</span></div><p className="mt-2 line-clamp-4 whitespace-pre-wrap text-sm leading-6 text-zinc-600">{item.content || 'Saved reference item'}</p></article>)}
                                </div>
                                <aside className="space-y-5">
                                    <div className="rounded-3xl border border-white/80 bg-white/70 p-5"><h3 className="mb-3 font-semibold text-zinc-950">Add note</h3><textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Capture next action, idea, or decision..." className="h-28 w-full rounded-2xl border border-zinc-200 bg-white p-3 text-sm outline-none focus:border-blue-300" /><button onClick={async () => { await addNote(note); setNote(''); }} className="mt-3 w-full rounded-2xl bg-zinc-950 px-4 py-2 text-sm font-semibold text-white">Save note</button></div>
                                    <div className="rounded-3xl border border-white/80 bg-white/70 p-5"><h3 className="mb-3 font-semibold text-zinc-950">Project actions</h3><div className="space-y-2 text-sm"><button className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-left">Export project</button><button className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-left">Rename project</button><button className="w-full rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-left text-red-600">Delete project</button></div></div>
                                </aside>
                            </section>
                        </div>
                    )}
                </main>
            </div>
        );
    }

    return (
        <div className="flex h-screen overflow-hidden bg-[linear-gradient(135deg,#f8fbff_0%,#ffffff_45%,#edf6ff_100%)]">
            <Sidebar />
            <main className="flex-1 overflow-y-auto p-6">
                <div className="mx-auto max-w-7xl">
                    <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div><p className="text-sm font-medium text-blue-600">UseGlass Projects</p><h1 className="mt-2 text-4xl font-semibold tracking-tight text-zinc-950">Projects</h1><p className="mt-2 text-zinc-600">Save and continue every chat, research result, document, code snippet, builder output, and agent result.</p></div>
                        <button onClick={createNewProject} className="inline-flex items-center gap-2 rounded-2xl bg-zinc-950 px-5 py-3 text-sm font-semibold text-white"><Plus size={16} /> Create Project</button>
                    </header>
                    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {loading || sessionsLoading ? <Loader2 className="animate-spin text-zinc-400" /> : projects.length > 0 ? projects.map(project => <button key={project.id} onClick={() => navigate(`/projects/${project.id}`)} className="group rounded-3xl border border-white/80 bg-white/75 p-5 text-left shadow-sm backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white"><div className="mb-5 flex items-center justify-between"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-50 text-purple-600"><FolderOpen size={20} /></div><ArrowRight className="text-zinc-400 group-hover:text-zinc-900" size={17} /></div><h3 className="font-semibold text-zinc-950">{project.name}</h3><p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-500">{project.description || 'Project workspace'}</p><p className="mt-4 text-xs text-zinc-400">Updated {new Date(project.updated_at).toLocaleDateString()}</p></button>) : <div className="col-span-full rounded-3xl border border-dashed border-zinc-200 bg-white/60 p-10 text-center"><FolderOpen className="mx-auto mb-4 text-blue-600" /><h3 className="font-semibold text-zinc-950">No projects yet</h3><p className="mt-2 text-sm text-zinc-500">Create your first workspace project or save an AI output from chat.</p></div>}
                    </section>
                    <section className="mt-8 rounded-3xl border border-white/80 bg-white/70 p-5"><h2 className="mb-4 font-semibold text-zinc-950">Recent chats that can become projects</h2><div className="grid gap-3 md:grid-cols-2">{sessions.slice(0, 6).map(session => <button key={session.id} onClick={() => navigate(`/chat/${session.id}`)} className="flex items-center justify-between rounded-2xl border border-zinc-100 bg-white/80 p-4 text-left"><span><b className="block text-sm text-zinc-900">{session.title || 'Untitled Chat'}</b><small className="text-zinc-500">Continue or save outputs to project</small></span><MessageSquare size={16} /></button>)}</div></section>
                </div>
            </main>
        </div>
    );
};

export default ProjectsPage;
