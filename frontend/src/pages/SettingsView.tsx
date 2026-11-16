import React, { useState } from 'react';
import { Settings, AlertTriangle, Check, Keyboard, Database } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { resetClassProgress } from '../db/hydration';

export const SettingsView: React.FC = () => {
  const { activeClass, refreshStats, forceRefreshPool, isHydrating } = useApp();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleReset = async () => {
    await resetClassProgress(activeClass);
    await refreshStats();
    setShowResetConfirm(false);
    setResetSuccess(true);
    setTimeout(() => setResetSuccess(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      
      <div>
        <h2 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
          <Settings className="w-6 h-6 text-slate-700" />
          <span>Application Settings</span>
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Configure study behavior, keyboard controls, and local storage.
        </p>
      </div>

      {/* Keyboard Shortcuts Reference */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="font-bold text-slate-900 flex items-center space-x-2">
          <Keyboard className="w-5 h-5 text-blue-600" />
          <span>Desktop Keyboard Shortcuts</span>
        </h3>
        <p className="text-xs text-slate-500">
          Study rapidly without taking your hands off the keyboard:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <span className="text-slate-700 font-medium">Select Choice A, B, C, D</span>
            <div className="flex space-x-1 font-mono text-xs">
              <span className="px-2 py-0.5 bg-white border border-slate-300 rounded shadow-xs">1</span>
              <span className="px-2 py-0.5 bg-white border border-slate-300 rounded shadow-xs">2</span>
              <span className="px-2 py-0.5 bg-white border border-slate-300 rounded shadow-xs">3</span>
              <span className="px-2 py-0.5 bg-white border border-slate-300 rounded shadow-xs">4</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <span className="text-slate-700 font-medium">Alternative Choice Keys</span>
            <div className="flex space-x-1 font-mono text-xs">
              <span className="px-2 py-0.5 bg-white border border-slate-300 rounded shadow-xs">A</span>
              <span className="px-2 py-0.5 bg-white border border-slate-300 rounded shadow-xs">B</span>
              <span className="px-2 py-0.5 bg-white border border-slate-300 rounded shadow-xs">C</span>
              <span className="px-2 py-0.5 bg-white border border-slate-300 rounded shadow-xs">D</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <span className="text-slate-700 font-medium">Advance to Next Question</span>
            <span className="px-3 py-0.5 bg-white border border-slate-300 rounded font-mono text-xs shadow-xs">
              Space / Enter
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <span className="text-slate-700 font-medium">Bookmark Question (Exam)</span>
            <span className="px-3 py-0.5 bg-white border border-slate-300 rounded font-mono text-xs shadow-xs">
              M
            </span>
          </div>
        </div>
      </div>

      {/* Spaced Repetition Rules */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <h3 className="font-bold text-slate-900">Study Engine Transition Rules</h3>
        <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside">
          <li><strong>Promotion:</strong> Answering a question correctly twice consecutively advances it one bucket (<em>Needs Work $\rightarrow$ Learning $\rightarrow$ Mastered</em>).</li>
          <li><strong>Demotion:</strong> Getting a question wrong demotes it one bucket (<em>Mastered $\rightarrow$ Learning $\rightarrow$ Needs Work</em>).</li>
          <li><strong>Time Decay:</strong> Questions in <em>Mastered</em> that sit idle for more than 7 days automatically decay back to <em>Learning</em> for a refresher.</li>
          <li><strong>Mistakes Queue:</strong> Any wrong answer in study or mock mode is added to the Mistake Drill queue and leaves only after 2 consecutive correct answers.</li>
        </ul>
      </div>

      {/* Local Storage & Cache Management */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="font-bold text-slate-900 flex items-center space-x-2">
          <Database className="w-5 h-5 text-indigo-600" />
          <span>Local Storage & Re-Sync</span>
        </h3>
        <p className="text-xs text-slate-500">
          Your question pools and progress are stored client-side in IndexedDB (Dexie.js).
        </p>

        <button
          onClick={forceRefreshPool}
          disabled={isHydrating}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg transition"
        >
          {isHydrating ? 'Re-syncing...' : 'Force Re-sync Pool from Server'}
        </button>
      </div>

      {/* Danger Zone: Reset Progress */}
      <div className="bg-rose-50 border border-rose-200 p-6 rounded-2xl space-y-4">
        <div className="flex items-center space-x-2 text-rose-800 font-bold">
          <AlertTriangle className="w-5 h-5" />
          <span>Reset Class Progress</span>
        </div>
        <p className="text-xs text-rose-700">
          This will reset all study buckets for the <strong>{activeClass}</strong> license class back to <em>Unseen</em>. 
          Your historical attempt event log is preserved for longitudinal analytics, but your active study queue will start fresh.
        </p>

        {resetSuccess ? (
          <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-lg">
            <Check className="w-4 h-4" />
            <span>Progress for {activeClass} reset successfully!</span>
          </div>
        ) : showResetConfirm ? (
          <div className="flex items-center space-x-3">
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition shadow-sm cursor-pointer"
            >
              Yes, Confirm Reset for {activeClass}
            </button>
            <button
              onClick={() => setShowResetConfirm(false)}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowResetConfirm(true)}
            className="px-4 py-2 bg-white hover:bg-rose-100 text-rose-700 border border-rose-300 text-xs font-bold rounded-lg transition"
          >
            Reset Progress for {activeClass}
          </button>
        )}
      </div>

    </div>
  );
};
