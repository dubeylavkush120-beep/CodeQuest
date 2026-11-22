import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, PlatformAccount, Activity, Goal, Portfolio, Duel, DailyQuest } from './models.js';
import { fetchCodeforcesUser } from './integrations/codeforces.service.js';
import { fetchLeetCodeUser } from './integrations/leetcode.service.js';
import { fetchCodeChefUser } from './integrations/codechef.service.js';
import { fetchGFGUser } from './integrations/gfg.service.js';
import { fetchGitHubUser } from './integrations/github.service.js';

const app = express();
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '32kb' }));
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 40 }));
const fail = (res, status, message) => res.status(status).json({ message });
const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
    if (!token) return fail(res, 401, 'Sign in to continue.');
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'development-only-change-me');
    req.user = await User.findById(payload.id);
    if (!req.user) return fail(res, 401, 'Account not found.');
    next();
  } catch { return fail(res, 401, 'Your session expired. Please sign in again.'); }
};
const handle = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const tokenFor = (user) => jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'development-only-change-me', { expiresIn: '7d' });
const safeUser = (user) => ({
  id: user.id,
  name: user.name,
  username: user.username,
  email: user.email,
  college: user.college,
  graduationYear: user.graduationYear,
  bio: user.bio,
  timezone: user.timezone,
  streakFreezes: user.streakFreezes ?? 1,
  equippedTitle: user.equippedTitle || 'Explorer',
  equippedTheme: user.equippedTheme || 'cyberpunk'
});

app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'CodeQuest API' }));
app.post('/api/auth/register', [body('name').trim().isLength({ min: 2, max: 80 }), body('username').trim().matches(/^[a-zA-Z0-9_]{3,24}$/), body('email').isEmail().normalizeEmail(), body('password').isLength({ min: 8, max: 72 })], handle(async (req, res) => {
  const errors = validationResult(req); if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });
  const { name, username, email, password, college, graduationYear } = req.body;
  if (await User.exists({ $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }] })) return fail(res, 409, 'That email or username is already in use.');
  const user = await User.create({ name, username, email, password: await bcrypt.hash(password, 12), college, graduationYear });
  res.status(201).json({ token: tokenFor(user), user: safeUser(user) });
}));
app.post('/api/auth/login', [body('email').isEmail().normalizeEmail(), body('password').isString()], handle(async (req, res) => {
  const user = await User.findOne({ email: req.body.email }).select('+password');
  if (!user || !(await bcrypt.compare(req.body.password, user.password))) return fail(res, 401, 'Email or password is incorrect.');
  res.json({ token: tokenFor(user), user: safeUser(user) });
}));
app.get('/api/auth/me', auth, (req, res) => res.json({ user: safeUser(req.user) }));
app.patch('/api/profile', auth, handle(async (req, res) => {
  const allowed = ['name', 'bio', 'college', 'graduationYear', 'timezone'];
  allowed.forEach((key) => { if (req.body[key] !== undefined) req.user[key] = req.body[key]; });
  await req.user.save(); res.json({ user: safeUser(req.user) });
}));

app.get('/api/dashboard', auth, handle(async (req, res) => {
  const [accounts, activities, goals] = await Promise.all([
    PlatformAccount.find({ user: req.user.id }).sort({ platform: 1 }),
    Activity.find({ user: req.user.id, verified: true }).sort({ date: -1 }).limit(365),
    Goal.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(10)
  ]);
  const solved = accounts.reduce((sum, a) => sum + (a.stats?.solved || 0), 0);
  const verifiedSolved = activities.reduce((sum, a) => sum + a.solved, 0);
  const byDay = new Map();
  accounts.forEach(a => {
    if (a.stats?.history && typeof a.stats.history === 'object') {
      for (const [day, count] of Object.entries(a.stats.history)) {
        byDay.set(day, (byDay.get(day) || 0) + Number(count));
      }
    }
  });
  activities.forEach(a => {
    const day = new Date(a.date).toISOString().slice(0, 10);
    byDay.set(day, (byDay.get(day) || 0) + a.solved);
  });
  const dates = [...byDay.keys()].sort(); let current = 0, longest = 0, prior = null;
  dates.forEach(day => { const date = new Date(`${day}T00:00:00Z`); if (prior && (date - prior) / 86400000 === 1) current++; else current = 1; longest = Math.max(longest, current); prior = date; });
  const today = new Date().toISOString().slice(0, 10); const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const streak = dates.at(-1) === today || dates.at(-1) === yesterday ? current : 0;
  const score = Math.min(100, Math.round((Math.min(solved, 500) / 500 * 35) + (Math.min(longest, 30) / 30 * 25) + (Math.min(accounts.length, 4) / 4 * 15) + (Math.min(activities.length, 100) / 100 * 25)));
  const recent = activities.slice(0, 7);
  const totalSolved = solved + verifiedSolved;
  const xp = (totalSolved * 10) + (longest * 25) + (accounts.length * 50);
  const level = Math.max(1, Math.floor(xp / 500) + 1);
  const highestRating = accounts.reduce((max, a) => Math.max(max, a.stats?.rating || 0), 0);
  const badges = [
    { name: 'First Steps', unlocked: totalSolved >= 1 || accounts.length >= 1, description: 'Connect a platform or solve your first problem.', tier: 'COMMON', icon: 'zap' },
    { name: 'Multi-Platform', unlocked: accounts.length >= 2, description: 'Sync at least 2 coding platform profiles.', tier: 'RARE', icon: 'users' },
    { name: 'Streak Master', unlocked: longest >= 3 || streak >= 3, description: 'Maintain a 3-day consecutive coding streak.', tier: 'RARE', icon: 'flame' },
    { name: 'Century Club', unlocked: totalSolved >= 100, description: 'Reach 100 total solved coding problems.', tier: 'EPIC', icon: 'award' },
    { name: 'Problem Slayer', unlocked: totalSolved >= 500, description: 'Solve 500+ problems across all platforms.', tier: 'LEGENDARY', icon: 'swords' },
    { name: 'Rating Champion', unlocked: highestRating >= 1600, description: 'Reach 1600+ rating on any coding platform.', tier: 'LEGENDARY', icon: 'trophy' }
  ];
  const dna = computeDeveloperDNA(accounts, streak, dates.length);
  res.json({
    stats: { solved: totalSolved, platforms: accounts.length, streak, longestStreak: longest, xp, level, score, verifiedDays: dates.length, verifiedSolved },
    accounts,
    goals,
    activity: [...byDay].map(([date, count]) => ({ date, count })).sort((a,b) => a.date.localeCompare(b.date)),
    recent,
    badges,
    dna,
    streakFreezes: req.user.streakFreezes ?? 1,
    equippedTitle: req.user.equippedTitle || 'Explorer',
    equippedTheme: req.user.equippedTheme || 'cyberpunk'
  });
}));

async function syncPlatformData(platform, cleanHandle) {
  if (platform === 'LeetCode') {
    return await fetchLeetCodeUser(cleanHandle);
  } else if (platform === 'Codeforces') {
    return await fetchCodeforcesUser(cleanHandle);
  } else if (platform === 'CodeChef') {
    return await fetchCodeChefUser(cleanHandle);
  } else if (platform === 'GeeksforGeeks') {
    return await fetchGFGUser(cleanHandle);
  } else if (platform === 'GitHub') {
    return await fetchGitHubUser(cleanHandle);
  } else {
    throw new Error('Unsupported platform.');
  }
}

app.get('/api/platforms', auth, handle(async (req, res) => res.json({ accounts: await PlatformAccount.find({ user: req.user.id }).sort({ platform: 1 }) })));

app.post('/api/platforms/sync-all', auth, rateLimit({ windowMs: 60 * 1000, limit: 15 }), handle(async (req, res) => {
  const accounts = await PlatformAccount.find({ user: req.user.id });
  if (!accounts.length) {
    return res.json({ accounts: [], note: 'No platforms connected yet.' });
  }

  const updated = [];
  const errors = [];

  for (const account of accounts) {
    try {
      const synced = await syncPlatformData(account.platform, account.handle.trim());
      account.handle = synced.handle;
      account.stats = synced.stats;
      account.profile = synced.profile;
      account.source = `${account.platform.toLowerCase()}-api`;
      account.syncedAt = new Date();
      account.verified = true;
      await account.save();
      updated.push(account);
    } catch (err) {
      console.error(`Error syncing ${account.platform} for user ${req.user.id}:`, err.message);
      errors.push(`${account.platform}: ${err.message || 'Failed'}`);
    }
  }

  let note;
  if (errors.length === 0) {
    note = `Refreshed all ${updated.length} platform${updated.length > 1 ? 's' : ''} successfully!`;
  } else if (updated.length > 0) {
    note = `Refreshed ${updated.length} platform(s). (${errors.join('; ')})`;
  } else {
    note = `Could not refresh platforms: ${errors.join('; ')}`;
  }

  res.json({ accounts: updated, note, errors });
}));

app.post('/api/platforms/:id/sync', auth, rateLimit({ windowMs: 60 * 1000, limit: 30 }), handle(async (req, res) => {
  const account = await PlatformAccount.findOne({ _id: req.params.id, user: req.user.id });
  if (!account) return fail(res, 404, 'Platform account not found.');

  try {
    const synced = await syncPlatformData(account.platform, account.handle.trim());
    account.handle = synced.handle;
    account.stats = synced.stats;
    account.profile = synced.profile;
    account.source = `${account.platform.toLowerCase()}-api`;
    account.syncedAt = new Date();
    account.verified = true;
    await account.save();

    res.json({ account, note: `${account.platform} profile (@${account.handle}) refreshed successfully!` });
  } catch (error) {
    return fail(res, /not found/i.test(error.message) ? 404 : 502, error.message || `Could not refresh ${account.platform} profile.`);
  }
}));

app.post('/api/platforms/sync', auth, rateLimit({ windowMs: 60 * 1000, limit: 20 }), [body('platform').isIn(['LeetCode', 'Codeforces', 'CodeChef', 'GeeksforGeeks', 'GitHub']), body('handle').trim().isLength({ min: 1, max: 64 })], handle(async (req, res) => {
  const errors = validationResult(req); if (!errors.isEmpty()) return fail(res, 400, errors.array()[0].msg);
  const { platform, handle } = req.body;
  const cleanHandle = handle.trim();
  let synced;

  try {
    synced = await syncPlatformData(platform, cleanHandle);
  } catch (error) {
    return fail(res, /not found/i.test(error.message) ? 404 : 502, error.message || `Could not sync ${platform} profile.`);
  }

  const account = await PlatformAccount.findOneAndUpdate(
    { user: req.user.id, platform },
    {
      $set: {
        handle: synced.handle,
        stats: synced.stats,
        profile: synced.profile,
        source: `${platform.toLowerCase()}-api`,
        syncedAt: new Date(),
        verified: true
      }
    },
    { upsert: true, new: true, runValidators: true }
  );

  res.json({ account, note: `${platform} profile (@${synced.handle}) synced successfully!` });
}));
app.post('/api/platforms', auth, [body('platform').isIn(['LeetCode', 'Codeforces', 'CodeChef', 'GeeksforGeeks', 'GitHub']), body('handle').trim().isLength({ min: 1, max: 64 }), body('solved').optional().isInt({ min: 0, max: 100000 })], handle(async (req, res) => {
  const errors = validationResult(req); if (!errors.isEmpty()) return fail(res, 400, errors.array()[0].msg);
  const { platform, handle, solved = 0, easy, medium, hard, rating } = req.body;
  const account = await PlatformAccount.findOneAndUpdate({ user: req.user.id, platform }, { handle, stats: { solved, easy, medium, hard, rating }, verified: false }, { upsert: true, new: true, runValidators: true });
  res.status(201).json({ account, note: 'Manually entered figures are saved.' });
}));
app.delete('/api/platforms/:id', auth, handle(async (req, res) => { const item = await PlatformAccount.findOneAndDelete({ _id: req.params.id, user: req.user.id }); if (!item) return fail(res, 404, 'Platform account not found.'); res.json({ message: 'Platform disconnected.' }); }));

app.get('/api/activity', auth, handle(async (req, res) => res.json({ activity: await Activity.find({ user: req.user.id }).sort({ date: -1 }).limit(100) })));
app.post('/api/activity', auth, [body('date').isISO8601(), body('platform').isString().isLength({ min: 2, max: 32 }), body('solved').isInt({ min: 0, max: 1000 }), body('note').optional().isString().isLength({ max: 160 })], handle(async (req, res) => {
  const errors = validationResult(req); if (!errors.isEmpty()) return fail(res, 400, errors.array()[0].msg);
  // Manual logs remain unverified; only verified records contribute to streak and score.
  const activity = await Activity.create({ ...req.body, user: req.user.id, verified: false }); res.status(201).json({ activity, message: 'Saved as a manual activity log. It does not count toward verified streaks.' });
}));

app.get('/api/goals', auth, handle(async (req, res) => res.json({ goals: await Goal.find({ user: req.user.id }).sort({ createdAt: -1 }) })));
app.post('/api/goals', auth, [body('title').trim().isLength({ min: 3, max: 100 }), body('target').isInt({ min: 1, max: 100000 }), body('period').isIn(['daily', 'weekly', 'monthly'])], handle(async (req, res) => {
  const errors = validationResult(req); if (!errors.isEmpty()) return fail(res, 400, errors.array()[0].msg);
  const goal = await Goal.create({ ...req.body, user: req.user.id }); res.status(201).json({ goal });
}));
app.patch('/api/goals/:id/progress', auth, [body('increment').isInt({ min: 1, max: 1000 })], handle(async (req, res) => {
  const goal = await Goal.findOne({ _id: req.params.id, user: req.user.id }); if (!goal) return fail(res, 404, 'Goal not found.');
  goal.progress = Math.min(goal.target, goal.progress + Number(req.body.increment)); if (goal.progress >= goal.target && !goal.completedAt) goal.completedAt = new Date(); await goal.save(); res.json({ goal });
}));
app.delete('/api/goals/:id', auth, handle(async (req, res) => { const goal = await Goal.findOneAndDelete({ _id: req.params.id, user: req.user.id }); if (!goal) return fail(res, 404, 'Goal not found.'); res.json({ message: 'Goal removed.' }); }));

app.get('/api/leaderboard', auth, handle(async (req, res) => {
  const users = await User.find({}).select('name username college');
  const rows = await Promise.all(users.map(async user => { const [accounts, activity] = await Promise.all([PlatformAccount.find({ user: user.id }), Activity.countDocuments({ user: user.id, verified: true })]); const solved = accounts.reduce((n, a) => n + (a.stats?.solved || 0), 0); return { username: user.username, name: user.name, college: user.college, solved, score: Math.min(100, Math.round(solved / 5 + activity / 4)) }; }));
  rows.sort((a, b) => b.score - a.score || b.solved - a.solved); res.json({ leaderboard: rows.slice(0, 50) });
}));
app.get('/api/portfolio', auth, handle(async (req, res) => { const portfolio = await Portfolio.findOne({ user: req.user.id }); res.json({ portfolio: portfolio || await Portfolio.create({ user: req.user.id }) }); }));
app.put('/api/portfolio', auth, handle(async (req, res) => {
  const allowed = ['theme', 'headline', 'skills', 'links', 'isPublic']; const update = {}; allowed.forEach(k => { if (req.body[k] !== undefined) update[k] = req.body[k]; });
  if (typeof update.headline === 'string') update.headline = update.headline.slice(0, 120);
  if (Array.isArray(update.skills)) update.skills = update.skills.slice(0, 12).map(s => String(s).slice(0, 32));
  const portfolio = await Portfolio.findOneAndUpdate({ user: req.user.id }, { $set: update, $setOnInsert: { user: req.user.id } }, { upsert: true, new: true, runValidators: true }); res.json({ portfolio });
}));
function computeDeveloperDNA(accounts = [], streak = 0, verifiedDays = 0) {
  let lcSolved = 0, lcEasy = 0, lcMedium = 0, lcHard = 0;
  let cfRating = 0, cfSolved = 0;
  let ghRepos = 0, ghFollowers = 0;
  let totalSolved = 0;
  let highestRating = 0;

  accounts.forEach(a => {
    totalSolved += (a.stats?.solved || 0);
    if (a.stats?.rating) highestRating = Math.max(highestRating, a.stats.rating);
    if (a.platform === 'LeetCode') {
      lcSolved = a.stats?.solved || 0;
      lcEasy = a.stats?.easy || 0;
      lcMedium = a.stats?.medium || 0;
      lcHard = a.stats?.hard || 0;
      if (a.stats?.rating) highestRating = Math.max(highestRating, a.stats.rating);
    }
    if (a.platform === 'Codeforces') {
      cfRating = a.stats?.rating || 0;
      cfSolved = a.stats?.solved || 0;
    }
    if (a.platform === 'GitHub') {
      ghRepos = a.stats?.solved || 0;
      ghFollowers = a.stats?.rating || 0;
    }
  });

  const dsScore = Math.min(100, Math.round((lcEasy * 0.15) + (lcMedium * 0.4) + (lcHard * 0.9) + (lcSolved * 0.1)));
  const algoScore = Math.min(100, Math.round((cfRating ? cfRating / 18 : 0) + (cfSolved * 0.2) + (highestRating > 1400 ? (highestRating - 1400) / 10 : 0)));
  const devScore = Math.min(100, Math.round((ghRepos * 4.5) + (ghFollowers * 5) + 20));
  const gritScore = Math.min(100, Math.round((streak * 3.5) + (verifiedDays * 0.3) + 25));
  const problemSolvingScore = Math.min(100, Math.round(totalSolved / 7) + 25);
  const mathScore = Math.min(100, Math.round((cfRating ? cfRating / 22 : 0) + (lcMedium * 0.25) + 30));

  let archetype = 'Rising Challenger';
  if (highestRating >= 1600 || cfRating >= 1600) archetype = 'Grandmaster Algorithmist';
  else if (lcSolved >= 350) archetype = 'DSA Specialist';
  else if (ghRepos >= 6 && totalSolved >= 150) archetype = 'Full-Stack Craftsman';
  else if (streak >= 14 || verifiedDays >= 50) archetype = 'Tenacious Grinder';
  else if (accounts.length >= 3) archetype = 'Polyglot Problem Solver';

  const radarData = [
    { subject: 'Data Structures', score: Math.max(25, dsScore), fullMark: 100 },
    { subject: 'Algorithms', score: Math.max(20, algoScore), fullMark: 100 },
    { subject: 'Real-world Dev', score: Math.max(20, devScore), fullMark: 100 },
    { subject: 'Speed & Grit', score: Math.max(30, gritScore), fullMark: 100 },
    { subject: 'Problem Solving', score: Math.max(30, problemSolvingScore), fullMark: 100 },
    { subject: 'Math & Logic', score: Math.max(25, mathScore), fullMark: 100 },
  ];

  return {
    radarData,
    archetype,
    metrics: { dsScore, algoScore, devScore, gritScore, problemSolvingScore, mathScore }
  };
}

function generateCardSVG({ username, name, totalSolved, streak, highestRating, archetype, accountsCount, level }) {
  const safeName = (name || username).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const safeArchetype = (archetype || 'Explorer').replace(/&/g, '&amp;');
  return `<svg width="495" height="195" viewBox="0 0 495 195" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0e1017"/>
      <stop offset="50%" stop-color="#141522"/>
      <stop offset="100%" stop-color="#0a0b10"/>
    </linearGradient>
    <linearGradient id="primaryGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#a78bfa"/>
      <stop offset="100%" stop-color="#ec4899"/>
    </linearGradient>
    <linearGradient id="flameGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fb923c"/>
      <stop offset="100%" stop-color="#ef4444"/>
    </linearGradient>
  </defs>
  <style>
    .title { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 16px; font-weight: 700; fill: #ffffff; }
    .subtitle { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; fill: #9ca3af; }
    .stat-val { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 22px; font-weight: 800; }
    .stat-lbl { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 9px; font-weight: 600; fill: #94a3b8; letter-spacing: 0.8px; text-transform: uppercase; }
    .badge { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 10px; font-weight: 600; fill: #c4b5fd; }
  </style>
  <rect x="1.5" y="1.5" width="492" height="192" rx="14" fill="url(#bgGrad)" stroke="#27273a" stroke-width="1.5"/>
  <circle cx="450" cy="40" r="70" fill="#a855f7" opacity="0.1"/>
  <circle cx="30" cy="160" r="50" fill="#3b82f6" opacity="0.1"/>

  <g transform="translate(24, 22)">
    <rect width="28" height="28" rx="8" fill="url(#primaryGrad)"/>
    <path d="M9 14L13 10M13 18L9 14M19 14L15 10M15 18L19 14" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="38" y="16" class="title">${safeName}</text>
    <text x="38" y="29" class="subtitle">@${username} · Level ${level} · ${safeArchetype}</text>
  </g>

  <g transform="translate(370, 22)">
    <rect width="100" height="22" rx="11" fill="rgba(167, 139, 250, 0.12)" stroke="rgba(167, 139, 250, 0.3)" stroke-width="1"/>
    <text x="14" y="14" class="badge">⚔️ CodeQuest</text>
  </g>

  <line x1="24" y1="68" x2="471" y2="68" stroke="#1f2130" stroke-width="1"/>

  <g transform="translate(30, 85)">
    <text x="0" y="24" class="stat-val" fill="url(#primaryGrad)">${Number(totalSolved || 0).toLocaleString()}</text>
    <text x="0" y="40" class="stat-lbl">Problems Solved</text>
  </g>

  <g transform="translate(160, 85)">
    <text x="0" y="24" class="stat-val" fill="url(#flameGrad)">🔥 ${streak}d</text>
    <text x="0" y="40" class="stat-lbl">Active Streak</text>
  </g>

  <g transform="translate(270, 85)">
    <text x="0" y="24" class="stat-val" fill="#38bdf8">${highestRating ? Number(highestRating).toLocaleString() : 'Unrated'}</text>
    <text x="0" y="40" class="stat-lbl">Contest Peak</text>
  </g>

  <g transform="translate(390, 85)">
    <text x="0" y="24" class="stat-val" fill="#34d399">${accountsCount} Hubs</text>
    <text x="0" y="40" class="stat-lbl">Platforms</text>
  </g>

  <g transform="translate(24, 160)">
    <circle cx="6" cy="6" r="4" fill="#10b981"/>
    <text x="16" y="9" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="9" fill="#64748b">Verified Developer Dossier · codequest.app/u/${username}</text>
  </g>
</svg>`;
}

const CURATED_PROBLEMS = [
  { title: 'Two Sum', difficulty: 'Easy', topic: 'Hash Table / Arrays', url: 'https://leetcode.com/problems/two-sum/', platform: 'LeetCode' },
  { title: 'Longest Substring Without Repeating Characters', difficulty: 'Medium', topic: 'Sliding Window', url: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/', platform: 'LeetCode' },
  { title: 'Coin Change', difficulty: 'Medium', topic: 'Dynamic Programming', url: 'https://leetcode.com/problems/coin-change/', platform: 'LeetCode' },
  { title: 'Number of Islands', difficulty: 'Medium', topic: 'Graphs / BFS / DFS', url: 'https://leetcode.com/problems/number-of-islands/', platform: 'LeetCode' },
  { title: 'Trapping Rain Water', difficulty: 'Hard', topic: 'Two Pointers', url: 'https://leetcode.com/problems/trapping-rain-water/', platform: 'LeetCode' },
  { title: 'Binary Tree Level Order Traversal', difficulty: 'Medium', topic: 'Trees / BFS', url: 'https://leetcode.com/problems/binary-tree-level-order-traversal/', platform: 'LeetCode' },
  { title: 'Merge Intervals', difficulty: 'Medium', topic: 'Intervals / Sorting', url: 'https://leetcode.com/problems/merge-intervals/', platform: 'LeetCode' },
  { title: 'Watermelon', difficulty: 'Easy', topic: 'Brute Force / Math', url: 'https://codeforces.com/problemset/problem/4/A', platform: 'Codeforces' },
  { title: 'Way Too Long Words', difficulty: 'Easy', topic: 'Strings', url: 'https://codeforces.com/problemset/problem/71/A', platform: 'Codeforces' }
];

app.get('/api/cards/:username.svg', handle(async (req, res) => {
  const user = await User.findOne({ username: req.params.username.toLowerCase() }).select('name username');
  if (!user) {
    res.setHeader('Content-Type', 'image/svg+xml');
    return res.send(generateCardSVG({
      username: req.params.username,
      name: 'Developer',
      totalSolved: 0,
      streak: 0,
      highestRating: 0,
      archetype: 'Code Explorer',
      accountsCount: 0,
      level: 1
    }));
  }
  const accounts = await PlatformAccount.find({ user: user.id });
  const totalSolved = accounts.reduce((sum, a) => sum + (a.stats?.solved || 0), 0);
  const highestRating = accounts.reduce((max, a) => Math.max(max, a.stats?.rating || 0), 0);
  const dna = computeDeveloperDNA(accounts, 0, 0);
  const xp = (totalSolved * 10) + (accounts.length * 50);
  const level = Math.max(1, Math.floor(xp / 500) + 1);

  const svg = generateCardSVG({
    username: user.username,
    name: user.name,
    totalSolved,
    streak: Math.max(1, accounts.length * 3),
    highestRating,
    archetype: dna.archetype,
    accountsCount: accounts.length,
    level
  });

  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=1800');
  res.send(svg);
}));

app.get('/api/ai/readiness', auth, handle(async (req, res) => {
  const accounts = await PlatformAccount.find({ user: req.user.id });
  let totalSolved = 0, highestRating = 0, easy = 0, medium = 0, hard = 0;
  accounts.forEach(a => {
    totalSolved += (a.stats?.solved || 0);
    if (a.stats?.rating) highestRating = Math.max(highestRating, a.stats.rating);
    if (a.platform === 'LeetCode') {
      easy += (a.stats?.easy || 0);
      medium += (a.stats?.medium || 0);
      hard += (a.stats?.hard || 0);
    }
  });

  const googleScore = Math.min(97, Math.max(38, Math.round((hard * 1.6) + (medium * 0.22) + (highestRating > 1400 ? (highestRating - 1400) * 0.14 : 0) + 36)));
  const amazonScore = Math.min(98, Math.max(45, Math.round((medium * 0.32) + (easy * 0.1) + 48)));
  const microsoftScore = Math.min(98, Math.max(46, Math.round((totalSolved * 0.08) + (medium * 0.24) + 46)));
  const metaScore = Math.min(96, Math.max(36, Math.round((medium * 0.28) + (highestRating > 1300 ? (highestRating - 1300) * 0.1 : 0) + 38)));
  const startupScore = Math.min(99, Math.max(50, Math.round((totalSolved * 0.09) + 52)));

  const companies = [
    { name: 'Amazon', readiness: amazonScore, focus: 'Medium DSA, Trees & Graphs, System Design Basics', status: amazonScore >= 75 ? 'Ready to Apply' : 'Solid Progress' },
    { name: 'Microsoft', readiness: microsoftScore, focus: 'Data Structures, Code Quality, Clean Recursion', status: microsoftScore >= 75 ? 'Ready to Apply' : 'Approaching' },
    { name: 'Google', readiness: googleScore, focus: 'Advanced DP, Segment Trees, Graph Algorithms, Hard Level', status: googleScore >= 75 ? 'Target Match' : 'Leveling Up' },
    { name: 'Meta', readiness: metaScore, focus: 'Speed solving, Binary Search, Sliding Window, Graph BFS', status: metaScore >= 75 ? 'Ready to Apply' : 'Build Speed' },
    { name: 'Top Tech Startups', readiness: startupScore, focus: 'Problem solving speed, End-to-end projects, Git', status: startupScore >= 75 ? 'Interview Ready' : 'Good Base' }
  ];

  const strengths = [
    totalSolved >= 200 ? 'Deep problem solving muscle memory (>200 solves across platforms)' : 'Consistent foundation established',
    highestRating >= 1300 ? `Competitive contest rating benchmark established (${highestRating})` : 'Active platform participation',
    medium >= 40 ? 'High confidence in Medium difficulty interview problems' : 'Steady progression through basic patterns'
  ];

  const focusAreas = [
    hard < 30 ? 'Solve 15-20 more Hard category problems (DP & Shortest Path) for Tier-1 companies.' : 'Maintain peak contest speed with timed virtual contests.',
    'Focus on multi-source BFS and Trie implementations.',
    'Keep your daily streak active to build habit discipline.'
  ];

  res.json({
    companies,
    strengths,
    focusAreas,
    overview: {
      totalSolved,
      highestRating,
      easy,
      medium,
      hard,
      averageReadiness: Math.round((googleScore + amazonScore + microsoftScore + metaScore + startupScore) / 5)
    }
  });
}));

app.get('/api/ai/daily-quest', auth, handle(async (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  let quest = await DailyQuest.findOne({ user: req.user.id, date: today });
  if (!quest) {
    const randomProblem = CURATED_PROBLEMS[Math.floor(Math.random() * CURATED_PROBLEMS.length)];
    quest = await DailyQuest.create({
      user: req.user.id,
      date: today,
      title: randomProblem.title,
      platform: randomProblem.platform,
      difficulty: randomProblem.difficulty,
      topic: randomProblem.topic,
      url: randomProblem.url,
      xpReward: 50,
      completed: false
    });
  }
  res.json({ quest });
}));

app.post('/api/ai/daily-quest/complete', auth, handle(async (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const quest = await DailyQuest.findOne({ user: req.user.id, date: today });
  if (!quest) return fail(res, 404, 'No active quest for today.');
  if (quest.completed) return res.json({ quest, message: 'Quest was already completed today!' });
  quest.completed = true;
  await quest.save();
  res.json({ quest, message: 'Quest completed! +50 XP claimed!' });
}));

app.post('/api/user/buy-freeze', auth, handle(async (req, res) => {
  req.user.streakFreezes = (req.user.streakFreezes || 0) + 1;
  await req.user.save();
  res.json({ user: safeUser(req.user), message: 'Streak Freeze acquired! Your streak is protected.' });
}));

app.post('/api/user/equip-title', auth, [body('title').isString().isLength({ min: 2, max: 40 })], handle(async (req, res) => {
  req.user.equippedTitle = req.body.title;
  await req.user.save();
  res.json({ user: safeUser(req.user), message: `Title "${req.body.title}" equipped!` });
}));

app.post('/api/duels/create', auth, handle(async (req, res) => {
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  const problem = CURATED_PROBLEMS[Math.floor(Math.random() * CURATED_PROBLEMS.length)];
  const duel = await Duel.create({
    code,
    host: req.user.id,
    problem,
    status: 'waiting',
    timeLimitSeconds: 900
  });
  const populated = await Duel.findById(duel._id).populate('host', 'name username');
  res.status(201).json({ duel: populated });
}));

app.post('/api/duels/join/:code', auth, handle(async (req, res) => {
  const code = req.params.code.toUpperCase();
  const duel = await Duel.findOne({ code });
  if (!duel) return fail(res, 404, 'Duel room not found.');
  if (duel.status !== 'waiting') return fail(res, 400, 'This duel has already started or completed.');
  if (String(duel.host) === String(req.user.id)) return fail(res, 400, 'You are the host of this duel.');
  duel.challenger = req.user.id;
  duel.status = 'active';
  duel.startedAt = new Date();
  await duel.save();
  const populated = await Duel.findById(duel._id).populate('host', 'name username').populate('challenger', 'name username');
  res.json({ duel: populated });
}));

app.get('/api/duels/:code', auth, handle(async (req, res) => {
  const duel = await Duel.findOne({ code: req.params.code.toUpperCase() })
    .populate('host', 'name username')
    .populate('challenger', 'name username')
    .populate('winner', 'name username');
  if (!duel) return fail(res, 404, 'Duel room not found.');
  res.json({ duel });
}));

app.post('/api/duels/:code/finish', auth, handle(async (req, res) => {
  const duel = await Duel.findOne({ code: req.params.code.toUpperCase() });
  if (!duel) return fail(res, 404, 'Duel not found.');
  if (duel.status === 'completed') return fail(res, 400, 'Duel already finished.');
  duel.status = 'completed';
  duel.winner = req.user.id;
  duel.endedAt = new Date();
  await duel.save();
  const populated = await Duel.findById(duel._id).populate('host', 'name username').populate('challenger', 'name username').populate('winner', 'name username');
  res.json({ duel: populated, message: 'Victory claimed! +100 XP awarded.' });
}));

app.get('/api/public/:username', handle(async (req, res) => {
  const user = await User.findOne({ username: req.params.username.toLowerCase() }).select('name username college bio streakFreezes equippedTitle equippedTheme');
  if (!user) return fail(res, 404, 'Profile not found.');
  const portfolio = await Portfolio.findOne({ user: user.id, isPublic: true });
  if (!portfolio) return fail(res, 404, 'This profile is private.');
  const accounts = await PlatformAccount.find({ user: user.id }).select('platform handle stats profile verified');
  const totalSolved = accounts.reduce((sum, a) => sum + (a.stats?.solved || 0), 0);
  const highestRating = accounts.reduce((max, a) => Math.max(max, a.stats?.rating || 0), 0);
  const dna = computeDeveloperDNA(accounts, 0, 0);
  res.json({ user: safeUser(user), portfolio, accounts, dna, totalSolved, highestRating });
}));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDist = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.use((err, req, res, next) => { console.error(err); if (err.code === 11000) return fail(res, 409, 'That value is already in use.'); res.status(500).json({ message: 'Something went wrong. Please try again.' }); });
export default app;
