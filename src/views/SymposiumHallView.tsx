import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
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
  Share2,
  Edit3,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Layers,
  Dna,
  Radio
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AGENTS, Agent } from '../lib/agents';
import { SummonCouncilModal } from '../components/SummonCouncilModal';
import { extractTriadicVectorsFromCodex } from '../lib/triadic-synthesis';
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
  saveCouncilFeedbackDoc,
  saveRevisionDoc,
  updateManuscriptContent
} from '../lib/firestore-service';

export type ReaderPalette = 'obsidian' | 'parchment' | 'midnight' | 'onyx';
export type FontSize = 'sm' | 'base' | 'lg' | 'xl';
export type LineHeight = 'compact' | 'normal' | 'spacious';

interface SectionEntry {
  id: string;
  title: string;
  lineIndex: number;
}

const AUTO_SAVE_INTERVAL_SECONDS = 300; // 5 minutes = 300 seconds

export function SymposiumHallView({ 
  pack, 
  agent, 
  settings, 
  onBack,
  onOpenSynthesizer
}: { 
  pack: LorepackDoc; 
  agent: Agent; 
  settings: FactorySettings; 
  onBack: () => void; 
  onOpenSynthesizer?: (pack: LorepackDoc) => void;
}) {
  const [isZenMode, setIsZenMode] = useState(false);
  const [readerView, setReaderView] = useState<'codex' | 'annotated'>('annotated');
  const [palette, setPalette] = useState<ReaderPalette>('obsidian');
  const [fontSize, setFontSize] = useState<FontSize>('base');
  const [lineHeight, setLineHeight] = useState<LineHeight>('normal');
  const [fontFamily, setFontFamily] = useState<'serif' | 'sans' | 'mono'>(settings.fontTheme || 'serif');
  const [isAppearanceOpen, setIsAppearanceOpen] = useState(false);
  const [isTocOpen, setIsTocOpen] = useState(false);
  const [isTriadicDrawerOpen, setIsTriadicDrawerOpen] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);

  // Extracted Triadic Vectors for this Codex (Artifacts, Genetics, Memetics)
  const codexVectors = useMemo(() => {
    return extractTriadicVectorsFromCodex(pack);
  }, [pack]);

  // Manuscript text & editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editedManuscript, setEditedManuscript] = useState(pack.manuscript || '');
  const editedManuscriptRef = useRef(editedManuscript);
  const lastSavedContentRef = useRef(pack.manuscript || '');

  // 5-minute Auto-save state
  const [secondsUntilAutoSave, setSecondsUntilAutoSave] = useState(AUTO_SAVE_INTERVAL_SECONDS);
  const [autoSaveState, setAutoSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [lastAutoSaveTime, setLastAutoSaveTime] = useState<string | null>(null);

  // In-Manuscript Search State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCaseSensitive, setIsCaseSensitive] = useState(false);
  const [isWholeWord, setIsWholeWord] = useState(false);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Version History State
  const [versions, setVersions] = useState<RevisionDoc[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [previewVersion, setPreviewVersion] = useState<RevisionDoc | null>(null);
  const [restoreConfirmVersion, setRestoreConfirmVersion] = useState<RevisionDoc | null>(null);
  const [copiedVersionId, setCopiedVersionId] = useState<string | null>(null);

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
    return initialAgents.map(a => getFallbackAgentFeedback(a, pack.manuscript || '', 'Theological & Canonical Analysis'));
  });
  const [sidebarTab, setSidebarTab] = useState<'council' | 'discussion'>('council');
  const [copiedCouncilId, setCopiedCouncilId] = useState<string | null>(null);

  // Scroll reading progress
  const [readProgress, setReadProgress] = useState(0);
  const readerScrollRef = useRef<HTMLDivElement>(null);

  // Synchronize ref on text changes
  useEffect(() => {
    editedManuscriptRef.current = editedManuscript;
  }, [editedManuscript]);

  // Sync when pack changes from outside (if user is not currently editing)
  useEffect(() => {
    if (pack.manuscript && !isEditing) {
      setEditedManuscript(pack.manuscript);
      lastSavedContentRef.current = pack.manuscript;
    }
  }, [pack.manuscript, pack.id, isEditing]);

  // Active manuscript for reading/parsing
  const activeManuscript = isEditing ? editedManuscript : (pack.manuscript || editedManuscript);

  // Global Keyboard Shortcuts for In-Manuscript Search (Cmd+F / Ctrl+F)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setIsSearchOpen(true);
        setTimeout(() => {
          searchInputRef.current?.focus();
          searchInputRef.current?.select();
        }, 50);
      } else if (e.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen]);

  // Search Regex & Total Matches Calculation
  const matchRegex = useMemo(() => {
    if (!searchQuery.trim()) return null;
    try {
      const escaped = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const flags = isCaseSensitive ? 'g' : 'gi';
      const pattern = isWholeWord ? `\\b${escaped}\\b` : escaped;
      return new RegExp(pattern, flags);
    } catch {
      return null;
    }
  }, [searchQuery, isCaseSensitive, isWholeWord]);

  const totalMatches = useMemo(() => {
    if (!matchRegex || !activeManuscript) return 0;
    const matches = activeManuscript.match(matchRegex);
    return matches ? matches.length : 0;
  }, [matchRegex, activeManuscript]);

  // Reset or constrain currentMatchIndex when search parameters or matches change
  useEffect(() => {
    if (totalMatches > 0) {
      setCurrentMatchIndex(0);
    } else {
      setCurrentMatchIndex(-1);
    }
  }, [searchQuery, isCaseSensitive, isWholeWord, totalMatches]);

  // Jump smoothly to current match element
  useEffect(() => {
    if (totalMatches > 0 && currentMatchIndex >= 0) {
      const el = document.getElementById(`search-match-${currentMatchIndex}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentMatchIndex]);

  const handleNextMatch = () => {
    if (totalMatches === 0) return;
    setCurrentMatchIndex((prev) => (prev + 1) % totalMatches);
  };

  const handlePrevMatch = () => {
    if (totalMatches === 0) return;
    setCurrentMatchIndex((prev) => (prev - 1 + totalMatches) % totalMatches);
  };

  // Firestore Real-Time Subscriptions
  useEffect(() => {
    if (!pack?.id) return;

    const unsubRevisions = subscribeRevisions(pack.id, (cloudRevisions) => {
      if (cloudRevisions && cloudRevisions.length > 0) {
        setVersions(cloudRevisions);
      } else {
        setVersions([
          {
            id: 'rev-canon-01',
            timestamp: pack.lastModified || 'Archived Canonical Base',
            content: pack.manuscript || '',
            author: pack.author || 'Primary Archivist'
          }
        ]);
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
  }, [pack.id, pack.manuscript, pack.lastModified, pack.author]);

  // Version creation helper: saves a new revision doc and updates lorepack manuscript
  const createVersionSnapshot = async (
    trigger: 'auto' | 'manual' | 'restore' | 'patch', 
    note?: string
  ): Promise<RevisionDoc> => {
    const currentContent = editedManuscriptRef.current;
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const revId = `rev-${Date.now()}`;
    
    let tag = 'Manual Snapshot';
    if (trigger === 'auto') tag = '5m Auto-save';
    else if (trigger === 'restore') tag = note ? `Restored: ${note}` : 'Restoration';
    else if (trigger === 'patch') tag = note ? `Council Patch (${note})` : 'Council Patch';

    const newRevision: RevisionDoc = {
      id: revId,
      timestamp: `${timeNow} · ${tag}`,
      content: currentContent,
      author: settings.operatorName || 'Scholar'
    };

    setAutoSaveState('saving');
    try {
      await saveRevisionDoc(pack.id, newRevision);
      await updateManuscriptContent(pack.id, currentContent, settings.operatorName);
      
      setVersions(prev => [newRevision, ...prev.filter(v => v.id !== revId)]);
      lastSavedContentRef.current = currentContent;
      setLastAutoSaveTime(timeNow);
      setAutoSaveState('saved');
      setTimeout(() => setAutoSaveState('idle'), 3000);
    } catch (err) {
      console.warn('Persisted revision locally:', err);
      setVersions(prev => [newRevision, ...prev.filter(v => v.id !== revId)]);
      lastSavedContentRef.current = currentContent;
      setLastAutoSaveTime(timeNow);
      setAutoSaveState('saved');
      setTimeout(() => setAutoSaveState('idle'), 3000);
    }

    return newRevision;
  };

  // 5-minute Auto-save Interval Mechanism
  useEffect(() => {
    if (!isEditing) {
      setSecondsUntilAutoSave(AUTO_SAVE_INTERVAL_SECONDS);
      return;
    }

    const interval = setInterval(() => {
      setSecondsUntilAutoSave((prev) => {
        if (prev <= 1) {
          createVersionSnapshot('auto');
          return AUTO_SAVE_INTERVAL_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isEditing, pack.id]);

  // Format mm:ss for countdown
  const formatCountdown = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Toggle edit mode
  const handleToggleEdit = () => {
    if (isEditing) {
      if (editedManuscriptRef.current !== lastSavedContentRef.current) {
        createVersionSnapshot('manual', 'Saved on exit');
      }
      setIsEditing(false);
    } else {
      setIsEditing(true);
      setSecondsUntilAutoSave(AUTO_SAVE_INTERVAL_SECONDS);
    }
  };

  // Manual snapshot
  const handleManualSaveVersion = () => {
    createVersionSnapshot('manual');
    setSecondsUntilAutoSave(AUTO_SAVE_INTERVAL_SECONDS);
  };

  // Restore previous historical version
  const handleRestoreVersion = (versionToRestore: RevisionDoc) => {
    setEditedManuscript(versionToRestore.content);
    editedManuscriptRef.current = versionToRestore.content;
    createVersionSnapshot('restore', versionToRestore.timestamp);
    setRestoreConfirmVersion(null);
    setPreviewVersion(null);
    setIsHistoryOpen(false);
  };

  // Adopt council patch
  const handleAdoptCouncilPatch = (patch: string, agentHandle: string) => {
    const updated = `${editedManuscriptRef.current}\n\n[COUNCIL EMENDATION // ${agentHandle}]\n${patch}`;
    setEditedManuscript(updated);
    editedManuscriptRef.current = updated;
    createVersionSnapshot('patch', agentHandle);
  };

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

  // Parse Sections / Outline from active manuscript
  const sections: SectionEntry[] = useMemo(() => {
    const lines = activeManuscript.split('\n');
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
  }, [activeManuscript]);

  // Word count & Estimated reading time
  const wordCount = useMemo(() => {
    return activeManuscript.trim().split(/\s+/).filter(Boolean).length;
  }, [activeManuscript]);

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

  // Render paragraphs with Section bookmarks and Keyword/Phrase search highlights
  let globalMatchCounter = 0;
  const renderManuscriptBody = () => {
    globalMatchCounter = 0;
    const paragraphs = activeManuscript.split('\n\n');

    return paragraphs.map((para, idx) => {
      const isHeader = /^(SECTION\s+[IVXLCDM\d]+|CHAPTER\s+\d+|PART\s+[IVXLCDM\d]+|#+\s+|THE\s+[A-Z\s]+:)/i.test(para.trim());
      const sectionMatch = sections.find(s => para.includes(s.title));
      const secId = sectionMatch ? sectionMatch.id : `para-${idx}`;

      // In-manuscript keyword/phrase match rendering
      let contentNode: React.ReactNode = para;
      if (matchRegex && searchQuery.trim()) {
        const parts = para.split(matchRegex);
        const matches = para.match(matchRegex) || [];
        
        if (matches.length > 0) {
          const nodes: React.ReactNode[] = [];
          parts.forEach((part, pIdx) => {
            nodes.push(part);
            if (pIdx < matches.length) {
              const matchText = matches[pIdx];
              const thisMatchNum = globalMatchCounter++;
              const isCurrentActive = thisMatchNum === currentMatchIndex;

              nodes.push(
                <mark
                  key={`m-${pIdx}-${thisMatchNum}`}
                  id={`search-match-${thisMatchNum}`}
                  className={`transition-all rounded px-1 scroll-mt-32 ${
                    isCurrentActive
                      ? 'bg-amber-400 text-slate-950 font-bold ring-2 ring-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.8)] scale-105 inline-block'
                      : 'bg-amber-500/35 text-amber-200 hover:bg-amber-500/50'
                  }`}
                >
                  {matchText}
                </mark>
              );
            }
          });
          contentNode = nodes;
        }
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
                {contentNode}
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${pack.title} - ${para}`);
                }}
                title="Copy section link / citation"
                className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-amber-400 text-[10px] flex items-center gap-1 font-mono cursor-pointer"
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
          {/* Triadic Lore Vectors & Interpretations */}
          <button
            onClick={() => setIsTriadicDrawerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-all cursor-pointer shadow-sm"
            title="Inspect Artifacts, Genetics, and Memetics in this Codex"
          >
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>Triadic Vectors</span>
          </button>

          {/* In-Manuscript Keyword/Phrase Search Trigger Button */}
          <button
            onClick={() => {
              setIsSearchOpen(prev => !prev);
              if (!isSearchOpen) {
                setTimeout(() => {
                  searchInputRef.current?.focus();
                  searchInputRef.current?.select();
                }, 50);
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              isSearchOpen || searchQuery
                ? 'bg-amber-500/15 border-amber-500/50 text-amber-300 shadow-sm'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
            }`}
            title="Search manuscript keywords or phrases (Ctrl+F / Cmd+F)"
          >
            <Search className="w-3.5 h-3.5 text-amber-400" />
            <span>Search Manuscript</span>
            {totalMatches > 0 && (
              <span className="text-[10px] bg-amber-500/25 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded font-mono font-bold">
                {totalMatches}
              </span>
            )}
          </button>

          {/* Edit / Read Mode Switcher */}
          <button
            onClick={handleToggleEdit}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              isEditing
                ? 'bg-amber-500 text-slate-950 font-bold border-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
            }`}
            title={isEditing ? 'Save and return to illuminated read mode' : 'Edit manuscript with 5-minute auto-save snapshots'}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{isEditing ? 'Done Editing' : 'Edit Codex'}</span>
          </button>

          {/* 5-Minute Auto-Save Live Status Indicator (when in Edit Mode) */}
          {isEditing && (
            <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-2.5 py-1 rounded-lg text-[11px] font-mono shadow-sm">
              <span className="relative flex h-2 w-2">
                {autoSaveState === 'saving' ? (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                ) : (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                )}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${
                  autoSaveState === 'saving' ? 'bg-amber-400' : 'bg-emerald-500'
                }`} />
              </span>
              <span className="text-slate-300">
                {autoSaveState === 'saving' ? (
                  <span className="text-amber-400 font-bold">Creating version...</span>
                ) : (
                  <span>Auto-save in <strong className="text-amber-400 font-bold">{formatCountdown(secondsUntilAutoSave)}</strong></span>
                )}
              </span>
              <button
                onClick={handleManualSaveVersion}
                disabled={autoSaveState === 'saving'}
                className="ml-1 pl-1.5 border-l border-slate-700 hover:text-amber-300 text-slate-400 text-[10px] font-semibold flex items-center gap-0.5 cursor-pointer disabled:opacity-40"
                title="Create a version snapshot right now"
              >
                <Save className="w-3 h-3 text-amber-500" />
                <span>Save</span>
              </button>
            </div>
          )}

          {/* Version History Drawer Trigger */}
          <button
            onClick={() => setIsHistoryOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-slate-300 hover:text-amber-400 text-xs font-semibold cursor-pointer transition-colors"
            title="Open Version History & Archival Snapshots"
          >
            <History className="w-3.5 h-3.5 text-amber-500" />
            <span>History</span>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded font-mono font-bold">
              {versions.length}
            </span>
          </button>

          {/* Table of Contents / Outline Button */}
          {sections.length > 0 && !isEditing && (
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
          {!isEditing && (
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
          )}

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

      {/* DEDICATED IN-MANUSCRIPT KEYWORD / PHRASE SEARCH BAR */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            className="overflow-hidden shrink-0 z-20"
          >
            <div className="bg-slate-900/95 border border-amber-500/40 backdrop-blur-xl rounded-xl p-2.5 shadow-2xl flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2.5 flex-1 min-w-[280px]">
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                  <Search className="w-4 h-4" />
                </div>
                <div className="relative flex-1">
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (e.shiftKey) {
                          handlePrevMatch();
                        } else {
                          handleNextMatch();
                        }
                      } else if (e.key === 'Escape') {
                        setIsSearchOpen(false);
                      }
                    }}
                    placeholder="Search keywords, phrases, or names inside manuscript (Enter for next, Shift+Enter for prev)..."
                    className="w-full bg-slate-950/90 border border-slate-800 rounded-lg py-1.5 pl-3 pr-8 text-xs text-white focus:outline-none focus:border-amber-500 placeholder:text-slate-500 transition-colors"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                      title="Clear search phrase"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Match Counter & Results Indicator */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="text-xs font-mono px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800 flex items-center gap-1.5">
                  {!searchQuery.trim() ? (
                    <span className="text-slate-500">Ready to search</span>
                  ) : totalMatches > 0 ? (
                    <span className="text-amber-400 font-bold">
                      Match {currentMatchIndex + 1} of {totalMatches}
                    </span>
                  ) : (
                    <span className="text-rose-400">0 matches found</span>
                  )}
                </div>

                {/* Match Navigation Buttons (Previous & Next) */}
                <div className="flex items-center bg-slate-950 rounded-md border border-slate-800 p-0.5">
                  <button
                    onClick={handlePrevMatch}
                    disabled={totalMatches === 0}
                    className="p-1 hover:bg-slate-800 text-slate-300 hover:text-white rounded disabled:opacity-30 cursor-pointer transition-colors"
                    title="Previous match (Shift+Enter)"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <div className="w-px h-3.5 bg-slate-800" />
                  <button
                    onClick={handleNextMatch}
                    disabled={totalMatches === 0}
                    className="p-1 hover:bg-slate-800 text-slate-300 hover:text-white rounded disabled:opacity-30 cursor-pointer transition-colors"
                    title="Next match (Enter)"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>

                {/* Search Options: Case Sensitivity & Whole Word */}
                <button
                  onClick={() => setIsCaseSensitive(!isCaseSensitive)}
                  className={`px-2 py-1 rounded-md text-[11px] font-mono font-bold border transition-colors cursor-pointer ${
                    isCaseSensitive
                      ? 'bg-amber-500 text-slate-950 border-amber-400'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                  title={isCaseSensitive ? 'Case Sensitive: ON' : 'Case Sensitive: OFF'}
                >
                  Aa
                </button>

                <button
                  onClick={() => setIsWholeWord(!isWholeWord)}
                  className={`px-2 py-1 rounded-md text-[11px] font-mono font-bold border transition-colors cursor-pointer ${
                    isWholeWord
                      ? 'bg-amber-500 text-slate-950 border-amber-400'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                  title={isWholeWord ? 'Match Whole Word: ON' : 'Match Whole Word: OFF'}
                >
                  \b
                </button>

                {/* Close Search Bar Button */}
                <button
                  onClick={() => setIsSearchOpen(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer transition-colors"
                  title="Close Search Bar (Esc)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reader / Editor Layout Grid */}
      <div className={`grid flex-1 gap-6 min-h-0 overflow-hidden ${
        readerView === 'codex' || isZenMode || isEditing ? 'grid-cols-1' : 'grid-cols-3'
      }`}>
        {/* Main Reading / Editing Canvas */}
        <div className={`flex flex-col h-full overflow-hidden ${
          readerView === 'codex' || isZenMode || isEditing ? 'col-span-1 max-w-4xl mx-auto w-full' : 'col-span-2'
        }`}>
          <div className={`border rounded-2xl flex-1 overflow-hidden flex flex-col shadow-2xl transition-all duration-300 ${paletteStyles.canvas}`}>
            {/* Header of Canvas */}
            <div className={`px-6 py-3 border-b flex items-center justify-between ${paletteStyles.header}`}>
              <div className="flex items-center gap-3">
                <span className="text-xs uppercase tracking-[0.2em] text-slate-400 font-semibold flex items-center gap-2">
                  <Compass className="w-3.5 h-3.5 text-amber-500" />
                  {isEditing ? 'Scribe Manuscript Editor' : 'Illuminated Manuscript'}
                </span>
                {!isEditing && (
                  <span className="text-[10px] text-slate-500 font-mono">
                    {readProgress}% Scrolled
                  </span>
                )}
                {isEditing && (
                  <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3" />
                    Auto-Save Active (every 5 min)
                  </span>
                )}
                {totalMatches > 0 && !isEditing && (
                  <span className="text-[10px] text-amber-400 font-mono bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                    Highlighting "{searchQuery}" ({currentMatchIndex + 1}/{totalMatches})
                  </span>
                )}
              </div>

              {/* Quick Font Size Controls */}
              <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-lg border border-slate-800">
                <button
                  onClick={() => setFontSize(fontSize === 'xl' ? 'lg' : fontSize === 'lg' ? 'base' : 'sm')}
                  className="px-2 py-0.5 text-xs text-slate-400 hover:text-white font-mono cursor-pointer"
                  title="Smaller text"
                >
                  A-
                </button>
                <button
                  onClick={() => setFontSize(fontSize === 'sm' ? 'base' : fontSize === 'base' ? 'lg' : 'xl')}
                  className="px-2 py-0.5 text-xs text-slate-400 hover:text-white font-mono font-bold cursor-pointer"
                  title="Larger text"
                >
                  A+
                </button>
              </div>
            </div>

            {/* Scrollable Reading / Editing Area */}
            {isEditing ? (
              <div className="flex-1 flex flex-col p-6 overflow-hidden">
                <div className="flex items-center justify-between pb-3 text-xs text-slate-400 border-b border-slate-800/80 mb-3">
                  <div className="flex items-center gap-3 font-mono text-[11px]">
                    <span>Words: <strong className="text-white">{wordCount}</strong></span>
                    <span>Characters: <strong className="text-white">{editedManuscript.length}</strong></span>
                    {lastAutoSaveTime && (
                      <span className="text-slate-500">Last auto-save: {lastAutoSaveTime}</span>
                    )}
                  </div>
                  <div className="text-[10px] font-mono text-amber-500/90">
                    Next version entry in {formatCountdown(secondsUntilAutoSave)}
                  </div>
                </div>

                <textarea
                  value={editedManuscript}
                  onChange={(e) => setEditedManuscript(e.target.value)}
                  placeholder="Enter or compose mythological manuscript..."
                  className={`w-full flex-1 bg-transparent border-0 focus:outline-none focus:ring-0 resize-none ${fontClass} ${fontSizeClass} custom-scrollbar text-slate-200 placeholder:text-slate-600 leading-relaxed`}
                  spellCheck="false"
                />

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                  <span className="text-[11px] font-mono flex items-center gap-1.5">
                    <Cloud className="w-3.5 h-3.5 text-emerald-400" />
                    All modifications are auto-saved to version history every 5 minutes.
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleManualSaveVersion}
                      disabled={autoSaveState === 'saving'}
                      className="px-3 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                    >
                      <Save className="w-3 h-3 text-amber-400" />
                      <span>Create Version Entry</span>
                    </button>
                    <button
                      onClick={handleToggleEdit}
                      className="px-3 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold cursor-pointer"
                    >
                      Done Editing
                    </button>
                  </div>
                </div>
              </div>
            ) : (
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
            )}
          </div>
        </div>

        {/* Right Rail: Scholarly Council Marginalia & Commentary */}
        {readerView === 'annotated' && !isZenMode && !isEditing && (
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
                          <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-lg text-[10px] font-mono text-amber-200/80 italic space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-500 not-italic block text-[9px] uppercase font-bold">Proposed Textual Emendation:</span>
                              <button
                                onClick={() => handleAdoptCouncilPatch(fb.proposedPatch!, fb.agentHandle)}
                                className="text-[9px] text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer"
                              >
                                Adopt into Manuscript
                              </button>
                            </div>
                            <p>"{fb.proposedPatch}"</p>
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
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-amber-400 disabled:opacity-30 cursor-pointer"
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

      {/* Version History Slide-Over Drawer */}
      <AnimatePresence>
        {isHistoryOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <div 
              className="fixed inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setIsHistoryOpen(false)}
            />
            <motion.div
              initial={{ x: 420 }}
              animate={{ x: 0 }}
              exit={{ x: 420 }}
              className="relative w-full max-w-md bg-slate-950 border-l border-slate-800 p-6 flex flex-col gap-5 shadow-2xl z-10"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    <History className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      Manuscript Version History
                    </h3>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {versions.length} Preserved Snapshot{versions.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsHistoryOpen(false)} 
                  className="text-slate-500 hover:text-white p-1 rounded-lg hover:bg-slate-900 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Informational Banner */}
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>5-Minute Auto-Save Guarantee</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  While editing, a new version entry is permanently archived every 5 minutes. You can preview or restore any historical snapshot without losing current work.
                </p>
                {isEditing && (
                  <p className="text-[10px] font-mono text-emerald-400 pt-1">
                    ● Next auto-save scheduled in {formatCountdown(secondsUntilAutoSave)}
                  </p>
                )}
              </div>

              {/* Manual Snapshot Trigger */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold">
                  Snapshots Archive
                </span>
                <button
                  onClick={handleManualSaveVersion}
                  disabled={autoSaveState === 'saving'}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40"
                >
                  <Save className="w-3 h-3 text-amber-500" />
                  <span>Take Snapshot Now</span>
                </button>
              </div>

              {/* Revisions List */}
              <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
                {versions.map((rev, idx) => {
                  const revWords = rev.content.trim().split(/\s+/).filter(Boolean).length;
                  const isAutoSave = rev.timestamp.includes('5m Auto-save');
                  const isRestored = rev.timestamp.includes('Restored');
                  const isPatch = rev.timestamp.includes('Council Patch');

                  return (
                    <div
                      key={rev.id || idx}
                      className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-white font-mono">
                              {rev.timestamp}
                            </span>
                            {isAutoSave && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-bold">
                                5m Auto-Save
                              </span>
                            )}
                            {isRestored && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono font-bold">
                                Restored
                              </span>
                            )}
                            {isPatch && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 font-mono font-bold">
                                Council Patch
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500 block mt-0.5">
                            Recorded by {rev.author || 'Scholar'} · {revWords} words · {rev.content.length} chars
                          </span>
                        </div>
                      </div>

                      {/* Snippet preview */}
                      <p className="text-[11px] text-slate-400 line-clamp-2 italic font-serif bg-slate-950/60 p-2 rounded-lg border border-slate-900">
                        "{rev.content.slice(0, 160)}..."
                      </p>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-xs">
                        <button
                          onClick={() => setPreviewVersion(rev)}
                          className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Inspect Full Version</span>
                        </button>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(rev.content);
                              setCopiedVersionId(rev.id);
                              setTimeout(() => setCopiedVersionId(null), 1500);
                            }}
                            className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
                            title="Copy version text"
                          >
                            {copiedVersionId === rev.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          
                          <button
                            onClick={() => setRestoreConfirmVersion(rev)}
                            className="text-[10px] px-2 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                            title="Restore manuscript to this historical snapshot"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Restore</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Version Preview Modal */}
      <AnimatePresence>
        {previewVersion && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
                <div className="flex items-center gap-2.5">
                  <History className="w-4 h-4 text-amber-500" />
                  <div>
                    <h3 className="text-sm font-bold text-white">Historical Version Inspection</h3>
                    <p className="text-[10px] text-slate-400 font-mono">
                      Timestamp: {previewVersion.timestamp} · Author: {previewVersion.author}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setPreviewVersion(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                  {previewVersion.content}
                </pre>
              </div>

              <div className="px-6 py-3 border-t border-slate-800 flex items-center justify-between bg-slate-900/40 text-xs">
                <span className="text-slate-400 font-mono text-[11px]">
                  Words: {previewVersion.content.trim().split(/\s+/).filter(Boolean).length}
                </span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(previewVersion.content);
                    }}
                    className="px-3 py-1.5 rounded-lg border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold cursor-pointer"
                  >
                    Copy Text
                  </button>
                  <button
                    onClick={() => handleRestoreVersion(previewVersion)}
                    className="px-4 py-1.5 rounded-lg bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400 transition-colors flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restore This Version</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Restore Confirmation Dialog */}
      <AnimatePresence>
        {restoreConfirmVersion && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4"
            >
              <div className="flex items-center gap-3 text-amber-400">
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                </div>
                <h3 className="text-base font-bold text-white">Restore Historical Version?</h3>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Are you sure you want to restore the manuscript to the snapshot from <strong className="text-white font-mono">{restoreConfirmVersion.timestamp}</strong>? 
                Your current manuscript will be safely archived into a new restoration entry before the reversion.
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setRestoreConfirmVersion(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleRestoreVersion(restoreConfirmVersion)}
                  className="px-4 py-1.5 rounded-lg bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400 transition-colors flex items-center gap-1.5 shadow-md"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Confirm & Restore</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
                    className={`py-2 px-3 rounded-lg text-xs font-medium border transition-all text-left cursor-pointer ${p.color} ${
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
                    className={`py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
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
                    className={`py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
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

      {/* Triadic Lore Vectors Drawer */}
      <AnimatePresence>
        {isTriadicDrawerOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-w-xl bg-slate-950 border-l border-slate-800 h-full flex flex-col p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      Triadic Vectors: {pack.title}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Hermeneutic breakdown of physical relics, genotypes, and dogmas
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsTriadicDrawerOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Action Banner to launch synthesis */}
              {onOpenSynthesizer && (
                <div className="my-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-amber-300 block">
                      Cross-Codex Synthesis
                    </span>
                    <span className="text-[11px] text-amber-200/70">
                      Synthesize profound new interpretations against other Codexes.
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setIsTriadicDrawerOpen(false);
                      onOpenSynthesizer(pack);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shrink-0 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Launch Synthesizer</span>
                  </button>
                </div>
              )}

              {/* Vector lists */}
              <div className="flex-1 overflow-y-auto space-y-5 custom-scrollbar pr-1">
                {/* Artifacts */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                    🏺 Physical Relics ({codexVectors.artifacts.length})
                  </span>
                  <div className="space-y-2">
                    {codexVectors.artifacts.map((art) => (
                      <div key={art.id} className="p-3 rounded-xl bg-slate-900 border border-cyan-500/20 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">{art.name}</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-300 font-mono">
                            {art.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 font-serif">{art.physicalForm}</p>
                        <p className="text-[10px] text-cyan-200/80 font-mono bg-cyan-950/40 p-1.5 rounded">
                          Resonance: {art.functionalResonance}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Genetics */}
                <div className="space-y-2 pt-2 border-t border-slate-900">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    🧬 Genetic Lineages ({codexVectors.genetics.length})
                  </span>
                  <div className="space-y-2">
                    {codexVectors.genetics.map((gen) => (
                      <div key={gen.id} className="p-3 rounded-xl bg-slate-900 border border-emerald-500/20 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">{gen.strainName}</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-300 font-mono">
                            {gen.taxonomy}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 font-sans">{gen.biologicalTraits}</p>
                        <p className="text-[10px] text-emerald-200/80 font-mono bg-emerald-950/40 p-1.5 rounded">
                          Mutation: {gen.divergencePattern}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Memetics */}
                <div className="space-y-2 pt-2 border-t border-slate-900">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                    🧠 Memetic Dogmas ({codexVectors.memetics.length})
                  </span>
                  <div className="space-y-2">
                    {codexVectors.memetics.map((mem) => (
                      <div key={mem.id} className="p-3 rounded-xl bg-slate-900 border border-purple-500/20 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">{mem.memeTitle}</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-300 font-mono">
                            {mem.vectorType}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 font-serif italic">"{mem.coreDogma}"</p>
                        <p className="text-[10px] text-purple-200/80 font-mono bg-purple-950/40 p-1.5 rounded">
                          Transmission: {mem.transmissionMode}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Summon Council Modal */}
      <SummonCouncilModal
        isOpen={isSummonModalOpen}
        onClose={() => setIsSummonModalOpen(false)}
        manuscript={activeManuscript}
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
        onAdoptPatch={handleAdoptCouncilPatch}
        onPostToDiscussion={handlePostToDiscussion}
      />
    </div>
  );
}
