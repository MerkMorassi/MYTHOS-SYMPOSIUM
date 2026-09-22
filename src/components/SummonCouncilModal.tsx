import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Sparkles, 
  X, 
  Check, 
  Copy, 
  Plus, 
  Scale, 
  MessageSquare, 
  RotateCcw, 
  Zap, 
  Flame, 
  ShieldAlert, 
  FileText, 
  ArrowRight,
  ChevronRight
} from 'lucide-react';
import { AGENTS, Agent } from '../lib/agents';
import { 
  CouncilFeedback, 
  COUNCIL_PRESETS, 
  FOCUS_DIRECTIVES, 
  AGENT_THEMES, 
  summonAgentFeedback 
} from '../lib/council';

interface SummonCouncilModalProps {
  isOpen: boolean;
  onClose: () => void;
  manuscript: string;
  modelName: string;
  selectedAgentIds: string[];
  onUpdateSelectedAgentIds: (ids: string[]) => void;
  feedbacks: CouncilFeedback[];
  onFeedbacksGenerated: (feedbacks: CouncilFeedback[]) => void;
  onAdoptPatch: (patch: string, agentHandle: string) => void;
  onPostToDiscussion: (feedback: CouncilFeedback) => void;
}

export function SummonCouncilModal({
  isOpen,
  onClose,
  manuscript,
  modelName,
  selectedAgentIds,
  onUpdateSelectedAgentIds,
  feedbacks,
  onFeedbacksGenerated,
  onAdoptPatch,
  onPostToDiscussion
}: SummonCouncilModalProps) {
  const [activeStage, setActiveStage] = useState<'roster' | 'contrasts'>(
    feedbacks.length > 0 ? 'contrasts' : 'roster'
  );
  const [focusDirective, setFocusDirective] = useState<string>(FOCUS_DIRECTIVES[0]);
  const [customDirective, setCustomDirective] = useState<string>('');
  const [isSummoning, setIsSummoning] = useState<boolean>(false);
  const [summonProgress, setSummonProgress] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [adoptedId, setAdoptedId] = useState<string | null>(null);
  const [postedId, setPostedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleAgent = (id: string) => {
    if (selectedAgentIds.includes(id)) {
      if (selectedAgentIds.length <= 1) return; // Maintain at least 1
      onUpdateSelectedAgentIds(selectedAgentIds.filter(a => a !== id));
    } else {
      onUpdateSelectedAgentIds([...selectedAgentIds, id]);
    }
  };

  const applyPreset = (presetAgentIds: string[]) => {
    onUpdateSelectedAgentIds(presetAgentIds);
  };

  const handleSummon = async () => {
    if (selectedAgentIds.length === 0) return;
    setIsSummoning(true);
    setSummonProgress('Invoking council chamber...');
    setActiveStage('contrasts');

    const effectiveDirective = customDirective.trim() || focusDirective;
    const chosenAgents = AGENTS.filter(a => selectedAgentIds.includes(a.id));

    const results: CouncilFeedback[] = [];

    // Run parallel summoning
    const promises = chosenAgents.map(async (agent, index) => {
      setSummonProgress(`Resonating with ${agent.handle}...`);
      const fb = await summonAgentFeedback(agent, manuscript, effectiveDirective, modelName);
      return fb;
    });

    try {
      const settled = await Promise.allSettled(promises);
      settled.forEach((res, i) => {
        if (res.status === 'fulfilled') {
          results.push(res.value);
        }
      });
      onFeedbacksGenerated(results);
    } catch (err) {
      console.error('Summon error:', err);
    } finally {
      setIsSummoning(false);
      setSummonProgress('');
    }
  };

  const handleCopy = (feedback: CouncilFeedback) => {
    const text = `[${feedback.agentHandle} - ${feedback.stanceTitle}]\nAlignment: ${feedback.alignmentScore}%\n\nCritique:\n${feedback.critique}\n\nContrast:\n${feedback.contrastPoint}\n\nProposal:\n${feedback.proposedPatch}`;
    navigator.clipboard.writeText(text);
    setCopiedId(feedback.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleAdopt = (feedback: CouncilFeedback) => {
    onAdoptPatch(feedback.proposedPatch, feedback.agentHandle);
    setAdoptedId(feedback.id);
    setTimeout(() => setAdoptedId(null), 1800);
  };

  const handlePost = (feedback: CouncilFeedback) => {
    onPostToDiscussion(feedback);
    setPostedId(feedback.id);
    setTimeout(() => setPostedId(null), 1800);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          className="bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl max-w-6xl w-full overflow-hidden flex flex-col h-[90vh]"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base md:text-lg font-bold text-white tracking-tight">
                    Symposium Council Chamber
                  </h2>
                  <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-mono uppercase tracking-widest font-semibold">
                    Multi-Agent Contrasts
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Summon distinct mythos agents to challenge, audit, and contrastively critique the manuscript
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Stage switch buttons */}
              <div className="hidden sm:flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs">
                <button
                  onClick={() => setActiveStage('roster')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                    activeStage === 'roster'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  1. Roster ({selectedAgentIds.length})
                </button>
                <button
                  onClick={() => setActiveStage('contrasts')}
                  disabled={feedbacks.length === 0 && !isSummoning}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                    activeStage === 'contrasts'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : feedbacks.length === 0
                      ? 'text-slate-600 cursor-not-allowed'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  2. Contrasting Voices ({feedbacks.length})
                </button>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
            {activeStage === 'roster' ? (
              <div className="space-y-6">
                {/* Presets */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      Council Dialectic Presets
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Quickly configure contrasting perspectives
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {COUNCIL_PRESETS.map((preset) => {
                      const isApplied = preset.agentIds.length === selectedAgentIds.length && 
                        preset.agentIds.every(id => selectedAgentIds.includes(id));
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => applyPreset(preset.agentIds)}
                          className={`p-3.5 rounded-xl border text-left transition-all relative overflow-hidden group ${
                            isApplied
                              ? 'bg-amber-500/10 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                              : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold">
                              {preset.tag}
                            </span>
                            {isApplied && (
                              <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.8)]" />
                            )}
                          </div>
                          <h4 className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                            {preset.title}
                          </h4>
                          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed line-clamp-2">
                            {preset.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Agents Grid */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-amber-500" />
                      Select Councilors ({selectedAgentIds.length} of {AGENTS.length} active)
                    </span>
                    <button
                      onClick={() => onUpdateSelectedAgentIds(AGENTS.map(a => a.id))}
                      className="text-[11px] text-amber-400 hover:text-amber-300 transition-colors font-medium"
                    >
                      Select All
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {AGENTS.map((agent) => {
                      const isSelected = selectedAgentIds.includes(agent.id);
                      const theme = AGENT_THEMES[agent.id] || AGENT_THEMES.NOESIS;
                      return (
                        <div
                          key={agent.id}
                          onClick={() => toggleAgent(agent.id)}
                          className={`p-4 rounded-xl border cursor-pointer transition-all relative ${
                            isSelected
                              ? 'bg-slate-900/90 border-amber-500/40 shadow-[0_0_20px_rgba(0,0,0,0.4)]'
                              : 'bg-slate-950/60 border-slate-800/80 opacity-60 hover:opacity-100 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold text-white shadow-md transition-transform"
                                style={{ backgroundColor: theme.color }}
                              >
                                {agent.handle.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="text-xs font-bold text-white">{agent.handle}</h4>
                                  <span className={`text-[9px] px-1.5 py-0.2 rounded border font-mono uppercase ${theme.badgeBg} ${theme.badgeBorder} ${theme.badgeText}`}>
                                    {agent.id}
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-400 line-clamp-1">{agent.role}</p>
                              </div>
                            </div>
                            <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                              isSelected
                                ? 'bg-amber-500 border-amber-500 text-slate-950'
                                : 'border-slate-700 bg-slate-900'
                            }`}>
                              {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-2.5 leading-relaxed line-clamp-2 italic">
                            "{agent.meta.description}"
                          </p>
                          <div className="mt-2.5 flex items-center gap-1.5 text-[9px] text-slate-500 font-mono">
                            <span>Tone:</span>
                            <span className="text-slate-300">{agent.meta.tone}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Inquiry & Directive */}
                <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-3">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-amber-500" />
                    Inquiry Focus & Debate Directive
                  </span>
                  <p className="text-xs text-slate-400">
                    Instruct the council on which angle to contrastively audit within the current manuscript.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {FOCUS_DIRECTIVES.map((directive) => (
                      <button
                        key={directive}
                        type="button"
                        onClick={() => {
                          setFocusDirective(directive);
                          setCustomDirective('');
                        }}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                          focusDirective === directive && !customDirective
                            ? 'bg-amber-500/10 border-amber-500 text-amber-400 font-semibold'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {directive}
                      </button>
                    ))}
                  </div>
                  <div className="pt-2">
                    <input
                      type="text"
                      value={customDirective}
                      onChange={(e) => setCustomDirective(e.target.value)}
                      placeholder="Or specify a custom debate inquiry (e.g. 'Critique the corporate taxonomy vs divine authority')..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50"
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* Contrasting Perspectives Chamber */
              <div className="space-y-6">
                {/* Tension Matrix Banner */}
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Scale className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        Philosophical Tension Spectrum
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Directive: <span className="text-amber-400 font-semibold">{customDirective || focusDirective}</span>
                    </span>
                  </div>

                  {/* Badges showing divergence */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
                    {feedbacks.map((fb) => {
                      const theme = AGENT_THEMES[fb.agentId] || AGENT_THEMES.NOESIS;
                      return (
                        <div
                          key={fb.id}
                          className="flex items-center gap-2 p-2 rounded-lg bg-slate-950/80 border border-slate-800/80"
                        >
                          <div 
                            className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                            style={{ backgroundColor: theme.color }}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <p className="text-[11px] font-bold text-white truncate">{fb.agentHandle}</p>
                              <span className="text-[10px] font-mono text-amber-400 font-semibold">
                                {fb.alignmentScore}% Align
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 truncate">{fb.stanceTitle}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Individual Agent Feedback Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {feedbacks.map((fb) => {
                    const theme = AGENT_THEMES[fb.agentId] || AGENT_THEMES.NOESIS;
                    const isCopied = copiedId === fb.id;
                    const isAdopted = adoptedId === fb.id;
                    const isPosted = postedId === fb.id;

                    return (
                      <div
                        key={fb.id}
                        className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-slate-700/80 transition-all flex flex-col justify-between space-y-4 shadow-lg relative overflow-hidden"
                      >
                        {/* Glow indicator line */}
                        <div 
                          className="absolute top-0 left-0 right-0 h-1"
                          style={{ backgroundColor: theme.color }}
                        />

                        {/* Card Header */}
                        <div>
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold text-white shadow-md shrink-0"
                                style={{ backgroundColor: theme.color }}
                              >
                                {fb.agentHandle.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="text-sm font-bold text-white">{fb.agentHandle}</h4>
                                  <span className={`text-[9px] px-2 py-0.5 rounded border font-mono uppercase font-bold ${theme.badgeBg} ${theme.badgeBorder} ${theme.badgeText}`}>
                                    {fb.agentRole.split(':')[0] || fb.agentId}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-400 italic">Tone: {fb.tone}</p>
                              </div>
                            </div>

                            {/* Alignment Gauge */}
                            <div className="text-right shrink-0">
                              <div className="flex items-center gap-1.5 justify-end">
                                <span className="text-[10px] font-mono text-slate-400">Alignment:</span>
                                <span className="text-xs font-mono font-bold text-white">{fb.alignmentScore}%</span>
                              </div>
                              <div className="w-20 h-1.5 bg-slate-800 rounded-full mt-1 overflow-hidden">
                                <div 
                                  className="h-full rounded-full transition-all duration-500"
                                  style={{ 
                                    width: `${fb.alignmentScore}%`,
                                    backgroundColor: theme.color 
                                  }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Stance Title */}
                          <div className="mt-3.5 p-2 rounded-lg bg-slate-950/70 border border-slate-800/80">
                            <span className="text-[10px] font-mono uppercase text-slate-500 tracking-wider block mb-0.5">
                              Declared Verdict & Stance
                            </span>
                            <p className="text-xs font-bold text-amber-300">
                              "{fb.stanceTitle}"
                            </p>
                          </div>

                          {/* Critique text */}
                          <div className="mt-3 space-y-2">
                            <p className="text-xs text-slate-300 leading-relaxed">
                              {fb.critique}
                            </p>
                          </div>

                          {/* Contrast Point Callout */}
                          <div className="mt-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs">
                            <div className="flex items-center gap-1.5 text-amber-400 font-semibold mb-1">
                              <Scale className="w-3.5 h-3.5" />
                              <span className="text-[10px] uppercase font-bold tracking-wider">
                                Direct Contrast with Other Voices
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-300 leading-relaxed">
                              {fb.contrastPoint}
                            </p>
                          </div>

                          {/* Proposed Patch Snippet */}
                          {fb.proposedPatch && (
                            <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-slate-800/90">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[10px] font-mono uppercase text-slate-500 font-bold tracking-wider flex items-center gap-1">
                                  <FileText className="w-3 h-3 text-slate-400" />
                                  Proposed Lore Patch
                                </span>
                              </div>
                              <p className="text-[11px] font-mono text-amber-200/80 leading-relaxed italic border-l-2 border-amber-500/50 pl-2 py-0.5">
                                "{fb.proposedPatch}"
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => handleCopy(fb)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{isCopied ? 'Copied' : 'Copy Stance'}</span>
                          </button>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handlePost(fb)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-300 hover:text-amber-400 hover:border-amber-500/40 transition-colors"
                            >
                              {isPosted ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <MessageSquare className="w-3.5 h-3.5" />}
                              <span>{isPosted ? 'Posted to Chat!' : 'Post to Discussion'}</span>
                            </button>

                            {fb.proposedPatch && (
                              <button
                                type="button"
                                onClick={() => handleAdopt(fb)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-all shadow-[0_0_12px_rgba(245,158,11,0.2)]"
                              >
                                {isAdopted ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                                <span>{isAdopted ? 'Applied to Text!' : 'Adopt Patch'}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              {isSummoning ? (
                <div className="flex items-center gap-2 text-amber-400">
                  <div className="w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                  <span className="font-mono text-xs">{summonProgress || 'Summoning council...'}</span>
                </div>
              ) : activeStage === 'contrasts' ? (
                <button
                  onClick={() => setActiveStage('roster')}
                  className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Configure Roster & Inquiries</span>
                </button>
              ) : (
                <span>
                  {selectedAgentIds.length} councilors selected for contrasting critique
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
              >
                Close
              </button>

              <button
                type="button"
                onClick={handleSummon}
                disabled={isSummoning || selectedAgentIds.length === 0}
                className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 px-5 py-2 rounded-xl text-xs font-bold hover:from-amber-400 hover:to-orange-400 transition-all shadow-[0_0_18px_rgba(245,158,11,0.25)] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isSummoning ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Summoning Debate...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-slate-950" />
                    <span>
                      {activeStage === 'contrasts' ? 'Re-Summon Contrasting Debate' : `Summon ${selectedAgentIds.length} Voices`}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
