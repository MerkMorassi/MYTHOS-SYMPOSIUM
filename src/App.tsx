import React, { useState, useEffect, useMemo } from 'react';
import { 
  Library, 
  Users, 
  Settings, 
  Search, 
  ChevronRight,
  BookOpen,
  Sparkles,
  Cpu,
  Database,
  X,
  RotateCcw,
  Check,
  LogIn,
  LogOut,
  Cloud,
  FileText,
  Clock,
  Compass,
  ArrowRight,
  BookMarked,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User } from 'firebase/auth';
import { AGENTS, Agent } from './lib/agents';
import { SymposiumHallView } from './views/SymposiumHallView';
import { TriadicSynthesizerView } from './views/TriadicSynthesizerView';
import { 
  LorepackDoc, 
  subscribeLorepacks, 
  loginWithGoogle, 
  logoutUser, 
  subscribeToAuth, 
  INITIAL_MOCK_LOREPACKS 
} from './lib/firestore-service';

// Settings interface
export interface FactorySettings {
  operatorName: string;
  operatorRole: string;
  defaultModel: string;
  temperature: number;
  maxWords: number;
  fontTheme: 'serif' | 'sans' | 'mono';
  autoSync: boolean;
  triadicResonance: boolean;
  councilMode: string;
}

export const DEFAULT_SETTINGS: FactorySettings = {
  operatorName: 'Merk Morassi',
  operatorRole: 'Lorepack Scholar',
  defaultModel: 'gemini-2.5-flash',
  temperature: 0.7,
  maxWords: 1000,
  fontTheme: 'serif',
  autoSync: true,
  triadicResonance: true,
  councilMode: 'Triadic Consensus'
};

function loadSettings(): FactorySettings {
  try {
    const saved = localStorage.getItem('mythos_factory_settings');
    if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
  } catch (e) {
    // fallback
  }
  return DEFAULT_SETTINGS;
}

function saveSettings(settings: FactorySettings) {
  try {
    localStorage.setItem('mythos_factory_settings', JSON.stringify(settings));
  } catch (e) {
    // ignore
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'gallery' | 'reader' | 'synthesizer'>('gallery');
  const [selectedLorepack, setSelectedLorepack] = useState<LorepackDoc | null>(INITIAL_MOCK_LOREPACKS[0]);
  const [selectedAgent, setSelectedAgent] = useState<Agent>(AGENTS[0]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<FactorySettings>(loadSettings);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  
  // Real-time Lorepacks from Firestore
  const [lorepacks, setLorepacks] = useState<LorepackDoc[]>(INITIAL_MOCK_LOREPACKS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Subscribe to Auth State
  useEffect(() => {
    const unsubscribe = subscribeToAuth((user) => {
      setCurrentUser(user);
      setIsAuthLoading(false);
      if (user?.displayName && !localStorage.getItem('mythos_factory_settings')) {
        setSettings(prev => ({
          ...prev,
          operatorName: user.displayName || prev.operatorName
        }));
      }
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to Firestore Lorepacks collection
  useEffect(() => {
    const unsubscribe = subscribeLorepacks(
      (data) => {
        if (data && data.length > 0) {
          setLorepacks(data);
          // Refresh selected lorepack reference if present
          setSelectedLorepack(current => {
            if (!current) return data[0];
            return data.find(p => p.id === current.id) || current;
          });
        }
      },
      (err) => {
        console.warn('Using local fallback for lorepacks:', err);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleSaveSettings = (newSettings: FactorySettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    lorepacks.forEach(p => p.category && set.add(p.category));
    return ['All', ...Array.from(set)];
  }, [lorepacks]);

  const filteredPacks = useMemo(() => {
    return lorepacks.filter(pack => {
      const matchesCategory = selectedCategory === 'All' || pack.category === selectedCategory;
      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return pack.title.toLowerCase().includes(q) || 
             pack.category.toLowerCase().includes(q) ||
             pack.author.toLowerCase().includes(q) ||
             (pack.manuscript && pack.manuscript.toLowerCase().includes(q));
    });
  }, [lorepacks, selectedCategory, searchQuery]);

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 font-sans selection:bg-amber-500/30">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 flex flex-col shrink-0 bg-slate-950/70 backdrop-blur-xl">
        <div className="p-6">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                Mythos Codex
              </h1>
              <p className="text-[10px] uppercase tracking-[0.2em] text-amber-500 font-mono font-semibold">
                Lorepack Reader
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto custom-scrollbar">
          <div className="pb-4">
            <p className="px-3 text-[10px] uppercase tracking-widest text-slate-600 font-bold mb-2">Reading Navigation</p>
            <NavItem 
              icon={<Library className="w-4 h-4" />} 
              label="Codex Archives" 
              active={activeTab === 'gallery'} 
              onClick={() => { setActiveTab('gallery'); }} 
            />
            <NavItem 
              icon={<BookMarked className="w-4 h-4" />} 
              label="Codex Reader" 
              active={activeTab === 'reader'} 
              onClick={() => {
                if (!selectedLorepack && lorepacks.length > 0) {
                  setSelectedLorepack(lorepacks[0]);
                }
                setActiveTab('reader');
              }} 
            />
            <NavItem 
              icon={<Layers className="w-4 h-4" />} 
              label="Triadic Synthesizer" 
              active={activeTab === 'synthesizer'} 
              onClick={() => { setActiveTab('synthesizer'); }} 
            />
          </div>

          <div className="pt-4 border-t border-slate-900">
            <div className="flex items-center justify-between px-3 mb-2">
              <p className="text-[10px] uppercase tracking-widest text-slate-600 font-bold">Pantheon Commentator</p>
              <span className="text-[9px] font-mono text-amber-500/80 bg-amber-500/10 px-1 rounded">
                Council
              </span>
            </div>
            {AGENTS.map(agent => (
              <button 
                key={agent.id}
                onClick={() => setSelectedAgent(agent)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-all cursor-pointer ${
                  selectedAgent.id === agent.id 
                    ? 'bg-slate-800 text-white border border-slate-700 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${selectedAgent.id === agent.id ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-slate-700'}`} />
                <span className="truncate">{agent.handle}</span>
                <span className="text-[9px] text-slate-500 ml-auto font-mono truncate max-w-[70px]">
                  {agent.role}
                </span>
              </button>
            ))}
          </div>
        </nav>

        {/* Scholar / Operator Profile Card */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          {currentUser ? (
            <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                {currentUser.photoURL ? (
                  <img 
                    src={currentUser.photoURL} 
                    alt={currentUser.displayName || ''} 
                    className="w-7 h-7 rounded-full border border-amber-500/40"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-xs font-bold">
                    {(currentUser.displayName || currentUser.email || 'S')[0].toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white truncate">
                    {currentUser.displayName || 'Authenticated Scholar'}
                  </p>
                  <p className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                    <Cloud className="w-2.5 h-2.5" />
                    Vault Synchronized
                  </p>
                </div>
              </div>
              <button 
                onClick={handleLogout}
                title="Sign out"
                className="p-1.5 text-slate-500 hover:text-red-400 rounded transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleGoogleLogin}
              disabled={isAuthLoading}
              className="w-full py-2 px-3 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Connect Vault Sync</span>
            </button>
          )}

          <div 
            onClick={() => setIsSettingsOpen(true)}
            title="Configure Reader Settings"
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-900 transition-colors cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-xs font-bold text-white shadow-md shrink-0">
              {settings.operatorName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'MM'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate group-hover:text-amber-400 transition-colors">{settings.operatorName}</p>
              <p className="text-[10px] text-slate-500 truncate">{settings.operatorRole}</p>
            </div>
            <Settings className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 group-hover:rotate-45 transition-all" />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-950/50 backdrop-blur-xl sticky top-0 z-10">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span>Codex Archives</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-white font-medium">
              {activeTab === 'reader' && selectedLorepack ? selectedLorepack.title : 'All Lorepacks'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative group">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-amber-500 transition-colors" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search codex manuscripts..." 
                className="bg-slate-900 border border-slate-800 rounded-lg py-1.5 pl-10 pr-8 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500/50 w-64 transition-all text-slate-200"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {selectedLorepack && activeTab === 'gallery' && (
              <button
                onClick={() => setActiveTab('reader')}
                className="bg-amber-500 text-slate-950 px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-amber-400 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Resume Reading</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('synthesizer')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'synthesizer'
                  ? 'bg-amber-500 text-slate-950 font-bold border-amber-500 shadow-sm'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-amber-400 hover:border-amber-500/40'
              }`}
              title="Hermeneutic Synthesis: Artifacts · Genetics · Memetics"
            >
              <Layers className="w-3.5 h-3.5 text-amber-500" />
              <span>Triadic Synthesis</span>
            </button>

            <button
              onClick={() => setIsSettingsOpen(true)}
              title="Reader Settings"
              aria-label="Open Settings"
              className="p-2 rounded-lg border border-slate-800 hover:border-amber-500/50 bg-slate-900/60 hover:bg-slate-900 text-slate-400 hover:text-amber-400 transition-all flex items-center justify-center group cursor-pointer"
            >
              <Settings className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
            </button>
          </div>
        </header>

        {/* Content View */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <AnimatePresence mode="wait">
            {activeTab === 'gallery' ? (
              <motion.div 
                key="gallery"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-6xl mx-auto space-y-6"
              >
                {/* Header Banner */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                      <BookOpen className="w-6 h-6 text-amber-500" />
                      Codex Lore Library
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">
                      Explore, study, and inspect preserved mythological lorepacks and canonical manuscripts.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                    <Database className="w-3.5 h-3.5 text-amber-500" />
                    <span>{filteredPacks.length} Codex Manuscript{filteredPacks.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>

                {/* Category Filter Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                        selectedCategory === cat
                          ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                          : 'bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      {cat === 'All' ? 'All Chronicles' : cat}
                    </button>
                  ))}
                </div>

                {/* Lorepacks Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredPacks.map((pack) => (
                    <LorepackReaderCard 
                      key={pack.id} 
                      pack={pack} 
                      onSelect={() => { 
                        setSelectedLorepack(pack); 
                        setActiveTab('reader'); 
                      }} 
                    />
                  ))}
                </div>

                {filteredPacks.length === 0 && (
                  <div className="py-16 text-center bg-slate-900/20 border border-slate-800/80 rounded-2xl p-8 space-y-4">
                    <BookOpen className="w-10 h-10 text-slate-600 mx-auto" />
                    <h3 className="text-base font-semibold text-white">No Codex Manuscripts Found</h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      No manuscripts match your filter criteria. Select another genre or clear the search.
                    </p>
                    <button
                      onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
                      className="text-xs text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer"
                    >
                      Clear Filters
                    </button>
                  </div>
                )}
              </motion.div>
            ) : activeTab === 'reader' ? (
              <motion.div 
                key="reader"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="h-full flex flex-col"
              >
                {selectedLorepack ? (
                  <SymposiumHallView 
                    pack={selectedLorepack} 
                    agent={selectedAgent}
                    settings={settings}
                    onBack={() => { setActiveTab('gallery'); }} 
                    onOpenSynthesizer={(p) => {
                      if (p) setSelectedLorepack(p);
                      setActiveTab('synthesizer');
                    }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center border border-slate-800 shadow-xl">
                      <BookOpen className="w-8 h-8 text-amber-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">Select a Codex to Read</h3>
                    <p className="text-slate-400 max-w-sm text-sm">Choose any lorepack from the library to open the illuminated manuscript reader.</p>
                    <button 
                      onClick={() => setActiveTab('gallery')}
                      className="text-amber-500 text-sm font-medium hover:text-amber-400 transition-colors cursor-pointer"
                    >
                      Browse Codex Archives
                    </button>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div 
                key="synthesizer"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="h-full"
              >
                <TriadicSynthesizerView 
                  lorepacks={lorepacks}
                  settings={settings}
                  onOpenCodex={(pack) => {
                    setSelectedLorepack(pack);
                    setActiveTab('reader');
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        settings={settings} 
        onSave={handleSaveSettings} 
      />
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
        active 
          ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' 
          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function LorepackReaderCard({ pack, onSelect }: { pack: LorepackDoc, onSelect: () => void }) {
  const wordCount = pack.manuscript ? pack.manuscript.trim().split(/\s+/).filter(Boolean).length : 250;
  const readTimeMin = Math.max(1, Math.ceil(wordCount / 200));

  // Excerpt first paragraph
  const excerpt = useMemo(() => {
    if (!pack.manuscript) return 'Ancient myth preserved within the vault archives.';
    const paras = pack.manuscript.split('\n\n').filter(p => !p.startsWith('===') && !p.startsWith('['));
    return paras[0] || pack.manuscript.slice(0, 140);
  }, [pack.manuscript]);

  return (
    <div 
      onClick={onSelect}
      className="group bg-slate-900/50 border border-slate-800 rounded-2xl p-6 hover:border-amber-500/50 hover:bg-slate-900 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between space-y-4 shadow-md"
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
            {pack.category}
          </span>
          <span className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
            <Clock className="w-3 h-3 text-slate-400" />
            {readTimeMin} min read
          </span>
        </div>
        
        <div>
          <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
            {pack.title}
          </h3>
          <p className="text-xs text-slate-400 line-clamp-3 mt-2 leading-relaxed font-serif italic">
            "{excerpt}"
          </p>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
        <div className="text-[10px] text-slate-500">
          <span>By {pack.author}</span>
          <span className="mx-1.5">·</span>
          <span>{wordCount} words</span>
        </div>
        <div className="flex items-center gap-1 text-amber-400 font-semibold group-hover:translate-x-1 transition-transform">
          <span>Read</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
}

function SettingsModal({ 
  isOpen, 
  onClose, 
  settings, 
  onSave 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  settings: FactorySettings; 
  onSave: (newSettings: FactorySettings) => void; 
}) {
  const [activeTab, setActiveTab] = useState<'reader' | 'scholar' | 'council' | 'storage'>('reader');
  const [form, setForm] = useState<FactorySettings>(settings);
  const [savedFeedback, setSavedFeedback] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setForm(settings);
      setSavedFeedback(false);
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(form);
    setSavedFeedback(true);
    setTimeout(() => {
      setSavedFeedback(false);
      onClose();
    }, 600);
  };

  const handleReset = () => {
    setForm(DEFAULT_SETTINGS);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Modal Header */}
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/40">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Codex Reader Configuration
                </h3>
                <p className="text-xs text-slate-400">Configure reading appearance, scholar identity, and council commentary</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Tabs */}
          <div className="flex border-b border-slate-800 bg-slate-900/20 px-6 gap-2 pt-2">
            {[
              { id: 'reader', label: 'Typography', icon: BookOpen },
              { id: 'scholar', label: 'Scholar Identity', icon: Users },
              { id: 'council', label: 'Pantheon Council', icon: Cpu },
              { id: 'storage', label: 'Cloud Vault', icon: Database }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                    isActive
                      ? 'border-amber-500 text-amber-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Modal Body */}
          <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar flex-1">
            {activeTab === 'reader' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Default Reading Typography
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'serif', label: 'Mythic Serif', desc: 'Illuminated classic book type' },
                      { id: 'sans', label: 'Modern Sans', desc: 'Clean high-readability' },
                      { id: 'mono', label: 'Terminal Mono', desc: 'Archive technical record' }
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setForm({ ...form, fontTheme: t.id as any })}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          form.fontTheme === t.id
                            ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <p className="text-xs font-bold">{t.label}</p>
                        <p className="text-[10px] text-slate-500 mt-1">{t.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'scholar' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Scholar Name / Handle
                  </label>
                  <input
                    type="text"
                    value={form.operatorName}
                    onChange={(e) => setForm({ ...form, operatorName: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500/50"
                    placeholder="e.g. Merk Morassi"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Scholar Title
                  </label>
                  <input
                    type="text"
                    value={form.operatorRole}
                    onChange={(e) => setForm({ ...form, operatorRole: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500/50"
                    placeholder="e.g. Lorepack Scholar, Archivist"
                  />
                </div>
              </div>
            )}

            {activeTab === 'council' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Commentary Reasoning Engine
                  </label>
                  <select
                    value={form.defaultModel}
                    onChange={(e) => setForm({ ...form, defaultModel: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50"
                  >
                    <option value="gemini-2.5-flash">Gemini 2.5 Flash (Fast responsive commentary)</option>
                    <option value="gemini-2.5-pro">Gemini 2.5 Pro (Deep theological analysis)</option>
                  </select>
                </div>

                <div className="pt-2">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Council Interpretation Paradigm
                  </label>
                  <select
                    value={form.councilMode}
                    onChange={(e) => setForm({ ...form, councilMode: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50"
                  >
                    <option value="Triadic Consensus">Triadic Consensus (3-agent harmonic validation)</option>
                    <option value="Dialectical Synthesis">Dialectical Synthesis (Thesis-Antithesis balance)</option>
                    <option value="Autonomous Crucible">Autonomous Crucible (Stress-testing mythos integrity)</option>
                    <option value="Socratic Inquiry">Socratic Inquiry (Continuous prompt questioning)</option>
                  </select>
                </div>
              </div>
            )}

            {activeTab === 'storage' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                      <Database className="w-4 h-4 text-emerald-400" />
                      Cloud Firestore Vault
                    </span>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono font-bold">
                      CONNECTED
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
                    ai-studio-mythossymposium-862be900-ffd9-4e03-890c-7756f4394805
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between bg-slate-900/40">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Defaults
            </button>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-900 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="flex items-center gap-2 bg-amber-500 text-slate-950 px-5 py-2 rounded-xl text-xs font-bold hover:bg-amber-400 transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)] cursor-pointer"
              >
                {savedFeedback ? (
                  <>
                    <Check className="w-4 h-4 text-slate-950" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <span>Save Preferences</span>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
