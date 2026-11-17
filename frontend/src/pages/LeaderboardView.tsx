import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Flame,
  Award,
  Medal,
  Crown,
  ArrowLeft,
  Sparkles,
  Edit2,
  Check,
  RefreshCw,
  Radio,
} from 'lucide-react';

export interface LeaderboardEntry {
  rank: number;
  user_id: number | null;
  username: string;
  callsign: string;
  display_name: string;
  avatar_color: string;
  xp: number;
  mastered_count: number;
  streak_days: number;
  accuracy: number;
  primary_class: string;
  is_current_user: boolean;
}

interface LeaderboardViewProps {
  onBackToDashboard: () => void;
  onOpenDailyChallenge?: () => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  onBackToDashboard,
  onOpenDailyChallenge,
}) => {
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [metric, setMetric] = useState<'xp' | 'streak' | 'mastered'>('xp');
  const [rankings, setRankings] = useState<LeaderboardEntry[]>([]);
  const [userStanding, setUserStanding] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit Callsign State
  const [isEditingCallsign, setIsEditingCallsign] = useState(false);
  const [callsignInput, setCallsignInput] = useState('');
  const [displayNameInput, setDisplayNameInput] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const deviceId = localStorage.getItem('ham_device_id') || '';
      const params = new URLSearchParams();
      if (selectedClass !== 'ALL') {
        params.append('class_type', selectedClass);
      }
      params.append('metric', metric);
      if (deviceId) {
        params.append('device_id', deviceId);
      }

      const res = await fetch(`/api/study/leaderboard?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setRankings(data.rankings || []);
        setUserStanding(data.user_standing || null);
        if (data.user_standing) {
          setCallsignInput(data.user_standing.callsign || '');
          setDisplayNameInput(data.user_standing.display_name || '');
        }
      }
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [selectedClass, metric]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const deviceId = localStorage.getItem('ham_device_id') || '';
      const res = await fetch('/api/study/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          callsign: callsignInput.trim().toUpperCase(),
          display_name: displayNameInput.trim() || undefined,
          device_id: deviceId,
        }),
      });
      if (res.ok) {
        setIsEditingCallsign(false);
        await fetchLeaderboard();
      }
    } catch (err) {
      console.error('Failed to save profile:', err);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const topThree = rankings.slice(0, 3);

  const getAvatarBg = (color: string) => {
    switch (color) {
      case 'amber':
        return 'bg-amber-500 text-white';
      case 'emerald':
        return 'bg-emerald-500 text-white';
      case 'purple':
        return 'bg-purple-500 text-white';
      case 'cyan':
        return 'bg-cyan-500 text-white';
      case 'indigo':
        return 'bg-indigo-500 text-white';
      case 'rose':
        return 'bg-rose-500 text-white';
      case 'teal':
        return 'bg-teal-500 text-white';
      default:
        return 'bg-blue-600 text-white';
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fade-in pb-24">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBackToDashboard}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center space-x-2">
              <Trophy className="w-7 h-7 text-amber-500" />
              <span>Community Leaderboard</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              National rankings, study streaks, and license mastery standings
            </p>
          </div>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center space-x-2">
          {onOpenDailyChallenge && (
            <button
              onClick={onOpenDailyChallenge}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs sm:text-sm rounded-xl shadow transition flex items-center space-x-1.5 cursor-pointer"
            >
              <Flame className="w-4 h-4 fill-white" />
              <span>Play Daily Challenge</span>
            </button>
          )}

          <button
            onClick={() => setIsEditingCallsign(true)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs sm:text-sm rounded-xl transition flex items-center space-x-1.5 cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Set Callsign</span>
          </button>
        </div>
      </div>

      {/* Control Bar: Class Filter & Metric Switcher */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Class Selection Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl w-full md:w-auto">
          {[
            { id: 'ALL', label: 'All Pools' },
            { id: 'TECH', label: 'Technician' },
            { id: 'GEN', label: 'General' },
            { id: 'EXTRA', label: 'Extra' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedClass(tab.id)}
              className={`flex-1 md:flex-none px-3.5 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                selectedClass === tab.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Metric Selector Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl w-full md:w-auto">
          {[
            { id: 'xp', label: 'Total XP', icon: Sparkles },
            { id: 'streak', label: 'Daily Streak', icon: Flame },
            { id: 'mastered', label: 'Questions Mastered', icon: Award },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setMetric(tab.id as any)}
                className={`flex-1 md:flex-none px-3.5 py-1.5 text-xs font-bold rounded-lg transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                  metric === tab.id
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${metric === tab.id && tab.id === 'streak' ? 'text-amber-500 fill-amber-500' : ''}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400 space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600" />
          <p className="text-sm font-semibold">Loading national leaderboard standings...</p>
        </div>
      ) : (
        <>
          {/* Top 3 Podium Cards */}
          {topThree.length >= 3 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              {/* 2nd Place */}
              <div className="order-2 md:order-1 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col items-center text-center relative overflow-hidden transform md:translate-y-4">
                <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-extrabold flex items-center justify-center text-sm mb-3">
                  2
                </div>
                <div className="relative mb-3">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black text-xl shadow-md ${getAvatarBg(topThree[1].avatar_color)}`}>
                    {(topThree[1].callsign || topThree[1].username).slice(0, 2).toUpperCase()}
                  </div>
                  <Medal className="w-6 h-6 text-slate-400 absolute -bottom-2 -right-2 drop-shadow" />
                </div>
                <h3 className="font-extrabold text-base text-slate-900 truncate max-w-full">
                  {topThree[1].callsign || topThree[1].display_name}
                </h3>
                <span className="text-xs text-slate-500 font-medium">
                  {topThree[1].display_name}
                </span>
                <span className="mt-1 px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-md">
                  {topThree[1].primary_class}
                </span>

                <div className="mt-4 pt-4 border-t border-slate-100 w-full flex items-center justify-around text-center">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Points</span>
                    <span className="text-base font-black text-slate-900">{topThree[1].xp} XP</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Streak</span>
                    <span className="text-base font-black text-amber-600 flex items-center justify-center space-x-0.5">
                      <Flame className="w-3.5 h-3.5 fill-amber-500" />
                      <span>{topThree[1].streak_days}d</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* 1st Place (Gold Champion) */}
              <div className="order-1 md:order-2 bg-gradient-to-b from-amber-50 to-white rounded-3xl p-6 border-2 border-amber-300 shadow-xl flex flex-col items-center text-center relative overflow-hidden ring-4 ring-amber-100">
                <Crown className="w-8 h-8 text-amber-500 mb-1 animate-bounce" />
                <div className="relative mb-3">
                  <div className={`w-20 h-20 rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg ring-4 ring-amber-200 ${getAvatarBg(topThree[0].avatar_color)}`}>
                    {(topThree[0].callsign || topThree[0].username).slice(0, 2).toUpperCase()}
                  </div>
                  <div className="w-7 h-7 rounded-full bg-amber-400 text-amber-950 font-black flex items-center justify-center text-xs absolute -bottom-2 -right-2 shadow">
                    1
                  </div>
                </div>
                <h3 className="font-extrabold text-lg text-slate-900 truncate max-w-full">
                  {topThree[0].callsign || topThree[0].display_name}
                </h3>
                <span className="text-xs text-amber-700 font-bold">
                  {topThree[0].display_name}
                </span>
                <span className="mt-1 px-2.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-extrabold rounded-md">
                  {topThree[0].primary_class} • National Leader
                </span>

                <div className="mt-4 pt-4 border-t border-amber-100 w-full flex items-center justify-around text-center">
                  <div>
                    <span className="text-[10px] text-amber-600 font-bold uppercase block">Points</span>
                    <span className="text-lg font-black text-amber-700">{topThree[0].xp} XP</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-amber-600 font-bold uppercase block">Streak</span>
                    <span className="text-lg font-black text-amber-600 flex items-center justify-center space-x-0.5">
                      <Flame className="w-4 h-4 fill-amber-500" />
                      <span>{topThree[0].streak_days}d</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-amber-600 font-bold uppercase block">Mastered</span>
                    <span className="text-lg font-black text-emerald-600">{topThree[0].mastered_count}</span>
                  </div>
                </div>
              </div>

              {/* 3rd Place */}
              <div className="order-3 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col items-center text-center relative overflow-hidden transform md:translate-y-6">
                <div className="w-8 h-8 rounded-full bg-amber-700/20 text-amber-900 font-extrabold flex items-center justify-center text-sm mb-3">
                  3
                </div>
                <div className="relative mb-3">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black text-xl shadow-md ${getAvatarBg(topThree[2].avatar_color)}`}>
                    {(topThree[2].callsign || topThree[2].username).slice(0, 2).toUpperCase()}
                  </div>
                  <Medal className="w-6 h-6 text-amber-600 absolute -bottom-2 -right-2 drop-shadow" />
                </div>
                <h3 className="font-extrabold text-base text-slate-900 truncate max-w-full">
                  {topThree[2].callsign || topThree[2].display_name}
                </h3>
                <span className="text-xs text-slate-500 font-medium">
                  {topThree[2].display_name}
                </span>
                <span className="mt-1 px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-md">
                  {topThree[2].primary_class}
                </span>

                <div className="mt-4 pt-4 border-t border-slate-100 w-full flex items-center justify-around text-center">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Points</span>
                    <span className="text-base font-black text-slate-900">{topThree[2].xp} XP</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Streak</span>
                    <span className="text-base font-black text-amber-600 flex items-center justify-center space-x-0.5">
                      <Flame className="w-3.5 h-3.5 fill-amber-500" />
                      <span>{topThree[2].streak_days}d</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Leaderboard Table (Ranks 4-25) */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                Full Rankings
              </h3>
              <span className="text-xs text-slate-400">
                Top {rankings.length} Operators
              </span>
            </div>

            <div className="divide-y divide-slate-100 overflow-x-auto">
              {rankings.map(item => {
                const isUser = item.is_current_user;
                return (
                  <div
                    key={`${item.rank}-${item.username}`}
                    className={`px-4 sm:px-6 py-3.5 flex items-center justify-between text-xs sm:text-sm transition ${
                      isUser
                        ? 'bg-blue-50/80 font-semibold border-l-4 border-blue-600'
                        : 'hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-center space-x-3 sm:space-x-4 min-w-[140px] sm:min-w-[200px]">
                      <span className="w-6 font-mono text-center font-bold text-slate-500">
                        {item.rank}
                      </span>
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${getAvatarBg(item.avatar_color)}`}
                      >
                        {(item.callsign || item.username).slice(0, 2).toUpperCase()}
                      </div>
                      <div className="truncate">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-extrabold text-slate-900 truncate">
                            {item.callsign || item.display_name}
                          </span>
                          {isUser && (
                            <span className="px-1.5 py-0.2 bg-blue-600 text-white text-[9px] font-bold rounded">
                              YOU
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 block truncate">
                          {item.display_name}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 sm:space-x-8">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded hidden sm:inline">
                        {item.primary_class}
                      </span>

                      <div className="text-center w-16 hidden md:block">
                        <span className="text-[10px] text-slate-400 block uppercase">Mastered</span>
                        <span className="font-bold text-slate-700">{item.mastered_count}</span>
                      </div>

                      <div className="text-center w-14">
                        <span className="text-[10px] text-slate-400 block uppercase">Streak</span>
                        <span className="font-bold text-amber-600 flex items-center justify-center space-x-0.5">
                          <Flame className="w-3.5 h-3.5 fill-amber-500" />
                          <span>{item.streak_days}d</span>
                        </span>
                      </div>

                      <div className="text-right w-16 sm:w-20">
                        <span className="text-[10px] text-slate-400 block uppercase">Score</span>
                        <span className="font-black text-blue-600">{item.xp} XP</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Pinned User Standing Bar at Bottom */}
      {userStanding && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur border-t border-slate-700 text-white p-3 sm:p-4 shadow-2xl">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-black text-xs flex items-center justify-center">
                #{userStanding.rank}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-sm sm:text-base text-white">
                    {userStanding.callsign || userStanding.display_name}
                  </span>
                  <span className="text-xs text-blue-300 font-medium hidden sm:inline">
                    (Your Standing)
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">
                  {userStanding.primary_class} Pool • {userStanding.mastered_count} Mastered
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-3 sm:space-x-5">
              <div className="text-right">
                <span className="text-sm sm:text-base font-black text-amber-400 flex items-center justify-end space-x-1">
                  <Flame className="w-4 h-4 fill-amber-400" />
                  <span>{userStanding.streak_days} Days</span>
                </span>
                <span className="text-[11px] text-slate-400">{userStanding.xp} XP</span>
              </div>

              <button
                onClick={() => setIsEditingCallsign(true)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg transition cursor-pointer"
              >
                Edit Callsign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Callsign Modal */}
      {isEditingCallsign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center space-x-2">
                <Radio className="w-5 h-5 text-blue-600" />
                <span>Set Amateur Callsign</span>
              </h3>
              <button
                onClick={() => setIsEditingCallsign(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Enter your FCC Amateur Radio callsign (e.g. <code>W1AW</code>, <code>KC3WSO</code>) or custom Elmer nickname to display on the public leaderboard.
            </p>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Amateur Radio Callsign
                </label>
                <input
                  type="text"
                  maxLength={16}
                  value={callsignInput}
                  onChange={e => setCallsignInput(e.target.value.toUpperCase())}
                  placeholder="e.g. W1AW or KC3WSO"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-sm uppercase focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Display Nickname
                </label>
                <input
                  type="text"
                  maxLength={64}
                  value={displayNameInput}
                  onChange={e => setDisplayNameInput(e.target.value)}
                  placeholder="e.g. Keystone Elmer or Skywave"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsEditingCallsign(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center space-x-1.5 cursor-pointer"
                >
                  {isSavingProfile ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>Save to Leaderboard</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
