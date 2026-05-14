import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { detectMode } from '@/lib/modeDetector';
import { routeGlassIntent } from '@/lib/glassAutoRouter';
import { useUser } from '@/lib/authContext';
import Sidebar from '../Sidebar';
import { ResearchWelcome, WorkflowModeId, GlassStyleId } from '../ResearchWelcome';

type GlassToolMode = 'chat' | 'search' | 'agents' | 'builder' | 'code' | 'omni' | 'documents';

const normalizeMode = (value: unknown): GlassToolMode => {
  const allowed: GlassToolMode[] = ['chat', 'search', 'agents', 'builder', 'code', 'omni', 'documents'];
  return allowed.includes(value as GlassToolMode) ? (value as GlassToolMode) : 'chat';
};

const Home: React.FC<{ defaultMode?: 'chat' | 'redesign' }> = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const [activeToolMode, setActiveToolMode] = React.useState<GlassToolMode>(() => normalizeMode(location.state?.glassMode));
  const [sidebarOpen, setSidebarOpenState] = React.useState(false);
  const [activeSkillId, setActiveSkillId] = React.useState<string | null>((location.state?.activeSkillId as string) || null);
  const [activeConnectorId, setActiveConnectorId] = React.useState<string | null>((location.state?.activeConnectorId as string) || null);
  const [activeWorkflowMode, setActiveWorkflowMode] = React.useState<WorkflowModeId>((location.state?.workflowMode as WorkflowModeId) || 'think');
  const [activeGlassStyle, setActiveGlassStyle] = React.useState<GlassStyleId>((location.state?.glassStyle as GlassStyleId) || 'normal');
  const selectToolMode = (mode: GlassToolMode) => {
    setActiveToolMode(mode);
    setSidebarOpenState(false);
  };

  React.useEffect(() => {
    if (location.state?.glassMode) setActiveToolMode(normalizeMode(location.state.glassMode));
    if (location.state?.workflowMode) setActiveWorkflowMode(location.state.workflowMode as WorkflowModeId);
    if (location.state?.glassStyle) setActiveGlassStyle(location.state.glassStyle as GlassStyleId);
  }, [location.state]);

  const submitPrompt = (query: string, _attachments?: any[], model?: any, reasoning?: boolean) => {
    const routingResult = routeGlassIntent(query, { webSearchConnected: true });
    const routedTool = routingResult.selectedTool as GlassToolMode;
    const detectedMode = routedTool === 'builder' ? 'builder' : detectMode(query);
    navigate('/chat', {
      state: {
        initialPrompt: query,
        draftPrompt: query,
        mode: detectedMode,
        glassMode: routedTool,
        autoSend: true,
        model,
        reasoning: reasoning || routedTool === 'search' || routedTool === 'omni',
        enableWebSearch: routingResult.selectedConnector === 'Web Search',
        activeSkillId: routingResult.selectedSkill,
        activeConnectorId: routingResult.selectedConnector === 'Web Search' ? 'web-search' : null,
        workflowMode: routingResult.selectedWorkflowMode,
        glassStyle: routingResult.selectedStyle,
        canvasType: routingResult.canvasType,
        routingResult,
        autoMode: true,
      },
    });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[linear-gradient(135deg,#f8fbff_0%,#ffffff_45%,#edf6ff_100%)]">
      <Sidebar activeToolMode={activeToolMode} onToolModeSelect={selectToolMode} isCollapsed={!sidebarOpen} onCollapse={() => setSidebarOpenState((open) => !open)} />
      <div className="flex-1 overflow-y-auto">
        <main className="relative min-h-screen w-full px-5 py-8 md:px-10">
          <section className="absolute left-1/2 top-[48%] flex w-full max-w-4xl -translate-x-1/2 -translate-y-1/2 flex-col items-center text-center">
            <div className="w-full max-w-3xl">
              <ResearchWelcome
                mode={activeToolMode}
                onModeChange={setActiveToolMode}
                onSearch={submitPrompt}
                userName={user?.firstName || undefined}
                isWebSearchEnabled={activeToolMode === 'search'}
                activeSkillId={activeSkillId}
                onSkillChange={setActiveSkillId}
                activeConnectorId={activeConnectorId}
                onConnectorChange={setActiveConnectorId}
                activeWorkflowMode={activeWorkflowMode}
                onWorkflowModeChange={setActiveWorkflowMode}
                activeGlassStyle={activeGlassStyle}
                onGlassStyleChange={setActiveGlassStyle}
              />
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default Home;
