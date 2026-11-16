import React, { useState } from 'react';
import { AppProvider } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { DashboardView } from './pages/DashboardView';
import { StudyView } from './pages/StudyView';
import { MockExamView } from './pages/MockExamView';
import { MistakeDrillView } from './pages/MistakeDrillView';
import { SettingsView } from './pages/SettingsView';
import { AnalyticsView } from './pages/AnalyticsView';

type Tab = 'dashboard' | 'study' | 'mock' | 'mistakes' | 'analytics' | 'settings';

const AppContent: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<Tab>('dashboard');

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
          <MockExamView onBackToDashboard={() => setCurrentTab('dashboard')} />
        )}

        {currentTab === 'mistakes' && (
          <MistakeDrillView onBackToDashboard={() => setCurrentTab('dashboard')} />
        )}

        {currentTab === 'analytics' && (
          <AnalyticsView onBackToDashboard={() => setCurrentTab('dashboard')} />
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
