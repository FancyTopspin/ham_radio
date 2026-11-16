import React, { useState } from 'react';
import { AppProvider } from './context/AppContext';
import { Navbar, type NavTab } from './components/Navbar';
import { DashboardView } from './pages/DashboardView';
import { TopicsView } from './pages/TopicsView';
import { TopicStudyView } from './pages/TopicStudyView';
import { StudyView } from './pages/StudyView';
import { MockExamView } from './pages/MockExamView';
import { MistakeDrillView } from './pages/MistakeDrillView';
import { SettingsView } from './pages/SettingsView';
import { AnalyticsView } from './pages/AnalyticsView';
import type { TopicLessonInfo } from './types';

const AppContent: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [selectedTopic, setSelectedTopic] = useState<TopicLessonInfo | null>(null);

  const handleSelectStudyTopic = (topic: TopicLessonInfo) => {
    setSelectedTopic(topic);
    setCurrentTab('study_read');
  };

  const handleSelectPracticeTopic = (topic: TopicLessonInfo) => {
    setSelectedTopic(topic);
    setCurrentTab('study');
  };

  const handleStudyAll = () => {
    setSelectedTopic(null);
    setCurrentTab('study_read');
  };

  const handlePracticeAll = () => {
    setSelectedTopic(null);
    setCurrentTab('study');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar currentTab={currentTab} setCurrentTab={setCurrentTab} />

      <main className="flex-1 pb-16">
        {currentTab === 'dashboard' && (
          <DashboardView
            onStartStudy={() => {
              setSelectedTopic(null);
              setCurrentTab('study');
            }}
            onStartMock={() => setCurrentTab('mock')}
            onStartMistakes={() => setCurrentTab('mistakes')}
            onOpenAnalytics={() => setCurrentTab('analytics')}
            onOpenTopics={() => setCurrentTab('topics')}
          />
        )}

        {currentTab === 'topics' && (
          <TopicsView
            onSelectStudyTopic={handleSelectStudyTopic}
            onSelectPracticeTopic={handleSelectPracticeTopic}
            onStudyAll={handleStudyAll}
            onPracticeAll={handlePracticeAll}
          />
        )}

        {currentTab === 'study_read' && (
          <TopicStudyView
            topic={selectedTopic}
            onBackToTopics={() => setCurrentTab('topics')}
            onStartPractice={(t) => {
              if (t) setSelectedTopic(t);
              setCurrentTab('study');
            }}
          />
        )}

        {currentTab === 'study' && (
          <StudyView
            topic={selectedTopic}
            onBackToDashboard={() => setCurrentTab('dashboard')}
            onBackToTopics={() => setCurrentTab('topics')}
            onSwitchToReadMode={(t) => {
              if (t) setSelectedTopic(t);
              setCurrentTab('study_read');
            }}
          />
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
