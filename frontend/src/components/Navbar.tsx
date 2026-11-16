import React from 'react';
import { Radio, RefreshCw, BookOpen, Award, AlertCircle, BarChart3, Settings } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { LicenseClassType } from '../types';

interface NavbarProps {
  currentTab: 'dashboard' | 'study' | 'mock' | 'mistakes' | 'analytics' | 'settings';
  setCurrentTab: (tab: 'dashboard' | 'study' | 'mock' | 'mistakes' | 'analytics' | 'settings') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab }) => {
  const { activeClass, setActiveClass, isHydrating, bucketCounts } = useApp();

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
                FCC FCC/NCVEC
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex space-x-1 lg:space-x-2">
            <button
              onClick={() => setCurrentTab('dashboard')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                currentTab === 'dashboard' ? 'bg-slate-800 text-blue-400' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setCurrentTab('study')}
              className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition ${
                currentTab === 'study' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Study</span>
            </button>
            <button
              onClick={() => setCurrentTab('mock')}
              className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition ${
                currentTab === 'mock' ? 'bg-purple-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Mock Exam</span>
            </button>
            <button
              onClick={() => setCurrentTab('mistakes')}
              className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition ${
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
              className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition ${
                currentTab === 'analytics' ? 'bg-slate-800 text-blue-400' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Analytics</span>
            </button>
            <button
              onClick={() => setCurrentTab('settings')}
              className={`p-2 rounded-md text-slate-300 hover:bg-slate-800 hover:text-white transition ${
                currentTab === 'settings' ? 'bg-slate-800 text-blue-400' : ''
              }`}
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </nav>

          {/* Active Target Class Switcher */}
          <div className="flex items-center space-x-3">
            <div className="relative">
              <label htmlFor="class-select" className="sr-only">License Class</label>
              <select
                id="class-select"
                value={activeClass}
                onChange={(e) => setActiveClass(e.target.value as LicenseClassType)}
                className="bg-slate-800 border border-slate-700 text-white text-sm font-medium rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {(['TECH', 'GEN', 'EXTRA'] as LicenseClassType[]).map((cls) => (
                  <option key={cls} value={cls}>
                    {classLabels[cls]}
                  </option>
                ))}
              </select>
            </div>

            {/* Hydration / Sync Indicator */}
            <div className="flex items-center text-xs text-slate-400" title={isHydrating ? "Hydrating local database..." : "Local-first active"}>
              <RefreshCw className={`w-3.5 h-3.5 mr-1 ${isHydrating ? 'animate-spin text-blue-400' : 'text-emerald-400'}`} />
              <span className="hidden sm:inline">{isHydrating ? 'Syncing...' : 'Local First'}</span>
            </div>
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
