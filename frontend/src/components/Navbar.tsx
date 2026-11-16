import React from 'react';
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
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { LicenseClassType } from '../types';

interface NavbarProps {
  currentTab: 'dashboard' | 'study' | 'mock' | 'mistakes' | 'analytics' | 'settings';
  setCurrentTab: (tab: 'dashboard' | 'study' | 'mock' | 'mistakes' | 'analytics' | 'settings') => void;
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
  } = useApp();

  const classLabels: Record<LicenseClassType, string> = {
    TECH: 'Technician',
    GEN: 'General',
    EXTRA: 'Amateur Extra',
  };

  return (
    <header className="bg-slate-900 text-white shadow-md border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentTab('dashboard')}>
            <div className="p-2 bg-blue-600 rounded-lg text-white">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight">Ham Radio Prep</span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded bg-blue-900 text-blue-200 border border-blue-700">
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
              onClick={() => setCurrentTab('study')}
              className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition cursor-pointer ${
                currentTab === 'study' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Study</span>
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
          </nav>

          {/* Right Action Cluster: Target Class Switcher + Sync + Auth */}
          <div className="flex items-center space-x-3">
            {/* Class Dropdown */}
            <div className="relative">
              <label htmlFor="class-select" className="sr-only">License Class</label>
              <select
                id="class-select"
                value={activeClass}
                onChange={(e) => setActiveClass(e.target.value as LicenseClassType)}
                className="bg-slate-800 border border-slate-700 text-white text-xs sm:text-sm font-medium rounded-lg px-2 sm:px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {(['TECH', 'GEN', 'EXTRA'] as LicenseClassType[]).map((cls) => (
                  <option key={cls} value={cls}>
                    {classLabels[cls]}
                  </option>
                ))}
              </select>
            </div>

            {/* Sync Status Button */}
            <button
              onClick={triggerManualSync}
              disabled={syncState.isSyncing}
              className="flex items-center space-x-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition cursor-pointer"
              title={
                syncState.isSyncing
                  ? 'Syncing with cloud...'
                  : syncState.unsyncedCount > 0
                  ? `${syncState.unsyncedCount} unsynced attempts. Click to sync.`
                  : 'All practice synced to cloud.'
              }
            >
              {syncState.isSyncing ? (
                <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin" />
              ) : syncState.unsyncedCount > 0 ? (
                <>
                  <CloudOff className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline text-amber-300 font-medium">
                    {syncState.unsyncedCount} unsynced
                  </span>
                </>
              ) : (
                <>
                  <Cloud className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline text-emerald-400 font-medium">
                    Synced
                  </span>
                </>
              )}
            </button>

            {/* Auth / Profile Area */}
            {currentUser ? (
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1.5 bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-200">
                  <UserIcon className="w-3.5 h-3.5 text-blue-400" />
                  <span className="max-w-[80px] sm:max-w-[120px] truncate">{currentUser.username}</span>
                </div>
                <button
                  onClick={logout}
                  className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={openAuthModal}
                className="flex items-center space-x-1 text-xs font-medium px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition shadow-sm cursor-pointer"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Sign In</span>
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
      <div className="md:hidden flex justify-around border-t border-slate-800 bg-slate-900/95 py-2">
        <button
          onClick={() => setCurrentTab('dashboard')}
          className={`text-xs px-2 py-1 ${currentTab === 'dashboard' ? 'text-blue-400 font-bold' : 'text-slate-400'}`}
        >
          Home
        </button>
        <button
          onClick={() => setCurrentTab('study')}
          className={`text-xs px-2 py-1 ${currentTab === 'study' ? 'text-blue-400 font-bold' : 'text-slate-400'}`}
        >
          Study
        </button>
        <button
          onClick={() => setCurrentTab('mock')}
          className={`text-xs px-2 py-1 ${currentTab === 'mock' ? 'text-blue-400 font-bold' : 'text-slate-400'}`}
        >
          Mock Exam
        </button>
        <button
          onClick={() => setCurrentTab('mistakes')}
          className={`text-xs px-2 py-1 ${currentTab === 'mistakes' ? 'text-rose-400 font-bold' : 'text-slate-400'}`}
        >
          Mistakes ({bucketCounts.mistakesCount})
        </button>
        <button
          onClick={() => setCurrentTab('analytics')}
          className={`text-xs px-2 py-1 ${currentTab === 'analytics' ? 'text-blue-400 font-bold' : 'text-slate-400'}`}
        >
          Stats
        </button>
      </div>
    </header>
  );
};
