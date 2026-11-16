import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { DashboardView } from './pages/DashboardView';
import { StudyView } from './pages/StudyView';
import { SettingsView } from './pages/SettingsView';
import { Award, AlertCircle, BarChart3 } from 'lucide-react';

type Tab = 'dashboard' | 'study' | 'mock' | 'mistakes' | 'analytics' | 'settings';

const AppContent: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<Tab>('dashboard');
  const { bucketCounts } = useApp();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar currentTab={currentTab} setCurrentTab={setCurrentTab} />

      <main className="flex-1 pb-16">
        {currentTab === 'dashboard' && (
          <DashboardView
            onStartStudy={() => setCurrentTab('study')}
            onStartMock={() => setCurrentTab('mock')}
            onStartMistakes={() => setCurrentTab('mistakes')}
            onOpenAnalytics={() => setCurrentTab('analytics')}
          />
        )}

        {currentTab === 'study' && (
          <StudyView onBackToDashboard={() => setCurrentTab('dashboard')} />
        )}

        {currentTab === 'mock' && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center border border-purple-200">
              <Award className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Official Blueprint Mock Exam</h2>
            <p className="text-sm text-slate-500 max-w-lg mx-auto">
              Simulates official FCC examination session rules with strict NCVEC sub-element quotas, countdown timer, and withheld feedback.
            </p>
            <div className="pt-4 flex justify-center space-x-3">
              <button
                onClick={() => setCurrentTab('study')}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl"
              >
                Study First
              </button>
              <button
                onClick={() => setCurrentTab('dashboard')}
                className="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        )}

        {currentTab === 'mistakes' && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center border border-rose-200">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Targeted "Drill My Mistakes" Mode</h2>
            <p className="text-sm text-slate-500 max-w-lg mx-auto">
              {bucketCounts.mistakesCount > 0
                ? `You have ${bucketCounts.mistakesCount} questions in your rescue queue. Questions stay here until answered correctly twice in a row.`
                : 'No mistakes currently pending. Good job! Missed questions from study sessions or mock exams will automatically show up here.'}
            </p>
            <div className="pt-4 flex justify-center space-x-3">
              <button
                onClick={() => setCurrentTab('study')}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl"
              >
                Practice in Study Mode
              </button>
              <button
                onClick={() => setCurrentTab('dashboard')}
                className="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        )}

        {currentTab === 'analytics' && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center border border-blue-200">
              <BarChart3 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Analytics & Longitudinal Reporting</h2>
            <p className="text-sm text-slate-500 max-w-lg mx-auto">
              Calculates readiness scores, sub-element topic radar, score trends over time, and ranked weak spots from your attempt history.
            </p>
            <div className="pt-4 flex justify-center space-x-3">
              <button
                onClick={() => setCurrentTab('dashboard')}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        )}

        {currentTab === 'settings' && <SettingsView />}
      </main>
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
