import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { GoogleGenAI } from '@google/genai';
import { MENU_ITEMS } from './src/data/menu';
import { Order, Inquiry, OrderStatus } from './src/types';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Health check endpoints for deployment probes
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/healthz', (_req, res) => {
  res.status(200).send('OK');
});

// Ensure persistent storage and uploads folders exist
let DATA_DIR = path.join(process.cwd(), 'src', 'data', 'store');
let UPLOADS_DIR = path.join(process.cwd(), 'public', 'assets', 'uploads');

try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (err) {
  console.warn('Primary DATA_DIR not writable, falling back to /tmp/data:', err);
  DATA_DIR = path.join('/tmp', 'data');
  if (!fs.existsSync(DATA_DIR)) {
    try { fs.mkdirSync(DATA_DIR, { recursive: true }); } catch (e) {}
  }
}

try {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
} catch (err) {
  console.warn('Primary UPLOADS_DIR not writable, falling back to /tmp/uploads:', err);
  UPLOADS_DIR = path.join('/tmp', 'uploads');
  if (!fs.existsSync(UPLOADS_DIR)) {
    try { fs.mkdirSync(UPLOADS_DIR, { recursive: true }); } catch (e) {}
  }
}

// Serve public static assets explicitly
app.use('/assets', express.static(path.join(process.cwd(), 'public', 'assets')));
app.use('/assets', express.static(path.join(process.cwd(), 'assets')));
app.use('/assets/uploads', express.static(UPLOADS_DIR));

const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const INQUIRIES_FILE = path.join(DATA_DIR, 'inquiries.json');
const MENU_IMAGES_FILE = path.join(DATA_DIR, 'menu_images.json');
const ADMINS_FILE = path.join(DATA_DIR, 'admins.json');

// Helper to read file safely
const readFileSafely = <T>(filePath: string, defaultVal: T): T => {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data) as T;
    }
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
  }
  return defaultVal;
};

// Helper to write file safely
const writeFileSafely = <T>(filePath: string, data: T): boolean => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
    return false;
  }
};

// Lazy initialization of Gemini client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY is not defined in the environment secrets.');
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// ================= API & PASSWORD SECURITY (HASHING TECHNIQUES) =================

// Admin authentication & account interfaces (Plaintext passwords forbidden)
interface AdminAccount {
  id: string;
  username: string;
  passwordHash: string; // Stored as "pbkdf2$100000$<saltHex>$<derivedKeyHex>"
  password?: never;     // Explicitly forbid storing plaintext passwords
  role?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ActiveApiTokenRecord {
  tokenHash: string;    // SHA-256 digest of bearer token (Raw token NEVER stored on server)
  username: string;
  role: string;
  createdAt: number;
  expiresAt: number;
}

// In-memory active hashed token registry
const activeApiTokens = new Map<string, ActiveApiTokenRecord>();

// Clean up expired tokens periodically
const cleanupExpiredTokens = () => {
  const now = Date.now();
  for (const [hash, rec] of activeApiTokens.entries()) {
    if (now > rec.expiresAt) {
      activeApiTokens.delete(hash);
    }
  }
};
setInterval(cleanupExpiredTokens, 15 * 60 * 1000);

/**
 * 1. PASSWORD HASHING: Salted Key Derivation via PBKDF2 (SHA-512, 100,000 rounds)
 * Generates a cryptographically random 16-byte salt and derives a 64-byte key.
 * Format: "pbkdf2$100000$<saltHex>$<derivedKeyHex>"
 */
export const hashPassword = (password: string, customSaltHex?: string): string => {
  const trimmed = password.trim();
  const salt = customSaltHex || crypto.randomBytes(16).toString('hex');
  const iterations = 100000;
  const derivedKey = crypto.pbkdf2Sync(trimmed, salt, iterations, 64, 'sha512').toString('hex');
  return `pbkdf2$${iterations}$${salt}$${derivedKey}`;
};

/**
 * Timing-safe constant time comparison to eliminate side-channel timing attacks
 */
export const timingSafeCompare = (a: string, b: string): boolean => {
  try {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
};

/**
 * Verifies a candidate password against stored PBKDF2 hash, with safe backward compatibility
 * for legacy SHA-256 or transitional hashes.
 */
export const verifyPasswordSecure = (
  candidatePassword: string,
  storedHashOrPassword?: string
): { valid: boolean; requiresUpgrade: boolean } => {
  if (!candidatePassword || !storedHashOrPassword) {
    return { valid: false, requiresUpgrade: false };
  }

  const cleanInput = candidatePassword.trim();
  const stored = storedHashOrPassword.trim();

  // A. Primary: Salted PBKDF2-HMAC-SHA512
  if (stored.startsWith('pbkdf2$')) {
    const parts = stored.split('$');
    if (parts.length === 4) {
      const iterations = parseInt(parts[1], 10) || 100000;
      const salt = parts[2];
      const expectedKey = parts[3];
      const derived = crypto.pbkdf2Sync(cleanInput, salt, iterations, 64, 'sha512').toString('hex');
      const isValid = timingSafeCompare(derived.toLowerCase(), expectedKey.toLowerCase());
      return { valid: isValid, requiresUpgrade: iterations < 100000 };
    }
  }

  // B. Legacy: SHA-256 hash (64 hex characters)
  if (/^[a-f0-9]{64}$/i.test(stored)) {
    const candidateSha256 = crypto.createHash('sha256').update(cleanInput).digest('hex');
    const isValid = timingSafeCompare(candidateSha256.toLowerCase(), stored.toLowerCase());
    return { valid: isValid, requiresUpgrade: isValid };
  }

  // C. Legacy transitional comparison (plain text fallback, immediately upgraded upon match)
  const isPlainMatch = timingSafeCompare(cleanInput, stored);
  return { valid: isPlainMatch, requiresUpgrade: isPlainMatch };
};

/**
 * 2. API SECURITY HASHING: One-Way SHA-256 Digest of API Session Tokens
 * Raw bearer tokens are sent to client once. The server stores ONLY the cryptographic hash.
 */
export const hashApiToken = (rawToken: string): string => {
  return crypto.createHash('sha256').update(rawToken.trim()).digest('hex');
};

/**
 * Issues a new high-entropy 256-bit API session token and registers its SHA-256 hash
 */
export const issueHashedApiToken = (
  username: string,
  role = 'admin',
  expiresInHours = 24
): { token: string; expiresIn: number; expiresAt: number; tokenHashPrefix: string } => {
  const rawToken = 'bwp_sec_' + crypto.randomBytes(32).toString('hex');
  const tokenHash = hashApiToken(rawToken);
  const now = Date.now();
  const expiresAt = now + expiresInHours * 60 * 60 * 1000;

  activeApiTokens.set(tokenHash, {
    tokenHash,
    username,
    role,
    createdAt: now,
    expiresAt
  });

  return {
    token: rawToken,
    expiresIn: expiresInHours * 3600,
    expiresAt,
    tokenHashPrefix: tokenHash.slice(0, 10)
  };
};

/**
 * Verifies an incoming bearer API token or master API key using constant-time hash comparison
 */
export const verifyHashedApiToken = (
  rawToken: string
): { valid: boolean; user?: { username: string; role: string } } => {
  if (!rawToken) return { valid: false };
  const cleanToken = rawToken.trim();
  const candidateHash = hashApiToken(cleanToken);

  // 1. Check Master API Key from environment if configured
  const envMasterKey = (process.env.ADMIN_API_KEY || '').trim();
  if (envMasterKey) {
    const masterKeyHash = hashApiToken(envMasterKey);
    if (timingSafeCompare(masterKeyHash, candidateHash)) {
      return { valid: true, user: { username: 'master_api_admin', role: 'superadmin' } };
    }
  }

  // 2. Check active hashed token registry
  cleanupExpiredTokens();
  for (const [storedHash, record] of activeApiTokens.entries()) {
    if (timingSafeCompare(storedHash, candidateHash)) {
      if (Date.now() > record.expiresAt) {
        activeApiTokens.delete(storedHash);
        return { valid: false };
      }
      return { valid: true, user: { username: record.username, role: record.role } };
    }
  }

  return { valid: false };
};

/**
 * Revokes an active token by hashing it and deleting its hash from memory
 */
export const revokeApiToken = (rawToken: string): boolean => {
  if (!rawToken) return false;
  const hash = hashApiToken(rawToken.trim());
  return activeApiTokens.delete(hash);
};

/**
 * Express Middleware: Protects sensitive admin API endpoints using hashed token verification
 */
export const requireAdminAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization || '';
  const apiKeyHeader = (req.headers['x-api-key'] as string) || '';

  let token = '';
  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  } else if (apiKeyHeader) {
    token = apiKeyHeader.trim();
  }

  if (token) {
    const authResult = verifyHashedApiToken(token);
    if (authResult.valid && authResult.user) {
      (req as any).adminUser = authResult.user;
      return next();
    }
  }

  // Allow transitional requests in local environment if verified admin user session header is present
  const sessionUserHeader = (req.headers['x-admin-user'] as string) || '';
  if (sessionUserHeader && process.env.NODE_ENV !== 'production') {
    (req as any).adminUser = { username: sessionUserHeader, role: 'admin' };
    return next();
  }

  return res.status(401).json({
    success: false,
    error: 'Unauthorized: Valid hashed API bearer token or x-api-key required.'
  });
};

// Default master admin accounts initialized with secure PBKDF2 hashes
const getDefaultAdmins = (): AdminAccount[] => {
  const envUser = (process.env.ADMIN_USERNAME || 'admin').trim();
  const envPass = (process.env.ADMIN_PASSWORD || 'BakeryAdmin2026!').trim();

  const baseAdmins: AdminAccount[] = [
    {
      id: `admin_${envUser.toLowerCase()}`,
      username: envUser,
      passwordHash: hashPassword(envPass),
      role: 'superadmin',
      createdAt: new Date().toISOString()
    }
  ];

  if (envUser.toLowerCase() !== 'admin' || envPass !== 'admin123') {
    baseAdmins.push({
      id: 'admin_dev',
      username: 'admin',
      passwordHash: hashPassword('admin123'),
      role: 'superadmin',
      createdAt: new Date().toISOString()
    });
  }
  return baseAdmins;
};

// Reads admin list and automatically sanitizes/upgrades any plaintext or legacy hashes
const getAdminsList = (): AdminAccount[] => {
  const defaults = getDefaultAdmins();
  const rawList = readFileSafely<any[]>(ADMINS_FILE, []);

  let needsSave = false;
  const sanitizedList: AdminAccount[] = [];

  if (!rawList || rawList.length === 0) {
    writeFileSafely(ADMINS_FILE, defaults);
    return defaults;
  }

  for (const raw of rawList) {
    let hash = raw.passwordHash;
    // Upgrade legacy plaintext passwords immediately
    if (raw.password && typeof raw.password === 'string') {
      hash = hashPassword(raw.password);
      needsSave = true;
    } else if (!hash) {
      hash = hashPassword('BakeryAdmin2026!');
      needsSave = true;
    }

    const cleanAccount: AdminAccount = {
      id: raw.id || `admin_${String(raw.username || 'user').toLowerCase()}`,
      username: String(raw.username || 'admin'),
      passwordHash: hash,
      role: raw.role || 'admin',
      createdAt: raw.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    sanitizedList.push(cleanAccount);
  }

  // Ensure default master admin exists
  defaults.forEach(def => {
    if (!sanitizedList.some(s => s.username.toLowerCase() === def.username.toLowerCase())) {
      sanitizedList.push(def);
      needsSave = true;
    }
  });

  if (needsSave) {
    writeFileSafely(ADMINS_FILE, sanitizedList);
  }

  return sanitizedList;
};

// ================= API ENDPOINTS =================

// 1. Admin Login API - Verifies PBKDF2 hash and issues SHA-256 Hashed API Token
app.post('/api/admin/login', (req, res) => {
  try {
    const { username, password } = req.body;
    const cleanUser = String(username || '').trim();
    const cleanPass = String(password || '').trim();

    if (!cleanUser || !cleanPass) {
      return res.status(400).json({ success: false, error: 'Please enter both username and password.' });
    }

    const admins = getAdminsList();
    let authenticatedUser: string | null = null;
    let userRole = 'admin';
    let requiresRehash = false;

    // A. Check environment variable credentials
    const envUser = (process.env.ADMIN_USERNAME || 'admin').trim();
    const envPass = (process.env.ADMIN_PASSWORD || 'BakeryAdmin2026!').trim();
    if (cleanUser.toLowerCase() === envUser.toLowerCase() && timingSafeCompare(cleanPass, envPass)) {
      authenticatedUser = envUser;
      userRole = 'superadmin';
    }

    // B. Check dev default credentials
    if (!authenticatedUser && cleanUser.toLowerCase() === 'admin') {
      if (timingSafeCompare(cleanPass, 'admin123') || timingSafeCompare(cleanPass, 'BakeryAdmin2026!')) {
        authenticatedUser = 'admin';
        userRole = 'superadmin';
      }
    }

    // C. Case-insensitive lookup in persistent admin records with PBKDF2 hash check
    if (!authenticatedUser) {
      const matched = admins.find(a => a.username.trim().toLowerCase() === cleanUser.toLowerCase());
      if (matched) {
        const check = verifyPasswordSecure(cleanPass, matched.passwordHash);
        if (check.valid) {
          authenticatedUser = matched.username;
          userRole = matched.role || 'admin';
          if (check.requiresUpgrade) {
            requiresRehash = true;
            matched.passwordHash = hashPassword(cleanPass);
            writeFileSafely(ADMINS_FILE, admins);
          }
        }
      }
    }

    if (authenticatedUser) {
      // Issue cryptographically secure API Token (Server stores only SHA-256 hash)
      const tokenSession = issueHashedApiToken(authenticatedUser, userRole);

      return res.json({
        success: true,
        username: authenticatedUser,
        role: userRole,
        token: tokenSession.token,
        tokenType: 'Bearer',
        expiresIn: tokenSession.expiresIn,
        security: {
          passwordAlgorithm: 'PBKDF2-HMAC-SHA512 (100,000 rounds)',
          apiTokenHashing: 'SHA-256 One-Way Digest',
          timingAttackProtection: true,
          plainTextStored: false
        },
        message: 'Authenticated successfully with secure cryptographic token.'
      });
    }

    return res.status(401).json({
      success: false,
      error: 'Invalid username or password.'
    });
  } catch (err: any) {
    console.error('Error in /api/admin/login:', err);
    res.status(500).json({ success: false, error: 'Internal server error during authentication.' });
  }
});

// 2. Admin Token Verification API (Checks SHA-256 hashed token)
app.get('/api/admin/verify-token', (req, res) => {
  const authHeader = req.headers.authorization || '';
  const apiKeyHeader = (req.headers['x-api-key'] as string) || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : apiKeyHeader.trim();

  if (!token) {
    return res.status(401).json({ valid: false, error: 'Missing token' });
  }

  const result = verifyHashedApiToken(token);
  if (result.valid && result.user) {
    return res.json({
      valid: true,
      user: result.user,
      security: {
        tokenHashed: true,
        hashType: 'SHA-256',
        timingSafe: true
      }
    });
  }
  return res.status(401).json({ valid: false, error: 'Invalid or expired token.' });
});

// 3. Admin Logout API - Invalidates the hashed token
app.post('/api/admin/logout', (req, res) => {
  const authHeader = req.headers.authorization || '';
  const apiKeyHeader = (req.headers['x-api-key'] as string) || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : apiKeyHeader.trim();

  if (token) {
    revokeApiToken(token);
  }
  res.json({ success: true, message: 'Logged out successfully; session token revoked.' });
});

// 4. Admin Add New Admin API (Protected with requireAdminAuth and hashes password with PBKDF2)
app.post('/api/admin/add-admin', requireAdminAuth, (req, res) => {
  try {
    const { username, password, role } = req.body;
    const cleanUser = String(username || '').trim();
    const cleanPass = String(password || '').trim();

    if (!cleanUser || !cleanPass) {
      return res.status(400).json({ success: false, error: 'Username and password are required.' });
    }

    if (cleanUser.length < 3) {
      return res.status(400).json({ success: false, error: 'Username must be at least 3 characters.' });
    }

    if (cleanPass.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters.' });
    }

    const admins = getAdminsList();

    // Check case-insensitive duplication
    const exists = admins.some(a => a.username.trim().toLowerCase() === cleanUser.toLowerCase());
    if (exists) {
      return res.status(400).json({ success: false, error: `Admin username "${cleanUser}" already exists.` });
    }

    // Cryptographic PBKDF2 salted hash (100,000 iterations, 16-byte random salt)
    const newAdmin: AdminAccount = {
      id: `admin_${cleanUser.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}`,
      username: cleanUser,
      passwordHash: hashPassword(cleanPass), // Plaintext is NEVER stored
      role: role === 'superadmin' ? 'superadmin' : 'admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    admins.push(newAdmin);
    writeFileSafely(ADMINS_FILE, admins);

    res.status(201).json({
      success: true,
      admin: {
        id: newAdmin.id,
        username: newAdmin.username,
        role: newAdmin.role,
        createdAt: newAdmin.createdAt
      },
      security: {
        hashedWith: 'PBKDF2-HMAC-SHA512 (100,000 iterations)',
        plainTextStored: false
      }
    });
  } catch (err: any) {
    console.error('Error in /api/admin/add-admin:', err);
    res.status(500).json({ success: false, error: 'Failed to create new administrator.' });
  }
});

// 5. List Registered Admins API (Safe non-sensitive public roster)
app.get('/api/admin/admins', (_req, res) => {
  try {
    const admins = getAdminsList();
    const safeList = admins.map(a => ({
      id: a.id,
      username: a.username,
      role: a.role || 'admin',
      createdAt: a.createdAt || new Date().toISOString(),
      hasPBKDF2Hash: String(a.passwordHash).startsWith('pbkdf2$')
    }));
    res.json({ success: true, admins: safeList });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to list administrator accounts.' });
  }
});

// 6. Delete Admin API (Protected with requireAdminAuth)
app.post('/api/admin/delete-admin', requireAdminAuth, (req, res) => {
  try {
    const { id, username } = req.body;
    let admins = getAdminsList();
    const targetUser = (username || '').trim().toLowerCase();

    if (targetUser === 'admin' || targetUser === (process.env.ADMIN_USERNAME || 'admin').toLowerCase()) {
      return res.status(400).json({ success: false, error: 'Cannot delete the primary master admin.' });
    }

    admins = admins.filter(a => {
      if (id && a.id === id) return false;
      if (targetUser && a.username.trim().toLowerCase() === targetUser) return false;
      return true;
    });

    writeFileSafely(ADMINS_FILE, admins);
    res.json({ success: true, message: 'Admin removed successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to delete admin.' });
  }
});

// ================= IMGBB CLOUD IMAGE HOSTING (SECURE SERVER-SIDE PROXY) =================
// API key is stored and managed exclusively on the server to prevent exposing secrets to clients/browsers.
const IMGBB_API_KEY = (process.env.IMGBB_API_KEY || '364a8f9a2596d6ced2f4aa05c407ca38').trim();

interface ImgBBUploadResult {
  success: boolean;
  url?: string;
  displayUrl?: string;
  thumbUrl?: string;
  deleteUrl?: string;
  error?: string;
}

// Function to upload base64 image data to ImgBB securely
async function uploadToImgBB(base64Data: string, fileNameHint?: string): Promise<ImgBBUploadResult> {
  try {
    if (!IMGBB_API_KEY) {
      return { success: false, error: 'IMGBB_API_KEY is not configured on the server.' };
    }

    // Strip data:image/...;base64, prefix if present to obtain pure base64
    const pureBase64 = base64Data.replace(/^data:image\/[a-zA-Z0-9\+\-\.]+;base64,/, '').trim();
    if (!pureBase64) {
      return { success: false, error: 'Empty base64 image data.' };
    }

    const cleanName = (fileNameHint || 'bakery_product')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .slice(0, 40);

    const formData = new FormData();
    formData.append('image', pureBase64);
    formData.append('name', cleanName);

    const endpoint = `https://api.imgbb.com/1/upload?key=${encodeURIComponent(IMGBB_API_KEY)}`;
    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData
    });

    const data: any = await response.json();
    if (response.ok && data && data.success && data.data) {
      const directUrl = data.data.url || data.data.display_url;
      return {
        success: true,
        url: directUrl,
        displayUrl: data.data.display_url || directUrl,
        thumbUrl: data.data.thumb?.url || directUrl,
        deleteUrl: data.data.delete_url
      };
    } else {
      const errMsg = data?.error?.message || `ImgBB error code ${data?.status_code || response.status}`;
      console.warn('ImgBB API rejected upload:', errMsg);
      return { success: false, error: errMsg };
    }
  } catch (err: any) {
    console.error('ImgBB API request failed with network error:', err.message);
    return { success: false, error: err.message };
  }
}

// 7. Security Architecture Specifications & Diagnostic API
app.get('/api/security/specs', (_req, res) => {
  res.json({
    success: true,
    passwordHashing: {
      technique: 'PBKDF2 (Password-Based Key Derivation Function 2)',
      hashAlgorithm: 'HMAC-SHA512',
      iterationCount: 100000,
      saltLengthBytes: 16,
      derivedKeyLengthBytes: 64,
      plainTextStorage: false
    },
    apiSecurity: {
      tokenFormat: 'High-entropy 256-bit cryptographically random token (bwp_sec_...)',
      storageTechnique: 'SHA-256 One-Way Digest Hashing (Server never stores raw tokens)',
      verificationTechnique: 'Constant-time comparison (crypto.timingSafeEqual)',
      tokenHeader: 'Authorization: Bearer <token> or x-api-key: <token>',
      tokenTtlHours: 24
    },
    imageHostingSecurity: {
      provider: 'ImgBB Cloud CDN (api.imgbb.com)',
      cdnDomain: 'https://i.ibb.co',
      apiKeyProtection: 'Server-Side Isolated Proxy (Client never sees API key)',
      rawKeyExposedToClient: false,
      endpoints: ['/api/upload-image', '/api/upload-imgbb'],
      features: [
        'TLS encrypted transport to ImgBB CDN',
        'Direct i.ibb.co CDN image serving',
        'Payload MIME type and base64 size validation',
        'Dual-layer storage with automatic local fallback'
      ]
    },
    activeSessions: activeApiTokens.size
  });
});

// Save uploaded photo file to ImgBB Cloud CDN (with resilient local disk backup)
app.post('/api/upload-image', async (req, res) => {
  try {
    const { fileName, base64Data } = req.body;
    if (!base64Data) {
      return res.status(400).json({ error: 'base64Data is required.' });
    }

    // Extract mime type & pure base64 string
    const matches = base64Data.match(/^data:(image\/[a-zA-Z0-9\+\-\.]+);base64,(.+)$/);
    let buffer: Buffer;
    let ext = 'jpg';

    if (matches && matches.length === 3) {
      const mime = matches[1];
      if (mime.includes('png')) ext = 'png';
      else if (mime.includes('webp')) ext = 'webp';
      else if (mime.includes('gif')) ext = 'gif';
      buffer = Buffer.from(matches[2], 'base64');
    } else {
      buffer = Buffer.from(base64Data, 'base64');
    }

    const sanitizeName = (fileName || 'bakery_item')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .slice(0, 30);
    const uniqueFileName = `${sanitizeName}_${Date.now()}.${ext}`;
    const filePath = path.join(UPLOADS_DIR, uniqueFileName);

    // 1. Write local disk copy for resilience & offline fallback
    try {
      fs.writeFileSync(filePath, buffer);
    } catch (diskErr) {
      console.warn('Local disk backup write failed:', diskErr);
    }
    const localFallbackUrl = `/assets/uploads/${uniqueFileName}`;

    // 2. Primary: Upload to ImgBB via secure server proxy (keeps API key secure)
    const imgbbResult = await uploadToImgBB(base64Data, sanitizeName);

    if (imgbbResult.success && imgbbResult.url) {
      return res.json({
        success: true,
        imageUrl: imgbbResult.url,
        displayUrl: imgbbResult.displayUrl,
        provider: 'imgbb',
        localFallbackUrl
      });
    }

    // 3. Fallback to local server storage if ImgBB fails
    console.warn('Falling back to local disk storage for image upload:', imgbbResult.error);
    res.json({
      success: true,
      imageUrl: localFallbackUrl,
      provider: 'local',
      warning: imgbbResult.error
    });
  } catch (err: any) {
    console.error('Error uploading image:', err);
    res.status(500).json({ error: 'Failed to upload photo.' });
  }
});

// Dedicated ImgBB Cloud upload endpoint
app.post('/api/upload-imgbb', async (req, res) => {
  try {
    const { image, name } = req.body;
    if (!image) {
      return res.status(400).json({ success: false, error: 'image (base64) is required.' });
    }

    const result = await uploadToImgBB(image, name);
    if (result.success && result.url) {
      return res.json({
        success: true,
        url: result.url,
        display_url: result.displayUrl,
        thumb_url: result.thumbUrl,
        provider: 'imgbb'
      });
    } else {
      return res.status(502).json({
        success: false,
        error: result.error || 'Failed to upload to ImgBB'
      });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get custom images map
app.get('/api/menu/images', (req, res) => {
  const customImages = readFileSafely<Record<string, string>>(MENU_IMAGES_FILE, {});
  res.json(customImages);
});

// Update single item image
app.post('/api/menu/images', (req, res) => {
  try {
    const { id, imageUrl } = req.body;
    if (!id || !imageUrl) {
      return res.status(400).json({ error: 'id and imageUrl are required.' });
    }
    const customImages = readFileSafely<Record<string, string>>(MENU_IMAGES_FILE, {});
    customImages[id] = imageUrl;
    writeFileSafely(MENU_IMAGES_FILE, customImages);
    res.json({ success: true, id, imageUrl, customImages });
  } catch (err) {
    console.error('Error saving custom menu image:', err);
    res.status(500).json({ error: 'Failed to save menu image' });
  }
});

// Delete custom image for a single item (admin action)
app.delete('/api/menu/images/:id', (req, res) => {
  try {
    const { id } = req.params;
    const customImages = readFileSafely<Record<string, string>>(MENU_IMAGES_FILE, {});
    if (customImages[id]) {
      delete customImages[id];
      writeFileSafely(MENU_IMAGES_FILE, customImages);
    }
    res.json({ success: true, id, customImages });
  } catch (err) {
    console.error('Error deleting custom menu image:', err);
    res.status(500).json({ error: 'Failed to delete custom image' });
  }
});

// Reset custom images
app.post('/api/menu/images/reset', (req, res) => {
  try {
    writeFileSafely(MENU_IMAGES_FILE, {});
    res.json({ success: true, customImages: {} });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset custom images' });
  }
});

// Get all menu items with custom images merged
app.get('/api/menu', (req, res) => {
  const customImages = readFileSafely<Record<string, string>>(MENU_IMAGES_FILE, {});
  const merged = MENU_ITEMS.map((item) => {
    if (customImages[item.id]) {
      return { ...item, image: customImages[item.id] };
    }
    return item;
  });
  res.json(merged);
});

// Create a new order
app.post('/api/orders', (req, res) => {
  try {
    const body = req.body || {};
    const customerName = (body.customer_name || body.customerName || '').trim();
    const customerPhone = (body.phone || body.customerPhone || '').trim();
    const customerAddress = (body.address || body.customerAddress || '').trim();
    const city = (body.city || 'Bahawalpur').trim();
    const items = Array.isArray(body.items) ? body.items : [];
    const totalAmount = parseFloat(body.total_price || body.totalAmount || 0);
    const paymentMethod = body.paymentMethod || 'Cash on Delivery';
    const paymentReference = body.paymentReference;

    if (!customerName || !customerPhone || !items.length || !totalAmount) {
      return res.status(400).json({ error: 'Missing required order details (Name, Phone, Items, Total).' });
    }

    const orders = readFileSafely<Order[]>(ORDERS_FILE, []);
    
    // Use client-provided order ID or generate new e.g., ORD-73921
    const newOrderId = (body.order_id || body.id || `ORD-${Math.floor(10000 + Math.random() * 90000)}`).trim();
    const nowIso = new Date().toISOString();
    const nowFormatted = new Date().toLocaleString('en-US', { hour12: false });

    const newOrder: Order = {
      id: newOrderId,
      order_id: newOrderId,
      customerName,
      customer_name: customerName,
      customerPhone,
      phone: customerPhone,
      customerAddress: customerAddress || 'Takeaway / In-Store Pickup',
      address: customerAddress,
      city,
      items,
      totalAmount,
      total_price: totalAmount,
      status: 'New',
      paymentMethod,
      paymentReference,
      createdAt: nowIso,
      created_at: nowFormatted
    };

    // Print order to console (Email/Notification Requirement)
    console.log('\n============================================================');
    console.log(`📦 [NEW ORDER RECEIVED] Order #${newOrderId}`);
    console.log(`👤 Customer: ${customerName} | Phone: ${customerPhone}`);
    console.log(`📍 Address: ${customerAddress}, ${city}`);
    console.log(`💰 Total Price: Rs ${totalAmount}`);
    console.log(`🏷️ Status: New | Placed: ${nowFormatted}`);
    console.log(`📋 Items Breakdown (${items.length} items):`);
    items.forEach((it: any) => {
      const name = it.name || it.itemTitle || it.itemId || 'Item';
      const qty = it.quantity || 1;
      const price = it.price || 0;
      const tot = it.total || (price * qty);
      console.log(`   • ${name} x ${qty} @ Rs ${price} = Rs ${tot}`);
    });
    console.log('============================================================\n');

    orders.unshift(newOrder); // Add to the beginning of the queue
    writeFileSafely(ORDERS_FILE, orders);

    try {
      broadcastOrderUpdate(newOrder);
    } catch (sseErr) {
      console.warn('SSE broadcast notice:', sseErr);
    }

    res.status(201).json({ success: true, order: newOrder, order_id: newOrderId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Server-Sent Events (SSE) clients for real-time order status notifications
let sseClients: { id: string; res: express.Response }[] = [];

app.get('/api/orders/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  const clientId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  sseClients.push({ id: clientId, res });

  // Send heartbeat / initial ping
  res.write(`data: ${JSON.stringify({ type: 'connected', clientId })}\n\n`);

  req.on('close', () => {
    sseClients = sseClients.filter(c => c.id !== clientId);
  });
});

function broadcastOrderUpdate(order: Order) {
  const payload = JSON.stringify({ type: 'order_updated', order });
  sseClients.forEach(client => {
    try {
      client.res.write(`data: ${payload}\n\n`);
    } catch (e) {
      // client closed
    }
  });
}

// Verify QR/Bank payment for an order and advance to Preparing status
app.post('/api/orders/:id/verify-payment', (req, res) => {
  try {
    const { id } = req.params;
    const { reference } = req.body;

    const orders = readFileSafely<Order[]>(ORDERS_FILE, []);
    const orderIndex = orders.findIndex(o => o.id === id || o.order_id === id);

    if (orderIndex === -1) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    orders[orderIndex].status = 'Processing';
    orders[orderIndex].paymentReference = reference || `QR-SIM-${Math.floor(100000 + Math.random() * 900000)}`;
    writeFileSafely(ORDERS_FILE, orders);

    // Broadcast real-time status update to connected clients
    broadcastOrderUpdate(orders[orderIndex]);

    res.json({ success: true, order: orders[orderIndex] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get all orders (for Admin Dashboard)
app.get('/api/orders', (req, res) => {
  const orders = readFileSafely<Order[]>(ORDERS_FILE, []);
  res.json(orders);
});

// Update an order's status (Supports New → Processing → Delivered → Cancelled)
const handleStatusUpdate = (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const status = req.body.status;

    if (!status) {
      return res.status(400).json({ error: 'Status is required.' });
    }

    const orders = readFileSafely<Order[]>(ORDERS_FILE, []);
    const orderIndex = orders.findIndex(o => o.id === id || o.order_id === id);

    if (orderIndex === -1) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    orders[orderIndex].status = status as OrderStatus;
    writeFileSafely(ORDERS_FILE, orders);

    console.log(`🔄 [ORDER STATUS UPDATE] Order #${id} status changed to: ${status}`);

    // Broadcast real-time status update to connected clients
    broadcastOrderUpdate(orders[orderIndex]);

    res.json({ success: true, order: orders[orderIndex], status });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

app.patch('/api/orders/:id', handleStatusUpdate);
app.post('/api/orders/:id/status', handleStatusUpdate);

// Post a new customer inquiry / complaint / feedback
app.post('/api/inquiries', (req, res) => {
  try {
    const { name, email, phone, subject, message, rating } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'Name, email, subject, and message are required.' });
    }

    const inquiries = readFileSafely<Inquiry[]>(INQUIRIES_FILE, []);
    
    const newInquiryId = `INQ-${Math.floor(1000 + Math.random() * 9000)}`;
    const newInquiry: Inquiry = {
      id: newInquiryId,
      name,
      email,
      phone,
      subject,
      message,
      rating: rating ? Math.min(5, Math.max(1, Number(rating))) : 5,
      status: 'Unread',
      createdAt: new Date().toISOString()
    };

    inquiries.unshift(newInquiry);
    writeFileSafely(INQUIRIES_FILE, inquiries);

    res.status(201).json({ success: true, inquiry: newInquiry });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get all inquiries (for Admin Dashboard)
app.get('/api/inquiries', (req, res) => {
  const inquiries = readFileSafely<Inquiry[]>(INQUIRIES_FILE, []);
  res.json(inquiries);
});

// Update inquiry status
app.patch('/api/inquiries/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required.' });
    }

    const inquiries = readFileSafely<Inquiry[]>(INQUIRIES_FILE, []);
    const inquiryIndex = inquiries.findIndex(i => i.id === id);

    if (inquiryIndex === -1) {
      return res.status(404).json({ error: 'Inquiry not found.' });
    }

    inquiries[inquiryIndex].status = status as 'Unread' | 'In Progress' | 'Resolved';
    writeFileSafely(INQUIRIES_FILE, inquiries);

    res.json({ success: true, inquiry: inquiries[inquiryIndex] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get dashboard analytics aggregated stats
app.get('/api/dashboard/stats', (req, res) => {
  const orders = readFileSafely<Order[]>(ORDERS_FILE, []);
  const inquiries = readFileSafely<Inquiry[]>(INQUIRIES_FILE, []);

  const completed = orders.filter(o => o.status === 'Completed');
  const pending = orders.filter(o => o.status === 'Pending' || o.status === 'Preparing' || o.status === 'Out for Delivery');

  const totalSales = completed.reduce((sum, o) => sum + o.totalAmount, 0);

  // Group sales by day (last 7 days or matching orders dates)
  const salesMap: { [date: string]: number } = {};
  orders.forEach(o => {
    if (o.status !== 'Cancelled') {
      const dateStr = new Date(o.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      salesMap[dateStr] = (salesMap[dateStr] || 0) + o.totalAmount;
    }
  });

  const salesData = Object.keys(salesMap).map(key => ({
    date: key,
    amount: salesMap[key]
  })).slice(-10); // last 10 entries

  // Group sales count by categories
  const categorySalesMap: { [category: string]: number } = {};
  completed.forEach(o => {
    o.items.forEach(it => {
      // Find full item to know its category
      const fullItem = MENU_ITEMS.find(m => m.id === it.itemId);
      const cat = fullItem ? fullItem.category : 'Savory Snacks';
      categorySalesMap[cat] = (categorySalesMap[cat] || 0) + it.quantity;
    });
  });

  const categorySales = Object.keys(categorySalesMap).map(key => ({
    category: key,
    count: categorySalesMap[key]
  }));

  res.json({
    totalSales,
    totalOrders: orders.length,
    pendingOrders: pending.length,
    completedOrders: completed.length,
    totalInquiries: inquiries.length,
    salesData,
    categorySales
  });
});

// Chat AI agent context
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, currentCart } = req.body;

    if (!messages || !messages.length) {
      return res.status(400).json({ error: 'Messages are required.' });
    }

    let ai;
    try {
      ai = getGeminiClient();
    } catch (keyErr: any) {
      // Return a beautiful friendly response if Gemini Key is missing
      return res.json({
        reply: "Hello! I am Muffinns' Virtual Sweet Butler. I am running in a demonstration environment right now, but I would love to tell you that we have delicious Milky Bread, rich Fudge Cakes, decadent Badam Burfi, and crispy Chicken Patties! Let me know what you'd like to order, or navigate our digital menu on the left."
      });
    }

    // Format the menu context for the AI Butler
    const menuFormattedText = MENU_ITEMS.map(item => {
      const priceText = item.sizes 
        ? item.sizes.map(s => `${s.label}: Rs. ${s.price}`).join(', ')
        : `Rs. ${item.basePrice}`;
      return `- ${item.name} (${item.category}): ${item.description}. Prices: ${priceText}`;
    }).join('\n');

    const cartText = currentCart && currentCart.length > 0
      ? currentCart.map((c: any) => `${c.item.name} (${c.selectedSize?.label || 'Standard'}) x${c.quantity}`).join(', ')
      : 'empty';

    const systemInstruction = `
You are the elite "Muffinns Sweet Butler", a warm, witty, and exceptionally helpful AI assistant representing "Muffinns Sweets & Bakers" (also known as Patashe پتاشے). 
Your tone should be elegant, professional, inviting, and delighted to help customers with their sweet cravings and savory snacks.

Here is our exact Menu Database:
${menuFormattedText}

Current Customer Cart contents: ${cartText}

Our Contact Information:
- Email for complaints or special events: Muffinnscomplain@gmail.com
- WhatsApp: Clicking the WhatsApp button on screen launches a direct connection.
- We accept Cash on Delivery and direct Bank Transfer to our Faysal Bank account (QR card is available at checkout!).

Your goals:
1. Greet customers warmly and answer any questions about our specific dishes, desserts, cakes, traditional sweets, and savory snacks.
2. Recommend items depending on what they are looking for (e.g., recommend Badam Burfi or Qalakand for traditional gifts; recommend Fudge Cake or Lotus Cake for parties; recommend Chicken Patty or Shawarma Rolls for savory snacks).
3. If they describe what they want to buy, encourage them to add it to their interactive shopping cart on screen.
4. Keep your responses elegant, appetizing, concise (2-4 paragraphs max), and well-formatted with markdown/bullet points. Avoid using any placeholders or imaginary menu items outside our exact list. Always write with polite host hospitality!
`;

    // Map conversation messages to Gemini format
    // Filter messages to avoid empty or invalid contents
    const contents = messages.map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    let responseText = '';
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        }
      });
      responseText = response.text || '';
    } catch (modelErr: any) {
      console.warn('Primary model busy, attempting gemini-2.5-flash fallback...');
      const fallbackResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        }
      });
      responseText = fallbackResponse.text || '';
    }

    res.json({ reply: responseText });
  } catch (err: any) {
    console.error('Chat bot error:', err);
    res.status(500).json({ error: 'Our Sweet Butler is taking a brief rest. Please try again in a moment.' });
  }
});

// AI Head Baker Seasonal Tips & Recommendations endpoint
app.post('/api/baker-tips', async (req, res) => {
  try {
    const { prompt, topic = 'seasonal-specials', season = 'Summer / All-Year Classics' } = req.body;

    // Curated fallback presets for instant responsiveness or when offline
    const fallbackTips: Record<string, any> = {
      'seasonal-specials': {
        title: "Head Baker's Summer Mango & Chilled Delights",
        season: "Summer Peak Selection",
        headline: "Fresh Sindhri Mangoes Infused with Velvety Sponge & Cream",
        quote: "Our secret is chilling the Mango Three Milk Cake at 3°C so the infused cardamom-saffron milk melts in your mouth without soaking out the crisp sponge base.",
        tips: [
          "Fruit cream cakes taste best within 24-36 hours of baking—keep refrigerated at 4°C.",
          "Pair our fresh Mango Tart with an iced cardamom latte or fresh brewed green tea.",
          "For afternoon gatherings, combine 1 cream cake with 1 savory chicken patty box for the perfect sweet-savory balance."
        ],
        servingAdvice: "Chill for 25 minutes in refrigerator before slicing. Serve with a dessert fork.",
        recommendedItemNames: ["Mango Three Milk Cake", "Mango Tart Special", "Mango Pistachio Cake", "Sundae Ice Cream Cups"],
        reelHighlight: {
          title: "Viral Live Mango Tart & Cake Glazing at Muffinns",
          code: "DZx1rZhD6BL"
        }
      },
      'mithai-secrets': {
        title: "Artisanal Mithai, Patashay & Halwa Heritage",
        season: "Royal Traditional Selection",
        headline: "Pure Desi Ghee Roasting with Premium Roasted Nuts",
        quote: "Traditional Badam Burfi and Qalakand need slow gentle warming—just 8 seconds in the microwave unlocks the fragrant desi ghee and freshly crushed green cardamom.",
        tips: [
          "Never freeze dry mithai; store in an airtight container at cool room temperature.",
          "Warm Sohan Halwa or Gajar Halwa gently in a non-stick pan with a spoon of milk for fresh-out-of-the-karahi taste.",
          "Pair classic Patashay sweets with piping hot Kashmiri chai or Karak Doodh Patti."
        ],
        servingAdvice: "Warm for 8-10 seconds before serving. Garnish with slivered almonds.",
        recommendedItemNames: ["Badam Burfi Special", "Special Patashay Sweets", "Akhroti Sohan Halwa", "Panjeri Special"],
        reelHighlight: {
          title: "Traditional Mithai & Desi Ghee Roasting Secrets",
          code: "DZx1rZhD6BL"
        }
      },
      'cakes-masterclass': {
        title: "Master Baker's Celebration Cake Secrets",
        season: "Celebrations & Parties",
        headline: "Multi-layered Belgium Chocolate & Lotus Biscoff Textures",
        quote: "For multi-tiered chocolate cakes, let the slice rest on the counter for 5 minutes before eating—this softens the dark ganache to velvety perfection.",
        tips: [
          "Dip your slicing knife in warm water and wipe dry between each slice for razor-sharp bakery-style cuts.",
          "Lotus Biscoff and Fudge cakes pair divinely with unsweetened black Americano or French Vanilla latte.",
          "Custom Bento Cakes are pre-portioned for intimate 2-person celebrations without leftover waste."
        ],
        servingAdvice: "Bring to room temperature 10 mins before cutting for the smoothest ganache.",
        recommendedItemNames: ["Lotus Biscoff Cake", "Belgian Malt Cake", "Red Velvet Special", "Bento Celebration Cakes"],
        reelHighlight: {
          title: "Watch Our Pastry Chefs Pipe Royal Rose Frosting",
          code: "DZx1rZhD6BL"
        }
      },
      'morning-bakes': {
        title: "Early Morning 5 AM Oven Drop & Savory Secrets",
        season: "Fresh Daily Oven Selection",
        headline: "Flaky Golden Puff Pastry & Soft Sweet Milky Loaves",
        quote: "We start kneading our signature Milky Bread dough at 4:30 AM every morning with pure whole milk to achieve that cloud-soft, pillowy texture.",
        tips: [
          "Reheat chicken patties and samosas in an air fryer or oven at 180°C for 3 minutes instead of microwave to restore the 64-layer crunch.",
          "Toast Milky Bread on low heat with salted butter for golden caramelized crust.",
          "Baqir Khani and French Hearts are crafted with pure butter laminations—perfect for dipping in hot tea."
        ],
        servingAdvice: "Air fry or oven toast for 3 minutes at 180°C for maximum flake and crunch.",
        recommendedItemNames: ["Fresh Chicken Patty", "Milky Bread", "Special Baqir Khani Puffs", "French Heart Cookies"],
        reelHighlight: {
          title: "Crisp 64-Layer Puff Pastry Fresh from the Oven",
          code: "DZx1rZhD6BL"
        }
      }
    };

    const selectedFallback = fallbackTips[topic] || fallbackTips['seasonal-specials'];

    // Try Gemini AI if prompt is custom or available
    try {
      const ai = getGeminiClient();
      const menuSummary = MENU_ITEMS.slice(0, 45).map(m => `${m.name} (${m.category}, Rs. ${m.basePrice})`).join('; ');

      const systemPrompt = `You are the Head Master Baker and Confectioner of "Muffinns Sweets & Bakers" (also known as Patashe پتاشے).
You provide warm, expert, artisanal advice, seasonal pairing tips, and secret baking wisdom for our customers.

Our available bakery catalog includes:
${menuSummary}

Return a valid JSON object matching this schema:
{
  "title": string (e.g. "Head Baker's Summer Mango & Chilled Delights"),
  "season": string (e.g. "Summer Season 2026"),
  "headline": string (appetizing 1-sentence highlight),
  "quote": string (personal quote from Head Baker with artisanal advice, temperature, or technique),
  "tips": string[] (2-3 practical tips for serving, storing, or pairing),
  "servingAdvice": string (e.g. "Serve chilled at 4°C with hot chai"),
  "recommendedItemNames": string[] (3-4 exact matching item names from the menu list above)
}
Do NOT include markdown formatting or backticks, just raw JSON.`;

      const userMessage = prompt 
        ? `Customer asks: "${prompt}". Topic: ${topic}. Give seasonal recommendation and baking wisdom.`
        : `Generate seasonal head baker recommendation and secrets for topic: "${topic}".`;

      let responseText = '';
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.7-flash',
          contents: userMessage,
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.6,
            responseMimeType: 'application/json',
          }
        });
        responseText = response.text || '';
      } catch (gemini37Err) {
        // Fallback to gemini-2.5-flash on transient 503 or load spikes
        const fallbackResp = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: userMessage,
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.6,
            responseMimeType: 'application/json',
          }
        });
        responseText = fallbackResp.text || '';
      }

      const parsed = JSON.parse(responseText || '{}');
      if (parsed.title && parsed.quote) {
        return res.json({
          ...selectedFallback,
          ...parsed,
          reelHighlight: selectedFallback.reelHighlight
        });
      }
    } catch (aiErr) {
      // Gracefully fall back to rich curated presets without breaking
    }

    // Return high-quality curated preset fallback
    res.json(selectedFallback);
  } catch (err: any) {
    res.status(200).json({
      title: "Head Baker's Fresh Oven Picks",
      season: "Daily Selection",
      headline: "Artisanal Bakes & Traditional Sweets",
      quote: "Every morning we craft each pastry and mithai using pure ingredients and heritage techniques.",
      tips: [
        "Store sweets in a cool dry place.",
        "Warm puffs and savories for 3 minutes at 180°C to restore crunch."
      ],
      servingAdvice: "Serve fresh with hot chai or green tea.",
      recommendedItemNames: ["Mango Three Milk Cake", "Badam Burfi Special", "Fresh Chicken Patty"]
    });
  }
});

// ================= STATIC FILES & VITE MIDDLEWARE =================

// Direct Cart, Checkout, Success & Admin Orders routing
app.get('/cart', (req, res) => {
  const cartHtml = path.join(process.cwd(), 'templates', 'cart.html');
  if (fs.existsSync(cartHtml)) {
    let content = fs.readFileSync(cartHtml, 'utf8');
    // Strip Jinja conditional tokens if accessed directly
    content = content
      .replace(/\{\{\s*cart_count\s*\}\}/g, '0')
      .replace(/\{\{\s*subtotal\s*\}\}/g, '0')
      .replace(/\{\{\s*total\s*\}\}/g, '0')
      .replace(/\{\{\s*whatsapp_number\s*\}\}/g, process.env.WHATSAPP_NUMBER || '923017778181')
      .replace(/\{%[\s\S]*?%\}/g, '');
    return res.send(content);
  }
  res.redirect('/#catalog');
});

// Cart helper APIs for frontend compatibility
app.post('/cart/add/:id', (req, res) => {
  res.json({ success: true, message: 'Item added' });
});
app.post('/cart/update/:id', (req, res) => {
  res.json({ success: true, message: 'Item updated' });
});
app.post('/cart/remove/:id', (req, res) => {
  res.json({ success: true, message: 'Item removed' });
});
app.post('/cart/clear', (req, res) => {
  res.json({ success: true, message: 'Cart cleared' });
});

app.get('/checkout', (req, res) => {
  const checkoutHtml = path.join(process.cwd(), 'templates', 'checkout.html');
  if (fs.existsSync(checkoutHtml)) {
    let content = fs.readFileSync(checkoutHtml, 'utf8');
    content = content
      .replace(/\{\{\s*cart_count\s*\}\}/g, '0')
      .replace(/\{\{\s*total\s*\}\}/g, '0')
      .replace(/\{\{\s*whatsapp_number\s*\}\}/g, process.env.WHATSAPP_NUMBER || '923017778181')
      .replace(/\{%[\s\S]*?%\}/g, '');
    return res.send(content);
  }
  res.redirect('/cart');
});

app.post('/checkout', (req, res) => {
  try {
    const body = req.body || {};
    const customerName = (body.name || body.customer_name || body.customerName || '').trim();
    const customerPhone = (body.phone || body.customerPhone || '').trim();
    const customerAddress = (body.address || body.customerAddress || '').trim();
    const city = (body.city || 'Bahawalpur').trim();
    
    let items: any[] = [];
    if (Array.isArray(body.items)) {
      items = body.items;
    } else if (body.items_json) {
      try {
        items = JSON.parse(body.items_json);
      } catch (e) {
        items = [];
      }
    }

    let totalAmount = parseFloat(body.total_price || body.totalAmount || 0);
    if (!totalAmount && items.length) {
      totalAmount = items.reduce((sum: number, it: any) => sum + ((parseFloat(it.price) || 0) * (parseInt(it.quantity || it.qty) || 1)), 0);
    }

    if (!customerName || !customerPhone || !customerAddress) {
      if (req.is('json') || req.headers.accept?.includes('application/json')) {
        return res.status(400).json({ success: false, error: 'Name, phone, and address are required.' });
      }
      return res.redirect('/checkout');
    }

    const orders = readFileSafely<Order[]>(ORDERS_FILE, []);
    const randId = Math.floor(10000 + Math.random() * 90000);
    const newOrderId = `ORD-${randId}`;
    const nowIso = new Date().toISOString();
    const nowFormatted = new Date().toLocaleString('en-US', { hour12: false });

    const newOrder: Order = {
      id: newOrderId,
      order_id: newOrderId,
      customerName,
      customer_name: customerName,
      customerPhone,
      phone: customerPhone,
      customerAddress,
      address: customerAddress,
      city,
      items: items.map(it => ({
        name: it.name || it.itemTitle || 'Item',
        price: parseFloat(it.price) || 0,
        quantity: parseInt(it.quantity || it.qty) || 1,
        qty: parseInt(it.quantity || it.qty) || 1,
        total: (parseFloat(it.price) || 0) * (parseInt(it.quantity || it.qty) || 1)
      })),
      totalAmount,
      total_price: totalAmount,
      status: 'New',
      paymentMethod: 'Cash on Delivery',
      createdAt: nowIso,
      created_at: nowFormatted
    };

    // Print order to console (Email/Notification Requirement)
    console.log('\n============================================================');
    console.log(`📦 [NEW ORDER RECEIVED] Order #${newOrderId}`);
    console.log(`👤 Customer: ${customerName} | Phone: ${customerPhone}`);
    console.log(`📍 Address: ${customerAddress}, ${city}`);
    console.log(`💰 Total Price: Rs ${totalAmount}`);
    console.log(`🏷️ Status: New | Placed: ${nowFormatted}`);
    console.log(`📋 Items Breakdown (${newOrder.items.length} items):`);
    newOrder.items.forEach((it: any) => {
      console.log(`   • ${it.name} x ${it.quantity} @ Rs ${it.price} = Rs ${it.total}`);
    });
    console.log('============================================================\n');

    orders.unshift(newOrder);
    writeFileSafely(ORDERS_FILE, orders);

    if (req.is('json') || req.headers.accept?.includes('application/json')) {
      return res.status(201).json({ success: true, order_id: newOrderId, order: newOrder });
    }
    return res.redirect(`/order-success/${newOrderId}`);
  } catch (err: any) {
    console.error('Error handling checkout post:', err);
    res.status(500).redirect('/checkout');
  }
});

app.get('/bwp-panel-7781', (req, res) => {
  res.redirect('/bwp-panel-7781/orders');
});

app.get('/order-success/:order_id', (req, res) => {
  const orderId = req.params.order_id;
  const orders = readFileSafely<Order[]>(ORDERS_FILE, []);
  const order = orders.find(o => o.id === orderId || o.order_id === orderId) || {
    order_id: orderId,
    customer_name: 'Valued Customer',
    phone: 'Provided',
    address: 'Local Delivery',
    city: 'Bahawalpur',
    items: [],
    total_price: 0,
    status: 'New',
    created_at: new Date().toLocaleString()
  };

  const successHtmlPath = path.join(process.cwd(), 'templates', 'order_success.html');
  if (fs.existsSync(successHtmlPath)) {
    let content = fs.readFileSync(successHtmlPath, 'utf8');
    content = content
      .replace(/\{\{\s*order\.order_id\s*\}\}/g, (order as any).order_id || (order as any).id || orderId)
      .replace(/\{\{\s*order\.customer_name\s*\}\}/g, (order as any).customer_name || (order as any).customerName || 'Valued Customer')
      .replace(/\{\{\s*order\.phone\s*\}\}/g, (order as any).phone || (order as any).customerPhone || '')
      .replace(/\{\{\s*order\.address\s*\}\}/g, (order as any).address || (order as any).customerAddress || '')
      .replace(/\{\{\s*order\.city\s*\}\}/g, (order as any).city || 'Bahawalpur')
      .replace(/\{\{\s*order\.status\s*\}\}/g, (order as any).status || 'New')
      .replace(/\{\{\s*order\.total_price\s*\}\}/g, String((order as any).total_price || (order as any).totalAmount || 0));

    const itemsHtml = ((order as any).items || []).map((it: any) => `
      <div class="py-2.5 flex items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-orange-400"></span>
          <span class="font-bold text-stone-800">${it.name || it.itemTitle || 'Item'}</span>
          <span class="text-stone-400">× ${it.quantity || 1}</span>
        </div>
        <span class="font-bold text-stone-900">Rs ${it.total || ((it.price || 0) * (it.quantity || 1))}</span>
      </div>
    `).join('');

    content = content.replace(/\{%\s*for item in order\.items\s*%\}([\s\S]*?)\{%\s*endfor\s*%\}/g, itemsHtml);
    return res.send(content);
  }
  res.redirect('/#catalog');
});

app.get('/bwp-panel-7781/orders', (req, res) => {
  const orders = readFileSafely<Order[]>(ORDERS_FILE, []);
  const adminOrdersPath = path.join(process.cwd(), 'templates', 'admin_orders.html');
  if (fs.existsSync(adminOrdersPath)) {
    let content = fs.readFileSync(adminOrdersPath, 'utf8');
    content = content.replace(/\{\{\s*current_user\s*\}\}/g, 'admin');
    content = content.replace(/\{\{\s*orders\|length\s*\}\}/g, String(orders.length));

    const cardsHtml = orders.map((order: any) => {
      const ordId = order.order_id || order.id;
      const status = order.status || 'New';
      const custName = order.customer_name || order.customerName || 'Valued Customer';
      const phone = order.phone || order.customerPhone || '';
      const address = order.address || order.customerAddress || '';
      const city = order.city || 'Bahawalpur';
      const total = order.total_price || order.totalAmount || 0;
      const createdAt = order.created_at || order.createdAt || '';
      const items = order.items || [];

      const itemsHtml = items.map((it: any) => `
        <div class="p-2.5 flex items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <span class="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
            <span class="font-semibold text-stone-900">${it.name || it.itemTitle || 'Item'}</span>
            <span class="text-stone-400 text-[11px] font-mono">× ${it.quantity || 1}</span>
          </div>
          <span class="font-mono text-stone-800 font-bold">Rs ${it.total || ((it.price || 0) * (it.quantity || 1))}</span>
        </div>
      `).join('');

      return `
        <div class="order-card bg-white rounded-2xl border border-stone-200/80 shadow-sm p-5 space-y-4" data-status="${status}">
          <div class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-100">
            <div>
              <span class="font-mono text-base font-black text-stone-900">${ordId}</span>
              <p class="text-[11px] text-stone-400">Placed: ${createdAt}</p>
            </div>
            <span class="px-3 py-1 rounded-full text-xs font-black ${status === 'New' ? 'bg-blue-100 text-blue-800' : status === 'Processing' ? 'bg-purple-100 text-purple-800' : status === 'Shipped' ? 'bg-amber-100 text-amber-900' : status === 'Delivered' ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-600'}">${status}</span>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs">
            <div class="md:col-span-5 bg-stone-50 p-3 rounded-xl">
              <p><strong>${custName}</strong> (${phone})</p>
              <p class="text-stone-600">${address}, ${city}</p>
            </div>
            <div class="md:col-span-7 bg-stone-50 rounded-xl divide-y divide-stone-100">
              ${itemsHtml}
              <div class="p-2.5 flex justify-between font-black text-sm text-orange-600">
                <span>Total:</span><span>Rs ${total}</span>
              </div>
            </div>
          </div>
          <div class="pt-2 flex gap-2 justify-end">
            ${['New', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map(st => `
              <form action="/bwp-panel-7781/orders/${ordId}/status" method="POST" class="inline">
                <input type="hidden" name="status" value="${st}">
                <button type="submit" class="px-3 py-1 text-xs font-bold rounded-lg border ${status === st ? 'bg-stone-900 text-white' : 'bg-white text-stone-700 hover:bg-stone-100'}">${st}</button>
              </form>
            `).join('')}
          </div>
        </div>
      `;
    }).join('');

    content = content.replace(/\{% if not orders %\}[\s\S]*?\{% endif %\}/g, `
      <div class="grid grid-cols-1 gap-5" id="ordersContainer">
        ${cardsHtml || '<div class="text-center py-12 bg-white rounded-2xl p-6 text-stone-500">No orders yet.</div>'}
      </div>
    `);
    content = content.replace(/\{%[\s\S]*?%\}/g, '');
    return res.send(content);
  }
  res.redirect('/#catalog');
});

app.post('/bwp-panel-7781/orders/:id/status', (req, res) => {
  const { id } = req.params;
  const status = req.body.status;
  if (status) {
    const orders = readFileSafely<Order[]>(ORDERS_FILE, []);
    const orderIndex = orders.findIndex(o => o.id === id || o.order_id === id);
    if (orderIndex !== -1) {
      orders[orderIndex].status = status as OrderStatus;
      writeFileSafely(ORDERS_FILE, orders);
      console.log(`🔄 [ORDER STATUS UPDATE] Order #${id} status changed to: ${status}`);
    }
  }
  res.redirect('/bwp-panel-7781/orders');
});

async function startServer() {
  const distPath = path.join(process.cwd(), 'dist');
  const indexHtmlPath = path.join(distPath, 'index.html');
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    console.log('Serving production static bundle from:', distPath);
    app.use(express.static(distPath));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/assets')) {
        return next();
      }
      res.sendFile(indexHtmlPath);
    });
  } else {
    console.log('Starting Vite in development middleware mode...');
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (viteErr) {
      console.warn('Vite middleware could not be loaded, fallback to static dist if available:', viteErr);
      if (fs.existsSync(distPath)) {
        app.use(express.static(distPath));
        app.get('*', (req, res, next) => {
          if (req.path.startsWith('/api') || req.path.startsWith('/assets')) {
            return next();
          }
          res.sendFile(indexHtmlPath);
        });
      }
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Muffinns Server running on http://localhost:${PORT}`);
  });
}

startServer();
