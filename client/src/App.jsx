import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Activity, ArrowDownRight, ArrowRight, ArrowUpRight, AtSign, Award, Bell, BookOpen, Brain, CalendarDays, Check, CheckCircle2, ChevronDown, CircleHelp, Code2, Coins, Copy, ExternalLink, Eye, EyeOff, Flame, Github, Goal, LayoutDashboard, Lock, LogOut, Mail, Menu, Moon, Plus, Printer, RefreshCw, Search, Settings, Shield, ShieldCheck, Snowflake, Sparkles, Sun, Swords, Trophy, UserRound, Users, X, Zap } from 'lucide-react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import api from './api.js';

const iconMap = { Dashboard: LayoutDashboard, Platforms: Code2, Readiness: Brain, Arena: Swords, Activity: Activity, Goals: Goal, Achievements: Award, Leaderboard: Trophy, Portfolio: UserRound, Settings };
const navItems = ['Dashboard', 'Platforms', 'Readiness', 'Arena', 'Activity', 'Goals', 'Achievements', 'Leaderboard', 'Portfolio', 'Settings'];
const platformColors = { LeetCode: '#f59e0b', Codeforces: '#3b82f6', CodeChef: '#d97706', GeeksforGeeks: '#10b981', GitHub: '#a855f7' };
const fmt = (n) => Number(n || 0).toLocaleString('en-US');

export default function App() {
  const [user, setUser] = useState(null), [tokenReady, setTokenReady] = useState(false);
  const [authMode, setAuthMode] = useState('login'), [loading, setLoading] = useState(true), [error, setError] = useState('');
  const [theme, setTheme] = useState(() => localStorage.getItem('cq_theme') || 'dark');
  const navigate = useNavigate(), location = useLocation();
  const publicMatch = location.pathname.match(/^\/u\/([a-z0-9_]{3,24})$/i);

  useEffect(() => {
    localStorage.setItem('cq_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'light') {
      document.body.classList.add('light-theme');
      document.body.classList.remove('dark-theme');
    } else {
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
    }
  }, [theme]);

  const toggleTheme = () => setTheme(t => (t === 'light' ? 'dark' : 'light'));

  useEffect(() => { if (!localStorage.getItem('cq_token')) { setLoading(false); setTokenReady(true); return; } api.get('/auth/me').then(r => setUser(r.data.user)).catch(() => localStorage.removeItem('cq_token')).finally(() => { setLoading(false); setTokenReady(true); }); }, []);
  const logout = () => { localStorage.removeItem('cq_token'); setUser(null); navigate('/'); };
  const signIn = async (values) => { setError(''); try { const endpoint = authMode === 'register' ? '/auth/register' : '/auth/login'; const r = await api.post(endpoint, values); localStorage.setItem('cq_token', r.data.token); setUser(r.data.user); navigate('/'); } catch (e) { setError(e.response?.data?.message || 'Could not connect. Is the API running?'); } };
  if (publicMatch) return <PublicProfile username={publicMatch[1]}/>;
  if (loading || !tokenReady) return <div className="boot"><div className="brand-mark"><Code2 size={21}/></div><span>Loading CodeQuest...</span></div>;
  if (!user) return <AuthScreen mode={authMode} setMode={setAuthMode} onSubmit={signIn} error={error} theme={theme} toggleTheme={toggleTheme}/>;
  return <Workspace user={user} setUser={setUser} logout={logout} theme={theme} toggleTheme={toggleTheme} setTheme={setTheme}/>;
}

function PublicProfile({ username }) {
  const [profile, setProfile] = useState(null), [error, setError] = useState('');
  useEffect(() => { api.get(`/public/${username}`).then(r => setProfile(r.data)).catch(e => setError(e.response?.data?.message || 'Profile is unavailable.')); }, [username]);
  if (error) return <div className="public-error"><div className="brand-mark"><Code2 size={20}/></div><h2>Profile unavailable</h2><p>{error}</p><a className="button" href="/">Open CodeQuest</a></div>;
  if (!profile) return <div className="boot">Loading profile…</div>;
  return (
    <div className={`public-page theme-${profile.portfolio.theme}`}>
      <div className="public-cover"/>
      <div className="public-card">
        <div className="preview-avatar">{profile.user.name.slice(0,1).toUpperCase()}</div>
        <span className="preview-tag">CODEQUEST DEVELOPER · {profile.dna?.archetype || profile.user.equippedTitle || 'Explorer'}</span>
        <h1>{profile.user.name}</h1>
        <div className="preview-handle">@{profile.user.username}{profile.user.college ? ` · ${profile.user.college}` : ''}</div>
        <p>{profile.portfolio.headline}</p>

        {profile.dna && (
          <div style={{ margin: '16px 0' }}>
            <DeveloperDNACard dna={profile.dna} archetype={profile.dna?.archetype} />
          </div>
        )}

        <div className="preview-skills">{profile.portfolio.skills.map(s=><span key={s}>{s}</span>)}</div>
        <div className="preview-divider"/>
        <div className="public-platforms">
          <h3>Verified Coding Platforms</h3>
          {profile.accounts.length ? profile.accounts.map(a=><div key={a._id}><span>{a.platform} · @{a.handle}</span><strong>{fmt(a.stats?.solved)} solved {a.stats?.rating ? `· Rating ${fmt(a.stats.rating)}` : ''}</strong></div>) : <span>No public platform accounts yet.</span>}
        </div>
        <div className="preview-bottom">
          <span><Code2 size={13}/> VERIFIED CODEQUEST DOSSIER</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="button small" onClick={() => window.print()}><Printer size={13}/> Print Dossier</button>
            <a className="button small primary" href="/">Create your own</a>
          </div>
        </div>
      </div>
    </div>
  );
}

function AuthScreen({ mode, setMode, onSubmit, error, theme, toggleTheme }) {
  const { register, handleSubmit, formState: { isSubmitting, errors }, reset } = useForm();
  const [showPassword, setShowPassword] = useState(false);

  const handleTabChange = (newMode) => {
    setMode(newMode);
    reset();
  };

  return (
    <div className="auth-shell-v2">
      <div className="auth-ambient-glow top-left" />
      <div className="auth-ambient-glow bottom-right" />

      {/* Floating Theme Switcher */}
      <div className="auth-theme-toggle">
        <button
          type="button"
          className="theme-toggle-btn"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
      </div>

      {/* Left Column: Hero & Interactive Showcase */}
      <div className="auth-hero-v2">
        <div className="auth-hero-brand">
          <div className="brand-mark">
            <Code2 size={22} />
          </div>
          <span>codequest</span>
        </div>

        <div className="auth-hero-content">
          <div className="hero-pill-badge">
            <span className="dot" />
            <span>Next-Gen Developer Hub</span>
          </div>

          <h1 className="hero-title">
            Make every commit <br />
            <span className="gradient-text">and solve count.</span>
          </h1>

          <p className="hero-desc">
            One unified home for your LeetCode, Codeforces, CodeChef, GFG, and GitHub stats.
            Track your streak, set real goals, and show off your developer journey.
          </p>

          {/* Interactive Card Preview */}
          <motion.div
            className="hero-card-preview"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="preview-top-row">
              <div className="preview-user-meta">
                <div className="preview-avatar-circle">CQ</div>
                <div className="preview-user-titles">
                  <strong>Alex Developer</strong>
                  <span>@alexcodes · Level 4 Explorer</span>
                </div>
              </div>
              <div className="preview-streak-badge">
                <Flame size={15} />
                <span>14 Day Streak</span>
              </div>
            </div>

            <div className="preview-chips-grid">
              <div className="platform-chip">
                <div className="platform-chip-label">
                  <span className="color-dot" style={{ background: '#f59e0b' }} />
                  LeetCode
                </div>
                <div className="platform-chip-val">253 Solved</div>
              </div>
              <div className="platform-chip">
                <div className="platform-chip-label">
                  <span className="color-dot" style={{ background: '#3b82f6' }} />
                  Codeforces
                </div>
                <div className="platform-chip-val">1640 Rating</div>
              </div>
              <div className="platform-chip">
                <div className="platform-chip-label">
                  <span className="color-dot" style={{ background: '#d97706' }} />
                  CodeChef
                </div>
                <div className="platform-chip-val">4★ (1850)</div>
              </div>
              <div className="platform-chip">
                <div className="platform-chip-label">
                  <span className="color-dot" style={{ background: '#10b981' }} />
                  GFG
                </div>
                <div className="platform-chip-val">340 Score</div>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="auth-hero-trust">
          <div className="trust-item">
            <CheckCircle2 size={16} />
            <span>5 Platforms Live Sync</span>
          </div>
          <div className="trust-item">
            <CheckCircle2 size={16} />
            <span>Campus Leaderboard</span>
          </div>
          <div className="trust-item">
            <CheckCircle2 size={16} />
            <span>Public Portfolio URL</span>
          </div>
        </div>
      </div>

      {/* Right Column: Modern Glass Auth Panel */}
      <div className="auth-panel-v2">
        <motion.div
          className="auth-card-v2"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          {/* Tab Switcher */}
          <div className="auth-tabs-v2">
            <button
              type="button"
              className={`auth-tab-btn ${mode === 'login' ? 'active' : ''}`}
              onClick={() => handleTabChange('login')}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`auth-tab-btn ${mode === 'register' ? 'active' : ''}`}
              onClick={() => handleTabChange('register')}
            >
              Create Account
            </button>
          </div>

          <div className="auth-card-header">
            <h2>{mode === 'login' ? 'Welcome back' : 'Start your quest'}</h2>
            <p>
              {mode === 'login'
                ? 'Sign in to access your dashboard and sync platform data.'
                : 'Build your unified developer profile, one solve at a time.'}
            </p>
          </div>

          {error && (
            <div className="error-callout-v2">
              <CircleHelp size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="auth-form-v2">
            {mode === 'register' && (
              <>
                <div className="form-group-v2">
                  <label>Full Name</label>
                  <div className="input-field-wrap">
                    <UserRound size={16} className="input-left-icon" />
                    <input
                      placeholder="Alex Morgan"
                      {...register('name', { required: 'Please enter your name.' })}
                    />
                  </div>
                  {errors.name && <span className="field-error">{errors.name.message}</span>}
                </div>

                <div className="form-group-v2">
                  <label>Username</label>
                  <div className="input-field-wrap">
                    <AtSign size={16} className="input-left-icon" />
                    <input
                      placeholder="alexcodes"
                      {...register('username', {
                        required: 'Choose a username.',
                        pattern: {
                          value: /^[a-zA-Z0-9_]{3,24}$/,
                          message: 'Use 3–24 letters, numbers, or underscores.'
                        }
                      })}
                    />
                  </div>
                  {errors.username && <span className="field-error">{errors.username.message}</span>}
                </div>
              </>
            )}

            <div className="form-group-v2">
              <label>Email Address</label>
              <div className="input-field-wrap">
                <Mail size={16} className="input-left-icon" />
                <input
                  type="email"
                  placeholder="you@example.com"
                  {...register('email', { required: 'Please enter your email.' })}
                />
              </div>
              {errors.email && <span className="field-error">{errors.email.message}</span>}
            </div>

            <div className="form-group-v2">
              <label>Password</label>
              <div className="input-field-wrap">
                <Lock size={16} className="input-left-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 8 characters"
                  {...register('password', {
                    required: 'Please enter a password.',
                    minLength: { value: 8, message: 'Password must be at least 8 characters.' }
                  })}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <span className="field-error">{errors.password.message}</span>}
            </div>

            <button type="submit" className="submit-btn-v2" disabled={isSubmitting}>
              {isSubmitting
                ? 'Processing…'
                : mode === 'login'
                ? 'Sign In to Workspace'
                : 'Create Your Account'}
              <ArrowRight size={16} />
            </button>
          </form>

          <div className="auth-foot-v2">
            <ShieldCheck size={14} />
            <span>Passwords securely hashed. Your data is protected.</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function Workspace({ user, setUser, logout, theme, toggleTheme, setTheme }) {
  const [page, setPage] = useState('Dashboard'), [mobileNav, setMobileNav] = useState(false), [toast, setToast] = useState('');
  const [dashboard, setDashboard] = useState(null), [refreshKey, setRefreshKey] = useState(0);
  const [refreshingAll, setRefreshingAll] = useState(false);
  const [greet, setGreet] = useState(greeting);
  const reload = useCallback(() => setRefreshKey(x => x + 1), []);
  const notify = (message) => { setToast(message); window.setTimeout(() => setToast(''), 3000); };
  useEffect(() => { api.get('/dashboard').then(r => setDashboard(r.data)).catch(e => notify(e.response?.data?.message || 'Could not load dashboard.')); }, [refreshKey]);
  useEffect(() => { const timer = setInterval(() => setGreet(greeting()), 60000); return () => clearInterval(timer); }, []);
  const PageIcon = iconMap[page] || LayoutDashboard;

  const refreshAllPlatforms = async () => {
    if (refreshingAll) return;
    setRefreshingAll(true);
    try {
      const r = await api.post('/platforms/sync-all');
      notify(r.data.note || 'Platforms refreshed successfully!');
      reload();
    } catch (e) {
      notify(e.response?.data?.message || 'Could not refresh platform stats.');
    } finally {
      setRefreshingAll(false);
    }
  };

  const buyFreeze = async () => {
    try {
      const r = await api.post('/user/buy-freeze');
      setUser(r.data.user);
      notify(r.data.message);
    } catch (e) {
      notify(e.response?.data?.message || 'Could not acquire streak freeze.');
    }
  };

  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? 'show' : ''}`}><div className="side-brand"><div className="brand-mark"><Code2 size={20}/></div><span>codequest</span><button className="mobile-close icon-button" onClick={() => setMobileNav(false)}><X size={18}/></button></div><div className="side-label">WORKSPACE</div><nav>{navItems.map(item => { const I = iconMap[item]; return <button key={item} onClick={() => { setPage(item); setMobileNav(false); }} className={`nav-item ${page === item ? 'active' : ''}`}><I size={17}/><span>{item}</span>{item === 'Achievements' && <span className="nav-count">2</span>}</button>; })}</nav><div className="side-spacer"/><div className="sidebar-plan"><div className="plan-icon"><Sparkles size={16}/></div><div><strong>Your next milestone</strong><span>{dashboard?.stats?.solved ? `${Math.max(0, 100 - dashboard.stats.solved)} solves to Century Club` : 'Sync your first profile'}</span></div><ArrowRight size={15}/></div><div className="user-menu"><div className="avatar">{user.name?.slice(0,1).toUpperCase()}</div><div className="user-info"><strong>{user.name}</strong><span>@{user.username} · {user.equippedTitle || 'Explorer'}</span></div><button className="icon-button" onClick={logout} title="Sign out"><LogOut size={17}/></button></div></aside>
    {mobileNav && <div className="scrim" onClick={() => setMobileNav(false)}/>}
    <main className="main"><header className="topbar"><div className="top-left"><button className="icon-button mobile-menu" onClick={() => setMobileNav(true)}><Menu size={20}/></button><div className="breadcrumb">Workspace <span>/</span> <strong>{page}</strong></div></div><div className="top-actions"><button className="theme-toggle-btn" onClick={toggleTheme} title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'} aria-label="Toggle theme">{theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}<span>{theme === 'dark' ? 'Light' : 'Dark'}</span></button><button className="button small btn-refresh" onClick={refreshAllPlatforms} disabled={refreshingAll} title="One-click refresh: fetch latest solved problems & contest ratings"><RefreshCw size={13} className={refreshingAll ? 'spin' : ''}/><span>{refreshingAll ? 'Syncing...' : 'Refresh Stats'}</span></button><button className="streak-freeze-pill" onClick={buyFreeze} title="Click to acquire streak freeze protection"><Snowflake size={14}/><span>{user.streakFreezes ?? 1} Freeze</span></button><div className="search-box"><Search size={16}/><input placeholder="Search anything..." aria-label="Search"/><kbd>⌘ K</kbd></div><button className="icon-button notification-button" title="Notifications" onClick={() => notify('You’re all caught up.') }><Bell size={18}/><i/></button><div className="top-avatar">{user.name?.slice(0,1).toUpperCase()}</div></div></header><div className="content"><div className="page-heading"><div><div className="eyebrow"><PageIcon size={13}/> CODEQUEST / {page.toUpperCase()}</div><h1>{page === 'Dashboard' ? `Good ${greet}, ${user.name?.split(' ')[0]}.` : page}</h1><p>{page === 'Dashboard' ? 'Here’s what your coding journey looks like today.' : pageSubtitle(page)}</p></div>{page === 'Dashboard' && <button className="button primary" onClick={() => setPage('Activity')}><Plus size={16}/> Log activity</button>}</div>
      {page === 'Dashboard' ? <DashboardPage data={dashboard} user={user} onNavigate={setPage} onReload={reload} notify={notify} onRefreshAll={refreshAllPlatforms} isRefreshing={refreshingAll} theme={theme}/> : <PageContent page={page} data={dashboard} user={user} setUser={setUser} reload={reload} notify={notify} theme={theme} setTheme={setTheme}/>}
    </div></main>{toast && <div className="toast"><Check size={16}/>{toast}</div>}</div>;
}
function greeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'morning';
  if (h >= 12 && h < 17) return 'afternoon';
  return 'evening';
}
function pageSubtitle(page) { return ({ Platforms: 'Connect your coding accounts and keep your progress together.', Readiness: 'AI-evaluated match scores and recommendations for top tech companies.', Arena: 'Live 1v1 speed coding duels with friends.', Activity: 'Record your coding sessions and build a consistent habit.', Goals: 'Set clear targets and celebrate the progress you make.', Achievements: 'A record of your milestones and the work behind them.', Leaderboard: 'See how your community is progressing.', Portfolio: 'Shape a public home and verified dossier for your developer story.', Settings: 'Keep your profile, developer title, and preferences up to date.' })[page]; }

function ActivityHeatmap({ activity = [], stats = {} }) {
  const { weeks, monthLabels, totalSolvedInYear, activeDaysInYear } = useMemo(() => {
    const actMap = {};
    let total = 0;
    let activeDays = 0;
    (activity || []).forEach(item => {
      actMap[item.date] = Number(item.count || 0);
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const currentDayOfWeek = today.getDay();
    const daysToSaturday = 6 - currentDayOfWeek;
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + daysToSaturday);

    const totalDays = 52 * 7;
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - totalDays + 1);

    const generatedWeeks = [];
    const months = [];
    let lastMonth = -1;

    let cur = new Date(startDate);
    for (let w = 0; w < 52; w++) {
      const weekDays = [];
      for (let d = 0; d < 7; d++) {
        const dateStr = cur.toISOString().slice(0, 10);
        const count = actMap[dateStr] || 0;
        const isFuture = cur > today;
        if (!isFuture && count > 0) {
          total += count;
          activeDays++;
        }

        let level = 0;
        if (!isFuture) {
          if (count >= 8) level = 4;
          else if (count >= 5) level = 3;
          else if (count >= 3) level = 2;
          else if (count >= 1) level = 1;
        }

        weekDays.push({
          date: dateStr,
          count,
          level,
          isFuture
        });

        const month = cur.getMonth();
        if (d === 0 && month !== lastMonth) {
          months.push({
            name: cur.toLocaleDateString(undefined, { month: 'short' }),
            weekIndex: w
          });
          lastMonth = month;
        }

        cur.setDate(cur.getDate() + 1);
      }
      generatedWeeks.push(weekDays);
    }

    return {
      weeks: generatedWeeks,
      monthLabels: months,
      totalSolvedInYear: total,
      activeDaysInYear: activeDays
    };
  }, [activity]);

  return (
    <div className="activity-heatmap">
      <div className="heatmap-stats-bar">
        <div className="heatmap-stat-item">
          <span>Active Days:</span>
          <strong>{stats.verifiedDays || activeDaysInYear}</strong>
        </div>
        <div className="heatmap-stat-item">
          <span>Current Streak:</span>
          <strong>{stats.streak || 0} days</strong>
        </div>
        <div className="heatmap-stat-item">
          <span>Longest Streak:</span>
          <strong>{stats.longestStreak || 0} days</strong>
        </div>
      </div>

      <div className="heatmap-scroll-area">
        <div className="heatmap-wrapper">
          <div className="heatmap-months-row">
            {monthLabels.map(m => (
              <span
                key={m.weekIndex}
                className="heatmap-month-label"
                style={{ left: `${m.weekIndex * 15}px` }}
              >
                {m.name}
              </span>
            ))}
          </div>

          <div className="heatmap-body">
            <div className="heatmap-day-labels">
              <span></span>
              <span>Mon</span>
              <span></span>
              <span>Wed</span>
              <span></span>
              <span>Fri</span>
              <span></span>
            </div>

            <div className="heatmap-weeks-row">
              {weeks.map((week, wi) => (
                <div key={wi} className="heatmap-week-col">
                  {week.map(day => (
                    <div
                      key={day.date}
                      className={`heatmap-cell level-${day.level} ${day.isFuture ? 'future-day' : ''}`}
                      title={day.isFuture ? '' : `${day.count} solved on ${day.date}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="heatmap-footer-row">
            <span>Verified 365-day platform activity</span>
            <div className="heatmap-legend">
              <span>Less</span>
              <div className="heatmap-legend-cell level-0" />
              <div className="heatmap-legend-cell level-1" />
              <div className="heatmap-legend-cell level-2" />
              <div className="heatmap-legend-cell level-3" />
              <div className="heatmap-legend-cell level-4" />
              <span>More</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeveloperDNACard({ dna, archetype, theme }) {
  const isLight = theme === 'light';
  const radarData = dna?.radarData || [
    { subject: 'Data Structures', score: 65, fullMark: 100 },
    { subject: 'Algorithms', score: 55, fullMark: 100 },
    { subject: 'Real-world Dev', score: 50, fullMark: 100 },
    { subject: 'Speed & Grit', score: 70, fullMark: 100 },
    { subject: 'Problem Solving', score: 60, fullMark: 100 },
    { subject: 'Math & Logic', score: 55, fullMark: 100 }
  ];

  const currentArchetype = dna?.archetype || archetype || 'Rising Challenger';

  return (
    <section className="panel dna-card">
      <div className="dna-header">
        <div>
          <div className="eyebrow"><Sparkles size={12} /> SKILL MATRIX</div>
          <h3>Developer DNA</h3>
        </div>
        <div className="archetype-badge">
          <span>{currentArchetype}</span>
        </div>
      </div>

      <div className="dna-chart-wrap">
        <ResponsiveContainer width="100%" height={230}>
          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
            <PolarGrid stroke={isLight ? '#cbd5e1' : '#2c2d3d'} />
            <PolarAngleAxis dataKey="subject" tick={{ fill: isLight ? '#475569' : '#a5b4fc', fontSize: 10, fontWeight: 600 }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
            <Radar name="Skill Score" dataKey="score" stroke="#a855f7" strokeWidth={2} fill="#8b5cf6" fillOpacity={0.4} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="dna-metrics-grid">
        {radarData.map(d => (
          <div key={d.subject} className="dna-metric-item">
            <span>{d.subject}</span>
            <div className="dna-metric-bar">
              <div style={{ width: `${d.score}%` }} />
            </div>
            <strong>{d.score}%</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function DailyQuestWidget({ onReload, notify }) {
  const [quest, setQuest] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get('/ai/daily-quest').then(r => setQuest(r.data.quest)).catch(() => {});
  }, []);

  const completeQuest = async () => {
    setBusy(true);
    try {
      const r = await api.post('/ai/daily-quest/complete');
      setQuest(r.data.quest);
      notify(r.data.message || 'Quest completed! +50 XP claimed!');
      if (onReload) onReload();
    } catch (e) {
      notify(e.response?.data?.message || 'Could not complete quest.');
    } finally {
      setBusy(false);
    }
  };

  if (!quest) return null;

  return (
    <div className={`quest-card ${quest.completed ? 'completed' : ''}`}>
      <div className="quest-top">
        <div className="quest-badge">
          <Zap size={14} />
          <span>DAILY AI QUEST</span>
        </div>
        <span className="quest-xp">+{quest.xpReward || 50} XP</span>
      </div>

      <div className="quest-body">
        <h4>{quest.title}</h4>
        <div className="quest-tags">
          <span className="tag-difficulty">{quest.difficulty}</span>
          <span className="tag-topic">{quest.topic}</span>
          <span className="tag-platform">{quest.platform}</span>
        </div>
      </div>

      <div className="quest-actions">
        {quest.url && (
          <a href={quest.url} target="_blank" rel="noreferrer" className="button small">
            Solve on {quest.platform} <ExternalLink size={13} />
          </a>
        )}
        <button
          className={`button small ${quest.completed ? '' : 'primary'}`}
          onClick={completeQuest}
          disabled={quest.completed || busy}
        >
          {quest.completed ? <><Check size={14} /> Solved & Claimed</> : <><Check size={14} /> Mark Solved (+50 XP)</>}
        </button>
      </div>
    </div>
  );
}

function ReadinessPage({ notify }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/ai/readiness')
      .then(r => setData(r.data))
      .catch(() => notify('Could not load AI readiness metrics.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="boot">Analyzing your platform telemetry with AI…</div>;
  if (!data) return <div className="section-empty">Readiness analysis unavailable.</div>;

  return (
    <div className="section-stack">
      <div className="readiness-hero">
        <div className="readiness-hero-text">
          <div className="eyebrow"><Brain size={14} /> {data.isAiPowered ? 'GEMINI-POWERED AI INTELLIGENCE ENGINE' : 'AI INTELLIGENCE ENGINE'}</div>
          <h2>Company Interview Readiness</h2>
          <p>
            Synthesized algorithmic metrics mapped against real-world technical bar evaluations for Tier-1 tech firms and high-growth unicorns.
          </p>
        </div>
        <div className="readiness-avg-score">
          <div className="avg-circle">
            <span>{data.overview?.averageReadiness || 0}%</span>
            <small>MATCH INDEX</small>
          </div>
        </div>
      </div>

      {data.aiInsight && (
        <div className="gemini-ai-card">
          <div className="gemini-card-header">
            <div className="gemini-badge"><Sparkles size={14} /> LIVE GEMINI AI STRATEGIC REPORT</div>
            <span className="gemini-model-pill">gemini-1.5-flash</span>
          </div>
          <p className="gemini-insight-text">{data.aiInsight}</p>
        </div>
      )}

      {!data.isAiPowered && (
        <div className="gemini-setup-banner">
          <Sparkles size={15} style={{ color: '#a855f7' }} />
          <span>
            Operating in heuristic baseline mode. Set <strong>GEMINI_API_KEY</strong> in your <code>.env</code> or Render Environment to activate live Google Gemini LLM evaluations.
          </span>
        </div>
      )}

      <div className="company-readiness-grid">
        {data.companies?.map(comp => (
          <div key={comp.name} className="company-card">
            <div className="company-top">
              <strong>{comp.name}</strong>
              <span className={`comp-status ${comp.readiness >= 75 ? 'ready' : 'progress'}`}>{comp.status}</span>
            </div>
            <div className="comp-progress-wrap">
              <div className="comp-progress-bar">
                <div style={{ width: `${comp.readiness}%` }} />
              </div>
              <strong className="comp-pct">{comp.readiness}%</strong>
            </div>
            <p className="comp-focus">{comp.focus}</p>
          </div>
        ))}
      </div>

      <div className="ai-feedback-grid">
        <div className="panel ai-feedback-panel">
          <div className="panel-header">
            <div>
              <h3>Algorithmic Strengths</h3>
              <p>Patterns you demonstrate mastery in</p>
            </div>
            <CheckCircle2 size={18} style={{ color: '#34d399' }} />
          </div>
          <ul className="ai-list strengths">
            {data.strengths?.map((s, i) => (
              <li key={i}><Check size={14} /> {s}</li>
            ))}
          </ul>
        </div>

        <div className="panel ai-feedback-panel">
          <div className="panel-header">
            <div>
              <h3>Targeted Recommendations</h3>
              <p>Key levers to raise your target company probability</p>
            </div>
            <Sparkles size={18} style={{ color: '#c4b5fd' }} />
          </div>
          <ul className="ai-list recommendations">
            {data.focusAreas?.map((f, i) => (
              <li key={i}><ArrowRight size={14} /> {f}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function ArenaPage({ user, notify, reload }) {
  const [activeDuel, setActiveDuel] = useState(null);
  const [busy, setBusy] = useState(false);
  const [inputCode, setInputCode] = useState('');

  const createDuel = async () => {
    setBusy(true);
    try {
      const r = await api.post('/duels/create');
      setActiveDuel(r.data.duel);
      notify(`Duel room #${r.data.duel.code} created! Share the code with a friend.`);
    } catch (e) {
      notify(e.response?.data?.message || 'Could not create duel room.');
    } finally {
      setBusy(false);
    }
  };

  const joinDuel = async (e) => {
    e?.preventDefault();
    if (!inputCode.trim()) return;
    setBusy(true);
    try {
      const r = await api.post(`/duels/join/${inputCode.trim()}`);
      setActiveDuel(r.data.duel);
      notify(`Joined duel #${inputCode.toUpperCase()}! Battle has begun!`);
    } catch (e) {
      notify(e.response?.data?.message || 'Could not join duel.');
    } finally {
      setBusy(false);
    }
  };

  const checkDuelStatus = async () => {
    if (!activeDuel?.code) return;
    try {
      const r = await api.get(`/duels/${activeDuel.code}`);
      setActiveDuel(r.data.duel);
    } catch {}
  };

  const claimVictory = async () => {
    if (!activeDuel?.code) return;
    setBusy(true);
    try {
      const r = await api.post(`/duels/${activeDuel.code}/finish`);
      setActiveDuel(r.data.duel);
      notify(r.data.message || 'Victory claimed! +100 XP awarded!');
      reload();
    } catch (e) {
      notify(e.response?.data?.message || 'Could not claim victory.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="section-stack">
      <div className="arena-hero">
        <div className="arena-hero-left">
          <div className="eyebrow"><Swords size={14} /> SPEED BATTLE ARENA</div>
          <h2>1v1 Algorithmic Speed Duel</h2>
          <p>
            Challenge a friend to a live 15-minute speed solve. Both players get the same competitive question; first to submit an accepted solve claims victory and +100 XP!
          </p>
        </div>
        <div className="arena-hero-actions">
          <button className="button primary" onClick={createDuel} disabled={busy}>
            <Swords size={16} /> Create Duel Room
          </button>
        </div>
      </div>

      {!activeDuel ? (
        <div className="arena-join-card panel">
          <div className="panel-header">
            <div>
              <h3>Have a Duel Room Code?</h3>
              <p>Enter the 6-character room code from your peer to enter the arena.</p>
            </div>
          </div>
          <form onSubmit={joinDuel} className="arena-join-form">
            <input
              placeholder="e.g. CQ94A2"
              value={inputCode}
              onChange={e => setInputCode(e.target.value.toUpperCase())}
              maxLength={8}
            />
            <button className="button primary" disabled={busy || !inputCode.trim()}>
              Join Arena <ArrowRight size={15} />
            </button>
          </form>
        </div>
      ) : (
        <div className="active-duel-arena panel">
          <div className="duel-header-row">
            <div>
              <span className="duel-room-tag">ROOM #{activeDuel.code}</span>
              <h3>Speed Duel in Progress</h3>
            </div>
            <div className="duel-status-pill">
              {activeDuel.status === 'waiting' && <span className="waiting">⏳ Waiting for Opponent</span>}
              {activeDuel.status === 'active' && <span className="active">⚔️ Duel In Progress</span>}
              {activeDuel.status === 'completed' && <span className="completed">🏆 Duel Completed</span>}
            </div>
          </div>

          <div className="duel-players-bar">
            <div className="duel-player host">
              <span className="player-role">HOST</span>
              <strong>{activeDuel.host?.name || 'Host'}</strong>
              <small>@{activeDuel.host?.username}</small>
            </div>
            <div className="duel-vs">VS</div>
            <div className="duel-player challenger">
              <span className="player-role">CHALLENGER</span>
              {activeDuel.challenger ? (
                <>
                  <strong>{activeDuel.challenger?.name}</strong>
                  <small>@{activeDuel.challenger?.username}</small>
                </>
              ) : (
                <span className="waiting-text">Share room code <strong>#{activeDuel.code}</strong> to start</span>
              )}
            </div>
          </div>

          <div className="duel-problem-card">
            <div className="duel-problem-meta">
              <span className="tag-difficulty">{activeDuel.problem?.difficulty}</span>
              <span className="tag-platform">{activeDuel.problem?.platform}</span>
              <span className="tag-topic">{activeDuel.problem?.topic || 'Algorithms'}</span>
            </div>
            <h2 className="duel-problem-title">{activeDuel.problem?.title}</h2>
            <div className="duel-problem-actions">
              <a href={activeDuel.problem?.url} target="_blank" rel="noreferrer" className="button primary">
                Open Problem on {activeDuel.problem?.platform} <ExternalLink size={15} />
              </a>
              {activeDuel.status === 'active' && (
                <button className="button victory-btn" onClick={claimVictory} disabled={busy}>
                  <Trophy size={16} /> I Solved It! (Claim Victory)
                </button>
              )}
              {activeDuel.status === 'waiting' && (
                <button className="button" onClick={checkDuelStatus}>
                  Check if Opponent Joined 🔄
                </button>
              )}
            </div>
          </div>

          {activeDuel.winner && (
            <div className="duel-winner-callout">
              <Trophy size={24} style={{ color: '#fbbf24' }} />
              <div>
                <strong>Winner: {activeDuel.winner.name} (@{activeDuel.winner.username})</strong>
                <span>Congratulations! +100 XP and Gladiator glory awarded.</span>
              </div>
            </div>
          )}

          <button className="text-button" onClick={() => setActiveDuel(null)} style={{ marginTop: '12px' }}>
            ← Leave Room
          </button>
        </div>
      )}
    </div>
  );
}

function DashboardPage({ data, user, onNavigate, onReload, notify, onRefreshAll, isRefreshing, theme }) {
  const isLight = theme === 'light';
  const [activityView, setActivityView] = useState('heatmap');
  const stats = data?.stats || {};
  const recent = data?.recent || [];
  const rawActivity = data?.activity || [];
  const chartActivity = rawActivity.slice(-30).map(x => ({
    ...x,
    day: new Date(`${x.date}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }));
  const cards = [
    { label: 'Problems solved', value: fmt(stats.solved), change: 'Across connected platforms', icon: Code2, color: 'violet' },
    { label: 'Current streak', value: `${stats.streak || 0} days`, change: `Best: ${stats.longestStreak || 0} days`, icon: Flame, color: 'orange' },
    { label: 'Experience points', value: fmt(stats.xp), change: `Level ${stats.level || 1} · ${user?.equippedTitle || 'Explorer'}`, icon: Zap, color: 'blue' },
    { label: 'Developer score', value: `${stats.score || 0}`, change: 'A progress snapshot', icon: Sparkles, color: 'green' }
  ];

  return <>
    <div className="stats-grid">{cards.map((card, i) => <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .06 }} className="stat-card" key={card.label}><div className="stat-top"><span>{card.label}</span><div className={`stat-icon ${card.color}`}><card.icon size={17}/></div></div><div className="stat-value">{card.value}</div><div className="stat-change"><span className="change-dot"/>{card.change}</div></motion.div>)}</div>
    
    <DailyQuestWidget onReload={onReload} notify={notify} />

    <div className="dashboard-grid">
      <section className="panel activity-panel">
        <div className="panel-header">
          <div>
            <h3>Coding activity</h3>
            <p>Your verified daily solves across all connected platforms</p>
          </div>
          <div className="activity-tabs">
            <button
              className={`activity-tab-btn ${activityView === 'heatmap' ? 'active' : ''}`}
              onClick={() => setActivityView('heatmap')}
            >
              Heatmap
            </button>
            <button
              className={`activity-tab-btn ${activityView === 'chart' ? 'active' : ''}`}
              onClick={() => setActivityView('chart')}
            >
              Trend
            </button>
          </div>
        </div>

        {activityView === 'heatmap' ? (
          <ActivityHeatmap activity={rawActivity} stats={stats} />
        ) : (
          <>
            <div className="chart-wrap">
              {chartActivity.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartActivity}>
                    <defs>
                      <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#9674fb" stopOpacity={.28}/>
                        <stop offset="95%" stopColor="#9674fb" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke={isLight ? '#e2e8f0' : '#252630'} vertical={false}/>
                    <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: isLight ? '#64748b' : '#777987', fontSize: 11 }}/>
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: isLight ? '#64748b' : '#777987', fontSize: 11 }}/>
                    <Tooltip contentStyle={{ background: isLight ? '#ffffff' : '#191a21', border: isLight ? '1px solid #cbd5e1' : '1px solid #30313b', borderRadius: 10, color: isLight ? '#0f172a' : '#eee', boxShadow: '0 4px 14px rgba(0,0,0,0.08)' }}/>
                    <Area type="monotone" dataKey="count" stroke="#a58bff" strokeWidth={2.4} fill="url(#actGrad)"/>
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart onAction={() => onNavigate('Activity')}/>
              )}
            </div>
            <div className="chart-foot">
              <span><i className="legend-dot"/> Verified coding days</span>
              <span>{stats.verifiedDays || 0} total active days</span>
            </div>
          </>
        )}
      </section>

      <DeveloperDNACard dna={data?.dna} archetype={data?.dna?.archetype} theme={theme} />

      <section className="panel level-panel"><div className="panel-header"><div><h3>Your level</h3><p>Keep showing up, level up</p></div><div className="level-star"><Zap size={17}/></div></div><div className="level-emblem"><div className="emblem-ring"><div className="emblem-inner"><span>LVL</span><strong>{stats.level || 1}</strong></div></div></div><div className="level-title">{levelName(stats.level || 1)}</div><div className="level-subtitle">{stats.xp || 0} XP earned so far</div><div className="progress-label"><span>Progress to level {(stats.level || 1) + 1}</span><span>{(stats.xp || 0) % 500}/500 XP</span></div><div className="progress-track"><div style={{ width: `${Math.min(100, ((stats.xp || 0) % 500) / 5)}%` }}/></div><div className="level-next"><Sparkles size={14}/> {Math.max(0, 500 - ((stats.xp || 0) % 500))} XP to your next level</div></section>
      <section className="panel platforms-panel">
        <div className="panel-header">
          <div>
            <h3>Synced platform profiles</h3>
            <p>Public profile data from supported APIs</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {data?.accounts?.length > 0 && (
              <button
                className="button small btn-refresh"
                onClick={onRefreshAll}
                disabled={isRefreshing}
                title="Fetch latest solved problems from all connected accounts"
              >
                <RefreshCw size={12} className={isRefreshing ? 'spin' : ''} />
                <span>{isRefreshing ? 'Refreshing…' : 'Refresh All'}</span>
              </button>
            )}
            <button className="text-button" onClick={() => onNavigate('Platforms')}>Manage <ArrowRight size={14}/></button>
          </div>
        </div>{data?.accounts?.length ? <div className="platform-list">{data.accounts.slice(0,4).map(a => <div className="platform-row" key={a._id}><div className="platform-symbol" style={{ '--platform-color': platformColors[a.platform] }}><Code2 size={16}/></div><div className="platform-name"><strong>{a.platform}</strong><span>@{a.handle}{!a.verified && <em> · {a.source === 'codeforces-api' ? 'synced' : 'manual'}</em>}</span></div><div className="platform-solved"><strong>{a.stats?.solved != null ? `${fmt(a.stats.solved)} solved` : (a.stats?.rating != null ? `Rating ${fmt(a.stats.rating)}` : '—')}</strong><span>{a.platform === 'LeetCode' && a.stats?.rating ? `Contest: ${fmt(a.stats.rating)}` : (a.platform === 'Codeforces' && a.stats?.rating ? `Rating: ${fmt(a.stats.rating)}` : (a.stats?.rank || 'Synced'))}</span></div><div className="status-check"><Check size={13}/></div></div>)}</div> : <div className="empty-inline"><div className="empty-icon"><Code2 size={19}/></div><div><strong>Sync your first profile</strong><span>Sync a public profile with its username.</span></div><button className="button small" onClick={() => onNavigate('Platforms')}>Add</button></div>}</section>
    <section className="panel goal-panel"><div className="panel-header"><div><h3>Goals in motion</h3><p>Small targets, steady progress</p></div><button className="text-button" onClick={() => onNavigate('Goals')}>All goals <ArrowRight size={14}/></button></div>{data?.goals?.length ? <div className="goal-list">{data.goals.slice(0,3).map(g => <div className="goal-row" key={g._id}><div className="goal-row-top"><div className="goal-icon"><TargetIcon/></div><div className="goal-title"><strong>{g.title}</strong><span>{g.period} goal</span></div><strong className="goal-count">{g.progress}/{g.target}</strong></div><div className="progress-track slim"><div style={{ width: `${Math.min(100, g.progress / g.target * 100)}%` }}/></div></div>)}</div> : <div className="empty-inline"><div className="empty-icon"><Goal size={19}/></div><div><strong>Give this week a direction</strong><span>Add a goal that feels doable.</span></div><button className="button small" onClick={() => onNavigate('Goals')}>Set goal</button></div>}</section>
    <section className="panel achievements-panel"><div className="panel-header"><div><h3>Achievements</h3><p>Milestones earned through your work</p></div><button className="text-button" onClick={() => onNavigate('Achievements')}>View collection <ArrowRight size={14}/></button></div><div className="badge-grid">{(data?.badges || []).map((b, i) => { const tier = (b.tier || 'COMMON').toLowerCase(); return <div className={`badge-card ${b.unlocked ? 'unlocked' : 'locked'}`} key={b.name}><div className={`badge-art badge-${i} tier-${tier}`}><BadgeIcon name={b.name} icon={b.icon} index={i} size={18}/>{b.unlocked && <span className="badge-check"><Check size={10}/></span>}</div><div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}><strong>{b.name}</strong><span className={`badge-tier-tag ${tier}`} style={{ width: 'fit-content', padding: '1px 5px', fontSize: 8 }}>{b.tier || 'COMMON'}</span></div></div>; })}</div></section></div>
    <div className="dashboard-bottom"><div className="welcome-tip"><div className="tip-spark"><Sparkles size={18}/></div><div><strong>Your profile gets stronger with every verified sync.</strong><span>Manual entries are saved separately; connect an official data source to build verified streaks and score insights.</span></div><button onClick={() => onNavigate('Platforms')}>Explore integrations <ArrowRight size={15}/></button></div><div className="mini-callout"><div className="mini-icon"><CalendarDays size={18}/></div><div><strong>Make today count</strong><span>Log a coding session</span></div><button className="round-arrow" onClick={() => onNavigate('Activity')}><ArrowRight size={16}/></button></div></div>
  </>;
}
function levelName(level) { return ['','Explorer','Problem Solver','Skilled Coder','Advanced Developer','Code Master','Elite Programmer','Legendary Coder'][Math.min(level,7)] || 'Explorer'; }
function TargetIcon() { return <Goal size={17}/>; }
function BadgeIcon({ name, icon, index, size = 22 }) {
  if (icon === 'zap' || name?.includes('Steps')) return <Zap size={size} />;
  if (icon === 'flame' || name?.includes('Streak') || name?.includes('Consistent')) return <Flame size={size} />;
  if (icon === 'users' || name?.includes('Multi')) return <Users size={size} />;
  if (icon === 'award' || name?.includes('Century')) return <Award size={size} />;
  if (icon === 'swords' || name?.includes('Slayer')) return <Swords size={size} />;
  if (icon === 'trophy' || name?.includes('Champion') || name?.includes('Leader')) return <Trophy size={size} />;
  const items = [<Zap size={size}/>, <Users size={size}/>, <Flame size={size}/>, <Award size={size}/>, <Swords size={size}/>, <Trophy size={size}/>];
  return items[index % items.length] || <Award size={size}/>;
}
function EmptyChart({ onAction }) { return <div className="empty-chart"><div className="empty-icon"><Activity size={19}/></div><strong>No verified activity yet</strong><span>Once a trusted data source is connected, your coding rhythm will show here.</span><button className="text-button" onClick={onAction}>See activity options <ArrowRight size={14}/></button></div>; }

function PageContent({ page, data, user, setUser, reload, notify, theme, setTheme }) {
  if (page === 'Platforms') return <PlatformsPage accounts={data?.accounts || []} reload={reload} notify={notify}/>;
  if (page === 'Readiness') return <ReadinessPage notify={notify}/>;
  if (page === 'Arena') return <ArenaPage user={user} notify={notify} reload={reload}/>;
  if (page === 'Activity') return <ActivityPage reload={reload} notify={notify}/>;
  if (page === 'Goals') return <GoalsPage goals={data?.goals || []} reload={reload} notify={notify}/>;
  if (page === 'Achievements') return <AchievementsPage badges={data?.badges || []}/>;
  if (page === 'Leaderboard') return <LeaderboardPage currentUser={user}/>;
  if (page === 'Portfolio') return <PortfolioPage user={user} notify={notify}/>;
  if (page === 'Settings') return <SettingsPage user={user} setUser={setUser} notify={notify} theme={theme} setTheme={setTheme}/>;
  return null;
}

function PlatformsPage({ accounts, reload, notify }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [syncError, setSyncError] = useState('');
  const [refreshingId, setRefreshingId] = useState(null);
  const [refreshingAll, setRefreshingAll] = useState(false);
  const { register, handleSubmit, reset, watch } = useForm({ defaultValues: { platform: 'LeetCode' } });
  const platform = watch('platform');

  const placeholders = {
    LeetCode: 'e.g. neal_wu or your LeetCode username',
    Codeforces: 'e.g. tourist or your Codeforces handle',
    CodeChef: 'e.g. gennady.korotkevich or your CodeChef handle',
    GeeksforGeeks: 'e.g. sandeeptripathi or your GFG username',
    GitHub: 'e.g. torvalds or your GitHub username'
  };

  const platformDescriptions = {
    LeetCode: 'Syncs total solved problems (Easy, Medium, Hard), global ranking, and avatar.',
    Codeforces: 'Syncs current rating, max rating, competitive rank, and solved problems.',
    CodeChef: 'Syncs current rating, highest rating, star level (★), and solved problems.',
    GeeksforGeeks: 'Syncs total solved problems, coding score, and profile avatar.',
    GitHub: 'Syncs public repositories count, followers, and developer bio.'
  };

  const refreshSingle = async (id, platName) => {
    setRefreshingId(id);
    try {
      const r = await api.post(`/platforms/${id}/sync`);
      notify(r.data.note || `${platName} refreshed!`);
      reload();
    } catch (e) {
      notify(e.response?.data?.message || `Could not refresh ${platName}.`);
    } finally {
      setRefreshingId(null);
    }
  };

  const refreshAll = async () => {
    if (refreshingAll) return;
    setRefreshingAll(true);
    try {
      const r = await api.post('/platforms/sync-all');
      notify(r.data.note || 'All platforms refreshed!');
      reload();
    } catch (e) {
      notify(e.response?.data?.message || 'Could not refresh platforms.');
    } finally {
      setRefreshingAll(false);
    }
  };

  const save = async values => {
    setBusy(true);
    setSyncError('');
    try {
      const r = await api.post('/platforms/sync', values);
      reset({ platform: 'LeetCode', handle: '' });
      setOpen(false);
      notify(r.data.note || 'Platform synced successfully!');
      reload();
    } catch (e) {
      setSyncError(e.response?.data?.message || 'Could not sync this profile.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async id => {
    try {
      await api.delete(`/platforms/${id}`);
      notify('Platform disconnected.');
      reload();
    } catch {
      notify('Could not disconnect platform.');
    }
  };

  return (
    <div className="section-stack">
      <div className="panel section-panel">
        <div className="panel-header">
          <div>
            <h3>Your coding platforms</h3>
            <p>Sync your live profiles across LeetCode, Codeforces, CodeChef, GeeksforGeeks, and GitHub.</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {accounts.length > 0 && (
              <button
                className="button btn-refresh"
                onClick={refreshAll}
                disabled={refreshingAll}
                title="Refresh all connected platforms with 1 click"
              >
                <RefreshCw size={14} className={refreshingAll ? 'spin' : ''} />
                <span>{refreshingAll ? 'Refreshing All…' : 'Refresh All'}</span>
              </button>
            )}
            <button className="button primary" onClick={() => { setOpen(!open); setSyncError(''); }}>
              <Plus size={16} /> Sync account
            </button>
          </div>
        </div>

        {open && (
          <form className="inline-form sync-form" onSubmit={handleSubmit(save)}>
            <label>
              Platform
              <select {...register('platform', { required: true })}>
                {[
                  ['LeetCode', 'LeetCode · Live Sync Ready'],
                  ['Codeforces', 'Codeforces · Live Sync Ready'],
                  ['CodeChef', 'CodeChef · Live Sync Ready'],
                  ['GeeksforGeeks', 'GeeksforGeeks · Live Sync Ready'],
                  ['GitHub', 'GitHub · Live Sync Ready']
                ].map(([val, label]) => (
                  <option value={val} key={val}>{label}</option>
                ))}
              </select>
            </label>

            <label className="sync-handle">
              Username / Handle
              <input
                placeholder={placeholders[platform] || 'Enter platform handle'}
                {...register('handle', { required: true })}
              />
            </label>

            <div className="form-actions">
              <button type="button" className="button" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button className="button primary" disabled={busy}>
                {busy ? 'Syncing Profile…' : 'Sync Profile'} <ArrowRight size={15} />
              </button>
            </div>

            {syncError ? (
              <p className="sync-error">{syncError}</p>
            ) : (
              <p className="form-note">
                <CheckCircle2 size={14} style={{ color: '#34d399' }} /> {platformDescriptions[platform]}
              </p>
            )}
          </form>
        )}

        {accounts.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>PLATFORM</th>
                  <th>HANDLE</th>
                  <th>PROBLEMS SOLVED</th>
                  <th>RATING / SCORE</th>
                  <th>DATA SOURCE</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {accounts.map(a => (
                  <tr key={a._id}>
                    <td>
                      <span className="table-platform">
                        <i style={{ background: platformColors[a.platform] || '#8b5cf6' }} />
                        {a.platform}
                      </span>
                    </td>
                    <td>
                      {a.profile?.profileUrl ? (
                        <a href={a.profile.profileUrl} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline', color: '#c4b5fd' }}>
                          @{a.handle}
                        </a>
                      ) : (
                        `@${a.handle}`
                      )}
                    </td>
                    <td>
                      <strong style={{ fontSize: '12px' }}>{a.stats?.solved == null ? '—' : fmt(a.stats.solved)}</strong>
                      {a.platform === 'LeetCode' && a.stats?.easy != null && (
                        <div style={{ fontSize: '9px', color: '#888a97', marginTop: '3px' }}>
                          E: {a.stats.easy} · M: {a.stats.medium} · H: {a.stats.hard}
                        </div>
                      )}
                    </td>
                    <td>
                      {a.platform === 'LeetCode' ? (
                        <div>
                          {a.stats?.rating != null ? (
                            <strong style={{ color: '#f59e0b', fontSize: '11px' }}>Contest: {fmt(a.stats.rating)}</strong>
                          ) : (
                            <span style={{ color: '#888a97', fontSize: '11px' }}>Unrated</span>
                          )}
                          {a.stats?.rank && (
                            <div style={{ fontSize: '9px', color: '#a78bfa', marginTop: '2px' }}>
                              {a.stats.rank}
                            </div>
                          )}
                        </div>
                      ) : a.platform === 'Codeforces' ? (
                        <div>
                          {a.stats?.rating != null ? (
                            <strong style={{ color: '#3b82f6', fontSize: '11px' }}>Rating: {fmt(a.stats.rating)}</strong>
                          ) : (
                            <span style={{ color: '#888a97', fontSize: '11px' }}>Unrated</span>
                          )}
                          {a.stats?.maxRating && a.stats.maxRating !== a.stats.rating && (
                            <div style={{ fontSize: '9px', color: '#888a97', marginTop: '1px' }}>Max: {fmt(a.stats.maxRating)}</div>
                          )}
                          {a.stats?.rank && (
                            <div style={{ fontSize: '9px', color: '#60a5fa', textTransform: 'capitalize', marginTop: '1px' }}>
                              {a.stats.rank}
                            </div>
                          )}
                        </div>
                      ) : (
                        a.stats?.rating == null
                          ? (a.stats?.rank || '—')
                          : `${fmt(a.stats.rating)}${a.stats.maxRating ? ` (Max: ${fmt(a.stats.maxRating)})` : ''}`
                      )}
                    </td>
                    <td>
                      <span className="tag sync-tag">
                        {a.source?.includes('api') ? 'Live API' : 'Manual'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'flex-end' }}>
                        <button
                          className="button small btn-refresh"
                          style={{ padding: '3px 8px', fontSize: '10px' }}
                          title={`Refresh ${a.platform} stats now`}
                          disabled={refreshingId === a._id}
                          onClick={() => refreshSingle(a._id, a.platform)}
                        >
                          <RefreshCw size={11} className={refreshingId === a._id ? 'spin' : ''} />
                          <span>{refreshingId === a._id ? 'Syncing…' : 'Sync'}</span>
                        </button>
                        <button className="text-danger" onClick={() => remove(a._id)}>Remove</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="section-empty">
            <div className="empty-icon"><Code2 size={20} /></div>
            <strong>No profiles synced yet</strong>
            <span>Select a platform (LeetCode, Codeforces, CodeChef, GFG, or GitHub), enter your handle, and sync your live progress.</span>
            <button className="button" onClick={() => { setOpen(true); setSyncError(''); }}>
              <Plus size={15} /> Sync your first profile
            </button>
          </div>
        )}
      </div>

      <div className="info-banner">
        <div className="info-icon"><Sparkles size={18} /></div>
        <div>
          <strong>Unified Real-Time Developer Profile</strong>
          <span>Syncing automatically populates your dashboard problems count, active stats, and global developer score. All 5 platforms are supported.</span>
        </div>
      </div>
    </div>
  );
}

function ActivityPage({ reload, notify }) {
  const [rows, setRows] = useState([]), [busy, setBusy] = useState(false); const { register, handleSubmit, reset } = useForm({ defaultValues: { date: new Date().toISOString().slice(0,10), platform: 'LeetCode', solved: 1, difficulty: 'mixed' } });
  useEffect(() => { api.get('/activity').then(r => setRows(r.data.activity)).catch(() => {}); }, []);
  const save = async v => { setBusy(true); try { const r = await api.post('/activity', { ...v, solved: Number(v.solved) }); setRows([r.data.activity, ...rows]); notify(r.data.message); reset({ date: new Date().toISOString().slice(0,10), platform: 'LeetCode', solved: 1, difficulty: 'mixed', note: '' }); reload(); } catch (e) { notify(e.response?.data?.message || 'Could not save activity.'); } finally { setBusy(false); } };
  return <div className="section-stack"><div className="panel section-panel"><div className="panel-header"><div><h3>Log a coding session</h3><p>Keep a personal record. Manual logs are never counted as verified activity.</p></div><div className="manual-pill"><i/> Manual entry</div></div><form className="inline-form activity-form" onSubmit={handleSubmit(save)}><label>Date<input type="date" {...register('date', { required: true })}/></label><label>Platform<select {...register('platform')}>{['LeetCode','Codeforces','CodeChef','GeeksforGeeks','Other'].map(x => <option key={x}>{x}</option>)}</select></label><label>Problems solved<input type="number" min="0" max="1000" {...register('solved', { required: true })}/></label><label>Difficulty<select {...register('difficulty')}><option value="mixed">Mixed</option><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></label><label className="wide-field">Note <span className="optional">optional</span><input maxLength="160" placeholder="What did you practice?" {...register('note')}/></label><div className="form-actions"><button className="button primary" disabled={busy}><Plus size={15}/> Save activity</button></div></form></div><div className="panel section-panel"><div className="panel-header"><div><h3>Activity history</h3><p>Recent sessions you recorded</p></div><span className="tag manual-tag">All manual logs</span></div>{rows.length ? <div className="table-wrap"><table><thead><tr><th>DATE</th><th>PLATFORM</th><th>SOLVED</th><th>DIFFICULTY</th><th>NOTE</th><th>STATUS</th></tr></thead><tbody>{rows.map(x => <tr key={x._id}><td>{new Date(x.date).toLocaleDateString()}</td><td>{x.platform}</td><td>{x.solved}</td><td className="capitalize">{x.difficulty}</td><td>{x.note || '—'}</td><td><span className="tag manual-tag">Unverified</span></td></tr>)}</tbody></table></div> : <div className="section-empty compact"><div className="empty-icon"><CalendarDays size={19}/></div><strong>Your activity log is ready</strong><span>Sessions you add will appear here.</span></div>}</div></div>;
}

function GoalsPage({ goals, reload, notify }) {
  const [open, setOpen] = useState(false); const { register, handleSubmit, reset } = useForm({ defaultValues: { period: 'weekly', target: 20 } });
  const save = async v => { try { await api.post('/goals', { ...v, target: Number(v.target) }); reset({ period: 'weekly', target: 20 }); setOpen(false); notify('Goal created.'); reload(); } catch(e) { notify(e.response?.data?.message || 'Could not create goal.'); } };
  const advance = async id => { try { await api.patch(`/goals/${id}/progress`, { increment: 1 }); notify('Progress updated.'); reload(); } catch { notify('Could not update progress.'); } };
  const remove = async id => { try { await api.delete(`/goals/${id}`); notify('Goal removed.'); reload(); } catch { notify('Could not remove goal.'); } };
  return <div className="section-stack"><div className="panel section-panel"><div className="panel-header"><div><h3>Your goals</h3><p>Progress is stored with your account. Use the plus control to record an increment.</p></div><button className="button primary" onClick={() => setOpen(!open)}><Plus size={16}/> New goal</button></div>{open && <form className="inline-form goal-form" onSubmit={handleSubmit(save)}><label className="goal-name-field">Goal name<input placeholder="Solve 20 problems" {...register('title', { required: true, minLength: 3 })}/></label><label>Period<select {...register('period')}><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select></label><label>Target<input type="number" min="1" {...register('target', { required: true, valueAsNumber: true })}/></label><div className="form-actions"><button className="button primary"><Plus size={15}/> Create goal</button></div></form>}{goals.length ? <div className="goal-cards">{goals.map(g => <div className="goal-card" key={g._id}><div className="goal-row-top"><div className="goal-icon"><Goal size={17}/></div><div className="goal-title"><strong>{g.title}</strong><span>{g.period} · {g.completedAt ? 'Completed' : 'In progress'}</span></div><button className="icon-button danger-icon" title="Remove goal" onClick={() => remove(g._id)}><X size={16}/></button></div><div className="goal-progress-label"><span>{g.progress} of {g.target}</span><span>{Math.round(g.progress/g.target*100)}%</span></div><div className="progress-track"><div style={{ width: `${Math.min(100,g.progress/g.target*100)}%` }}/></div><button className="goal-increment" disabled={g.progress >= g.target} onClick={() => advance(g._id)}><Plus size={14}/>{g.progress >= g.target ? 'Complete' : 'Record progress'}</button></div>)}</div> : <div className="section-empty"><div className="empty-icon"><Goal size={20}/></div><strong>Nothing on the list yet</strong><span>Start with a simple target you can reach this week.</span><button className="button" onClick={() => setOpen(true)}><Plus size={15}/> Create your first goal</button></div>}</div><div className="info-banner"><div className="info-icon"><Sparkles size={18}/></div><div><strong>Consistency beats intensity</strong><span>Small, repeatable goals make it easier to see how your habits grow over time.</span></div></div></div>;
}

function AchievementsPage({ badges = [] }) {
  const unlockedCount = badges.filter(b => b.unlocked).length;
  const percent = badges.length ? Math.round((unlockedCount / badges.length) * 100) : 0;

  return (
    <div className="section-stack">
      <div className="ach-intro-v2">
        <div>
          <div className="eyebrow"><Sparkles size={13} /> MILESTONES & HONORS</div>
          <h2>Achievements & Quests</h2>
          <p>
            Complete coding milestones, maintain streaks, and sync competitive platforms to unlock exclusive holographic badges.
          </p>
        </div>

        <div className="ach-progress-card">
          <div className="ach-ring-circle" style={{ '--p': `${percent}%` }}>
            <div className="ach-ring-inner">
              <span>{percent}%</span>
            </div>
          </div>
          <div className="ach-progress-meta">
            <strong>{unlockedCount} / {badges.length}</strong>
            <span>Badges Unlocked</span>
          </div>
        </div>
      </div>

      <div className="achievement-grid-v2">
        {badges.map((b, i) => {
          const tier = (b.tier || 'COMMON').toLowerCase();
          return (
            <motion.div
              key={b.name}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`badge-card-v2 ${b.unlocked ? 'unlocked' : 'locked'}`}
            >
              <div className={`badge-emblem-wrap tier-${tier}`}>
                <BadgeIcon name={b.name} icon={b.icon} index={i} size={24} />
                {b.unlocked && (
                  <span className="badge-emblem-check">
                    <Check size={12} />
                  </span>
                )}
              </div>

              <div className="badge-details">
                <div className="badge-header-row">
                  <span className="badge-name-title">{b.name}</span>
                  <span className={`badge-tier-tag ${tier}`}>{b.tier || 'COMMON'}</span>
                </div>
                <p className="badge-desc-text">{b.description}</p>
                <div>
                  <span className={`badge-status-pill ${b.unlocked ? 'unlocked' : 'locked'}`}>
                    {b.unlocked ? <><Check size={11} /> Unlocked</> : <><Lock size={11} /> In Progress</>}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="info-banner">
        <div className="info-icon"><ShieldCheck size={18} /></div>
        <div>
          <strong>Automatic Verified Badges</strong>
          <span>Badges automatically unlock as your synced solves, streaks, and platform ratings reach milestones.</span>
        </div>
      </div>
    </div>
  );
}

function LeaderboardPage({ currentUser }) {
  const [items, setItems] = useState([]), [filter, setFilter] = useState('Global'), [query, setQuery] = useState('');
  useEffect(() => { api.get('/leaderboard').then(r => setItems(r.data.leaderboard)).catch(() => {}); }, []);
  const list = items.filter(x => (filter !== 'My college' || (currentUser.college && x.college === currentUser.college)) && `${x.name} ${x.username} ${x.college || ''}`.toLowerCase().includes(query.toLowerCase()));
  return <div className="section-stack"><div className="panel section-panel"><div className="panel-header"><div><h3>Community leaderboard</h3><p>Ranked by a simple progress score from available account data.</p></div><div className="leader-tools"><select value={filter} onChange={e => setFilter(e.target.value)}><option>Global</option><option>My college</option></select><div className="table-search"><Search size={15}/><input placeholder="Find a developer" value={query} onChange={e => setQuery(e.target.value)}/></div></div></div><div className="leader-explainer"><Sparkles size={15}/> Score = available manually entered solves and verified activity. This is a community progress metric, not a skill or employability rating.</div><div className="table-wrap"><table className="leader-table"><thead><tr><th>RANK</th><th>DEVELOPER</th><th>COLLEGE</th><th>PROBLEMS</th><th>PROGRESS SCORE</th></tr></thead><tbody>{list.map((x,i) => <tr key={x.username} className={x.username === currentUser.username ? 'current-row' : ''}><td><span className={`rank ${i<3 ? `rank-${i+1}` : ''}`}>{String(i+1).padStart(2,'0')}</span></td><td><div className="leader-person"><div className="avatar small-avatar">{x.name.slice(0,1)}</div><span><strong>{x.name}{x.username === currentUser.username && <em> YOU</em>}</strong><small>@{x.username}</small></span></div></td><td>{x.college || '—'}</td><td>{fmt(x.solved)}</td><td><span className="leader-score">{x.score}<small>/100</small></span></td></tr>)}</tbody></table>{!list.length && <div className="section-empty compact"><strong>No developers found</strong><span>Try another search.</span></div>}</div></div></div>;
}

function PortfolioPage({ user, notify }) {
  const [form, setForm] = useState({ theme: 'midnight', headline: 'Building thoughtful software.', skills: [], links: { github: '', website: '', linkedin: '' }, isPublic: true });
  const [skill, setSkill] = useState('');

  useEffect(() => {
    api.get('/portfolio').then(r => {
      const p = r.data.portfolio;
      setForm({ theme: p.theme, headline: p.headline, skills: p.skills || [], links: p.links || {}, isPublic: p.isPublic });
    }).catch(() => {});
  }, []);

  const update = (key,val) => setForm(f => ({ ...f, [key]: val }));
  const updateLink = (key,val) => setForm(f => ({ ...f, links: { ...f.links, [key]: val } }));
  const save = async e => {
    e.preventDefault();
    try {
      await api.put('/portfolio', form);
      notify('Portfolio saved.');
    } catch(e) {
      notify(e.response?.data?.message || 'Could not save portfolio.');
    }
  };

  const addSkill = () => {
    const v = skill.trim();
    if (v && !form.skills.includes(v) && form.skills.length < 12) update('skills', [...form.skills, v]);
    setSkill('');
  };

  const copy = async () => {
    const url = `${window.location.origin}/u/${user.username}`;
    await navigator.clipboard.writeText(url);
    notify('Profile link copied.');
  };

  const copyReadmeMarkdown = async () => {
    const md = `[![CodeQuest Stats](${window.location.origin}/api/cards/${user.username}.svg)](${window.location.origin}/u/${user.username})`;
    await navigator.clipboard.writeText(md);
    notify('GitHub README Markdown copied to clipboard!');
  };

  return (
    <div className="section-stack">
      <div className="portfolio-layout">
        <form className="panel section-panel portfolio-editor" onSubmit={save}>
          <div className="panel-header">
            <div>
              <h3>Portfolio settings</h3>
              <p>Make your public developer profile feel like yours.</p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="button" type="button" onClick={() => window.print()} title="Print Recruiter Dossier">
                <Printer size={14}/> Dossier PDF
              </button>
              <button className="button primary"><Check size={15}/> Save</button>
            </div>
          </div>
          <label>Headline<input maxLength="120" value={form.headline} onChange={e => update('headline',e.target.value)}/></label>
          <label>Theme<select value={form.theme} onChange={e => update('theme',e.target.value)}><option value="midnight">Midnight</option><option value="violet">Violet</option><option value="emerald">Emerald</option></select></label>
          <label>Skills <span className="optional">up to 12</span></label>
          <div className="skill-input"><input value={skill} placeholder="Add a skill (e.g. React)" onChange={e => setSkill(e.target.value)} onKeyDown={e => { if(e.key==='Enter'){e.preventDefault();addSkill();} }}/><button className="button" type="button" onClick={addSkill}><Plus size={14}/> Add</button></div>
          <div className="skill-chips">{form.skills.map(s => <button type="button" key={s} onClick={() => update('skills',form.skills.filter(x=>x!==s))}>{s}<X size={12}/></button>)}</div>
          <label>GitHub profile URL<input placeholder="https://github.com/you" value={form.links.github || ''} onChange={e => updateLink('github',e.target.value)}/></label>
          <label>Website<input placeholder="https://your-site.com" value={form.links.website || ''} onChange={e => updateLink('website',e.target.value)}/></label>
          <label className="public-toggle"><span><strong>Public profile</strong><small>Allow anyone with your link to view this profile</small></span><input type="checkbox" checked={form.isPublic} onChange={e => update('isPublic',e.target.checked)}/></label>
        </form>

        <div className={`portfolio-preview theme-${form.theme}`}>
          <div className="preview-top"><span>LIVE PREVIEW</span><button className="preview-copy" onClick={copy}><ArrowRight size={13}/> Copy profile link</button></div>
          <div className="preview-cover"/>
          <div className="preview-profile">
            <div className="preview-avatar">{user.name?.slice(0,1).toUpperCase()}</div>
            <span className="preview-tag">DEVELOPER PROFILE</span>
            <h2>{user.name}</h2>
            <div className="preview-handle">@{user.username} {user.college ? `· ${user.college}` : ''}</div>
            <p>{form.headline}</p>
            <div className="preview-skills">{form.skills.map(s=><span key={s}>{s}</span>)}{form.skills.length===0 && <small>Add skills to preview them here.</small>}</div>
            <div className="preview-divider"/>
            <div className="preview-stats">
              <div><strong>{fmt(0)}</strong><span>SOLVES</span></div>
              <div><strong>{form.skills.length}</strong><span>SKILLS</span></div>
              <div><strong>{user.equippedTitle || 'Explorer'}</strong><span>TITLE</span></div>
            </div>
            <div className="preview-bottom"><span><Code2 size={13}/> CODEQUEST PROFILE</span><span>{form.isPublic ? 'PUBLIC' : 'PRIVATE'}</span></div>
          </div>
        </div>
      </div>

      <div className="panel section-panel github-readme-panel">
        <div className="panel-header">
          <div>
            <div className="eyebrow"><Github size={13} /> VIRAL EMBEDDABLE CARD</div>
            <h3>Embed in your GitHub Profile README</h3>
            <p>Showcase your verified live CodeQuest statistics directly on your GitHub profile.</p>
          </div>
          <button className="button primary" onClick={copyReadmeMarkdown}>
            <Copy size={14} /> Copy README Markdown
          </button>
        </div>

        <div className="readme-preview-wrap">
          <img
            src={`/api/cards/${user.username}.svg`}
            alt={`${user.username} CodeQuest Stats`}
            style={{ maxWidth: '100%', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}
          />
        </div>

        <pre className="readme-code-block">
          <code>{`[![CodeQuest Stats](${window.location.origin}/api/cards/${user.username}.svg)](${window.location.origin}/u/${user.username})`}</code>
        </pre>
      </div>
    </div>
  );
}

function SettingsPage({ user, setUser, notify, theme, setTheme }) {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm({ defaultValues: user });
  const save = async values => {
    try {
      const r = await api.patch('/profile', values);
      setUser(r.data.user);
      notify('Profile settings saved.');
    } catch(e) {
      notify(e.response?.data?.message || 'Could not save settings.');
    }
  };

  const handleTitleChange = async (e) => {
    try {
      const r = await api.post('/user/equip-title', { title: e.target.value });
      setUser(r.data.user);
      notify(r.data.message);
    } catch {
      notify('Could not equip title.');
    }
  };

  const buyFreeze = async () => {
    try {
      const r = await api.post('/user/buy-freeze');
      setUser(r.data.user);
      notify(r.data.message);
    } catch {
      notify('Could not acquire streak freeze.');
    }
  };

  return (
    <div className="section-stack">
      <form className="panel section-panel settings-form" onSubmit={handleSubmit(save)}>
        <div className="panel-header">
          <div>
            <h3>Profile details</h3>
            <p>Update the information and developer persona tied to your account.</p>
          </div>
          <button className="button primary" disabled={isSubmitting}><Check size={15}/> Save changes</button>
        </div>

        <div className="settings-avatar">
          <div className="avatar large-avatar">{user.name?.slice(0,1).toUpperCase()}</div>
          <div>
            <strong>{user.name}</strong>
            <span>@{user.username} · {user.equippedTitle || 'Explorer'}</span>
          </div>
        </div>

        <div className="settings-fields">
          <label>Full name<input {...register('name', { required: true, minLength: 2 })}/></label>
          <label>Username<input value={user.username} disabled/><span className="field-hint">Username changes are not supported yet.</span></label>
          <label>Email<input value={user.email} disabled/><span className="field-hint">Email changes are not supported yet.</span></label>
          <label>
            Developer Title (RPG Role)
            <select defaultValue={user.equippedTitle || 'Explorer'} onChange={handleTitleChange}>
              {['Explorer', 'Recursion Weaver', 'Algorithm Architect', 'Binary Knight', 'Dynamic Programmer', 'Grandmaster of Code'].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </label>
          <label>College<input placeholder="College or university" {...register('college')}/></label>
          <label>Graduation year<input type="number" min="1970" max="2100" {...register('graduationYear', { valueAsNumber: true })}/></label>
          <label>Timezone<input placeholder="Asia/Kolkata" {...register('timezone')}/></label>
          <label className="full-label">Bio<textarea maxLength="280" rows="4" placeholder="A little about you..." {...register('bio')}/></label>
        </div>

        {/* Theme & Display Mode Preference */}
        <div className="settings-theme-section">
          <strong style={{ fontSize: '13px' }}>Theme & Appearance</strong>
          <p style={{ margin: '2px 0 10px', fontSize: '11px', color: '#9ca3af' }}>
            Choose between a high-contrast dark cyberpunk theme or a crisp modern light theme.
          </p>
          <div className="theme-selector-group">
            <button
              type="button"
              className={`theme-mode-card ${theme === 'dark' ? 'active' : ''}`}
              onClick={() => { setTheme('dark'); notify('Dark Mode enabled.'); }}
            >
              <Moon size={18} />
              <div style={{ textAlign: 'left' }}>
                <strong style={{ display: 'block', fontSize: '12px' }}>Dark Mode</strong>
                <span style={{ display: 'block', fontSize: '10px', opacity: 0.75 }}>Midnight Cyberpunk</span>
              </div>
            </button>
            <button
              type="button"
              className={`theme-mode-card ${theme === 'light' ? 'active' : ''}`}
              onClick={() => { setTheme('light'); notify('Light Mode enabled.'); }}
            >
              <Sun size={18} />
              <div style={{ textAlign: 'left' }}>
                <strong style={{ display: 'block', fontSize: '12px' }}>Light Mode</strong>
                <span style={{ display: 'block', fontSize: '10px', opacity: 0.75 }}>Clean Modern Day</span>
              </div>
            </button>
          </div>
        </div>

        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <strong style={{ fontSize: '13px' }}>Streak Freeze Protection</strong>
            <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#9ca3af' }}>
              Active Freezes: ❄️ {user.streakFreezes ?? 1} (Prevents your streak from breaking if you miss a day)
            </p>
          </div>
          <button className="button" type="button" onClick={buyFreeze}>
            <Snowflake size={14} /> Add Streak Freeze
          </button>
        </div>
      </form>

      <div className="info-banner">
        <div className="info-icon"><ShieldCheck size={18} /></div>
        <div>
          <strong>Account security</strong>
          <span>Your password is securely hashed in the database with bcrypt.</span>
        </div>
      </div>
    </div>
  );
}
