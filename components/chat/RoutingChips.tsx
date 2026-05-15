import React, { useState } from 'react';
import { Sparkles, Info, X, AlertTriangle, Users, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GlassRoutingResult } from '@/lib/glassAutoRouter';
import { WORKFLOW_MODES, GLASS_STYLES } from '@/components/ResearchWelcome';

type Props = {
  routing: GlassRoutingResult;
  autoPilotOn?: boolean;
  isPending?: boolean;
  team?: { activate: boolean; reason: string | null; workstreams: string[] };
  isReadingSkill?: boolean;
  onHide?: () => void;
  className?: string;
};

const TOOL_LABELS: Record<string, string> = {
  chat: 'Glass Chat',
  search: 'Glass Search',
  builder: 'Glass Build',
  code: 'Glass Code',
  omni: 'Glass Omni',
};

const labelOrId = <T extends { id: string; label: string }>(
  list: ReadonlyArray<T>,
  id: string,
) => list.find((item) => item.id === id)?.label || id;

const RoutingChips: React.FC<Props> = ({
  routing,
  autoPilotOn = true,
  isPending = false,
  team,
  isReadingSkill = false,
  onHide,
  className,
}) => {
  const [openDetails, setOpenDetails] = useState(false);

  const toolLabel = TOOL_LABELS[routing.selectedTool] || routing.selectedTool;
  const workflowLabel = labelOrId(WORKFLOW_MODES, routing.selectedWorkflowMode);
  const styleLabel = labelOrId(GLASS_STYLES, routing.selectedStyle);
  const connectorMissing =
    !routing.selectedConnector && /* heuristic */ false; // backend signals via routing, omitted in local

  return (
    <div
      className={cn(
        'pointer-events-auto flex items-center gap-1.5 sm:gap-2 rounded-2xl border border-white/70 bg-white/80 px-2.5 py-1.5 sm:px-3 sm:py-2 text-[11px] sm:text-xs text-zinc-600 shadow-sm backdrop-blur-xl',
        'max-w-full overflow-x-auto whitespace-nowrap [scrollbar-width:none] [-ms-overflow-style:none] [-webkit-overflow-scrolling:touch] [touch-action:pan-x]',
        '[&::-webkit-scrollbar]:hidden',
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <span
        className={cn(
          'inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-1 font-medium transition',
          autoPilotOn
            ? 'border-blue-200 bg-blue-50 text-blue-700'
            : 'border-stone-200 bg-white text-stone-600',
          isPending && 'animate-pulse',
        )}
        title={autoPilotOn ? 'Auto Pilot is choosing tool, mode, and skill' : 'Auto Pilot off'}
      >
        <Sparkles size={12} />
        Auto Pilot{autoPilotOn ? '' : ' off'}
      </span>

      {team?.activate && (
        <span
          className="inline-flex shrink-0 items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2 py-1 font-medium text-indigo-700"
          title={team.reason || 'Auto Pilot Team running multiple workstreams.'}
        >
          <Users size={12} />
          Team: {team.workstreams.join(' → ')}
        </span>
      )}

      <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-1 font-medium text-zinc-700">
        {toolLabel}
      </span>
      <span className="shrink-0 rounded-full bg-sky-50 px-2 py-1 font-medium text-sky-700">
        {workflowLabel}
      </span>
      <span className="shrink-0 rounded-full bg-orange-50 px-2 py-1 font-medium text-orange-700">
        {styleLabel}
      </span>

      {routing.selectedSkill && (
        <span
          className={cn(
            "shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-1 font-medium",
            isReadingSkill
              ? "bg-violet-100 text-violet-800 ring-1 ring-violet-300 animate-pulse"
              : "bg-violet-50 text-violet-700",
          )}
          title={isReadingSkill ? `Reading ${routing.selectedSkill} skill...` : routing.selectedSkill}
        >
          <BookOpen size={11} className={isReadingSkill ? "animate-pulse" : undefined} />
          {isReadingSkill ? `Reading ${routing.selectedSkill}…` : routing.selectedSkill}
        </span>
      )}
      {routing.selectedConnector && (
        <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-1 font-medium text-emerald-700">
          {routing.selectedConnector}
        </span>
      )}
      {routing.canvasType && (
        <span className="shrink-0 rounded-full bg-cyan-50 px-2 py-1 font-medium text-cyan-700">
          {routing.canvasType[0].toUpperCase() + routing.canvasType.slice(1)} Canvas
        </span>
      )}
      {connectorMissing && (
        <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 font-medium text-amber-700">
          <AlertTriangle size={11} />
          Connector needed
        </span>
      )}

      <div className="relative ml-auto flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => setOpenDetails((v) => !v)}
          className="min-h-[32px] min-w-[44px] rounded-full px-2 py-1 text-zinc-500 active:bg-zinc-100 hover:bg-zinc-50 [touch-action:manipulation]"
          title="Why this routing?"
          aria-expanded={openDetails}
        >
          <Info size={12} className="inline-block align-middle" />
          <span className="ml-1 align-middle">Why?</span>
        </button>

        {openDetails && (
          <div
            className="absolute bottom-full right-0 z-50 mb-2 w-[min(85vw,18rem)] sm:w-72 whitespace-normal rounded-2xl border border-zinc-200 bg-white p-3 text-[12px] leading-5 text-zinc-600 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-1 flex items-center justify-between">
              <span className="font-semibold text-zinc-800">Auto Pilot reasoning</span>
              <button
                type="button"
                onClick={() => setOpenDetails(false)}
                className="rounded p-1 text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600 [touch-action:manipulation]"
                aria-label="Close"
              >
                <X size={14} />
              </button>
            </div>
            <div><b>Intent:</b> {routing.detectedIntent}</div>
            <div><b>Tool:</b> {toolLabel}</div>
            <div><b>Mode:</b> {workflowLabel}</div>
            <div><b>Style:</b> {styleLabel}</div>
            <div><b>Skill:</b> {routing.selectedSkill || 'none'}</div>
            <div><b>Connector:</b> {routing.selectedConnector || 'none'}</div>
            <div><b>Canvas:</b> {routing.canvasType || 'none'}</div>
            <div><b>Confidence:</b> {Math.round(routing.confidence * 100)}%</div>
            <div className="mt-1 border-t border-zinc-100 pt-1 text-zinc-500">{routing.reason}</div>
          </div>
        )}

        {onHide && (
          <button
            type="button"
            onClick={onHide}
            className="min-h-[32px] min-w-[40px] rounded-full px-2 py-1 text-zinc-400 active:bg-zinc-100 hover:bg-zinc-50 hover:text-zinc-600 [touch-action:manipulation]"
            title="Hide routing chips"
          >
            Hide
          </button>
        )}
      </div>
    </div>
  );
};

export default RoutingChips;
