import mongoose from 'mongoose';

const { Schema, model } = mongoose;
const userSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  username: { type: String, required: true, unique: true, lowercase: true, trim: true, match: /^[a-z0-9_]{3,24}$/ },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  college: { type: String, default: '' }, graduationYear: Number,
  bio: { type: String, default: '', maxlength: 280 },
  timezone: { type: String, default: 'Asia/Kolkata' },
  streakFreezes: { type: Number, default: 1 },
  equippedTitle: { type: String, default: 'Explorer' },
  equippedTheme: { type: String, default: 'cyberpunk' },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

const platformSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  platform: { type: String, enum: ['LeetCode', 'Codeforces', 'CodeChef', 'GeeksforGeeks', 'GitHub'], required: true },
  handle: { type: String, required: true, trim: true },
  verified: { type: Boolean, default: false },
  stats: { solved: { type: Number, min: 0 }, easy: Number, medium: Number, hard: Number, rating: Number, maxRating: Number, rank: String, maxRank: String, history: Schema.Types.Mixed },
  source: { type: String, default: 'manual' },
  profile: { displayName: String, country: String, organization: String, avatar: String, profileUrl: String },
  syncedAt: Date
}, { timestamps: true });
platformSchema.index({ user: 1, platform: 1 }, { unique: true });

const activitySchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true }, platform: { type: String, required: true },
  solved: { type: Number, default: 0, min: 0 }, difficulty: { type: String, enum: ['easy', 'medium', 'hard', 'mixed'], default: 'mixed' },
  verified: { type: Boolean, default: false }, note: { type: String, maxlength: 160, default: '' }
}, { timestamps: true });
activitySchema.index({ user: 1, date: 1, platform: 1 });

const goalSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true }, title: { type: String, required: true, maxlength: 100 },
  target: { type: Number, required: true, min: 1 }, progress: { type: Number, default: 0 }, period: { type: String, enum: ['daily', 'weekly', 'monthly'], default: 'weekly' },
  deadline: Date, completedAt: Date
}, { timestamps: true });

const portfolioSchema = new Schema({ user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  theme: { type: String, enum: ['midnight', 'violet', 'emerald'], default: 'midnight' }, headline: { type: String, maxlength: 120, default: 'Building thoughtful software.' },
  skills: [{ type: String, maxlength: 32 }], links: { github: String, website: String, linkedin: String }, isPublic: { type: Boolean, default: true }
}, { timestamps: true });

const duelSchema = new Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  host: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  challenger: { type: Schema.Types.ObjectId, ref: 'User' },
  problem: {
    title: { type: String, default: 'Two Sum' },
    difficulty: { type: String, default: 'Easy' },
    url: { type: String, default: 'https://leetcode.com/problems/two-sum/' },
    platform: { type: String, default: 'LeetCode' }
  },
  status: { type: String, enum: ['waiting', 'active', 'completed'], default: 'waiting' },
  winner: { type: Schema.Types.ObjectId, ref: 'User' },
  startedAt: Date,
  endedAt: Date,
  timeLimitSeconds: { type: Number, default: 900 }
}, { timestamps: true });

const questSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true },
  title: { type: String, required: true },
  platform: { type: String, default: 'LeetCode' },
  difficulty: { type: String, default: 'Medium' },
  topic: { type: String, default: 'Dynamic Programming' },
  url: { type: String, default: '' },
  xpReward: { type: Number, default: 50 },
  completed: { type: Boolean, default: false }
}, { timestamps: true });
questSchema.index({ user: 1, date: 1 }, { unique: true });

export const User = model('User', userSchema);
export const PlatformAccount = model('PlatformAccount', platformSchema);
export const Activity = model('Activity', activitySchema);
export const Goal = model('Goal', goalSchema);
export const Portfolio = model('Portfolio', portfolioSchema);
export const Duel = model('Duel', duelSchema);
export const DailyQuest = model('DailyQuest', questSchema);
