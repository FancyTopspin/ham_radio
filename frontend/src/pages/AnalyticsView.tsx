import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, CartesianGrid
} from 'recharts';
import {
  BarChart3, Award, Flame, CheckCircle, AlertTriangle,
  ArrowLeft, RefreshCw, Trophy
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { computeClassAnalytics, type AnalyticsSummary } from '../engine/analyticsEngine';

interface AnalyticsViewProps {
  onBackToDashboard: () => void;
  onStartStudyTopic?: (topicCode: string) => void;
  onOpenLeaderboard?: () => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ onBackToDashboard, onOpenLeaderboard }) => {
  const { activeClass } = useApp();
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      const res = await computeClassAnalytics(activeClass);
      setData(res);
      setLoading(false);
    };
    fetchAnalytics();
  }, [activeClass]);

  if (loading || !data) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-slate-400 space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600" />
        <p className="text-sm font-medium">Computing longitudinal analytics...</p>
      </div>
    );
  }

  const probColor = {
    High: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    Moderate: 'text-blue-600 bg-blue-50 border-blue-200',
    'Needs Practice': 'text-amber-600 bg-amber-50 border-amber-200',
    'Not Ready': 'text-slate-600 bg-slate-100 border-slate-200',
  }[data.passProbability];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBackToDashboard}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
              <BarChart3 className="w-6 h-6 text-blue-600" />
              <span>{activeClass} Class Analytics & Readiness</span>
            </h2>
            <p className="text-xs text-slate-500">
              Real-time progress evaluation based on your personal attempt history
            </p>
          </div>
        </div>

        {onOpenLeaderboard && (
          <button
            onClick={onOpenLeaderboard}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs sm:text-sm rounded-xl shadow transition flex items-center space-x-1.5 cursor-pointer"
          >
            <Trophy className="w-4 h-4 text-white" />
            <span>Community Leaderboard</span>
          </button>
        )}
      </div>

      {/* Top 3 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        
        {/* Readiness Score Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Exam Readiness Score
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="text-4xl font-extrabold text-slate-900">{data.readinessScore}%</span>
            <span className="text-xs text-slate-500 font-medium">/ 100%</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${data.readinessScore}%` }}
            />
          </div>
          <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-md border ${probColor}`}>
            Pass Likelihood: {data.passProbability}
          </span>
        </div>

        {/* Study Activity Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Overall Accuracy
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="text-4xl font-extrabold text-slate-900">{data.overallAccuracy}%</span>
            <span className="text-xs text-slate-500 font-medium">
              ({data.totalCorrect} / {data.totalAttempts})
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Total lifetime attempts logged across study and mock sessions.
          </p>
        </div>

        {/* Study Streak Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Study Days Streak
          </span>
          <div className="flex items-center space-x-2">
            <Flame className="w-8 h-8 text-amber-500 fill-amber-500" />
            <span className="text-4xl font-extrabold text-slate-900">{data.studyStreakDays}</span>
            <span className="text-sm text-slate-500 font-medium">Days Active</span>
          </div>
          <p className="text-xs text-slate-500">
            Consistent daily practice dramatically improves spaced repetition retention.
          </p>
        </div>

      </div>

      {/* Charts Section: Sub-element Mastery & Bucket Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Subelement Mastery Bar Chart (2 cols) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900">Sub-element Mastery Breakdown</h3>
            <span className="text-xs text-slate-500 font-medium">Passing threshold: 74%</span>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.subelements} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="code" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#64748b' }} unit="%" />
                <Tooltip
                  formatter={(value: any) => [`${value}%`, 'Mastery']}
                  contentStyle={{ borderRadius: '0.75rem', borderColor: '#e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="masteryPercentage" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bucket Donut Chart (1 col) */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900">Question Pool Distribution</h3>
          
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.bucketDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                >
                  {data.bucketDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any, name: any) => [`${value} Questions`, name]}
                  contentStyle={{ borderRadius: '0.75rem', borderColor: '#e2e8f0' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {data.bucketDistribution.map((b) => (
              <div key={b.name} className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: b.color }} />
                <span className="text-slate-600">{b.name}:</span>
                <span className="font-bold text-slate-800">{b.value}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Historical Mock Exam Score Trends & Weakest Topics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Mock Exam Trend Line Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 flex items-center space-x-2">
              <Award className="w-4 h-4 text-purple-600" />
              <span>Mock Exam Score History</span>
            </h3>
            <span className="text-xs text-slate-500">74% required</span>
          </div>

          {data.examHistory.length > 0 ? (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.examHistory} margin={{ top: 10, right: 15, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} unit="%" />
                  <Tooltip
                    formatter={(val: any) => [`${val}%`, 'Score']}
                    contentStyle={{ borderRadius: '0.75rem', borderColor: '#e2e8f0' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="percentage"
                    stroke="#8b5cf6"
                    strokeWidth={3}
                    dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-56 flex flex-col items-center justify-center text-center p-6 bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
              <Award className="w-8 h-8 text-slate-300" />
              <p className="text-xs text-slate-500">
                No mock exams completed yet. Take an official mock exam to record your first score point.
              </p>
            </div>
          )}
        </div>

        {/* Top Weakest Topics Ranked */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            <span>Target Areas: Lowest Mastery Topics</span>
          </h3>

          {data.weakestSubelements.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {data.weakestSubelements.map((se) => (
                <div key={se.code} className="py-2.5 flex items-center justify-between text-sm">
                  <div>
                    <span className="font-mono font-bold text-slate-800">Sub-element {se.code}</span>
                    <span className="text-xs text-slate-400 block">
                      {se.needsWork} needs work • {se.mastered} mastered
                    </span>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                    {se.masteryPercentage}% Mastery
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-56 flex flex-col items-center justify-center text-center p-6 bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
              <p className="text-xs text-slate-500">
                No weak spots detected yet! Answer more questions in study mode to isolate difficult topics.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
