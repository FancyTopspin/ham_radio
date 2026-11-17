import React, { useState, useRef, useEffect } from 'react';
import {
  Radio,
  BookOpen,
  Award,
  AlertCircle,
  BarChart3,
  Settings,
  Cloud,
  CloudOff,
  RefreshCw,
  User as UserIcon,
  LogOut,
  GraduationCap,
  ChevronDown,
  Check,
  MessageSquare,
  Layers,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { LicenseClassType } from '../types';

export type NavTab = 'dashboard' | 'topics' | 'study_read' | 'study' | 'mock' | 'mistakes' | 'analytics' | 'settings';

interface NavbarProps {
  currentTab: NavTab;
  setCurrentTab: (tab: NavTab) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab }) => {
  const {
    activeClass,
    setActiveClass,
    isHydrating,
    bucketCounts,
    currentUser,
    openAuthModal,
    logout,
    syncState,
    triggerManualSync,
    openFeedbackModal,
  } = useApp();

  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsClassDropdownOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsClassDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const classLabels: Record<LicenseClassType, string> = {
    TECH: 'Technician',
    GEN: 'General',
    EXTRA: 'Amateur Extra',
  };

  const classShortLabels: Record<LicenseClassType, string> = {
    TECH: 'Tech',
    GEN: 'General',
    EXTRA: 'Extra',
  };

  const classDetails: Record<
    LicenseClassType,
    { name: string; element: string; questions: string; cycle: string; desc: string }
  > = {
    TECH: {
      name: 'Technician',
      element: 'Element 2',
      questions: '35 Questions',
      cycle: '2022–2026 Pool',
      desc: 'Entry-level VHF/UHF & basic privileges',
    },
    GEN: {
      name: 'General',
      element: 'Element 3',
      questions: '35 Questions',
      cycle: '2023–2027 Pool',
      desc: 'Worldwide HF band & DX privileges',
    },
    EXTRA: {
      name: 'Amateur Extra',
      element: 'Element 4',
      questions: '50 Questions',
      cycle: '2024–2028 Pool',
      desc: 'All amateur radio frequencies & modes',
    },
  };

  return (
    <header className="bg-slate-900 text-white shadow-md border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-1.5 sm:space-x-3 cursor-pointer shrink-0" onClick={() => setCurrentTab('dashboard')}>
            <div className="p-1 sm:p-2 bg-blue-600 rounded-lg text-white shrink-0">
              <Radio className="w-3.5 h-3.5 sm:w-5 sm:h-5 animate-pulse" />
            </div>
            <div className="shrink-0 flex items-center">
              <span className="font-extrabold text-xs sm:text-lg tracking-tight whitespace-nowrap">
                Ham Radio<span className="hidden xs:inline sm:inline"> Prep</span>
              </span>
              <span className="hidden lg:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded bg-blue-900 text-blue-200 border border-blue-700">
                FCC / NCVEC
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex space-x-1 lg:space-x-2">
            <button
              onClick={() => setCurrentTab('dashboard')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition cursor-pointer ${
                currentTab === 'dashboard' ? 'bg-slate-800 text-blue-400' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setCurrentTab('topics')}
              className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition cursor-pointer ${
                currentTab === 'topics' || currentTab === 'study_read'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Lessons & Topics</span>
            </button>
            <button
              onClick={() => setCurrentTab('study')}
              className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition cursor-pointer ${
                currentTab === 'study' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Practice</span>
            </button>
            <button
              onClick={() => setCurrentTab('mock')}
              className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition cursor-pointer ${
                currentTab === 'mock' ? 'bg-purple-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Mock Exam</span>
            </button>
            <button
              onClick={() => setCurrentTab('mistakes')}
              className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition cursor-pointer ${
                currentTab === 'mistakes' ? 'bg-rose-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <AlertCircle className="w-4 h-4" />
              <span>Mistakes</span>
              {bucketCounts.mistakesCount > 0 && (
                <span className="ml-1 text-xs px-1.5 py-0.5 rounded-full bg-rose-500 text-white font-bold">
                  {bucketCounts.mistakesCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setCurrentTab('analytics')}
              className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition cursor-pointer ${
                currentTab === 'analytics' ? 'bg-slate-800 text-blue-400' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Analytics</span>
            </button>
            <button
              onClick={() => setCurrentTab('settings')}
              className={`p-2 rounded-md text-slate-300 hover:bg-slate-800 hover:text-white transition cursor-pointer ${
                currentTab === 'settings' ? 'bg-slate-800 text-blue-400' : ''
              }`}
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={() => openFeedbackModal()}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition cursor-pointer border border-slate-700/60"
              title="Share Feedback or Suggestions"
            >
              <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
              <span>Feedback</span>
            </button>
          </nav>

          {/* Right Action Cluster: Target Class Switcher + Sync + Auth */}
          <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
            {/* Class Dropdown Pill */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsClassDropdownOpen(!isClassDropdownOpen)}
                className="flex items-center space-x-1 sm:space-x-2 bg-gradient-to-r from-blue-950/80 to-slate-800 hover:from-blue-900/90 hover:to-slate-750 border border-blue-500/40 hover:border-blue-400 text-white rounded-lg sm:rounded-xl px-1.5 py-1 sm:px-3 sm:py-1.5 transition shadow-sm cursor-pointer group"
                aria-haspopup="true"
                aria-expanded={isClassDropdownOpen}
                title="Switch FCC License Class"
              >
                <div className="p-0.5 sm:p-1 rounded-md bg-blue-600/30 text-blue-300 group-hover:bg-blue-600/50">
                  <GraduationCap className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
                </div>
                <div className="text-left">
                  <span className="text-[9px] text-blue-300/80 uppercase font-semibold tracking-wider hidden sm:block leading-none">
                    Class
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-white block leading-tight">
                    <span className="sm:hidden">{classShortLabels[activeClass]}</span>
                    <span className="hidden sm:inline">{classLabels[activeClass]}</span>
                  </span>
                </div>
                <ChevronDown
                  className={`w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-300 transition-transform duration-200 ml-0.5 ${
                    isClassDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Backdrop on mobile */}
              {isClassDropdownOpen && (
                <div
                  className="fixed inset-0 bg-black/60 z-40 sm:hidden"
                  onClick={() => setIsClassDropdownOpen(false)}
                />
              )}

              {/* Rich Dropdown Popover (fixed centered on mobile, absolute right on desktop) */}
              {isClassDropdownOpen && (
                <div className="fixed left-3 right-3 top-16 z-50 sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-80 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2.5 sm:p-2 space-y-1 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1.5 flex items-center justify-between border-b border-slate-800">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Select License Tier
                    </span>
                    <span className="text-[10px] font-medium text-blue-400">
                      Official NCVEC
                    </span>
                  </div>

                  {(['TECH', 'GEN', 'EXTRA'] as LicenseClassType[]).map((cls) => {
                    const isSelected = activeClass === cls;
                    const details = classDetails[cls];
                    return (
                      <button
                        key={cls}
                        type="button"
                        onClick={() => {
                          setActiveClass(cls);
                          setIsClassDropdownOpen(false);
                        }}
                        className={`w-full text-left p-2.5 rounded-xl transition flex items-start justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600/25 border border-blue-500/50 text-white'
                            : 'hover:bg-slate-800/80 border border-transparent text-slate-300 hover:text-white'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-sm text-white">
                              {details.name} Class
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-medium border border-slate-700">
                              {details.element}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400">
                            {details.desc}
                          </p>
                          <div className="text-[10px] text-blue-400 font-medium">
                            {details.questions} • {details.cycle}
                          </div>
                        </div>

                        {isSelected && (
                          <div className="shrink-0 ml-2 p-1 bg-blue-500/20 text-blue-400 rounded-full mt-0.5">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Sync Status Button - Compact on mobile (hidden when fully synced to save space) */}
            <button
              onClick={triggerManualSync}
              disabled={syncState.isSyncing}
              className={`p-1 sm:px-2.5 sm:py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition cursor-pointer flex items-center space-x-1.5 ${
                syncState.unsyncedCount === 0 && !syncState.isSyncing ? 'hidden sm:flex' : 'flex'
              }`}
              title={
                syncState.isSyncing
                  ? 'Syncing with cloud...'
                  : syncState.unsyncedCount > 0
                  ? `${syncState.unsyncedCount} unsynced attempts. Click to sync.`
                  : 'All practice synced to cloud.'
              }
            >
              {syncState.isSyncing ? (
                <RefreshCw className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-400 animate-spin" />
              ) : syncState.unsyncedCount > 0 ? (
                <>
                  <CloudOff className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400" />
                  <span className="hidden sm:inline text-xs text-amber-300 font-medium">
                    {syncState.unsyncedCount}
                  </span>
                </>
              ) : (
                <>
                  <Cloud className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline text-xs text-emerald-400 font-medium">
                    Synced
                  </span>
                </>
              )}
            </button>

            {/* Auth / Profile Area */}
            {currentUser ? (
              <div className="flex items-center space-x-0.5 sm:space-x-1.5">
                <div className="flex items-center space-x-1 bg-slate-800 border border-slate-700 px-1.5 py-1 sm:px-2 sm:py-1 rounded-lg text-xs font-semibold text-slate-200">
                  <UserIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-400 shrink-0" />
                  <span className="max-w-[40px] sm:max-w-[120px] truncate text-[11px] sm:text-xs">{currentUser.username}</span>
                </div>
                <button
                  onClick={logout}
                  className="p-1 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition cursor-pointer shrink-0"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={openAuthModal}
                className="flex items-center space-x-1 text-xs font-medium px-2 py-1 sm:px-3 sm:py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition shadow-sm cursor-pointer whitespace-nowrap"
              >
                <UserIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span className="text-[11px] sm:text-xs">Sign In</span>
              </button>
            )}

            {/* Pool Hydration spinner */}
            {isHydrating && (
              <span title="Hydrating pool...">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
              </span>
            )}
          </div>

        </div>
      </div>

      {/* Mobile Tab Bar */}
      <div className="md:hidden grid grid-cols-6 border-t border-slate-800 bg-slate-900/95 py-1.5 px-0.5 text-center">
        <button
          onClick={() => setCurrentTab('dashboard')}
          className={`text-[11px] py-1 font-semibold truncate transition ${
            currentTab === 'dashboard' ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Home
        </button>
        <button
          onClick={() => setCurrentTab('topics')}
          className={`text-[11px] py-1 font-semibold truncate transition ${
            currentTab === 'topics' || currentTab === 'study_read'
              ? 'text-blue-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Lessons
        </button>
        <button
          onClick={() => setCurrentTab('study')}
          className={`text-[11px] py-1 font-semibold truncate transition ${
            currentTab === 'study' ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Practice
        </button>
        <button
          onClick={() => setCurrentTab('mock')}
          className={`text-[11px] py-1 font-semibold truncate transition ${
            currentTab === 'mock' ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Exam
        </button>
        <button
          onClick={() => setCurrentTab('mistakes')}
          className={`text-[11px] py-1 font-semibold truncate transition ${
            currentTab === 'mistakes' ? 'text-rose-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Mistakes{bucketCounts.mistakesCount > 0 ? ` (${bucketCounts.mistakesCount})` : ''}
        </button>
        <button
          onClick={() => setCurrentTab('analytics')}
          className={`text-[11px] py-1 font-semibold truncate transition ${
            currentTab === 'analytics' ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Stats
        </button>
      </div>
    </header>
  );
};
