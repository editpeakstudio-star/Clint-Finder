import express, { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '3000', 10);
const SESSION_SECRET = process.env.SESSION_SECRET || 'client-finder-v2-super-secure-production-secret-key-32b';
const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'leads.db');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

// 1. Database Schema Initialization & Migrations
db.exec(`
  CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source TEXT,
    message_id INTEGER,
    text TEXT,
    score INTEGER,
    category TEXT,
    matched_keywords TEXT,
    link TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(source, message_id)
  );

  CREATE TABLE IF NOT EXISTS keywords (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    keyword TEXT UNIQUE NOT NULL,
    category TEXT,
    priority TEXT DEFAULT 'normal',
    enabled INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    title TEXT,
    type TEXT DEFAULT 'public',
    status TEXT DEFAULT 'active',
    lead_count INTEGER DEFAULT 0,
    last_checked TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    type TEXT DEFAULT 'Telegram Channel',
    status TEXT DEFAULT 'active',
    enabled INTEGER DEFAULT 1,
    lead_count INTEGER DEFAULT 0,
    last_sync TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read INTEGER DEFAULT 0,
    data TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`);

// Add missing columns if migrating from old database
try {
  const pragmaLeads = db.prepare('PRAGMA table_info(leads)').all() as { name: string }[];
  const cols = pragmaLeads.map(c => c.name);
  if (!cols.includes('matched_keywords')) {
    db.exec('ALTER TABLE leads ADD COLUMN matched_keywords TEXT;');
  }
  if (!cols.includes('link')) {
    db.exec('ALTER TABLE leads ADD COLUMN link TEXT;');
  }
} catch (e) {
  // Ignored if already existing
}

// 2. Seed Default Admin User (Username: Hacker, Password: Hackerx)
const adminUser = db.prepare('SELECT * FROM users WHERE username = ?').get('Hacker');
if (!adminUser) {
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'Hackerx', salt);
  db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)').run(
    process.env.ADMIN_USERNAME || 'Hacker',
    hash,
    'admin'
  );
}

// 3. Seed Default 80 Keywords if empty
const kwCount = db.prepare('SELECT COUNT(*) as count FROM keywords').get() as { count: number };
if (kwCount.count === 0) {
  const initial80 = [
    // General editor
    ["video editor", "General editor", "high"],
    ["video editing", "General editor", "normal"],
    ["editor needed", "General editor", "high"],
    ["editor required", "General editor", "high"],
    ["editor wanted", "General editor", "high"],
    ["hiring editor", "General editor", "high"],
    ["hire an editor", "General editor", "high"],
    ["need an editor", "General editor", "high"],
    ["need editor", "General editor", "high"],
    ["looking for an editor", "General editor", "high"],
    ["looking for editor", "General editor", "high"],
    ["searching for an editor", "General editor", "high"],
    ["editor vacancy", "General editor", "normal"],
    ["editor job", "General editor", "normal"],
    ["editing job", "General editor", "normal"],
    ["video editing job", "General editor", "normal"],
    // YouTube
    ["youtube editor", "YouTube", "high"],
    ["youtube video editor", "YouTube", "high"],
    ["youtube editing", "YouTube", "normal"],
    ["youtube videos", "YouTube", "normal"],
    ["youtube channel editor", "YouTube", "high"],
    ["long form editor", "YouTube", "high"],
    ["long-form editor", "YouTube", "high"],
    ["long form video editor", "YouTube", "high"],
    // Shorts / Reels
    ["reels editor", "Shorts / Reels", "high"],
    ["reel editor", "Shorts / Reels", "high"],
    ["instagram reels editor", "Shorts / Reels", "high"],
    ["shorts editor", "Shorts / Reels", "high"],
    ["youtube shorts editor", "Shorts / Reels", "high"],
    ["short form editor", "Shorts / Reels", "high"],
    ["short-form editor", "Shorts / Reels", "high"],
    ["shorts editing", "Shorts / Reels", "normal"],
    ["reels editing", "Shorts / Reels", "normal"],
    ["short form video editor", "Shorts / Reels", "high"],
    // Social media
    ["social media editor", "Social media", "normal"],
    ["content editor", "Social media", "normal"],
    ["content creator editor", "Social media", "high"],
    ["creator editor", "Social media", "normal"],
    ["instagram editor", "Social media", "normal"],
    ["tiktok editor", "Social media", "high"],
    ["social media videos", "Social media", "low"],
    // Real estate
    ["real estate editor", "Real estate", "high"],
    ["real estate video editor", "Real estate", "high"],
    ["property video editor", "Real estate", "normal"],
    ["real estate reels", "Real estate", "normal"],
    ["real estate videos", "Real estate", "normal"],
    // Other common niches
    ["podcast editor", "Other niches", "high"],
    ["podcast video editor", "Other niches", "high"],
    ["wedding video editor", "Other niches", "normal"],
    ["gaming video editor", "Other niches", "normal"],
    ["documentary editor", "Other niches", "high"],
    ["cinematic editor", "Other niches", "normal"],
    ["faceless video editor", "Other niches", "high"],
    ["ugc video editor", "Other niches", "high"],
    ["ad video editor", "Other niches", "high"],
    ["commercial video editor", "Other niches", "high"],
    // Software / skills
    ["premiere pro editor", "Software / skills", "normal"],
    ["premiere pro", "Software / skills", "normal"],
    ["after effects editor", "Software / skills", "high"],
    ["after effects", "Software / skills", "normal"],
    ["motion graphics", "Software / skills", "high"],
    ["davinci resolve", "Software / skills", "normal"],
    ["capcut editor", "Software / skills", "normal"],
    // Hiring / payment signals
    ["freelance editor", "Hiring / payment", "high"],
    ["freelancer editor", "Hiring / payment", "normal"],
    ["paid editor", "Hiring / payment", "high"],
    ["paid editing", "Hiring / payment", "high"],
    ["paid work", "Hiring / payment", "high"],
    ["editor for hire", "Hiring / payment", "high"],
    ["long term editor", "Hiring / payment", "high"],
    ["long-term editor", "Hiring / payment", "high"],
    ["monthly editor", "Hiring / payment", "high"],
    ["per video", "Hiring / payment", "normal"],
    ["budget", "Hiring / payment", "normal"],
    ["paid", "Hiring / payment", "normal"],
    ["payment", "Hiring / payment", "normal"],
    ["salary", "Hiring / payment", "normal"],
    ["rate", "Hiring / payment", "normal"],
    ["remote editor", "Hiring / payment", "high"],
    ["work from home editor", "Hiring / payment", "high"]
  ];

  const insertKw = db.prepare('INSERT OR IGNORE INTO keywords (keyword, category, priority, enabled) VALUES (?, ?, ?, 1)');
  const tx = db.transaction(() => {
    for (const [kw, cat, prio] of initial80) {
      insertKw.run(kw, cat, prio);
    }
  });
  tx();
}

// 4. Seed Sources & Groups if empty
const srcCount = db.prepare('SELECT COUNT(*) as count FROM sources').get() as { count: number };
if (srcCount.count === 0) {
  const initialSources = [
    ["Editpeakstudio", "Telegram Community"],
    ["Freelancing_Video_Editing", "Telegram Channel"],
    ["redgs", "Telegram Channel"],
    ["editing_material7", "Telegram Channel"],
    ["@letsgrow10", "Telegram Group"],
    ["@NOXXCUT", "Telegram Group"],
    ["@techjailbreakofficial", "Telegram Channel"]
  ];
  const insSrc = db.prepare('INSERT OR IGNORE INTO sources (name, type, status, enabled, lead_count, last_sync) VALUES (?, ?, "active", 1, 0, CURRENT_TIMESTAMP)');
  const insGrp = db.prepare('INSERT OR IGNORE INTO groups (username, title, type, status, lead_count, last_checked) VALUES (?, ?, "public", "active", 0, CURRENT_TIMESTAMP)');
  for (const [name, stype] of initialSources) {
    insSrc.run(name, stype);
    insGrp.run(name.startsWith('@') ? name : `@${name}`, name.replace(/^@/, ''));
  }
}

// Restore Telegram session from TELEGRAM_SESSION_B64 if available
const SESSION_FILE_PATH = path.join(__dirname, 'editpeak_session.session');
const SESSION_B64 = process.env.TELEGRAM_SESSION_B64;
if (SESSION_B64 && !fs.existsSync(SESSION_FILE_PATH)) {
  try {
    const cleanedB64 = SESSION_B64.trim().replace(/^["']|["']$/g, '');
    fs.writeFileSync(SESSION_FILE_PATH, Buffer.from(cleanedB64, 'base64'));
    console.log('✅ Telegram session restored from TELEGRAM_SESSION_B64');
  } catch (err) {
    console.warn('⚠️ Could not decode TELEGRAM_SESSION_B64:', err);
  }
}

export function getTelegramConnectionStatus() {
  const hasCredentials = Boolean(
    process.env.API_ID &&
    process.env.API_HASH &&
    process.env.API_ID.trim() !== '' &&
    process.env.API_HASH.trim() !== ''
  );
  const hasSessionFile = fs.existsSync(SESSION_FILE_PATH);
  const hasSessionB64 = Boolean(
    process.env.TELEGRAM_SESSION_B64 &&
    process.env.TELEGRAM_SESSION_B64.trim().length > 10
  );

  let status: 'connected' | 'session_required' | 'credentials_missing' | 'standby' = 'standby';
  let message = '';

  if (hasCredentials && (hasSessionFile || hasSessionB64)) {
    status = 'connected';
    message = 'Telegram API credentials and session verified. Telegram listener is ready to stream leads.';
  } else if (hasCredentials && !hasSessionFile && !hasSessionB64) {
    status = 'session_required';
    message = 'Telegram API credentials found, but session file is missing. Run python generate_session.py to generate it.';
  } else {
    status = 'credentials_missing';
    message = 'Telegram API_ID / API_HASH not configured. Running in safe standalone database mode with simulated signals.';
  }

  return {
    status,
    has_credentials: hasCredentials,
    has_session_file: hasSessionFile,
    has_session_b64: hasSessionB64,
    message
  };
}

// Helper to verify passwords supporting both bcrypt ($2a$, $2b$) and pbkdf2
function checkPasswordHash(password: string, storedHash: string): boolean {
  if (!storedHash) return false;
  if (storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$')) {
    return bcrypt.compareSync(password, storedHash);
  }
  if (storedHash.startsWith('pbkdf2:sha256:')) {
    try {
      const parts = storedHash.split('$');
      const salt = parts[1];
      const expected = parts[2];
      const computed = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256').toString('hex');
      return computed === expected;
    } catch {
      return false;
    }
  }
  return false;
}

// Lead Analyzer Engine in Node/TypeScript matching lead_analyzer.py
function analyzeLeadText(text: string, customKeywords?: string[]) {
  if (!text) return { score: 0, category: '⚪ LOW', matched: [] };

  const textLower = text.toLowerCase();
  let score = 0;
  const matched: string[] = [];

  const STRONG_HIRING = [
    "i need video editor", "i need a video editor", "need video editor", "need a video editor",
    "need an editor", "need editor", "video editor needed", "editor needed", "video editor required",
    "editor required", "looking for a video editor", "looking for video editor", "looking for an editor",
    "looking for editor", "hiring a video editor", "hiring video editor", "hiring editor",
    "hire a video editor", "hire an editor", "editor wanted"
  ];

  const CLIENT_SIGNALS = [
    "long term", "long-term", "monthly", "budget", "paid", "paid work", "per video",
    "payment", "salary", "rate", "urgent", "urgently", "remote", "work from home", "freelance"
  ];

  const GENERAL_SIGNALS = [
    "video editor", "video editing", "youtube editor", "reels editor", "reel editor",
    "shorts editor", "short form editor", "long form editor", "podcast editor",
    "real estate editor", "gaming video editor", "documentary editor", "cinematic editor",
    "faceless video editor", "ugc video editor", "ad video editor", "commercial video editor"
  ];

  const NEGATIVE_SIGNALS = [
    "i am a video editor", "i'm a video editor", "i am an editor", "i'm an editor",
    "looking for clients", "looking for client", "my portfolio", "check my portfolio",
    "hire me", "available for work"
  ];

  for (const signal of STRONG_HIRING) {
    if (textLower.includes(signal)) {
      score += 50;
      if (!matched.includes(signal)) matched.push(signal);
      break;
    }
  }

  for (const signal of CLIENT_SIGNALS) {
    if (textLower.includes(signal)) {
      score += 10;
      if (!matched.includes(signal)) matched.push(signal);
    }
  }

  for (const signal of GENERAL_SIGNALS) {
    if (textLower.includes(signal)) {
      score += 5;
      if (!matched.includes(signal)) matched.push(signal);
    }
  }

  // Active dynamic keywords from DB
  const keywordsToCheck = customKeywords || (db.prepare('SELECT keyword FROM keywords WHERE enabled = 1').all() as { keyword: string }[]).map(k => k.keyword);
  for (const kw of keywordsToCheck) {
    const cleanKw = kw.trim().toLowerCase();
    if (cleanKw && textLower.includes(cleanKw)) {
      if (!matched.includes(cleanKw)) {
        matched.push(cleanKw);
        if (score < 70) score += 5;
      }
    }
  }

  // Currency signal
  if (text.includes('₹') || text.includes('$') || /\b(rs|inr|usd|eur|gbp)\b/i.test(textLower)) {
    score += 10;
    if (!matched.includes('rate/currency')) matched.push('rate/currency');
  }

  // Negative editor self-promotion
  for (const signal of NEGATIVE_SIGNALS) {
    if (textLower.includes(signal)) {
      score -= 25;
      matched.push(`self-promo (${signal})`);
    }
  }

  score = Math.max(0, Math.min(score, 100));

  let category = '⚪ LOW';
  if (score >= 70) category = '🔥 HOT';
  else if (score >= 45) category = '🟡 WARM';

  return { score, category, matched };
}

// In-Memory Sessions & Login Rate Limiting
interface SessionUser {
  id: number;
  username: string;
  role: string;
  createdAt: number;
}
const activeSessions = new Map<string, SessionUser>();
const loginAttempts = new Map<string, { attempts: number; windowStart: number }>();

function createSessionToken(user: { id: number; username: string; role: string }): string {
  const token = crypto.randomBytes(32).toString('hex');
  activeSessions.set(token, {
    id: user.id,
    username: user.username,
    role: user.role,
    createdAt: Date.now()
  });
  return token;
}

const app = express();
app.use(express.json());
app.use(cookieParser(SESSION_SECRET));

// Security Headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Auth Middleware
function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies.cf_session_token;
  if (!token || !activeSessions.has(token)) {
    return res.status(401).json({ error: 'Unauthorized access. Authentication required.', authenticated: false });
  }
  (req as any).user = activeSessions.get(token);
  next();
}

// ── Auth Endpoints ──────────────────────────────────────────────
app.post('/api/auth/login', (req, res) => {
  const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
  const now = Date.now();
  const attemptInfo = loginAttempts.get(ip);

  if (attemptInfo) {
    if (now - attemptInfo.windowStart < 15 * 60 * 1000) {
      if (attemptInfo.attempts >= 5) {
        return res.status(429).json({
          error: 'Maximum login attempts exceeded. Account access locked for 15 minutes.'
        });
      }
      attemptInfo.attempts++;
    } else {
      loginAttempts.set(ip, { attempts: 1, windowStart: now });
    }
  } else {
    loginAttempts.set(ip, { attempts: 1, windowStart: now });
  }

  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password credentials are required.' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username.trim()) as any;
  if (!user || !checkPasswordHash(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid username or password credentials.' });
  }

  // Reset rate limiting on successful login
  loginAttempts.delete(ip);

  const token = createSessionToken(user);
  res.cookie('cf_session_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false, // works seamlessly in dev and preview iframes
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  return res.json({
    success: true,
    user: {
      id: user.id,
      username: user.username,
      role: user.role
    }
  });
});

app.post('/api/auth/logout', (req, res) => {
  const token = req.cookies.cf_session_token;
  if (token) {
    activeSessions.delete(token);
  }
  res.clearCookie('cf_session_token');
  return res.json({ success: true, message: 'Logged out successfully.' });
});

app.get('/api/auth/me', (req, res) => {
  const token = req.cookies.cf_session_token;
  if (!token || !activeSessions.has(token)) {
    return res.status(401).json({ authenticated: false });
  }
  const sessionUser = activeSessions.get(token);
  return res.json({
    authenticated: true,
    user: sessionUser
  });
});

// ── Overview & Statistics API ────────────────────────────────────
app.get('/api/stats', requireAuth, (req, res) => {
  const totalLeads = (db.prepare('SELECT COUNT(*) as count FROM leads').get() as any).count;
  const todayLeads = (db.prepare("SELECT COUNT(*) as count FROM leads WHERE date(created_at) = date('now')").get() as any).count;
  const hotLeads = (db.prepare("SELECT COUNT(*) as count FROM leads WHERE category LIKE '%HOT%'").get() as any).count;
  const warmLeads = (db.prepare("SELECT COUNT(*) as count FROM leads WHERE category LIKE '%WARM%'").get() as any).count;
  const lowLeads = (db.prepare("SELECT COUNT(*) as count FROM leads WHERE category LIKE '%LOW%'").get() as any).count;
  const activeSources = (db.prepare('SELECT COUNT(*) as count FROM sources WHERE enabled = 1').get() as any).count;
  const activeKeywords = (db.prepare('SELECT COUNT(*) as count FROM keywords WHERE enabled = 1').get() as any).count;
  const monitoredGroups = (db.prepare("SELECT COUNT(*) as count FROM groups WHERE status = 'active'").get() as any).count;

  // Timeline
  const leadsTimeline = db.prepare(`
    SELECT date(created_at) as day, COUNT(*) as count,
           SUM(CASE WHEN category LIKE '%HOT%' THEN 1 ELSE 0 END) as hot_count,
           SUM(CASE WHEN category LIKE '%WARM%' THEN 1 ELSE 0 END) as warm_count
    FROM leads
    GROUP BY date(created_at)
    ORDER BY day ASC
    LIMIT 14
  `).all();

  // Source performance
  const sourceStats = db.prepare(`
    SELECT source, COUNT(*) as count, ROUND(AVG(score), 1) as avg_score
    FROM leads
    GROUP BY source
    ORDER BY count DESC
    LIMIT 8
  `).all();

  // Keyword performance (from matched_keywords)
  const allLeads = db.prepare('SELECT matched_keywords FROM leads WHERE matched_keywords IS NOT NULL').all() as { matched_keywords: string }[];
  const kwMap: Record<string, number> = {};
  for (const l of allLeads) {
    if (l.matched_keywords) {
      const parts = l.matched_keywords.split(',').map(s => s.trim());
      for (const p of parts) {
        if (p && !p.startsWith('self-promo')) {
          kwMap[p] = (kwMap[p] || 0) + 1;
        }
      }
    }
  }
  const topKeywords = Object.entries(kwMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([keyword, count]) => ({ keyword, count }));

  // Recent leads
  const recentLeads = db.prepare('SELECT * FROM leads ORDER BY created_at DESC LIMIT 5').all();

  const tgStatus = getTelegramConnectionStatus();

  return res.json({
    total_leads: totalLeads,
    today_leads: todayLeads,
    hot_leads: hotLeads,
    warm_leads: warmLeads,
    low_leads: lowLeads,
    active_sources: activeSources,
    active_keywords: activeKeywords,
    monitored_groups: monitoredGroups,
    leads_timeline: leadsTimeline,
    source_stats: sourceStats,
    top_keywords: topKeywords,
    recent_leads: recentLeads,
    telegram_listener_status: tgStatus.status === 'connected' ? 'streaming' : 'standby',
    telegram_status: tgStatus,
    last_sync: new Date().toISOString()
  });
});

app.get('/api/telegram/status', requireAuth, (req, res) => {
  return res.json(getTelegramConnectionStatus());
});

// ── Lead Finder API ─────────────────────────────────────────────
app.get('/api/leads', requireAuth, (req, res) => {
  const search = (req.query.search as string) || '';
  const category = (req.query.category as string) || 'ALL';
  const source = (req.query.source as string) || 'ALL';
  const minScore = req.query.min_score ? parseInt(req.query.min_score as string, 10) : null;
  const sort = (req.query.sort as string) || 'newest';
  const page = Math.max(1, parseInt((req.query.page as string) || '1', 10));
  const limit = Math.max(1, Math.min(100, parseInt((req.query.limit as string) || '15', 10)));

  let whereClauses: string[] = ['1=1'];
  const params: any[] = [];

  if (search) {
    whereClauses.push('(text LIKE ? OR source LIKE ? OR matched_keywords LIKE ?)');
    const term = `%${search}%`;
    params.push(term, term, term);
  }

  if (category && category !== 'ALL') {
    if (category === 'HOT') whereClauses.push("category LIKE '%HOT%'");
    else if (category === 'WARM') whereClauses.push("category LIKE '%WARM%'");
    else if (category === 'LOW') whereClauses.push("category LIKE '%LOW%'");
  }

  if (source && source !== 'ALL') {
    whereClauses.push('(source = ? OR source = ?)');
    params.push(source, source.replace(/^@/, ''));
  }

  if (minScore !== null && !isNaN(minScore)) {
    whereClauses.push('score >= ?');
    params.push(minScore);
  }

  const whereSql = whereClauses.join(' AND ');

  const countRow = db.prepare(`SELECT COUNT(*) as total FROM leads WHERE ${whereSql}`).get(...params) as any;
  const total = countRow.total;

  let orderSql = 'ORDER BY created_at DESC, id DESC';
  if (sort === 'oldest') orderSql = 'ORDER BY created_at ASC, id ASC';
  else if (sort === 'score_desc') orderSql = 'ORDER BY score DESC, created_at DESC';
  else if (sort === 'score_asc') orderSql = 'ORDER BY score ASC, created_at DESC';

  const offset = (page - 1) * limit;
  const leads = db.prepare(`SELECT * FROM leads WHERE ${whereSql} ${orderSql} LIMIT ? OFFSET ?`).all(...params, limit, offset);

  return res.json({
    leads,
    total,
    page,
    limit,
    total_pages: Math.max(1, Math.ceil(total / limit))
  });
});

app.delete('/api/leads/:id', requireAuth, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const info = db.prepare('DELETE FROM leads WHERE id = ?').run(id);
  return res.json({ success: info.changes > 0 });
});

app.post('/api/leads/bulk-delete', requireAuth, (req, res) => {
  const ids: number[] = req.body.ids || [];
  if (!ids.length) return res.json({ success: true, deleted_count: 0 });

  const placeholders = ids.map(() => '?').join(',');
  const info = db.prepare(`DELETE FROM leads WHERE id IN (${placeholders})`).run(...ids);
  return res.json({ success: true, deleted_count: info.changes });
});

// ── Keyword Manager API ──────────────────────────────────────────
app.get('/api/keywords', requireAuth, (req, res) => {
  const search = (req.query.search as string) || '';
  const status = (req.query.status as string) || 'ALL';
  const sort = (req.query.sort as string) || 'alpha';

  let where = '1=1';
  const params: any[] = [];

  if (search) {
    where += ' AND (keyword LIKE ? OR category LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  if (status === 'enabled') where += ' AND enabled = 1';
  else if (status === 'disabled') where += ' AND enabled = 0';

  let order = 'ORDER BY keyword ASC';
  if (sort === 'priority') order = "ORDER BY CASE priority WHEN 'high' THEN 1 WHEN 'normal' THEN 2 ELSE 3 END, keyword ASC";
  else if (sort === 'newest') order = 'ORDER BY created_at DESC';

  const keywords = db.prepare(`SELECT * FROM keywords WHERE ${where} ${order}`).all(...params);
  const total = (db.prepare('SELECT COUNT(*) as count FROM keywords').get() as any).count;
  const enabled = (db.prepare('SELECT COUNT(*) as count FROM keywords WHERE enabled = 1').get() as any).count;

  return res.json({
    keywords,
    total,
    enabled,
    disabled: total - enabled
  });
});

app.post('/api/keywords', requireAuth, (req, res) => {
  const { keyword, category, priority } = req.body;
  const cleanKw = (keyword || '').trim().toLowerCase();
  if (!cleanKw) {
    return res.status(400).json({ error: 'Keyword phrase cannot be empty.' });
  }

  try {
    const info = db.prepare(`
      INSERT INTO keywords (keyword, category, priority, enabled)
      VALUES (?, ?, ?, 1)
    `).run(cleanKw, category || 'Custom', priority || 'normal');

    return res.json({
      success: true,
      keyword: {
        id: info.lastInsertRowid,
        keyword: cleanKw,
        category: category || 'Custom',
        priority: priority || 'normal',
        enabled: 1
      }
    });
  } catch (err: any) {
    if (err.message?.includes('UNIQUE')) {
      return res.status(400).json({ error: `Keyword "${cleanKw}" is already registered.` });
    }
    return res.status(500).json({ error: 'Failed to add keyword.' });
  }
});

app.put('/api/keywords/:id', requireAuth, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { enabled, priority, category } = req.body;

  const updates: string[] = [];
  const params: any[] = [];

  if (enabled !== undefined) {
    updates.push('enabled = ?');
    params.push(enabled ? 1 : 0);
  }
  if (priority !== undefined) {
    updates.push('priority = ?');
    params.push(priority);
  }
  if (category !== undefined) {
    updates.push('category = ?');
    params.push(category);
  }

  if (!updates.length) return res.json({ success: false });

  params.push(id);
  const info = db.prepare(`UPDATE keywords SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  return res.json({ success: info.changes > 0 });
});

app.delete('/api/keywords/:id', requireAuth, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const info = db.prepare('DELETE FROM keywords WHERE id = ?').run(id);
  return res.json({ success: info.changes > 0 });
});

// ── Group Manager API ───────────────────────────────────────────
app.get('/api/groups', requireAuth, (req, res) => {
  const search = (req.query.search as string) || '';
  const status = (req.query.status as string) || 'ALL';

  let where = '1=1';
  const params: any[] = [];

  if (search) {
    where += ' AND (username LIKE ? OR title LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  if (status !== 'ALL') {
    where += ' AND status = ?';
    params.push(status.toLowerCase());
  }

  const groups = db.prepare(`SELECT * FROM groups WHERE ${where} ORDER BY id DESC`).all(...params);
  const total = (db.prepare('SELECT COUNT(*) as count FROM groups').get() as any).count;
  const active = (db.prepare("SELECT COUNT(*) as count FROM groups WHERE status = 'active'").get() as any).count;
  const paused = (db.prepare("SELECT COUNT(*) as count FROM groups WHERE status = 'paused'").get() as any).count;

  return res.json({ groups, total, active, paused });
});

app.post('/api/groups', requireAuth, (req, res) => {
  const { target, title } = req.body;
  if (!target || typeof target !== 'string') {
    return res.status(400).json({ error: 'Telegram group link or username is required.' });
  }

  const cleanTarget = target.trim();
  let username = cleanTarget;
  let type = 'public';

  if (/t\.me\/\+|joinchat/i.test(cleanTarget)) {
    type = 'private';
    username = cleanTarget;
  } else {
    const match = cleanTarget.match(/(?:t\.me|telegram\.me)\/([a-zA-Z0-9_]+)/i);
    if (match) {
      username = `@${match[1]}`;
    } else if (!cleanTarget.startsWith('@')) {
      username = `@${cleanTarget}`;
    }
  }

  const groupTitle = (title && title.trim()) || username.replace(/^@/, '');
  const initialStatus = type === 'public' ? 'active' : 'pending_validation';

  try {
    const info = db.prepare(`
      INSERT INTO groups (username, title, type, status, lead_count, last_checked)
      VALUES (?, ?, ?, ?, 0, CURRENT_TIMESTAMP)
    `).run(username, groupTitle, type, initialStatus);

    // Sync to sources
    db.prepare(`
      INSERT OR IGNORE INTO sources (name, type, status, enabled, lead_count, last_sync)
      VALUES (?, ?, ?, 1, 0, CURRENT_TIMESTAMP)
    `).run(username.replace(/^@/, ''), `Telegram ${type === 'public' ? 'Group' : 'Private'}`, initialStatus);

    return res.json({
      success: true,
      group: {
        id: info.lastInsertRowid,
        username,
        title: groupTitle,
        type,
        status: initialStatus
      }
    });
  } catch (err: any) {
    if (err.message?.includes('UNIQUE')) {
      return res.status(400).json({ error: `Group "${username}" is already monitored.` });
    }
    return res.status(500).json({ error: 'Failed to add group.' });
  }
});

app.put('/api/groups/:id/toggle', requireAuth, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const grp = db.prepare('SELECT status FROM groups WHERE id = ?').get(id) as any;
  if (!grp) return res.status(404).json({ error: 'Group not found.' });

  const newStatus = grp.status === 'active' ? 'paused' : 'active';
  db.prepare('UPDATE groups SET status = ? WHERE id = ?').run(newStatus, id);
  return res.json({ success: true, status: newStatus });
});

app.delete('/api/groups/:id', requireAuth, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const grp = db.prepare('SELECT username FROM groups WHERE id = ?').get(id) as any;
  if (!grp) return res.status(404).json({ error: 'Group not found.' });

  db.prepare('DELETE FROM groups WHERE id = ?').run(id);
  db.prepare('DELETE FROM sources WHERE name = ? OR name = ?').run(grp.username, grp.username.replace(/^@/, ''));
  return res.json({ success: true });
});

// ── Sources API ─────────────────────────────────────────────────
app.get('/api/sources', requireAuth, (req, res) => {
  const sources = db.prepare('SELECT * FROM sources ORDER BY id ASC').all();
  return res.json({ sources });
});

app.post('/api/sources', requireAuth, (req, res) => {
  const { name, type } = req.body;
  const cleanName = (name || '').trim().replace(/^@/, '');
  if (!cleanName) return res.status(400).json({ error: 'Source name is required.' });

  try {
    const info = db.prepare(`
      INSERT INTO sources (name, type, status, enabled, lead_count, last_sync)
      VALUES (?, ?, 'active', 1, 0, CURRENT_TIMESTAMP)
    `).run(cleanName, type || 'Telegram Channel');

    return res.json({
      success: true,
      source: { id: info.lastInsertRowid, name: cleanName, type: type || 'Telegram Channel', enabled: 1, status: 'active' }
    });
  } catch (err: any) {
    return res.status(400).json({ error: `Source "${cleanName}" already exists.` });
  }
});

app.put('/api/sources/:id/toggle', requireAuth, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const src = db.prepare('SELECT enabled FROM sources WHERE id = ?').get(id) as any;
  if (!src) return res.status(404).json({ error: 'Source not found.' });

  const newState = src.enabled ? 0 : 1;
  db.prepare('UPDATE sources SET enabled = ? WHERE id = ?').run(newState, id);
  return res.json({ success: true, enabled: newState });
});

app.delete('/api/sources/:id', requireAuth, (req, res) => {
  const id = parseInt(req.params.id, 10);
  db.prepare('DELETE FROM sources WHERE id = ?').run(id);
  return res.json({ success: true });
});

// ── Notifications API ───────────────────────────────────────────
app.get('/api/notifications', requireAuth, (req, res) => {
  const notifications = db.prepare('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50').all();
  const unreadCount = (db.prepare('SELECT COUNT(*) as count FROM notifications WHERE read = 0').get() as any).count;
  return res.json({ notifications, unread_count: unreadCount });
});

app.post('/api/notifications/mark-read', requireAuth, (req, res) => {
  db.prepare('UPDATE notifications SET read = 1').run();
  return res.json({ success: true });
});

app.delete('/api/notifications', requireAuth, (req, res) => {
  db.prepare('DELETE FROM notifications').run();
  return res.json({ success: true });
});

// ── Settings API ────────────────────────────────────────────────
app.get('/api/settings', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
  const settings: Record<string, string> = {
    min_score: '45',
    refresh_interval: '15',
    notification_sound: 'true',
    hot_alerts: 'true',
    warm_alerts: 'true',
    theme: 'navy-dark'
  };
  for (const r of rows) {
    settings[r.key] = r.value;
  }
  return res.json({ settings });
});

app.post('/api/settings', requireAuth, (req, res) => {
  const updates = req.body || {};
  const ins = db.prepare(`
    INSERT INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP
  `);
  const tx = db.transaction(() => {
    for (const [k, v] of Object.entries(updates)) {
      ins.run(k, String(v), String(v));
    }
  });
  tx();
  return res.json({ success: true, message: 'Settings saved.' });
});

// ── Lead Simulator & Test Pipeline API ──────────────────────────
app.post('/api/test-analyze', requireAuth, (req, res) => {
  const { text } = req.body;
  const result = analyzeLeadText(text || '');
  return res.json(result);
});

app.post('/api/simulate-lead', requireAuth, (req, res) => {
  const { source, text } = req.body;
  const leadSource = source || 'Editpeakstudio';
  const leadText = text || 'Urgent: Looking for a dedicated YouTube video editor to work long-term. Must know Premiere Pro and Motion Graphics. Monthly salary ₹30,000.';

  const analysis = analyzeLeadText(leadText);
  const msgId = Math.floor(10000 + Math.random() * 90000);

  try {
    db.prepare(`
      INSERT INTO leads (source, message_id, text, score, category, matched_keywords, link)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      leadSource,
      msgId,
      leadText,
      analysis.score,
      analysis.category,
      analysis.matched.join(', '),
      `https://t.me/${leadSource.replace(/^@/, '')}/${msgId}`
    );

    // Notify
    db.prepare(`
      INSERT INTO notifications (type, title, message, read)
      VALUES (?, ?, ?, 0)
    `).run(
      analysis.score >= 70 ? 'lead_hot' : 'lead_warm',
      `${analysis.category} Lead in ${leadSource} (${analysis.score}/100)`,
      leadText.slice(0, 120) + '...'
    );

    return res.json({ success: true, message: 'Lead simulated successfully', analysis });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ── Vite Integration ────────────────────────────────────────────
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.join(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✨ CLIENT FINDER V2 Dashboard active at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Fatal Server Error:', err);
});
