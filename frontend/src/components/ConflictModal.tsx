import React, { useState } from 'react';
import { GitMerge, DownloadCloud, AlertTriangle, Loader2 } from 'lucide-react';
import type { AttemptEvent } from '../types';
import { mergeCloudHistory, overwriteLocalWithCloud } from '../services/syncService';

interface ConflictModalProps {
  isOpen: boolean;
  localCount: number;
  cloudAttempts: AttemptEvent[];
  onResolved: () => void;
}

export const ConflictModal: React.FC<ConflictModalProps> = ({
  isOpen,
  localCount,
  cloudAttempts,
  onResolved,
}) => {
  const [processing, setProcessing] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<'merge' | 'overwrite'>('merge');

  if (!isOpen) return null;

  const handleResolve = async () => {
    setProcessing(true);
    try {
      if (selectedStrategy === 'merge') {
        await mergeCloudHistory(cloudAttempts);
      } else {
        await overwriteLocalWithCloud(cloudAttempts);
      }
      onResolved();
    } catch (err) {
      console.error('Failed to resolve sync conflict:', err);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-lg w-full p-6 text-white">
        
        <div className="flex items-center space-x-3 text-amber-400 mb-4">
          <div className="p-2 bg-amber-500/20 rounded-xl">
            <AlertTriangle className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">Sync Conflict Detected</h3>
            <p className="text-xs text-slate-400">Account linking history resolution</p>
          </div>
        </div>

        <p className="text-sm text-slate-300 mb-5 leading-relaxed">
          You have <strong className="text-white">{localCount}</strong> local practice attempts on this browser, 
          and your logged-in account has <strong className="text-white">{cloudAttempts.length}</strong> attempts saved in the cloud. 
          How would you like to handle this?
        </p>

        <div className="space-y-3 mb-6">
          {/* Merge Option */}
          <label
            onClick={() => setSelectedStrategy('merge')}
            className={`flex items-start p-3.5 rounded-xl border cursor-pointer transition ${
              selectedStrategy === 'merge'
                ? 'bg-blue-900/30 border-blue-500'
                : 'bg-slate-800/60 border-slate-700 hover:border-slate-600'
            }`}
          >
            <input
              type="radio"
              name="sync_strategy"
              value="merge"
              checked={selectedStrategy === 'merge'}
              onChange={() => setSelectedStrategy('merge')}
              className="mt-1 mr-3 text-blue-600 focus:ring-blue-500"
            />
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <GitMerge className="w-4 h-4 text-blue-400" />
                <span className="font-semibold text-sm text-slate-100">Merge Practice History (Recommended)</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Combines both your guest attempts and cloud history into one unified profile. No progress is lost.
              </p>
            </div>
          </label>

          {/* Overwrite Option */}
          <label
            onClick={() => setSelectedStrategy('overwrite')}
            className={`flex items-start p-3.5 rounded-xl border cursor-pointer transition ${
              selectedStrategy === 'overwrite'
                ? 'bg-blue-900/30 border-blue-500'
                : 'bg-slate-800/60 border-slate-700 hover:border-slate-600'
            }`}
          >
            <input
              type="radio"
              name="sync_strategy"
              value="overwrite"
              checked={selectedStrategy === 'overwrite'}
              onChange={() => setSelectedStrategy('overwrite')}
              className="mt-1 mr-3 text-blue-600 focus:ring-blue-500"
            />
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <DownloadCloud className="w-4 h-4 text-purple-400" />
                <span className="font-semibold text-sm text-slate-100">Overwrite Local Data</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Discards local guest practice on this device and loads your cloud account data.
              </p>
            </div>
          </label>
        </div>

        <button
          onClick={handleResolve}
          disabled={processing}
          className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:opacity-60 text-white font-semibold rounded-xl transition shadow-lg shadow-blue-900/30 cursor-pointer"
        >
          {processing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Applying resolution...</span>
            </>
          ) : (
            <span>Confirm & Continue</span>
          )}
        </button>

      </div>
    </div>
  );
};
