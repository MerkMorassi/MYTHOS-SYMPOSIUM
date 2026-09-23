import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  BookOpen, 
  Dna, 
  Radio, 
  Layers, 
  Copy, 
  Check, 
  Bookmark, 
  ArrowRight, 
  Compass, 
  Eye, 
  FileText, 
  CheckCircle2, 
  RefreshCw,
  Scale,
  Quote,
  Shield,
  History,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LorepackDoc } from '../lib/firestore-service';
import { 
  TriadicInterpretation, 
  ArtifactVector, 
  GeneticVector, 
  MemeticVector,
  extractTriadicVectorsFromCodex, 
  synthesizeCrossCodexInterpretation 
} from '../lib/triadic-synthesis';
import { FactorySettings } from '../App';
import { AGENTS } from '../lib/agents';

interface TriadicSynthesizerViewProps {
  lorepacks: LorepackDoc[];
  settings: FactorySettings;
  onOpenCodex: (pack: LorepackDoc) => void;
}

export function TriadicSynthesizerView({ 
  lorepacks, 
  settings, 
  onOpenCodex 
}: TriadicSynthesizerViewProps) {
  // Selected Codex IDs for Cross-Codex synthesis (default to first two)
  const [selectedCodexIds, setSelectedCodexIds] = useState<string[]>(() => {
    if (lorepacks.length >= 2) return [lorepacks[0].id, lorepacks[1].id];
    if (lorepacks.length === 1) return [lorepacks[0].id];
    return [];
  });

  const [activeVectorTab, setActiveVectorTab] = useState<'all' | 'artifacts' | 'genetics' | 'memetics'>('all');
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [currentInterpretation, setCurrentInterpretation] = useState<TriadicInterpretation | null>(null);
  const [savedInterpretations, setSavedInterpretations] = useState<TriadicInterpretation[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedSavedId, setSelectedSavedId] = useState<string | null>(null);

  // Selected Codex documents
  const selectedCodexes = useMemo(() => {
    return lorepacks.filter(p => selectedCodexIds.includes(p.id));
  }, [lorepacks, selectedCodexIds]);

  // Aggregate extracted vectors from all selected codexes
  const extractedData = useMemo(() => {
    const artifacts: ArtifactVector[] = [];
    const genetics: GeneticVector[] = [];
    const memetics: MemeticVector[] = [];

    selectedCodexes.forEach(c => {
      const data = extractTriadicVectorsFromCodex(c);
      artifacts.push(...data.artifacts);
      genetics.push(...data.genetics);
      memetics.push(...data.memetics);
    });

    return { artifacts, genetics, memetics };
  }, [selectedCodexes]);

  // Toggle codex selection
  const handleToggleCodex = (id: string) => {
    setSelectedCodexIds(prev => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev; // Keep at least one
        return prev.filter(cId => cId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Run Synthesis
  const handleSynthesize = async () => {
    if (selectedCodexes.length === 0) return;
    setIsSynthesizing(true);

    try {
      const interp = await synthesizeCrossCodexInterpretation(
        selectedCodexes, 
        settings.operatorName, 
        settings.defaultModel
      );
      setCurrentInterpretation(interp);
      setSavedInterpretations(prev => [interp, ...prev.filter(item => item.id !== interp.id)]);
      setSelectedSavedId(interp.id);
    } catch (err) {
      console.error('Synthesis failed:', err);
    } finally {
      setIsSynthesizing(false);
    }
  };

  // Active displayed interpretation (either live or selected from history)
  const activeDisplay = useMemo(() => {
    if (selectedSavedId) {
      const found = savedInterpretations.find(i => i.id === selectedSavedId);
      if (found) return found;
    }
    return currentInterpretation;
  }, [selectedSavedId, savedInterpretations, currentInterpretation]);

  return (
    <div className="flex flex-col h-full gap-6 overflow-hidden">
      {/* View Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              Hermeneutic Synthesis Engine
            </h2>
            <span className="text-[10px] bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-widest">
              Artifacts · Genetic · Memetic
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Access lorepack manuscripts to extract physical relics, biological genotypes, and memetic contagions to synthesize profound new cross-codex interpretations.
          </p>
        </div>

        {/* Action button to execute synthesis */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSynthesize}
            disabled={isSynthesizing || selectedCodexes.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-slate-950 font-bold text-xs shadow-lg hover:shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
          >
            {isSynthesizing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                <span>Synthesizing Vectors...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-slate-950" />
                <span>Synthesize New Interpretation</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0 overflow-hidden">
        {/* Left Column: Codex Selection & Extracted Triadic Vectors (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4 min-h-0 overflow-hidden">
          {/* Codex Selection Bar */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 shrink-0 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5 font-mono">
                <BookOpen className="w-3.5 h-3.5 text-amber-500" />
                Select Source Codexes ({selectedCodexIds.length}/{lorepacks.length})
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                Cross-Reference Active
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto custom-scrollbar pr-1">
              {lorepacks.map((pack) => {
                const isSelected = selectedCodexIds.includes(pack.id);
                return (
                  <button
                    key={pack.id}
                    onClick={() => handleToggleCodex(pack.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500/60 text-white shadow-sm'
                        : 'bg-slate-950 border-slate-800/80 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="text-xs font-bold truncate pr-1">{pack.title}</span>
                      {isSelected ? (
                        <Check className="w-3 h-3 text-amber-400 shrink-0" />
                      ) : (
                        <div className="w-2.5 h-2.5 rounded-full border border-slate-700" />
                      )}
                    </div>
                    <span className="text-[9px] font-mono text-slate-500 uppercase">
                      {pack.category}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Triadic Vector Breakdown (Artifacts, Genetics, Memetics) */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl flex-1 flex flex-col min-h-0 overflow-hidden shadow-xl">
            {/* Vector Tabs */}
            <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 shrink-0">
              <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                <button
                  onClick={() => setActiveVectorTab('all')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                    activeVectorTab === 'all'
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All ({extractedData.artifacts.length + extractedData.genetics.length + extractedData.memetics.length})
                </button>
                <button
                  onClick={() => setActiveVectorTab('artifacts')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                    activeVectorTab === 'artifacts'
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-cyan-300'
                  }`}
                >
                  <span>🏺 Artifacts</span>
                  <span className="text-[9px] font-mono opacity-80">({extractedData.artifacts.length})</span>
                </button>
                <button
                  onClick={() => setActiveVectorTab('genetics')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                    activeVectorTab === 'genetics'
                      ? 'bg-emerald-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-emerald-300'
                  }`}
                >
                  <span>🧬 Genetics</span>
                  <span className="text-[9px] font-mono opacity-80">({extractedData.genetics.length})</span>
                </button>
                <button
                  onClick={() => setActiveVectorTab('memetics')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                    activeVectorTab === 'memetics'
                      ? 'bg-purple-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-purple-300'
                  }`}
                >
                  <span>🧠 Memetics</span>
                  <span className="text-[9px] font-mono opacity-80">({extractedData.memetics.length})</span>
                </button>
              </div>
            </div>

            {/* Vector Cards List */}
            <div className="p-4 flex-1 overflow-y-auto space-y-3 custom-scrollbar">
              {/* Artifacts */}
              {(activeVectorTab === 'all' || activeVectorTab === 'artifacts') && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5 font-mono">
                    🏺 Physical Relics & Techno-Vessels
                  </span>
                  {extractedData.artifacts.map((art) => (
                    <div
                      key={art.id}
                      className="p-3 rounded-xl bg-slate-950/80 border border-cyan-500/20 hover:border-cyan-500/40 transition-colors space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-bold text-white">{art.name}</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-mono">
                          {art.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed font-serif">
                        {art.physicalForm}
                      </p>
                      <div className="text-[10px] text-cyan-200/80 font-mono bg-cyan-950/40 p-1.5 rounded border border-cyan-900/50">
                        ⚡ Resonance: {art.functionalResonance}
                      </div>
                      <span className="text-[9px] text-slate-500 block">
                        Source: {art.sourceCodexTitle}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Genetics */}
              {(activeVectorTab === 'all' || activeVectorTab === 'genetics') && (
                <div className="space-y-2 pt-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 font-mono">
                    🧬 Biological Lineages & Divergence Strains
                  </span>
                  {extractedData.genetics.map((gen) => (
                    <div
                      key={gen.id}
                      className="p-3 rounded-xl bg-slate-950/80 border border-emerald-500/20 hover:border-emerald-500/40 transition-colors space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-bold text-white">{gen.strainName}</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-mono">
                          {gen.taxonomy}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                        {gen.biologicalTraits}
                      </p>
                      <div className="text-[10px] text-emerald-200/80 font-mono bg-emerald-950/40 p-1.5 rounded border border-emerald-900/50">
                        🧬 Mutation Pattern: {gen.divergencePattern}
                      </div>
                      <span className="text-[9px] text-slate-500 block">
                        Source: {gen.sourceCodexTitle}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Memetics */}
              {(activeVectorTab === 'all' || activeVectorTab === 'memetics') && (
                <div className="space-y-2 pt-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5 font-mono">
                    🧠 Memetic Contagions & Liturgical Dogmas
                  </span>
                  {extractedData.memetics.map((mem) => (
                    <div
                      key={mem.id}
                      className="p-3 rounded-xl bg-slate-950/80 border border-purple-500/20 hover:border-purple-500/40 transition-colors space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-bold text-white">{mem.memeTitle}</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-300 border border-purple-500/30 font-mono">
                          {mem.vectorType}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed font-serif italic">
                        "{mem.coreDogma}"
                      </p>
                      <div className="text-[10px] text-purple-200/80 font-mono bg-purple-950/40 p-1.5 rounded border border-purple-900/50">
                        📡 Vector Transmission: {mem.transmissionMode}
                      </div>
                      <span className="text-[9px] text-slate-500 block">
                        Source: {mem.sourceCodexTitle}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Synthesized Interpretation Presentation & History (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4 min-h-0 overflow-hidden">
          {activeDisplay ? (
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl flex-1 flex flex-col min-h-0 overflow-hidden shadow-2xl">
              {/* Header */}
              <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-widest text-amber-400 font-bold block">
                      Synthesized Hermeneutic Interpretation
                    </span>
                    <h3 className="text-sm font-bold text-white tracking-tight">
                      {activeDisplay.title}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const text = `# ${activeDisplay.title}\n\n## Convergence\n${activeDisplay.triadicConvergence}\n\n## Theological Implication\n${activeDisplay.theologicalConsequence}\n\n## Axioms\n${activeDisplay.emergentMythicAxioms.join('\n')}`;
                      navigator.clipboard.writeText(text);
                      setCopiedId(activeDisplay.id);
                      setTimeout(() => setCopiedId(null), 1500);
                    }}
                    className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1 text-xs"
                    title="Copy full synthesized interpretation"
                  >
                    {copiedId === activeDisplay.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedId === activeDisplay.id ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Scrollable Content Body */}
              <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar flex-1">
                {/* Source Codex Badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] text-slate-500 uppercase font-mono">Synthesized From:</span>
                  {activeDisplay.sourceCodexTitles.map((title, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] bg-slate-950 border border-slate-800 px-2 py-0.5 rounded text-amber-300 font-serif font-bold"
                    >
                      {title}
                    </span>
                  ))}
                  <span className="text-[10px] text-slate-500 font-mono ml-auto">
                    {activeDisplay.createdAt} · By {activeDisplay.author}
                  </span>
                </div>

                {/* Convergence Analysis */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 font-mono">
                    <Compass className="w-4 h-4" />
                    <span>The Triadic Convergence (Artifact · Gene · Meme)</span>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950/70 border border-amber-500/20 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap font-serif">
                    {activeDisplay.triadicConvergence}
                  </div>
                </div>

                {/* Theological & Ontological Consequence */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono">
                    <Scale className="w-4 h-4" />
                    <span>Theological & Cosmological Consequence</span>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950/70 border border-cyan-500/20 text-xs text-slate-300 leading-relaxed font-sans">
                    {activeDisplay.theologicalConsequence}
                  </div>
                </div>

                {/* Emergent Mythic Axioms */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Emergent Mythic Axioms</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {activeDisplay.emergentMythicAxioms.map((ax, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-xs text-emerald-200 font-mono flex items-start gap-2.5"
                      >
                        <span className="text-emerald-400 font-bold shrink-0">✦</span>
                        <span>{ax}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Council Glosses on the Synthesis */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-400 font-mono">
                    <Quote className="w-4 h-4" />
                    <span>Pantheon Council Stances on this Synthesis</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {activeDisplay.councilGlosses.map((cg) => (
                      <div
                        key={cg.agentId}
                        className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">{cg.agentHandle}</span>
                          <span className="text-[9px] text-amber-400 font-mono">{cg.role}</span>
                        </div>
                        <p className="text-[10px] text-amber-300 font-bold">"{cg.stance}"</p>
                        <p className="text-[11px] text-slate-300 leading-relaxed font-sans">{cg.verdict}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl flex-1 flex flex-col items-center justify-center p-12 text-center shadow-xl">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mb-4 shadow-inner">
                <Layers className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                Awaiting Hermeneutic Synthesis
              </h3>
              <p className="text-xs text-slate-400 max-w-md leading-relaxed mb-6">
                Select one or more codexes on the left to review their extracted <strong>Artifacts</strong>, <strong>Genetic lineages</strong>, and <strong>Memetic dogmas</strong>. Then click below to synthesize a groundbreaking new interpretation.
              </p>
              <button
                onClick={handleSynthesize}
                disabled={isSynthesizing || selectedCodexes.length === 0}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow-lg hover:bg-amber-400 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Begin Triadic Synthesis</span>
              </button>
            </div>
          )}

          {/* Historical Saved Interpretations Library Drawer / Strip */}
          {savedInterpretations.length > 0 && (
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 shrink-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <History className="w-3 h-3 text-amber-400" />
                  Preserved Interpretations Archive ({savedInterpretations.length})
                </span>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
                {savedInterpretations.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedSavedId(item.id)}
                    className={`px-3 py-1.5 rounded-lg border text-left shrink-0 transition-all cursor-pointer text-xs ${
                      activeDisplay?.id === item.id
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="truncate max-w-[200px] block">{item.title}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
