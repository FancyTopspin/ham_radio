import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  Play,
  ChevronDown,
  ChevronUp,
  Search,
  GraduationCap,
  Loader2,
  FolderOpen,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { SubElementGroupInfo, TopicLessonInfo, LicenseClassType } from '../types';
import { getTopicsWithProgress } from '../engine/topicEngine';
import { CircularProgress } from '../components/CircularProgress';

interface TopicsViewProps {
  onSelectStudyTopic: (topic: TopicLessonInfo) => void;
  onSelectPracticeTopic: (topic: TopicLessonInfo) => void;
  onStudyAll: () => void;
  onPracticeAll: () => void;
}

export const TopicsView: React.FC<TopicsViewProps> = ({
  onSelectStudyTopic,
  onSelectPracticeTopic,
  onStudyAll,
  onPracticeAll,
}) => {
  const { activeClass, bucketCounts } = useApp();

  const [curriculum, setCurriculum] = useState<SubElementGroupInfo[]>([]);
  const [expandedSubElements, setExpandedSubElements] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubElementFilter, setSelectedSubElementFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  // Class display info
  const classNames: Record<LicenseClassType, { level: string; name: string; cycle: string }> = {
    TECH: { level: 'Level 1', name: 'Technician License', cycle: '2022–2026' },
    GEN: { level: 'Level 2', name: 'General License', cycle: '2023–2027' },
    EXTRA: { level: 'Level 3', name: 'Amateur Extra License', cycle: '2024–2028' },
  };

  const currentClassInfo = classNames[activeClass];

  // Load syllabus and progress
  useEffect(() => {
    let isMounted = true;
    async function load() {
      setIsLoading(true);
      const data = await getTopicsWithProgress(activeClass);
      if (isMounted) {
        setCurriculum(data);
        // Expand first 2 subelements by default
        const initialExpanded: Record<string, boolean> = {};
        data.forEach((se, i) => {
          initialExpanded[se.code] = i < 3;
        });
        setExpandedSubElements(initialExpanded);
        setIsLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [activeClass]);

  const toggleSubElement = (code: string) => {
    setExpandedSubElements((prev) => ({
      ...prev,
      [code]: !prev[code],
    }));
  };

  const expandAll = () => {
    const allExpanded: Record<string, boolean> = {};
    curriculum.forEach((se) => {
      allExpanded[se.code] = true;
    });
    setExpandedSubElements(allExpanded);
  };

  const collapseAll = () => {
    setExpandedSubElements({});
  };

  // Filter lessons based on search query and subelement filter
  const filteredCurriculum = useMemo(() => {
    return curriculum
      .filter((se) => {
        if (selectedSubElementFilter !== 'ALL' && se.code !== selectedSubElementFilter) {
          return false;
        }
        return true;
      })
      .map((se) => {
        if (!searchQuery.trim()) return se;
        const q = searchQuery.toLowerCase();
        const filteredLessons = se.lessons.filter(
          (l) =>
            l.subGroupCode.toLowerCase().includes(q) ||
            l.title.toLowerCase().includes(q) ||
            `lesson ${l.lessonNumber}`.includes(q)
        );
        return {
          ...se,
          lessons: filteredLessons,
        };
      })
      .filter((se) => se.lessons.length > 0);
  }, [curriculum, searchQuery, selectedSubElementFilter]);

  // Overall metrics
  const totalLessons = useMemo(() => {
    return curriculum.reduce((acc, se) => acc + se.lessons.length, 0);
  }, [curriculum]);

  const completedLessons = useMemo(() => {
    return curriculum.reduce((acc, se) => {
      return acc + se.lessons.filter((l) => l.progress.percentage >= 80).length;
    }, 0);
  }, [curriculum]);

  const overallMastery = bucketCounts.total > 0
    ? Math.round((bucketCounts.mastered / bucketCounts.total) * 100)
    : 0;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Top Hero Banner matching Mobile Theme */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-3xl p-5 sm:p-7 shadow-lg border border-slate-800 space-y-4">
        
        {/* Top Header: Level & License Class Name */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-bold text-blue-400 tracking-wider uppercase flex items-center space-x-1.5">
              <GraduationCap className="w-4 h-4 text-blue-400" />
              <span>{currentClassInfo.level}:</span>
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              {currentClassInfo.name}
            </h1>
            <p className="text-xs text-slate-300">
              NCVEC Official Question Pool ({currentClassInfo.cycle}) • {totalLessons} Topic Lessons
            </p>
          </div>

          {/* Quick Mastery Gauge & Global Actions */}
          <div className="flex items-center space-x-4 bg-slate-950/60 backdrop-blur border border-slate-700/80 p-3 sm:px-4 sm:py-3 rounded-2xl shrink-0 self-start sm:self-auto">
            <CircularProgress percentage={overallMastery} size={54} strokeWidth={5} />
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-slate-200">Overall Pool Mastery</div>
              <div className="text-xs text-cyan-400 font-semibold">
                {completedLessons} of {totalLessons} Lessons Mastered
              </div>
            </div>
          </div>
        </div>

        {/* Global Pool Action Bar */}
        <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-300">
            Study passively with pre-highlighted answers, or practice questions interactively:
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onStudyAll}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition border border-slate-700 cursor-pointer flex items-center space-x-1.5"
            >
              <BookOpen className="w-3.5 h-3.5 text-blue-400" />
              <span>Study All ({bucketCounts.total}Q)</span>
            </button>
            <button
              onClick={onPracticeAll}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer flex items-center space-x-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Practice All</span>
            </button>
          </div>
        </div>

      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by topic, lesson, or keyword (e.g. Satellite, Propagation, E1A)..."
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900"
            />
          </div>

          {/* Subelement selector */}
          <div className="flex items-center space-x-2 w-full sm:w-auto shrink-0 justify-between sm:justify-start">
            <select
              value={selectedSubElementFilter}
              onChange={(e) => setSelectedSubElementFilter(e.target.value)}
              className="text-xs font-bold bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">All SubElements (Complete Pool)</option>
              {curriculum.map((se) => (
                <option key={se.code} value={se.code}>
                  [{se.code}] {se.title}
                </option>
              ))}
            </select>

            {/* Expand / Collapse buttons */}
            <div className="flex items-center space-x-1 text-xs">
              <button
                onClick={expandAll}
                className="px-2 py-1 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-100 font-semibold"
              >
                Expand
              </button>
              <span className="text-slate-300">|</span>
              <button
                onClick={collapseAll}
                className="px-2 py-1 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-100 font-semibold"
              >
                Collapse
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Curriculum Topic Lessons List */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
          <p className="text-sm font-medium">Loading syllabus lessons & progress...</p>
        </div>
      ) : filteredCurriculum.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <FolderOpen className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800">No matching topics found</h3>
          <p className="text-xs text-slate-500">
            Try adjusting your search query or SubElement filter.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCurriculum.map((se) => {
            const isExpanded = !!expandedSubElements[se.code] || !!searchQuery.trim();

            return (
              <div
                key={se.code}
                className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden transition"
              >
                {/* SubElement Header Accordion */}
                <button
                  type="button"
                  onClick={() => toggleSubElement(se.code)}
                  className="w-full px-4 sm:px-6 py-4 bg-slate-50/80 hover:bg-slate-100/80 border-b border-slate-200/80 flex items-center justify-between text-left transition cursor-pointer"
                >
                  <div className="flex items-center space-x-3 min-w-0 pr-2">
                    <span className="font-mono font-bold text-xs sm:text-sm bg-blue-100 text-blue-800 border border-blue-200 px-2.5 py-1 rounded-lg shrink-0">
                      {se.code}
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-extrabold text-sm sm:text-base text-slate-900 truncate">
                        {se.title}
                      </h3>
                      <p className="text-xs text-slate-500 truncate">
                        {se.lessons.length} Lessons • {se.totalQuestions} Questions total
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0">
                    <CircularProgress
                      percentage={se.progress.percentage}
                      size={42}
                      strokeWidth={4}
                    />
                    <div className="p-1 text-slate-400 hover:text-slate-700 rounded-lg">
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </div>
                  </div>
                </button>

                {/* SubGroup Lessons List */}
                {isExpanded && (
                  <div className="divide-y divide-slate-100">
                    {se.lessons.map((lesson) => {
                      return (
                        <div
                          key={lesson.subGroupCode}
                          className="p-4 sm:px-6 hover:bg-slate-50/70 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          {/* Lesson Info (Styled identical to user reference screenshot) */}
                          <div className="flex items-start space-x-3 min-w-0">
                            <CircularProgress
                              percentage={lesson.progress.percentage}
                              size={48}
                              strokeWidth={4.5}
                              className="mt-0.5 sm:mt-0"
                            />
                            <div className="space-y-0.5 min-w-0">
                              <div className="flex items-center space-x-2">
                                <span className="font-extrabold text-sm sm:text-base text-cyan-600">
                                  Lesson {lesson.lessonNumber}
                                </span>
                                <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                  {lesson.subGroupCode}
                                </span>
                              </div>
                              <h4 className="font-bold text-sm sm:text-base text-slate-900 leading-snug line-clamp-2">
                                {lesson.title}
                              </h4>
                              <p className="text-xs text-slate-500">
                                {lesson.questionCount} Questions in Pool •{' '}
                                {lesson.progress.mastered} Mastered
                              </p>
                            </div>
                          </div>

                          {/* Action Buttons: Read & Study vs. Practice Quiz */}
                          <div className="flex items-center space-x-2 self-end sm:self-auto shrink-0 pt-2 sm:pt-0">
                            <button
                              type="button"
                              onClick={() => onSelectStudyTopic(lesson)}
                              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-300 rounded-xl text-xs font-bold transition cursor-pointer"
                              title="Browse all questions in this topic with answers and explanations"
                            >
                              <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                              <span>Read & Study</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => onSelectPracticeTopic(lesson)}
                              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
                              title="Practice questions interactively and test your knowledge"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                              <span>Practice Quiz</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
