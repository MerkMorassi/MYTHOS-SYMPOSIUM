import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  ChevronRight,
  ChevronLeft,
  Sparkles,
  MessageSquare,
  History,
  Eye,
  Check,
  Scale,
  Copy,
  Users,
  Database,
  Cloud,
  BookOpen,
  Search,
  Maximize2,
  Minimize2,
  Type,
  Bookmark,
  Compass,
  Quote,
  Clock,
  FileText,
  SlidersHorizontal,
  X,
  Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AGENTS, Agent } from '../lib/agents';
import { SummonCouncilModal } from '../components/SummonCouncilModal';
import { 
  CouncilFeedback, 
  AGENT_THEMES, 
  getFallbackAgentFeedback 
} from '../lib/council';
import { FactorySettings } from '../App';
import { 
  LorepackDoc, 
  RevisionDoc, 
  CommentDoc,
  subscribeRevisions, 
  subscribeComments, 
  saveCommentDoc, 
  subscribeCouncilFeedbacks, 
  saveCouncilFeedbackDoc 
} from '../lib/firestore-service';

export type ReaderPalette = 'obsidian' | 'parchment' | 'midnight' | 'onyx';
export type FontSize = 'sm' | 'base' | 'lg' | 'xl';
export type LineHeight = 'compact' | 'normal' | 'spacious';

interface SectionEntry {
  id: string;
  title: string;
  lineIndex: number;
}

export function SymposiumHallView({ 
  pack, 
  agent, 
  settings, 
  onBack 
}: { 
  pack: LorepackDoc; 
  agent: Agent; 
  settings: FactorySettings; 
  onBack: () => void; 
}) {
  const [isZenMode, setIsZenMode] = useState(false);
  const [readerView, setReaderView] = useState<'codex' | 'annotated'>('annotated');
  const [palette, setPalette] = useState<ReaderPalette>('obsidian');
  const [fontSize, setFontSize] = useState<FontSize>('base');
  const [lineHeight, setLineHeight] = useState<LineHeight>('normal');
  const [fontFamily, setFontFamily] = useState<'serif' | 'sans' | 'mono'>(settings.fontTheme || 'serif');
  const [isAppearanceOpen, setIsAppearanceOpen] = useState(false);
  const [isTocOpen, setIsTocOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);

  // Reading manuscript content (read-only lorepack text)
  const manuscript = useMemo(() => {
    return pack.manuscript || `SECTION I: THE ARCHIVAL RECORD\n\nNo manuscript text found for this lorepack.`;
  }, [pack.manuscript]);

  const [versions, setVersions] = useState<RevisionDoc[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Discussion comments & annotations
  const [comments, setComments] = useState<CommentDoc[]>([
    { id: '1', author: 'Merk Morassi', time: 'Archived', content: 'Notice the synthesis between theological liturgy and industrial thermodynamics in this codex.' },
    { id: '2', author: 'Archivax Scribe', time: 'Canonical', content: 'Confirmed cross-referenced against the Third Ledger of the Upper Firmament.' }
  ]);
  const [newCommentText, setNewCommentText] = useState('');

  // Council Summoning State
  const [isSummonModalOpen, setIsSummonModalOpen] = useState(false);
  const [selectedCouncilIds, setSelectedCouncilIds] = useState<string[]>(['ARCHIVAX', 'ERATO', 'MELPOMENE']);
  const [councilFeedbacks, setCouncilFeedbacks] = useState<CouncilFeedback[]>(() => {
    const initialAgents = AGENTS.filter(a => ['ARCHIVAX', 'ERATO', 'MELPOMENE'].includes(a.id));
    return initialAgents.map(a => getFallbackAgentFeedback(a, manuscript, 'Theological & Canonical Analysis'));
  });
  const [sidebarTab, setSidebarTab] = useState<'council' | 'discussion'>('council');
  const [copiedCouncilId, setCopiedCouncilId] = useState<string | null>(null);

  // Scroll reading progress
  const [readProgress, setReadProgress] = useState(0);
  const readerScrollRef = useRef<HTMLDivElement>(null);

  // Firestore Real-Time Subscriptions
  useEffect(() => {
    if (!pack?.id) return;

    const unsubRevisions = subscribeRevisions(pack.id, (cloudRevisions) => {
      if (cloudRevisions && cloudRevisions.length > 0) {
        setVersions(cloudRevisions);
      }
    });

    const unsubComments = subscribeComments(pack.id, (cloudComments) => {
      if (cloudComments && cloudComments.length > 0) {
        setComments(cloudComments);
      }
    });

    const unsubCouncil = subscribeCouncilFeedbacks(pack.id, (cloudCouncil) => {
      if (cloudCouncil && cloudCouncil.length > 0) {
        setCouncilFeedbacks(cloudCouncil);
      }
    });

    return () => {
      unsubRevisions();
      unsubComments();
      unsubCouncil();
    };
  }, [pack.id]);

  // Track scroll progress
  const handleScroll = () => {
    if (!readerScrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = readerScrollRef.current;
    const maxScroll = scrollHeight - clientHeight;
    if (maxScroll <= 0) {
      setReadProgress(100);
    } else {
      const pct = Math.min(Math.round((scrollTop / maxScroll) * 100), 100);
      setReadProgress(pct);
    }
  };

  // Parse Sections / Outline from manuscript
  const sections: SectionEntry[] = useMemo(() => {
    const lines = manuscript.split('\n');
    const result: SectionEntry[] = [];
    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (/^(SECTION\s+[IVXLCDM\d]+|CHAPTER\s+\d+|PART\s+[IVXLCDM\d]+|#+\s+)/i.test(trimmed)) {
        result.push({
          id: `sec-${idx}`,
          title: trimmed.replace(/^#+\s*/, ''),
          lineIndex: idx
        });
      }
    });
    return result;
  }, [manuscript]);

  // Word count & Estimated reading time
  const wordCount = useMemo(() => {
    return manuscript.trim().split(/\s+/).filter(Boolean).length;
  }, [manuscript]);

  const readingTimeMin = useMemo(() => {
    return Math.max(1, Math.ceil(wordCount / 200));
  }, [wordCount]);

  const handlePostToDiscussion = async (feedback: CouncilFeedback) => {
    const newComm: CommentDoc = {
      id: Date.now().toString(),
      author: `${feedback.agentHandle} (Council Gloss)`,
      time: 'Just now',
      content: `[${feedback.stanceTitle}]\n\n${feedback.critique}\n\nKey Insight: ${feedback.contrastPoint}`
    };

    setComments(prev => [...prev, newComm]);
    setSidebarTab('discussion');

    try {
      await saveCommentDoc(pack.id, newComm);
    } catch (e) {
      console.warn('Saved comment locally:', e);
    }
  };

  const handleAddComment = async () => {
    if (!newCommentText.trim()) return;
    const commentItem: CommentDoc = {
      id: Date.now().toString(),
      author: settings.operatorName || 'Scholar',
      time: 'Just now',
      content: newCommentText.trim()
    };

    setComments(prev => [...prev, commentItem]);
    setNewCommentText('');

    try {
      await saveCommentDoc(pack.id, commentItem);
    } catch (e) {
      console.warn('Saved comment locally:', e);
    }
  };

  const scrollToSection = (secId: string) => {
    setSelectedSectionId(secId);
    const element = document.getElementById(secId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setIsTocOpen(false);
  };

  // Palette color styles
  const paletteStyles = useMemo(() => {
    switch (palette) {
      case 'parchment':
        return {
          wrapper: 'bg-[#181511] text-[#e8dfcf]',
          canvas: 'bg-[#1e1a14]/90 border-[#3a3224]',
          header: 'bg-[#1a1612] border-[#3a3224]',
          accent: 'text-[#d4a359]',
          border: 'border-[#3a3224]',
          card: 'bg-[#262018]',
          badge: 'bg-[#d4a359]/15 text-[#d4a359] border-[#d4a359]/30'
        };
      case 'midnight':
        return {
          wrapper: 'bg-[#090d16] text-[#cbd5e1]',
          canvas: 'bg-[#0d1527]/80 border-[#1e293b]',
          header: 'bg-[#0a1020] border-[#1e293b]',
          accent: 'text-[#38bdf8]',
          border: 'border-[#1e293b]',
          card: 'bg-[#111c35]',
          badge: 'bg-[#38bdf8]/15 text-[#38bdf8] border-[#38bdf8]/30'
        };
      case 'onyx':
        return {
          wrapper: 'bg-black text-slate-300',
          canvas: 'bg-neutral-950 border-neutral-800',
          header: 'bg-neutral-950 border-neutral-800',
          accent: 'text-amber-400',
          border: 'border-neutral-800',
          card: 'bg-neutral-900',
          badge: 'bg-neutral-800 text-neutral-200 border-neutral-700'
        };
      case 'obsidian':
      default:
        return {
          wrapper: 'bg-slate-950 text-slate-200',
          canvas: 'bg-slate-900/40 border-slate-800',
          header: 'bg-slate-950/80 border-slate-800',
          accent: 'text-amber-500',
          border: 'border-slate-800',
          card: 'bg-slate-900/70',
          badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20'
        };
    }
  }, [palette]);

  // Typography font size mapping
  const fontClass = fontFamily === 'serif' ? 'font-serif' : fontFamily === 'mono' ? 'font-mono' : 'font-sans';
  const fontSizeClass = fontSize === 'sm' ? 'text-sm leading-relaxed' : fontSize === 'lg' ? 'text-lg leading-loose' : fontSize === 'xl' ? 'text-xl leading-loose' : 'text-base leading-relaxed';
  const lineHeightClass = lineHeight === 'compact' ? 'leading-normal space-y-4' : lineHeight === 'spacious' ? 'leading-loose space-y-8' : 'leading-relaxed space-y-6';

  // Render paragraphs with Section bookmarks and search highlights
  const renderManuscriptBody = () => {
    const paragraphs = manuscript.split('\n\n');
    let currentLine = 0;

    return paragraphs.map((para, idx) => {
      const isHeader = /^(SECTION\s+[IVXLCDM\d]+|CHAPTER\s+\d+|PART\s+[IVXLCDM\d]+|#+\s+|THE\s+[A-Z\s]+:)/i.test(para.trim());
      const sectionMatch = sections.find(s => para.includes(s.title));
      const secId = sectionMatch ? sectionMatch.id : `para-${idx}`;
      currentLine += para.split('\n').length + 1;

      // Handle search highlighting
      let contentNode: React.ReactNode = para;
      if (searchQuery.trim() && para.toLowerCase().includes(searchQuery.toLowerCase())) {
        const parts = para.split(new RegExp(`(${searchQuery})`, 'gi'));
        contentNode = parts.map((part, i) => 
          part.toLowerCase() === searchQuery.toLowerCase() ? (
            <mark key={i} className="bg-amber-500/40 text-white rounded px-0.5 font-semibold">
              {part}
            </mark>
          ) : part
        );
      }

      if (isHeader) {
        return (
          <div 
            key={idx} 
            id={secId} 
            className="pt-8 pb-3 border-b border-amber-500/20 my-6 scroll-mt-20 group relative"
          >
            <div className="flex items-center justify-between">
              <span className={`text-xs font-mono uppercase tracking-[0.25em] font-bold ${paletteStyles.accent} flex items-center gap-2`}>
                <Bookmark className="w-3.5 h-3.5" />
                {para}
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${pack.title} - ${para}`);
                }}
                title="Copy section link / citation"
                className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-amber-400 text-[10px] flex items-center gap-1 font-mono"
              >
                <Share2 className="w-3 h-3" />
                Cite
              </button>
            </div>
          </div>
        );
      }

      return (
        <p 
          key={idx}
          className={`${fontSizeClass} ${fontClass} opacity-95 first-letter:text-2xl first-letter:font-bold first-letter:${paletteStyles.accent} selection:bg-amber-500/30`}
        >
          {contentNode}
        </p>
      );
    });
  };

  return (
    <div className={`flex flex-col h-full gap-4 relative transition-colors duration-300 ${paletteStyles.wrapper}`}>
      {/* Top Reading Progress Bar */}
      <div className="w-full bg-slate-900/50 h-1 overflow-hidden shrink-0">
        <motion.div 
          className="h-full bg-gradient-to-r from-amber-500 via-orange-400 to-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
          style={{ width: `${readProgress}%` }}
        />
      </div>

      {/* Reader Navigation & Controls Header */}
      <div className="flex items-center justify-between shrink-0 pb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack} 
            className="p-2 rounded-xl hover:bg-slate-900 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Return to Lore Library"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-500" />
                {pack.title}
              </h2>
              <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase tracking-widest ${paletteStyles.badge}`}>
                {pack.category}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                {readingTimeMin} min read
              </span>
              <span>·</span>
              <span>{wordCount} words</span>
              <span>·</span>
              <span className="text-slate-400">Authored by {pack.author}</span>
            </div>
          </div>
        </div>

        {/* Reader Action Toolbar */}
        <div className="flex items-center gap-3">
          {/* Search inside manuscript */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Find in text..."
              className="bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-6 py-1 text-xs w-36 focus:w-48 transition-all focus:outline-none focus:border-amber-500 text-slate-200"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Table of Contents / Outline Button */}
          {sections.length > 0 && (
            <button
              onClick={() => setIsTocOpen(!isTocOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                isTocOpen 
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300' 
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
              title="Table of Contents & Section Index"
            >
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              <span>Outline</span>
              <span className="text-[10px] bg-slate-800 px-1.5 py-0.2 rounded font-mono">
                {sections.length}
              </span>
            </button>
          )}

          {/* Reader View Mode Switcher: Pure Codex vs Scholarly Symposium */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => setReaderView('codex')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                readerView === 'codex'
                  ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Codex View</span>
            </button>
            <button
              onClick={() => setReaderView('annotated')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                readerView === 'annotated'
                  ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Quote className="w-3.5 h-3.5" />
              <span>Symposium Marginalia</span>
            </button>
          </div>

          {/* Appearance Drawer Toggle */}
          <button
            onClick={() => setIsAppearanceOpen(!isAppearanceOpen)}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-slate-300 hover:text-amber-400 transition-all cursor-pointer"
            title="Reader Typography & Theme Settings"
          >
            <Type className="w-4 h-4" />
          </button>

          {/* Summon Council Action */}
          <button
            onClick={() => setIsSummonModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-amber-500/15 border border-amber-500/40 hover:border-amber-400 text-amber-300 hover:text-white text-xs font-bold transition-all cursor-pointer active:scale-95"
            title="Summon Pantheon Councilors for Contrasting Critiques"
          >
            <Users className="w-3.5 h-3.5 text-amber-400" />
            <span>Summon Council</span>
          </button>

          {/* Zen Fullscreen Toggle */}
          <button
            onClick={() => setIsZenMode(!isZenMode)}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title={isZenMode ? 'Exit Zen Mode' : 'Distraction-Free Zen Mode'}
          >
            {isZenMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Reader Layout Grid */}
      <div className={`grid flex-1 gap-6 min-h-0 overflow-hidden ${
        readerView === 'codex' || isZenMode ? 'grid-cols-1' : 'grid-cols-3'
      }`}>
        {/* Main Reading Canvas */}
        <div className={`flex flex-col h-full overflow-hidden ${
          readerView === 'codex' || isZenMode ? 'col-span-1 max-w-4xl mx-auto w-full' : 'col-span-2'
        }`}>
          <div className={`border rounded-2xl flex-1 overflow-hidden flex flex-col shadow-2xl transition-all duration-300 ${paletteStyles.canvas}`}>
            {/* Illuminated Reader Canvas Header */}
            <div className={`px-6 py-3 border-b flex items-center justify-between ${paletteStyles.header}`}>
              <div className="flex items-center gap-3">
                <span className="text-xs uppercase tracking-[0.2em] text-slate-400 font-semibold flex items-center gap-2">
                  <Compass className="w-3.5 h-3.5 text-amber-500" />
                  Illuminated Manuscript
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {readProgress}% Scrolled
                </span>
              </div>

              {/* Quick Font Size Controls */}
              <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-lg border border-slate-800">
                <button
                  onClick={() => setFontSize(fontSize === 'xl' ? 'lg' : fontSize === 'lg' ? 'base' : 'sm')}
                  className="px-2 py-0.5 text-xs text-slate-400 hover:text-white font-mono"
                  title="Smaller text"
                >
                  A-
                </button>
                <button
                  onClick={() => setFontSize(fontSize === 'sm' ? 'base' : fontSize === 'base' ? 'lg' : 'xl')}
                  className="px-2 py-0.5 text-xs text-slate-400 hover:text-white font-mono font-bold"
                  title="Larger text"
                >
                  A+
                </button>
              </div>
            </div>

            {/* Reading Scroll Canvas */}
            <div 
              ref={readerScrollRef}
              onScroll={handleScroll}
              className="p-8 md:p-12 overflow-y-auto custom-scrollbar flex-1 space-y-6"
            >
              <div className="max-w-2xl mx-auto py-2">
                <div className="text-center pb-8 mb-8 border-b border-amber-500/20">
                  <p className="text-[11px] uppercase tracking-[0.3em] text-amber-500/80 font-mono mb-2">
                    ✦ MYTHOS CODEX // LORE ARCHIVE ✦
                  </p>
                  <h1 className={`text-2xl md:text-3xl font-bold tracking-tight text-white mb-2 ${fontClass}`}>
                    {pack.title}
                  </h1>
                  <p className="text-xs text-slate-400 font-mono">
                    Category: {pack.category} · Preserved for Council Review
                  </p>
                </div>

                <div className={lineHeightClass}>
                  {renderManuscriptBody()}
                </div>

                <div className="pt-16 pb-8 flex items-center justify-center gap-3 text-slate-700">
                  <div className="h-px w-16 bg-slate-800" />
                  <span className="text-xs font-mono text-amber-500/60">✦ ✦ ✦</span>
                  <div className="h-px w-16 bg-slate-800" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Rail: Scholarly Council Marginalia & Commentary */}
        {readerView === 'annotated' && !isZenMode && (
          <div className="flex flex-col gap-4 h-full min-h-0">
            <div className={`border rounded-2xl flex-1 flex flex-col min-h-0 shadow-xl ${paletteStyles.canvas}`}>
              {/* Rail Header */}
              <div className={`p-3 border-b flex items-center justify-between ${paletteStyles.header}`}>
                <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSidebarTab('council')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      sidebarTab === 'council'
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                        : 'text-slate-400 hover:text-amber-400'
                    }`}
                  >
                    <Quote className="w-3.5 h-3.5" />
                    <span>Council Marginalia</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                      sidebarTab === 'council' ? 'bg-slate-950 text-amber-400' : 'bg-slate-800 text-slate-300'
                    }`}>
                      {councilFeedbacks.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSidebarTab('discussion')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      sidebarTab === 'discussion'
                        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Reader Notes</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono font-bold">
                      {comments.length}
                    </span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsSummonModalOpen(true)}
                  className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-amber-500/10 cursor-pointer"
                  title="Summon or update council perspectives"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Summon</span>
                </button>
              </div>

              {/* Rail Content Body */}
              {sidebarTab === 'council' ? (
                <div className="p-4 flex-1 overflow-y-auto space-y-4 custom-scrollbar">
                  <div className="flex items-center justify-between pb-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Scale className="w-3.5 h-3.5 text-amber-400" />
                      Pantheon Scholarly Glosses
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Active Stances
                    </span>
                  </div>

                  {councilFeedbacks.map((fb) => {
                    const theme = AGENT_THEMES[fb.agentId] || AGENT_THEMES.NOESIS;
                    const isCopied = copiedCouncilId === fb.id;
                    return (
                      <div
                        key={fb.id}
                        className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3 relative overflow-hidden shadow-sm"
                      >
                        <div 
                          className="absolute top-0 left-0 bottom-0 w-1"
                          style={{ backgroundColor: theme.color }}
                        />
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white shadow-sm shrink-0"
                              style={{ backgroundColor: theme.color }}
                            >
                              {fb.agentHandle.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-white">{fb.agentHandle}</span>
                                <span className={`text-[8px] px-1.5 py-0.2 rounded font-mono uppercase ${theme.badgeBg} ${theme.badgeBorder} ${theme.badgeText}`}>
                                  {fb.agentId}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-500 italic block">{fb.tone}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] font-mono font-bold text-amber-400">
                              {fb.alignmentScore}% Resonance
                            </span>
                            <div className="w-14 h-1 bg-slate-800 rounded-full mt-0.5 overflow-hidden">
                              <div 
                                className="h-full rounded-full"
                                style={{ width: `${fb.alignmentScore}%`, backgroundColor: theme.color }}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="bg-slate-900/70 rounded-lg p-2.5 border border-slate-800">
                          <p className="text-xs font-bold text-amber-300">
                            "{fb.stanceTitle}"
                          </p>
                        </div>

                        <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                          {fb.critique}
                        </p>

                        <div className="bg-amber-500/5 border border-amber-500/15 p-2.5 rounded-lg text-[10px] text-slate-300 leading-relaxed">
                          <span className="text-amber-400 font-bold block mb-1">⚡ Hermeneutic Contrast:</span>
                          {fb.contrastPoint}
                        </div>

                        {fb.proposedPatch && (
                          <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-lg text-[10px] font-mono text-amber-200/80 italic">
                            <span className="text-slate-500 not-italic block text-[9px] uppercase font-bold mb-1">Proposed Textual Emendation:</span>
                            "{fb.proposedPatch}"
                          </div>
                        )}

                        <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between gap-1 flex-wrap">
                          <button
                            type="button"
                            onClick={() => {
                              const text = `[${fb.agentHandle} - ${fb.stanceTitle}]\n${fb.critique}\n\nContrast: ${fb.contrastPoint}`;
                              navigator.clipboard.writeText(text);
                              setCopiedCouncilId(fb.id);
                              setTimeout(() => setCopiedCouncilId(null), 1500);
                            }}
                            className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            <span>{isCopied ? 'Copied' : 'Copy Gloss'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handlePostToDiscussion(fb)}
                            className="text-[10px] px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-amber-400 hover:border-amber-500/30 transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>Save to Notes</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 flex-1 overflow-y-auto space-y-4 custom-scrollbar flex flex-col justify-between">
                  <div className="space-y-3">
                    {comments.map((c) => (
                      <div key={c.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800/70 space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-bold text-white">{c.author}</span>
                          <span className="text-slate-500">{c.time}</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{c.content}</p>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-slate-800">
                    <div className="relative">
                      <input 
                        value={newCommentText}
                        onChange={(e) => setNewCommentText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                        placeholder="Add scholar annotation or reader note..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-amber-500 text-slate-200 pr-8"
                      />
                      <button 
                        onClick={handleAddComment}
                        disabled={!newCommentText.trim()}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-amber-400 disabled:opacity-30"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Table of Contents / Outline Slide-Over Drawer */}
      <AnimatePresence>
        {isTocOpen && (
          <div className="fixed inset-0 z-50 flex">
            <div 
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsTocOpen(false)}
            />
            <motion.div
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              className="relative w-80 bg-slate-950 border-r border-slate-800 p-6 flex flex-col gap-6 shadow-2xl z-10"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-amber-500" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Codex Outline</h3>
                </div>
                <button onClick={() => setIsTocOpen(false)} className="text-slate-500 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-1">
                {sections.map((sec, idx) => (
                  <button
                    key={sec.id}
                    onClick={() => scrollToSection(sec.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all text-xs cursor-pointer ${
                      selectedSectionId === sec.id
                        ? 'bg-amber-500/10 border-amber-500 text-amber-300 font-bold'
                        : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-[10px] text-slate-500 font-mono block mb-1">
                      Part 0{idx + 1}
                    </span>
                    <span className="line-clamp-2">{sec.title}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Appearance & Typography Settings Drawer */}
      <AnimatePresence>
        {isAppearanceOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-16 right-8 z-40 w-72 bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-5"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-amber-500" />
                Reading Preferences
              </span>
              <button onClick={() => setIsAppearanceOpen(false)} className="text-slate-500 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Typography Palette Theme */}
            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Manuscript Palette
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'obsidian', label: 'Obsidian', color: 'bg-slate-950 border-amber-500/30' },
                  { id: 'parchment', label: 'Parchment', color: 'bg-[#1e1a14] border-[#d4a359]/30' },
                  { id: 'midnight', label: 'Midnight', color: 'bg-[#0d1527] border-[#38bdf8]/30' },
                  { id: 'onyx', label: 'Pure Onyx', color: 'bg-black border-neutral-700' }
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPalette(p.id as ReaderPalette)}
                    className={`py-2 px-3 rounded-lg text-xs font-medium border transition-all text-left ${p.color} ${
                      palette === p.id ? 'ring-2 ring-amber-500 text-white font-bold' : 'text-slate-400'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Typeface */}
            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Typeface
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'serif', label: 'Serif' },
                  { id: 'sans', label: 'Sans' },
                  { id: 'mono', label: 'Mono' }
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setFontFamily(t.id as any)}
                    className={`py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      fontFamily === t.id
                        ? 'bg-amber-500 text-slate-950 border-amber-500'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Spacing / Line-height */}
            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Line Spacing
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'compact', label: 'Compact' },
                  { id: 'normal', label: 'Normal' },
                  { id: 'spacious', label: 'Spacious' }
                ].map((lh) => (
                  <button
                    key={lh.id}
                    onClick={() => setLineHeight(lh.id as LineHeight)}
                    className={`py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      lineHeight === lh.id
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    {lh.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summon Council Modal */}
      <SummonCouncilModal
        isOpen={isSummonModalOpen}
        onClose={() => setIsSummonModalOpen(false)}
        manuscript={manuscript}
        modelName={settings.defaultModel}
        selectedAgentIds={selectedCouncilIds}
        onUpdateSelectedAgentIds={setSelectedCouncilIds}
        feedbacks={councilFeedbacks}
        onFeedbacksGenerated={async (newFeedbacks) => {
          setCouncilFeedbacks(newFeedbacks);
          setSidebarTab('council');
          for (const fb of newFeedbacks) {
            try {
              await saveCouncilFeedbackDoc(pack.id, fb);
            } catch (e) {
              console.warn('Saved feedback locally:', e);
            }
          }
        }}
        onAdoptPatch={() => {}}
        onPostToDiscussion={handlePostToDiscussion}
      />
    </div>
  );
}
