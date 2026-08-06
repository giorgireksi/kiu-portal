import { app, BrowserWindow, Menu, screen, clipboard, globalShortcut, session, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { exec } from 'child_process';
import axios from 'axios';
import * as CryptoJS from 'crypto-js';
import { Bonjour } from 'bonjour-service';
import express, { Request, Response } from 'express';
import * as http from 'http';

const bonjour = new Bonjour();
const localApp = express();
let localServer: http.Server | null = null;
const desktopBridgeApp = express();
let desktopBridgeServer: http.Server | null = null;
const DESKTOP_BRIDGE_PORT = Number(process.env.KIU_ANTI_CHEAT_BRIDGE_PORT || 47835);
let proctorInfo: any = null;
const TEST_SETTINGS_PATH = path.join(app.getPath('userData'), 'anti-cheat-test-settings.json');
const DESKTOP_SESSION_PATH = path.join(app.getPath('userData'), 'anti-cheat-desktop-session.json');
const LOGIN_PREFS_PATH = path.join(app.getPath('userData'), 'anti-cheat-login-prefs.json');
const RUNTIME_APP_URL_OVERRIDE = String(process.env.KIU_PUBLIC_APP_URL || process.env.KIU_ANTI_CHEAT_APP_URL || '').trim().replace(/\/$/, '');
const RUNTIME_BACKEND_URL_OVERRIDE = String(process.env.KIU_PUBLIC_BACKEND_URL || process.env.KIU_ANTI_CHEAT_BACKEND_URL || '').trim().replace(/\/$/, '');
const RUNTIME_QUIZ_URL_OVERRIDE = String(process.env.KIU_ANTI_CHEAT_QUIZ_URL || '').trim().replace(/\/$/, '');
const DEFAULT_DESKTOP_APP_URL = String(process.env.KIU_PUBLIC_APP_URL || process.env.KIU_ANTI_CHEAT_APP_URL || 'http://127.0.0.1:8876').replace(/\/$/, '');
const DEFAULT_BACKEND_URL = String(process.env.KIU_PUBLIC_BACKEND_URL || process.env.KIU_ANTI_CHEAT_BACKEND_URL || 'http://127.0.0.1:48933').replace(/\/$/, '');
const ALLOW_LOCAL_DEV_HOSTS = !app.isPackaged || /^(development|dev)$/i.test(String(process.env.KIU_ENVIRONMENT || process.env.NODE_ENV || '').trim());
const ENABLE_LOCAL_PROCTOR_DASHBOARD = /^(1|true|yes)$/i.test(String(process.env.KIU_ENABLE_LOCAL_PROCTOR_DASHBOARD || '').trim());

function trimUrl(value: any) {
  return String(value || '').trim().replace(/\/$/, '');
}

function isPlaceholderUrl(value: any) {
  const normalized = trimUrl(value).toLowerCase();
  if (!normalized) return true;
  return normalized.includes('university-lms.com')
    || normalized.includes('lms.youruniversity.edu')
    || normalized.includes('quiz-api.youruniversity.edu');
}

function isLoopbackUrl(value: any) {
  try {
    return ['127.0.0.1', 'localhost'].includes(new URL(String(value || '').trim()).hostname.toLowerCase());
  } catch (error) {
    return false;
  }
}

function isAllowedProtectedBackendUrl(value: any) {
  try {
    const target = new URL(String(value || '').trim());
    const backend = new URL(String(config?.backendUrl || '').trim());
    if (target.username || target.password || backend.username || backend.password) return false;
    const localTarget = ['127.0.0.1', 'localhost'].includes(target.hostname.toLowerCase());
    if (localTarget && ALLOW_LOCAL_DEV_HOSTS && target.protocol === 'http:') return true;
    if (target.origin !== backend.origin) return false;
    if (target.protocol === 'https:') return true;
    return ALLOW_LOCAL_DEV_HOSTS && ['127.0.0.1', 'localhost'].includes(target.hostname.toLowerCase());
  } catch (error) {
    return false;
  }
}

function extractHost(value: any) {
  try {
    return new URL(String(value || '').trim()).hostname.trim().toLowerCase();
  } catch (error) {
    return '';
  }
}

function isAllowedDesktopBridgeOrigin(origin: any) {
  const value = String(origin || '').trim();
  if (!value) return true;
  try {
    const host = new URL(value).hostname.trim().toLowerCase();
    if (!host) return false;
    if (host === '127.0.0.1' || host === 'localhost') return true;
    return parseAllowedDomainValues(config?.allowedDomains || [], config?.appUrl || '', config?.quizUrl || '', config?.backendUrl || '').includes(host);
  } catch (error) {
    return false;
  }
}

function isAllowedDesktopBridgeTarget(targetUrl: any) {
  const value = String(targetUrl || '').trim();
  if (!value) return false;
  if (value.startsWith('anticheat://')) return true;
  try {
    const parsed = new URL(value);
    if (parsed.username || parsed.password) return false;
    if (parsed.protocol.toLowerCase() === 'http:' && !(ALLOW_LOCAL_DEV_HOSTS && ['127.0.0.1', 'localhost'].includes(parsed.hostname.trim().toLowerCase()))) return false;
    if (parsed.protocol.toLowerCase() !== 'https:' && parsed.protocol.toLowerCase() !== 'http:') return false;
    const host = parsed.hostname.trim().toLowerCase();
    if (!host) return false;
    if (host === '127.0.0.1' || host === 'localhost') return true;
    return parseAllowedDomainValues(config?.allowedDomains || [], config?.appUrl || '', config?.quizUrl || '', config?.backendUrl || '').includes(host);
  } catch (error) {
    return false;
  }
}

function isAllowedDesktopBridgeBackendUrl(targetUrl: any) {
  const value = String(targetUrl || '').trim();
  if (!value) return false;
  try {
    const parsed = new URL(value);
    if (parsed.username || parsed.password) return false;
    if (parsed.protocol.toLowerCase() === 'http:' && !(ALLOW_LOCAL_DEV_HOSTS && ['127.0.0.1', 'localhost'].includes(parsed.hostname.trim().toLowerCase()))) return false;
    if (parsed.protocol.toLowerCase() !== 'https:' && parsed.protocol.toLowerCase() !== 'http:') return false;
    const host = parsed.hostname.trim().toLowerCase();
    if (!host) return false;
    if (host === '127.0.0.1' || host === 'localhost') return true;
    return parseAllowedDomainValues(config?.allowedDomains || [], config?.appUrl || '', config?.quizUrl || '', config?.backendUrl || '').includes(host);
  } catch (error) {
    return false;
  }
}

function buildDesktopBridgeLaunchUrl(body: any = {}) {
  const launchType = String(body?.launchType || '').trim().toLowerCase();
  if (launchType === 'open_app') {
    const params = new URLSearchParams({
      screen: 'lms',
      source: 'kiu-lms-bridge'
    });
    const launchUrl = String(body?.launchUrl || body?.url || '').trim();
    const backendUrl = String(body?.backendUrl || '').trim().replace(/\/$/, '');
    if (launchUrl) {
      params.set('launchUrl', launchUrl);
    }
    if (backendUrl) {
      params.set('backendUrl', backendUrl);
    }
    return `anticheat://open?${params.toString()}`;
  }
  if (launchType === 'protected_quiz') {
    const ticket = String(body?.ticket || '').trim();
    const backendUrl = String(body?.backendUrl || '').trim().replace(/\/$/, '');
    if (!ticket) {
      throw new Error('Protected launch ticket is missing.');
    }
    if (!isAllowedDesktopBridgeBackendUrl(backendUrl)) {
      throw new Error('Protected launch backend URL is not allowed.');
    }
    return `anticheat://launch?ticket=${encodeURIComponent(ticket)}&backendUrl=${encodeURIComponent(backendUrl)}`;
  }
  const legacyLaunchUrl = String(body?.launchUrl || body?.url || '').trim();
  if (isAllowedDesktopBridgeTarget(legacyLaunchUrl)) {
    return legacyLaunchUrl;
  }
  throw new Error('Launch request is not allowed.');
}

function startDesktopBridgeServer() {
  if (desktopBridgeServer) return;
  desktopBridgeApp.use(express.json({ limit: '64kb' }));
  desktopBridgeApp.use((request: Request, response: Response, next) => {
    const origin = String(request.headers.origin || '').trim();
    if (origin && isAllowedDesktopBridgeOrigin(origin)) {
      response.setHeader('Access-Control-Allow-Origin', origin);
    } else if (!origin) {
      response.setHeader('Access-Control-Allow-Origin', '*');
    }
    response.setHeader('Vary', 'Origin');
    response.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (request.method === 'OPTIONS') {
      response.sendStatus(204);
      return;
    }
    next();
  });

  desktopBridgeApp.get('/health', (_request: Request, response: Response) => {
    response.json({
      ok: true,
      app: 'anti-cheat',
      version: app.getVersion(),
      bridgePort: DESKTOP_BRIDGE_PORT,
      launcherOpen: Boolean(
        (loginWindow && !loginWindow.isDestroyed())
        || (launcherWindow && !launcherWindow.isDestroyed())
        || (mainWindow && !mainWindow.isDestroyed())
      ),
      protectedSessionActive: Boolean(activeClientSessionToken)
    });
  });

  desktopBridgeApp.post('/launch', async (request: Request, response: Response) => {
    try {
      const launchUrl = buildDesktopBridgeLaunchUrl(request.body || {});
      const launchType = String(request.body?.launchType || '').trim().toLowerCase();
      await handleOpenUrl(launchUrl);
      if (launchType === 'open_app') showDesktopEntryWindow(false, true);
      else if (mainWindow && !mainWindow.isDestroyed()) focusWindow(mainWindow);
      else showDesktopEntryWindow(false, true);
      response.json({
        ok: true,
        launchType: launchType || (String(launchUrl).includes('anticheat://open') ? 'open_app' : 'protected_quiz'),
        activeClientSessionToken: Boolean(activeClientSessionToken),
        quizUrl: String(config.quizUrl || '').trim()
      });
    } catch (error: any) {
      response.status(400).json({ ok: false, error: String(error?.message || error || 'Launch handoff failed.') });
    }
  });

  desktopBridgeServer = desktopBridgeApp.listen(DESKTOP_BRIDGE_PORT, '127.0.0.1');
  desktopBridgeServer.on('error', (error) => {
    console.warn('Desktop bridge server failed to start.', error);
    desktopBridgeServer = null;
  });
}

function parseAllowedDomainValues(...values: any[]) {
  const domains = new Set<string>();
  values.flat().forEach((entry: any) => {
    const value = String(entry || '').trim();
    if (!value) return;
    if (/^https?:\/\//i.test(value)) {
      const host = extractHost(value);
      if (host) domains.add(host);
      return;
    }
    domains.add(value.toLowerCase());
  });
  if (ALLOW_LOCAL_DEV_HOSTS) {
    domains.add('127.0.0.1');
    domains.add('localhost');
  }
  return Array.from(domains);
}

function normalizeRuntimeConfig(rawConfig: any = {}) {
  const appUrl = !isPlaceholderUrl(rawConfig.appUrl) ? trimUrl(rawConfig.appUrl) : DEFAULT_DESKTOP_APP_URL;
  const backendUrl = !isPlaceholderUrl(rawConfig.backendUrl) ? trimUrl(rawConfig.backendUrl) : DEFAULT_BACKEND_URL;
  const explicitQuizUrl = !isPlaceholderUrl(rawConfig.quizUrl) ? trimUrl(rawConfig.quizUrl) : '';
  const quizUrl = explicitQuizUrl || `${appUrl}/lms.html`;
  const allowedDomains = parseAllowedDomainValues(
    rawConfig.allowedDomains,
    process.env.KIU_ALLOWED_DOMAINS ? process.env.KIU_ALLOWED_DOMAINS.split(',') : [],
    appUrl,
    backendUrl,
    quizUrl
  );
  return {
    quizUrl,
    backendUrl,
    appUrl,
    version: String(rawConfig.version || '1.0.0').trim() || '1.0.0',
    updateCheckUrl: isPlaceholderUrl(rawConfig.updateCheckUrl) ? '' : trimUrl(rawConfig.updateCheckUrl),
    reportingUrl: isPlaceholderUrl(rawConfig.reportingUrl) ? '' : trimUrl(rawConfig.reportingUrl),
    heartbeatUrl: isPlaceholderUrl(rawConfig.heartbeatUrl) ? '' : trimUrl(rawConfig.heartbeatUrl),
    allowedDomains,
    secretExitKey: String(rawConfig.secretExitKey || 'End').trim() || 'End',
    blockedProcesses: Array.isArray(rawConfig.blockedProcesses) ? [...rawConfig.blockedProcesses] : []
  };
}

// Development-only local proctor discovery
function startProctorDiscovery() {
  const browser = bonjour.find({ type: 'anticheat-proctor' });
  browser.on('up', (service) => {
    console.log('Proctor detected at:', service.referer.address);
    proctorInfo = service;
    config.reportingUrl = `http://${service.referer.address}:${service.port}/report`;
  });
}

// Development-only local proctoring server
function startProctorServer(port: number = 9000) {
  localApp.use(express.json());
  const activeStudents: Map<string, any> = new Map();

  localApp.post('/report', (req: Request, res: Response) => {
    const { student, event, details, platform } = req.body;
    activeStudents.set(student, { event, details, platform, lastSeen: Date.now() });
    res.sendStatus(200);
  });

  localApp.get('/dashboard', (req: Request, res: Response) => {
    let html = '<h1>Local Proctor Dashboard</h1><table border="1"><tr><th>Student</th><th>Status</th><th>Last Event</th><th>Platform</th></tr>';
    activeStudents.forEach((data, name) => {
      const status = (Date.now() - data.lastSeen < 5000) ? '🟢 Active' : '🔴 Disconnected';
      const rowColor = data.event.includes('violation') ? 'style="background-color:#ffcccc"' : '';
      html += `<tr ${rowColor}><td>${name}</td><td>${status}</td><td>${data.event}</td><td>${data.platform}</td></tr>`;
    });
    html += '</table>';
    res.send(html);
  });

  localServer = localApp.listen(port, () => {
    bonjour.publish({ name: 'University-Proctor-' + os.hostname(), type: 'anticheat-proctor', port });
    console.log('Proctor Dashboard live at http://localhost:' + port + '/dashboard');
  });
}

let mainWindow: BrowserWindow | null = null;
let loginWindow: BrowserWindow | null = null;
let launcherWindow: BrowserWindow | null = null;
let protectedBlockWindow: BrowserWindow | null = null;
let isScanning = false;
let studentIdentity: any = "Unknown Student";
let activeClientSessionToken = '';
let activeProtectedCourseId = '';
let activeProtectedQuizId = '';
let activeHeartbeatUrl = '';
let activePolicy: any = null;
let desktopSession: any = null;
let pendingLaunchTarget = '';
let heartbeatInterval: NodeJS.Timeout | null = null;
let processScanInterval: NodeJS.Timeout | null = null;
let clipboardInterval: NodeJS.Timeout | null = null;
let protectedControlInterval: NodeJS.Timeout | null = null;
let requestHeaderHookRegistered = false;
let lastProtectedControlState = {
  blocked: false,
  status: '',
  antiCheatConnected: true
};

function focusWindow(windowRef: BrowserWindow | null) {
  if (!windowRef) return;
  if (windowRef.isMinimized()) windowRef.restore();
  windowRef.show();
  windowRef.focus();
}

function isPortalLauncherPageUrl(url: string) {
  try {
    const parsed = new URL(String(url || '').trim());
    if (!['http:', 'https:'].includes(parsed.protocol)) return false;
    const path = parsed.pathname.toLowerCase();
    return path.endsWith('/exam-portal.html')
      || path.includes('/exam-portal')
      || path.endsWith('/lms.html')
      || /\/lms(?:\/|$)/.test(path);
  } catch (error) {
    return false;
  }
}

function shouldOfferPortalBackNavigation(url: string = '') {
  if (activeClientSessionToken) return false;
  const currentUrl = String(url || mainWindow?.webContents.getURL() || '').trim();
  if (!currentUrl || currentUrl.startsWith('file:')) return false;
  return isPortalLauncherPageUrl(currentUrl);
}

type RuntimeProfile = 'browsing' | 'protected';

function getRuntimeProfile(): RuntimeProfile {
  return activeClientSessionToken ? 'protected' : 'browsing';
}

function normalizeDesktopAccount(account: any = {}) {
  const role = String(account?.role || account?.actualRole || 'student').trim().toLowerCase() || 'student';
  return {
    id: String(account?.id || account?.userId || '').trim(),
    email: String(account?.email || '').trim(),
    name: String(account?.displayName || account?.nameEn || account?.name || account?.email || 'Signed-in user').trim(),
    role,
    faculty: String(account?.facultyCode || account?.faculty || '').trim()
  };
}

function getDesktopRoleCapabilities(role: string = '') {
  const normalizedRole = String(role || 'student').trim().toLowerCase();
  const staffRoles = new Set(['admin', 'professor', 'ta']);
  return {
    role: normalizedRole,
    canLaunchExamPortal: true,
    canLaunchLms: true,
    canRunSystemCheck: true,
    canClearCache: true,
    canUseStaffTools: staffRoles.has(normalizedRole),
    canOpenDevTools: staffRoles.has(normalizedRole),
    canUseCustomLaunchTarget: staffRoles.has(normalizedRole),
    canViewPolicyDiagnostics: staffRoles.has(normalizedRole)
  };
}

function buildDesktopSessionPayload(raw: any = {}) {
  const sessionToken = String(raw?.session?.token || raw?.token || '').trim();
  const account = normalizeDesktopAccount(raw?.account || {});
  const actualRole = String(raw?.session?.actualRole || account.role || '').trim().toLowerCase();
  const impersonatedRole = String(raw?.session?.impersonatedRole || '').trim().toLowerCase();
  const effectiveRole = actualRole === 'admin' && impersonatedRole ? impersonatedRole : (account.role || actualRole || 'student');
  const normalizedAccount = { ...account, role: effectiveRole };
  return {
    token: sessionToken,
    account: normalizedAccount,
    session: {
      userId: String(raw?.session?.userId || account.id || '').trim(),
      actualRole,
      impersonatedRole,
      expiresAt: String(raw?.session?.expiresAt || '').trim(),
      identityProvider: String(raw?.session?.identityProvider || 'portal').trim() || 'portal'
    },
    capabilities: getDesktopRoleCapabilities(effectiveRole),
    savedAt: new Date().toISOString()
  };
}

function readLoginPrefs() {
  try {
    if (!fs.existsSync(LOGIN_PREFS_PATH)) return { staySignedIn: true };
    const parsed = JSON.parse(fs.readFileSync(LOGIN_PREFS_PATH, 'utf8'));
    return { staySignedIn: parsed?.staySignedIn !== false };
  } catch (error) {
    return { staySignedIn: true };
  }
}

function persistLoginPrefs(prefs: { staySignedIn?: boolean }) {
  try {
    fs.mkdirSync(path.dirname(LOGIN_PREFS_PATH), { recursive: true });
    fs.writeFileSync(LOGIN_PREFS_PATH, JSON.stringify({ staySignedIn: prefs?.staySignedIn !== false }, null, 2), 'utf8');
  } catch (error) {}
}

function shouldStaySignedIn() {
  return readLoginPrefs().staySignedIn;
}

function isSessionLocallyValid(session: any) {
  const expiresAt = String(session?.session?.expiresAt || '').trim();
  if (!expiresAt) return true;
  return new Date(expiresAt).getTime() > Date.now();
}

function readPersistedDesktopSession() {
  try {
    if (!fs.existsSync(DESKTOP_SESSION_PATH)) return null;
    const parsed = JSON.parse(fs.readFileSync(DESKTOP_SESSION_PATH, 'utf8'));
    const normalized = buildDesktopSessionPayload(parsed);
    return normalized.token ? normalized : null;
  } catch (error) {
    return null;
  }
}

function persistDesktopSession(nextSession: any) {
  try {
    const normalized = buildDesktopSessionPayload(nextSession);
    if (!normalized.token) return null;
    desktopSession = normalized;
    if (shouldStaySignedIn()) {
      fs.mkdirSync(path.dirname(DESKTOP_SESSION_PATH), { recursive: true });
      fs.writeFileSync(DESKTOP_SESSION_PATH, JSON.stringify(normalized, null, 2), 'utf8');
    } else {
      try {
        if (fs.existsSync(DESKTOP_SESSION_PATH)) fs.unlinkSync(DESKTOP_SESSION_PATH);
      } catch (error) {}
    }
    return normalized;
  } catch (error) {
    return null;
  }
}

function clearDesktopSession() {
  desktopSession = null;
  pendingLaunchTarget = '';
  try {
    if (fs.existsSync(DESKTOP_SESSION_PATH)) fs.unlinkSync(DESKTOP_SESSION_PATH);
  } catch (error) {}
}

async function validateDesktopSession(candidate: any = null) {
  const persisted = candidate || readPersistedDesktopSession();
  const token = String(persisted?.token || '').trim();
  if (!token) {
    clearDesktopSession();
    return null;
  }
  if (!isSessionLocallyValid(persisted)) {
    clearDesktopSession();
    return null;
  }
  try {
    const response = await axios.get(`${String(config.backendUrl || '').replace(/\/$/, '')}/api/portal/session`, {
      headers: { 'X-Portal-Session': token },
      timeout: 5000
    });
    const payload = buildDesktopSessionPayload({
      token,
      account: response.data?.account || persisted.account || {},
      session: {
        ...(response.data?.session || {}),
        token
      }
    });
    persistDesktopSession(payload);
    return payload;
  } catch (error: any) {
    const status = Number(error?.response?.status || 0);
    if (status === 401 || status === 403) {
      clearDesktopSession();
      return null;
    }
    if (!isSessionLocallyValid(persisted)) {
      clearDesktopSession();
      return null;
    }
    desktopSession = persisted;
    return persisted;
  }
}

async function loginDesktopSession(email: string, password: string, staySignedIn: boolean = true) {
  persistLoginPrefs({ staySignedIn });
  const response = await axios.post(`${String(config.backendUrl || '').replace(/\/$/, '')}/api/portal/session/login`, {
    email,
    password
  }, { timeout: 5000 });
  const payload = buildDesktopSessionPayload(response.data || {});
  if (!payload.token) throw new Error('Login succeeded, but the backend did not return a desktop session token.');
  persistDesktopSession(payload);
  return payload;
}

async function logoutDesktopSession() {
  const token = String(desktopSession?.token || readPersistedDesktopSession()?.token || '').trim();
  if (token) {
    try {
      await axios.post(`${String(config.backendUrl || '').replace(/\/$/, '')}/api/portal/session/logout`, { token }, { timeout: 3000 });
    } catch (error) {}
  }
  clearDesktopSession();
}

function clearProtectedSession() {
  activeClientSessionToken = '';
  activeProtectedCourseId = '';
  activeProtectedQuizId = '';
  activeHeartbeatUrl = '';
  activePolicy = null;
  lastProtectedControlState = {
    blocked: false,
    status: '',
    antiCheatConnected: true
  };
  if (protectedControlInterval) {
    clearInterval(protectedControlInterval);
    protectedControlInterval = null;
  }
  if (protectedBlockWindow && !protectedBlockWindow.isDestroyed()) {
    protectedBlockWindow.close();
  }
  protectedBlockWindow = null;
}

function shouldNormalizeAsBrowsingLaunch(launchUrl: string) {
  if (activeClientSessionToken) return false;
  const normalized = String(launchUrl || '').trim();
  if (/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//i.test(normalized)) return true;
  if (!isPortalLauncherPageUrl(normalized)) return false;
  const appHost = extractHost(config?.appUrl || DEFAULT_DESKTOP_APP_URL);
  const launchHost = extractHost(normalized);
  if (!launchHost) return false;
  if (ALLOW_LOCAL_DEV_HOSTS && (launchHost === '127.0.0.1' || launchHost === 'localhost')) return true;
  return Boolean(appHost && launchHost === appHost);
}

function getBrowsingRelaxedSettings(settings: any = {}) {
  return {
    ...settings,
    focusProtection: false,
    inputBlocking: false,
    clipboardClearing: false,
    kioskMode: false,
    violationScreen: false
  };
}

const DEFAULT_BLOCKED_PROCESSES = [
  "TeamViewer.exe", "AnyDesk.exe", "Discord.exe", "obs64.exe", "obs32.exe",
  "Zoom.exe", "Skype.exe", "Cheat Engine.exe", "x64dbg.exe", "Wireshark.exe",
  "SnippingTool.exe", "ScreenClippingHost.exe",
  "discord", "obs", "wireshark", "anydesk", "teamviewer", "zoom", "x64dbg", "gdb"
];

function clampPolicyInterval(value: any, fallback: number, min: number, max: number) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(max, Math.max(min, Math.round(numeric)));
}

function uniquePolicyStrings(values: any[] = []) {
  return Array.from(new Set(values.map(value => String(value || '').trim()).filter(Boolean)));
}

function normalizeAntiCheatPolicy(policy: any = {}, fallback: any = {}) {
  const source = policy && typeof policy === 'object' ? policy : {};
  const prior = fallback && typeof fallback === 'object' ? fallback : {};
  const merged = {
    processScanning: true,
    clipboardClearing: true,
    focusProtection: true,
    inputBlocking: true,
    kioskMode: true,
    vmDetection: true,
    devToolsProtection: true,
    allowDebugTools: false,
    navigationProtection: true,
    securityDialogs: true,
    violationScreen: true,
    blockedProcesses: DEFAULT_BLOCKED_PROCESSES,
    allowedDomains: [],
    heartbeatMs: 2000,
    processScanMs: 1500,
    ...prior,
    ...source
  };
  const blockedProcesses = uniquePolicyStrings(Array.isArray(merged.blockedProcesses) ? merged.blockedProcesses : []);
  return {
    processScanning: merged.processScanning !== false,
    clipboardClearing: merged.clipboardClearing !== false,
    focusProtection: merged.focusProtection !== false,
    inputBlocking: merged.inputBlocking !== false,
    kioskMode: merged.kioskMode !== false,
    vmDetection: merged.vmDetection !== false,
    devToolsProtection: merged.devToolsProtection !== false,
    allowDebugTools: merged.allowDebugTools === true,
    navigationProtection: merged.navigationProtection !== false,
    securityDialogs: merged.securityDialogs !== false,
    violationScreen: merged.violationScreen !== false,
    blockedProcesses: blockedProcesses.length ? blockedProcesses : [...DEFAULT_BLOCKED_PROCESSES],
    allowedDomains: uniquePolicyStrings(Array.isArray(merged.allowedDomains) ? merged.allowedDomains : []),
    heartbeatMs: clampPolicyInterval(merged.heartbeatMs, 2000, 1000, 60000),
    processScanMs: clampPolicyInterval(merged.processScanMs, 1500, 1000, 60000)
  };
}

function getEffectiveTestSettings() {
  if (getRuntimeProfile() === 'protected') return activePolicy || normalizeAntiCheatPolicy();
  return getBrowsingRelaxedSettings(testSettings);
}

function getEffectiveAllowedDomains() {
  const effective = getEffectiveTestSettings();
  if (getRuntimeProfile() === 'protected') {
    return uniquePolicyStrings([
      ...(Array.isArray(config?.allowedDomains) ? config.allowedDomains : []),
      ...(Array.isArray(effective.allowedDomains) ? effective.allowedDomains : [])
    ]);
  }
  return Array.isArray(config?.allowedDomains) ? config.allowedDomains : [];
}

function getEffectiveBlockedProcesses() {
  const effective = getEffectiveTestSettings();
  if (getRuntimeProfile() === 'protected') {
    return Array.isArray(effective.blockedProcesses) ? effective.blockedProcesses : DEFAULT_BLOCKED_PROCESSES;
  }
  return Array.isArray(config?.blockedProcesses) ? config.blockedProcesses : DEFAULT_BLOCKED_PROCESSES;
}

function getAntiCheatUserAgent(profile: RuntimeProfile = getRuntimeProfile()) {
  const chromiumUa = session.defaultSession.getUserAgent();
  if (profile === 'browsing') {
    return `${chromiumUa} AntiCheatBrowser/1.0 KIU-Exam`;
  }
  return `${chromiumUa} AntiCheatBrowser/1.0 (UniversityExam; Protected)`;
}

function getAppOriginHosts() {
  const hosts = new Set<string>();
  [config?.appUrl, config?.quizUrl, testSettings.launchUrl, DEFAULT_DESKTOP_APP_URL].forEach((value) => {
    const host = extractHost(value);
    if (host) hosts.add(host);
  });
  (Array.isArray(config?.allowedDomains) ? config.allowedDomains : []).forEach((domain: string) => {
    const clean = String(domain || '').trim().toLowerCase().replace(/^\*\./, '');
    if (clean) hosts.add(clean);
  });
  return [...hosts];
}

function isSameAppOrigin(url: string, referenceUrl: string = '') {
  try {
    const target = new URL(String(url || '').trim());
    const refValue = String(referenceUrl || mainWindow?.webContents.getURL() || testSettings.launchUrl || config.quizUrl || '').trim();
    if (refValue) {
      const base = new URL(refValue);
      if (target.protocol === base.protocol && target.host === base.host) return true;
    }
    return getAppOriginHosts().some((host) => target.hostname === host || target.hostname.endsWith(`.${host}`));
  } catch (error) {
    return false;
  }
}

function isNavigationBlocked(url: string) {
  const value = String(url || '').trim();
  if (!value || value.startsWith('anticheat://')) return false;
  try {
    const parsed = new URL(value);
    if (parsed.protocol === 'file:' || parsed.protocol === 'about:') return false;
  } catch (error) {
    return true;
  }
  if (getRuntimeProfile() === 'browsing' && isSameAppOrigin(value)) return false;
  const effective = getEffectiveTestSettings();
  if (getRuntimeProfile() === 'browsing' && !effective.navigationProtection) return false;
  try {
    const parsedUrl = new URL(value);
    if (parsedUrl.protocol === 'file:' || parsedUrl.protocol === 'about:' || parsedUrl.protocol === 'anticheat:') return false;
    return !getEffectiveAllowedDomains().some((domain: string) =>
      parsedUrl.hostname === domain || parsedUrl.hostname.endsWith('.' + domain)
    );
  } catch (error) {
    return true;
  }
}

function syncClipboardInterval() {
  if (clipboardInterval) {
    clearInterval(clipboardInterval);
    clipboardInterval = null;
  }
  const effective = getEffectiveTestSettings();
  if (getRuntimeProfile() === 'protected' && effective.clipboardClearing) {
    clipboardInterval = setInterval(() => { clipboard.clear(); }, 2000);
  }
}

function applyRuntimeProfileToWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const profile = getRuntimeProfile();
  const effective = getEffectiveTestSettings();

  mainWindow.webContents.setUserAgent(getAntiCheatUserAgent(profile));

  if (profile === 'browsing') {
    if (mainWindow.isKiosk()) {
      mainWindow.setKiosk(false);
      mainWindow.setFullScreen(false);
      mainWindow.setAlwaysOnTop(false);
      mainWindow.setSkipTaskbar(false);
      mainWindow.setContentProtection(false);
    }
    if (!mainWindow.isMaximized() && !mainWindow.isFullScreen()) {
      mainWindow.setSize(1200, 800);
    }
  } else if (effective.kioskMode) {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;
    mainWindow.setKiosk(true);
    mainWindow.setFullScreen(true);
    mainWindow.setAlwaysOnTop(true, 'screen-saver');
    mainWindow.setSkipTaskbar(true);
    mainWindow.setContentProtection(true);
    mainWindow.setSize(width, height);
    Menu.setApplicationMenu(null);
  }

  syncClipboardInterval();

  const currentUrl = mainWindow.webContents.getURL();
  mainWindow.webContents.send('portal-back-state-changed', {
    visible: shouldOfferPortalBackNavigation(currentUrl),
    label: 'Back to Dashboard'
  });
}

async function showLoginOrLauncher(preferMain: boolean = false) {
  if (activeClientSessionToken) {
    showDesktopEntryWindow(false, true);
    return;
  }
  const restored = desktopSession || await validateDesktopSession();
  if (!restored) {
    createDesktopLoginWindow();
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.close();
    }
    return;
  }
  showDesktopEntryWindow(!preferMain, preferMain);
}

function showDesktopEntryWindow(preferSettings: boolean = false, preferMain: boolean = false) {
  if (preferMain) {
    if (!activeClientSessionToken && !desktopSession) {
      void showLoginOrLauncher(false);
      return;
    }
    if (loginWindow && !loginWindow.isDestroyed()) {
      loginWindow.close();
      loginWindow = null;
    }
    if (launcherWindow && !launcherWindow.isDestroyed()) {
      launcherWindow.close();
      launcherWindow = null;
    }
    if (mainWindow && !mainWindow.isDestroyed()) {
      focusWindow(mainWindow);
      return;
    }
    createMainWindow();
    return;
  }
  if (preferSettings && !activeClientSessionToken) {
    if (launcherWindow && !launcherWindow.isDestroyed()) {
      focusWindow(launcherWindow);
    } else {
      createSettingsWindow();
    }
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.close();
    }
    return;
  }
  if (mainWindow) {
    focusWindow(mainWindow);
    return;
  }
  if (launcherWindow) {
    focusWindow(launcherWindow);
    return;
  }
  if (activeClientSessionToken) createMainWindow();
  else if (desktopSession) createSettingsWindow();
  else void showLoginOrLauncher(false);
}

function clearRuntimeIntervals() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
  if (processScanInterval) {
    clearInterval(processScanInterval);
    processScanInterval = null;
  }
  if (clipboardInterval) {
    clearInterval(clipboardInterval);
    clipboardInterval = null;
  }
  if (protectedControlInterval) {
    clearInterval(protectedControlInterval);
    protectedControlInterval = null;
  }
}

function getProtectedControlBaseUrl() {
  return String(config.backendUrl || '').replace(/\/$/, '');
}

function getProtectedSessionStateUrl() {
  if (!activeProtectedCourseId || !activeProtectedQuizId) return '';
  const baseUrl = getProtectedControlBaseUrl();
  if (!baseUrl) return '';
  return `${baseUrl}/api/protected-quizzes/${encodeURIComponent(activeProtectedQuizId)}/attempt?courseId=${encodeURIComponent(activeProtectedCourseId)}`;
}

function closeProtectedBlockWindow() {
  if (protectedBlockWindow && !protectedBlockWindow.isDestroyed()) {
    protectedBlockWindow.close();
  }
  protectedBlockWindow = null;
}

function showProtectedSessionBlockedWindow(reason: string) {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const safeReason = escapeHtml(reason || 'This protected session has been blocked by course staff.');
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  if (protectedBlockWindow && !protectedBlockWindow.isDestroyed()) {
    protectedBlockWindow.focus();
    return;
  }
  protectedBlockWindow = new BrowserWindow({
    width,
    height,
    kiosk: true,
    fullscreen: true,
    frame: false,
    alwaysOnTop: true,
    backgroundColor: '#020617',
    webPreferences: { nodeIntegration: false, contextIsolation: true }
  });
  protectedBlockWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Session Blocked</title>
  <style>
    :root { color-scheme: dark; }
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      background: linear-gradient(180deg, #020617 0%, #0f172a 100%);
      color: #e5eefb;
      font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
      padding: 24px;
    }
    .panel {
      width: min(720px, 100%);
      background: rgba(15, 23, 42, 0.92);
      border: 1px solid rgba(148,163,184,0.22);
      border-radius: 18px;
      padding: 28px;
      box-shadow: 0 20px 40px rgba(2,6,23,0.45);
    }
    h1 { margin: 0 0 12px; font-size: 30px; }
    p { margin: 0; color: #cbd5e1; line-height: 1.7; }
    .reason { margin-top: 16px; padding: 14px 16px; border-radius: 14px; background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.16); color: #fde68a; white-space: pre-wrap; }
  </style>
</head>
<body>
  <div class="panel">
    <h1>Protected session blocked</h1>
    <p>The course staff placed this attempt into a blocked state. The anti-cheat client is locked until the backend changes the attempt state again.</p>
    <div class="reason">${safeReason}</div>
  </div>
</body>
</html>`)}`);
  protectedBlockWindow.once('closed', () => {
    protectedBlockWindow = null;
  });
  protectedBlockWindow.show();
  protectedBlockWindow.focus();
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.hide();
  }
}

function restoreProtectedSessionWindow() {
  if (!activeClientSessionToken) return;
  closeProtectedBlockWindow();
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (mainWindow.webContents.getURL() !== config.quizUrl) {
      mainWindow.loadURL(String(config.quizUrl || '')).catch(() => {});
    }
    mainWindow.show();
    mainWindow.focus();
  } else {
    createMainWindow();
  }
}

async function syncProtectedSessionState() {
  if (!activeClientSessionToken) return null;
  const stateUrl = getProtectedSessionStateUrl();
  if (!stateUrl) return null;
  try {
    const response = await axios.get(stateUrl, {
      headers: { 'X-Protected-Client-Session': activeClientSessionToken },
      timeout: 4000
    });
    const payload = response.data || {};
    const attempt = payload.attempt || {};
    const quiz = payload.quiz || {};
    activePolicy = normalizeAntiCheatPolicy(attempt.appliedAntiCheatPolicy || activePolicy || {}, {
      allowedDomains: Array.isArray(payload.allowedDomains) ? payload.allowedDomains : []
    });
    if (Array.isArray(activePolicy.allowedDomains) && activePolicy.allowedDomains.length) {
      config.allowedDomains = uniquePolicyStrings([
        ...(Array.isArray(config.allowedDomains) ? config.allowedDomains : []),
        ...activePolicy.allowedDomains
      ]);
    }
    if (Array.isArray(activePolicy.blockedProcesses) && activePolicy.blockedProcesses.length) {
      config.blockedProcesses = [...activePolicy.blockedProcesses];
    }
    const blocked = attempt.blocked === true || String(attempt.status || '').trim() === 'blocked';
    const status = String(attempt.status || '').trim();
    const antiCheatConnected = attempt.antiCheatConnected !== false;
    const lastEventType = String(attempt.lastEvent?.type || '').trim();
    const forceEnded = ['force-submit', 'submitted'].includes(lastEventType) || ['auto-submitted', 'submitted', 'graded'].includes(status);
    if (forceEnded) {
      clearProtectedSession();
      if (!desktopSession) {
        createDesktopLoginWindow();
      } else {
        createSettingsWindow();
      }
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.close();
      }
      return payload;
    }
    if (blocked && (!lastProtectedControlState.blocked || !protectedBlockWindow)) {
      const reason = String(attempt.lastEvent?.note || attempt.submitReason || 'This protected session has been blocked by course staff.').trim();
      showProtectedSessionBlockedWindow(reason);
    } else if (!blocked && (lastProtectedControlState.blocked || protectedBlockWindow)) {
      restoreProtectedSessionWindow();
    }
    lastProtectedControlState = {
      blocked,
      status,
      antiCheatConnected
    };
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('protected-session-control-state', {
        blocked,
        status,
        antiCheatConnected,
        overrideStatus: String(attempt.overrideStatus || '').trim(),
        reconnectApprovedAt: String(attempt.reconnectApprovedAt || '').trim(),
        applyPolicy: activePolicy,
        quizId: String(quiz?.id || activeProtectedQuizId || '').trim(),
        courseId: String(quiz?.courseId || activeProtectedCourseId || '').trim()
      });
    }
    return payload;
  } catch (error: any) {
    const statusCode = Number(error?.response?.status || 0);
    if (statusCode === 403) {
      clearProtectedSession();
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.close();
      }
      if (desktopSession) createSettingsWindow();
      else createDesktopLoginWindow();
      return null;
    }
    if (activeClientSessionToken) {
      reportToLMS('disconnect', {
        reason: error?.message || 'Protected session state could not be refreshed.',
        courseId: activeProtectedCourseId,
        quizId: activeProtectedQuizId
      });
    }
    return null;
  }
}

function startProtectedSessionControlLoop() {
  if (protectedControlInterval) {
    clearInterval(protectedControlInterval);
    protectedControlInterval = null;
  }
  if (!activeClientSessionToken) return;
  const effective = getEffectiveTestSettings();
  const intervalMs = clampPolicyInterval(effective.heartbeatMs || 2000, 2000, 1000, 15000);
  protectedControlInterval = setInterval(() => {
    void syncProtectedSessionState();
  }, intervalMs);
  void syncProtectedSessionState();
}

function escapeHtml(value: string) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildLoadFailurePage(targetUrl: string, description: string) {
  const safeTargetUrl = escapeHtml(targetUrl || 'Unknown target');
  const safeDescription = escapeHtml(description || 'The requested page could not be loaded.');
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Launch Failed</title>
  <style>
    :root {
      color-scheme: dark;
      --bg: #0b1120;
      --panel: #111827;
      --line: rgba(148,163,184,0.18);
      --text: #e5eefb;
      --muted: #94a3b8;
      --warn: #f59e0b;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 24px;
      background:
        radial-gradient(circle at top right, rgba(245,158,11,0.14), transparent 30%),
        linear-gradient(180deg, #020617 0%, var(--bg) 100%);
      color: var(--text);
      font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
    }
    .panel {
      width: min(760px, 100%);
      background: rgba(17,24,39,0.94);
      border: 1px solid var(--line);
      border-radius: 20px;
      padding: 24px;
      box-shadow: 0 24px 48px rgba(2, 6, 23, 0.42);
      display: grid;
      gap: 16px;
    }
    h1 {
      margin: 0;
      font-size: 28px;
      line-height: 1.15;
    }
    p {
      margin: 0;
      color: var(--muted);
      line-height: 1.7;
    }
    code {
      display: block;
      padding: 12px 14px;
      border-radius: 14px;
      background: rgba(15,23,42,0.8);
      border: 1px solid rgba(148,163,184,0.12);
      color: #cbd5e1;
      white-space: pre-wrap;
      word-break: break-word;
      font-family: Consolas, "Courier New", monospace;
      font-size: 12px;
      line-height: 1.6;
    }
    .notice {
      padding: 14px 16px;
      border-radius: 14px;
      background: rgba(245,158,11,0.1);
      border: 1px solid rgba(245,158,11,0.2);
      color: #fde68a;
    }
  </style>
</head>
<body>
  <div class="panel">
    <h1>Protected quiz launch failed</h1>
    <p>The anti-cheat browser opened, but the requested LMS page could not be loaded.</p>
    <div>
      <p>Target URL</p>
      <code>${safeTargetUrl}</code>
    </div>
    <div>
      <p>Failure details</p>
      <code>${safeDescription}</code>
    </div>
    <div class="notice">Close this window and reopen the anti-cheat launcher to review the configured exam or LMS target.</div>
  </div>
</body>
</html>`;
}

function showMainWindowLoadFailure(targetUrl: string, description: string) {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const page = buildLoadFailurePage(targetUrl, description);
  mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(page)}`).catch(() => {});
}

const DEFAULT_TEST_SETTINGS = {
  processScanning: true,
  clipboardClearing: true,
  focusProtection: true,
  inputBlocking: true,
  kioskMode: true,
  vmDetection: true,
  devToolsProtection: true,
  allowDebugTools: false,
  navigationProtection: true,
  securityDialogs: true,
  violationScreen: true,
  launchUrl: ''
};

function getDefaultDesktopTestUrl() {
  const baseAppUrl = DEFAULT_DESKTOP_APP_URL.replace(/\/$/, '');
  return `${baseAppUrl}/exam-portal.html`;
}

function normalizeLaunchUrl(rawUrl: any) {
  const fallbackUrl = getDefaultDesktopTestUrl();
  const candidate = String(rawUrl || '').trim();
  if (!candidate) return fallbackUrl;
  if (/^https?:\/\//i.test(candidate) && isAllowedDesktopBridgeTarget(candidate)) {
    return candidate;
  }
  if (/^[a-z0-9.-]+\.[a-z]{2,}(\/.*)?$/i.test(candidate)) {
    const normalized = `https://${candidate}`;
    return isAllowedDesktopBridgeTarget(normalized) ? normalized : fallbackUrl;
  }
  return fallbackUrl;
}

function normalizeTestSettings(settings: any = {}) {
  const launchUrl = normalizeLaunchUrl(settings.launchUrl);
  const isRelaxedLaunch = shouldNormalizeAsBrowsingLaunch(launchUrl);
  return {
    processScanning: isRelaxedLaunch ? false : settings.processScanning !== false,
    clipboardClearing: isRelaxedLaunch ? false : settings.clipboardClearing !== false,
    focusProtection: isRelaxedLaunch ? false : settings.focusProtection !== false,
    inputBlocking: isRelaxedLaunch ? false : settings.inputBlocking !== false,
    kioskMode: isRelaxedLaunch ? false : settings.kioskMode !== false,
    vmDetection: isRelaxedLaunch ? false : settings.vmDetection !== false,
    devToolsProtection: isRelaxedLaunch ? false : settings.devToolsProtection !== false,
    allowDebugTools: settings.allowDebugTools === true,
    navigationProtection: isRelaxedLaunch ? false : settings.navigationProtection !== false,
    securityDialogs: isRelaxedLaunch ? false : settings.securityDialogs !== false,
    violationScreen: isRelaxedLaunch ? false : settings.violationScreen !== false,
    launchUrl
  };
}

function getCurrentLauncherTargetUrl() {
  return String(pendingLaunchTarget || testSettings.launchUrl || getDefaultDesktopTestUrl()).trim();
}

function applyLaunchTarget(settings: any = {}, options: any = {}) {
  if (!desktopSession && !activeClientSessionToken) {
    throw new Error('Please sign in before launching a portal or quiz target.');
  }
  const nextSettings = normalizeTestSettings(settings);
  if (desktopSession?.capabilities?.canUseCustomLaunchTarget !== true && !isPortalLauncherPageUrl(nextSettings.launchUrl)) {
    throw new Error('This launcher target is restricted to staff roles.');
  }
  const shouldPersist = options.persist !== false && desktopSession?.capabilities?.canUseCustomLaunchTarget === true;
  pendingLaunchTarget = '';
  testSettings = nextSettings;
  if (!testSettings.launchUrl && !activeClientSessionToken) {
    testSettings.launchUrl = getDefaultDesktopTestUrl();
  }
  if (shouldPersist) {
    persistTestSettings();
  }
  if (testSettings.launchUrl) {
    config.quizUrl = testSettings.launchUrl;
  }
  if (launcherWindow && !launcherWindow.isDestroyed() && !activeClientSessionToken) {
    launcherWindow.close();
    launcherWindow = null;
  }
  createMainWindow();
}

function loadPersistedTestSettings() {
  try {
    if (fs.existsSync(TEST_SETTINGS_PATH)) {
      return JSON.parse(fs.readFileSync(TEST_SETTINGS_PATH, 'utf8'));
    }
  } catch (error) {}
  return {};
}

const VM_DETECTION_SIGNATURES = [
  {
    manufacturer: /vmware/i,
    model: /.+/i,
    reason: 'VMware virtual machine'
  },
  {
    manufacturer: /(oracle|innotek)/i,
    model: /(virtualbox|.+)/i,
    reason: 'VirtualBox virtual machine'
  },
  {
    manufacturer: /microsoft corporation/i,
    model: /virtual machine/i,
    reason: 'Hyper-V virtual machine'
  },
  {
    manufacturer: /parallels/i,
    model: /.+/i,
    reason: 'Parallels virtual machine'
  },
  {
    manufacturer: /(qemu|xen)/i,
    model: /.+/i,
    reason: 'QEMU or Xen virtual machine'
  },
  {
    manufacturer: /.+/i,
    model: /(virtualbox|vmware virtual platform|virtual machine|kvm|hvm domu)/i,
    reason: 'Virtual machine model detected'
  }
];

let lastHardwareDiagnostics = {
  manufacturer: '',
  model: '',
  source: '',
  isVirtualMachine: false,
  reason: ''
};

function persistTestSettings() {
  try {
    fs.mkdirSync(path.dirname(TEST_SETTINGS_PATH), { recursive: true });
    fs.writeFileSync(TEST_SETTINGS_PATH, JSON.stringify(testSettings, null, 2), 'utf8');
  } catch (error) {}
}

// Default launcher settings (can be modified by staff roles)
let config: any;

let testSettings = normalizeTestSettings({
  ...DEFAULT_TEST_SETTINGS,
  ...loadPersistedTestSettings(),
  ...(RUNTIME_QUIZ_URL_OVERRIDE || RUNTIME_APP_URL_OVERRIDE
    ? { launchUrl: RUNTIME_QUIZ_URL_OVERRIDE || `${RUNTIME_APP_URL_OVERRIDE}/exam-portal.html` }
    : {})
});

config = normalizeRuntimeConfig({
  quizUrl: getDefaultDesktopTestUrl(),
  backendUrl: DEFAULT_BACKEND_URL,
  appUrl: DEFAULT_DESKTOP_APP_URL,
  version: '1.0.0',
  updateCheckUrl: process.env.KIU_ANTI_CHEAT_UPDATE_URL || '',
  reportingUrl: '',
  heartbeatUrl: '',
  allowedDomains: [],
  secretExitKey: 'End',
  blockedProcesses: [
    "TeamViewer.exe", "AnyDesk.exe", "Discord.exe", "obs64.exe", "obs32.exe",
    "Zoom.exe", "Skype.exe", "Cheat Engine.exe", "x64dbg.exe", "Wireshark.exe",
    "SnippingTool.exe", "ScreenClippingHost.exe"
  ]
});

// Load configuration from disk if exists
try {
  const configPath = path.join(__dirname, 'config.json');
  if (fs.existsSync(configPath)) {
    const diskConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    config = normalizeRuntimeConfig({
      ...config,
      ...diskConfig,
      ...(RUNTIME_APP_URL_OVERRIDE
        ? {
            appUrl: RUNTIME_APP_URL_OVERRIDE,
            quizUrl: RUNTIME_QUIZ_URL_OVERRIDE || `${RUNTIME_APP_URL_OVERRIDE}/exam-portal.html`
          }
        : {}),
      ...(RUNTIME_BACKEND_URL_OVERRIDE
        ? { backendUrl: RUNTIME_BACKEND_URL_OVERRIDE }
        : {})
    });
  }
} catch (err) {}

config = normalizeRuntimeConfig(config);
if (!RUNTIME_APP_URL_OVERRIDE && !isLoopbackUrl(config.appUrl) && isLoopbackUrl(testSettings.launchUrl)) {
  testSettings.launchUrl = trimUrl(config.quizUrl || `${config.appUrl}/exam-portal.html`);
  persistTestSettings();
}

// ANTI-TAMPER: Self-Integrity Check
function verifyIntegrity() {
  try {
    const mainPath = __filename;
    const content = fs.readFileSync(mainPath, 'utf8');
    const currentHash = CryptoJS.SHA256(content).toString();
    console.log("App Integrity Verified:", currentHash);
    
    setInterval(() => {
      if (getEffectiveTestSettings().devToolsProtection && !canUseDebugTools() && mainWindow && mainWindow.webContents.isDevToolsOpened()) {
        reportToLMS('tamper_attempt', { reason: 'DevTools opened' });
        app.quit();
      }
    }, 1000);
  } catch (e) {
    app.quit();
  }
}

function readLinuxDmiField(fileName: string) {
  try {
    const filePath = path.join('/sys/class/dmi/id', fileName);
    if (!fs.existsSync(filePath)) return '';
    return String(fs.readFileSync(filePath, 'utf8') || '').trim();
  } catch (error) {
    return '';
  }
}

// ANTI-TAMPER: Prevent running in virtual machines
async function resolveHardwareDiagnostics(): Promise<typeof lastHardwareDiagnostics> {
  if (process.platform === 'linux') {
    const manufacturer = readLinuxDmiField('sys_vendor');
    const model = readLinuxDmiField('product_name');
    const match = VM_DETECTION_SIGNATURES.find(signature =>
      signature.manufacturer.test(manufacturer || '')
      && signature.model.test(model || '')
    );
    lastHardwareDiagnostics = {
      manufacturer,
      model,
      source: 'linux-dmi',
      isVirtualMachine: Boolean(match),
      reason: match?.reason || ''
    };
    return lastHardwareDiagnostics;
  }
  return new Promise((resolve) => {
    const command = 'powershell -NoProfile -Command "(Get-CimInstance Win32_ComputerSystem | Select-Object -Property Manufacturer,Model | ConvertTo-Json -Compress)"';
    exec(command, (err, stdout) => {
      let manufacturer = '';
      let model = '';
      let source = 'powershell';
      if (!err && String(stdout || '').trim()) {
        try {
          const parsed = JSON.parse(String(stdout || '').trim());
          manufacturer = String(parsed?.Manufacturer || '').trim();
          model = String(parsed?.Model || '').trim();
        } catch (error) {}
      }
      if (!manufacturer && !model) {
        source = 'systeminfo';
        exec('systeminfo', (fallbackErr, fallbackStdout) => {
          if (!fallbackErr && String(fallbackStdout || '').trim()) {
            const lines = String(fallbackStdout || '').split(/\r?\n/);
            manufacturer = String(lines.find(line => /^System Manufacturer:/i.test(line)) || '').split(':').slice(1).join(':').trim();
            model = String(lines.find(line => /^System Model:/i.test(line)) || '').split(':').slice(1).join(':').trim();
          }
          const match = VM_DETECTION_SIGNATURES.find(signature =>
            signature.manufacturer.test(manufacturer || '')
            && signature.model.test(model || '')
          );
          lastHardwareDiagnostics = {
            manufacturer,
            model,
            source,
            isVirtualMachine: Boolean(match),
            reason: match?.reason || ''
          };
          resolve(lastHardwareDiagnostics);
        });
        return;
      }
      const match = VM_DETECTION_SIGNATURES.find(signature =>
        signature.manufacturer.test(manufacturer || '')
        && signature.model.test(model || '')
      );
      lastHardwareDiagnostics = {
        manufacturer,
        model,
        source,
        isVirtualMachine: Boolean(match),
        reason: match?.reason || ''
      };
      resolve(lastHardwareDiagnostics);
    });
  });
}

async function checkVM(): Promise<boolean> {
  if (!getEffectiveTestSettings().vmDetection) return false;
  const diagnostics = await resolveHardwareDiagnostics();
  if (diagnostics.isVirtualMachine) {
    const detail = diagnostics.reason
      ? `${diagnostics.reason} (${diagnostics.manufacturer || 'Unknown manufacturer'} / ${diagnostics.model || 'Unknown model'})`
      : 'Running inside Virtual Machine';
    reportToLMS('tamper_attempt', { reason: detail });
    dialog.showErrorBox('Security Error', `This application appears to be running inside a virtual machine.\n\nDetected system: ${diagnostics.manufacturer || 'Unknown'} / ${diagnostics.model || 'Unknown'}`);
    app.quit();
    return true;
  }
  return false;
}

async function checkForUpdates(): Promise<boolean> {
  if (!config.updateCheckUrl || config.updateCheckUrl.includes('university-lms.com')) return true;
  try {
    const response = await axios.get(`${config.updateCheckUrl}?current=${config.version}&platform=desktop`);
    const { latestVersion, isMandatory, downloadUrl } = response.data;
    
    if (latestVersion !== config.version && isMandatory) {
      const choice = dialog.showMessageBoxSync({
        type: 'info',
        buttons: ['Download Update', 'Exit'],
        title: 'Update Required',
        message: `A mandatory update (v${latestVersion}) is required to continue the exam.`
      });
      
      if (choice === 0) {
        if (process.platform === 'win32') {
          exec(`start ${downloadUrl}`);
        } else if (process.platform === 'darwin') {
          exec(`open ${downloadUrl}`);
        } else {
          exec(`xdg-open ${downloadUrl}`);
        }
      }
      app.quit();
      return false;
    }
  } catch (err) {}
  return true;
}

// Protocol registration
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('anticheat', process.execPath, [path.resolve(process.argv[1])]);
  }
} else {
  app.setAsDefaultProtocolClient('anticheat');
}

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine) => {
    const url = commandLine.find(arg => String(arg || '').startsWith('anticheat://'));
    if (url && url.startsWith('anticheat://')) {
      handleOpenUrl(url).then(() => showDesktopEntryWindow(false, true));
      return;
    }
    void showLoginOrLauncher(false);
  });

  app.on('open-url', (event, url) => {
    event.preventDefault();
    if (!url || !url.startsWith('anticheat://')) return;
    handleOpenUrl(url).then(() => showDesktopEntryWindow(false, true));
  });

  app.on('ready', async () => {
    verifyIntegrity();
    startDesktopBridgeServer();
    
    if (ENABLE_LOCAL_PROCTOR_DASHBOARD) {
      startProctorDiscovery();
      startProctorServer();
    }

    const canContinue = await checkForUpdates();
    if (canContinue) {
      const initialProtocolUrl = process.argv.find(arg => String(arg || '').startsWith('anticheat://'));
      if (initialProtocolUrl) {
        await handleOpenUrl(initialProtocolUrl);
        showDesktopEntryWindow(false, true);
      } else {
        await showLoginOrLauncher(false);
      }
    }
  });
}

async function ensureProtectedLaunchPreflight(): Promise<boolean> {
  const isVm = await checkVM();
  return !isVm;
}

async function redeemLaunchTicket(ticket: string) {
  const response = await axios.post(`${String(config.backendUrl || '').replace(/\/$/, '')}/api/protected-client/redeem-launch`, { ticket }, { timeout: 5000 });
  const payload = response.data || {};
  activeClientSessionToken = String(payload.clientSessionToken || '').trim();
  activeHeartbeatUrl = String(payload.heartbeatUrl || '').trim();
  activeProtectedCourseId = String(payload.quiz?.courseId || payload.quiz?.groupKey || '').trim();
  activeProtectedQuizId = String(payload.quiz?.id || '').trim();
  if (payload.studentIdentity?.name) studentIdentity = payload.studentIdentity.name;
  const reportingUrl = String(payload.reportingUrl || '').trim();
  const quizSessionUrl = String(payload.quizSessionUrl || '').trim();
  if (reportingUrl && !isAllowedProtectedBackendUrl(reportingUrl)) {
    throw new Error('The protected reporting URL is not an approved backend origin.');
  }
  if (quizSessionUrl && !isAllowedDesktopBridgeTarget(quizSessionUrl)) {
    throw new Error('The protected quiz URL is not an approved application origin.');
  }
  if (reportingUrl) config.reportingUrl = reportingUrl;
  if (quizSessionUrl) config.quizUrl = quizSessionUrl;
  activePolicy = normalizeAntiCheatPolicy(payload.antiCheatPolicy, {
    allowedDomains: Array.isArray(payload.allowedDomains) ? payload.allowedDomains : []
  });
  if (Array.isArray(payload.allowedDomains) && payload.allowedDomains.length) {
    config.allowedDomains = uniquePolicyStrings([
      ...payload.allowedDomains,
      ...(Array.isArray(activePolicy.allowedDomains) ? activePolicy.allowedDomains : [])
    ]);
  } else if (Array.isArray(activePolicy.allowedDomains) && activePolicy.allowedDomains.length) {
    config.allowedDomains = uniquePolicyStrings(activePolicy.allowedDomains);
  }
  if (Array.isArray(activePolicy.blockedProcesses) && activePolicy.blockedProcesses.length) {
    config.blockedProcesses = [...activePolicy.blockedProcesses];
  }
  applyRuntimeProfileToWindow();
}

async function handleOpenUrl(url: string) {
  try {
    const parsed = new URL(url);
    const backendUrl = String(parsed.searchParams.get('backendUrl') || '').trim();
    let createdMainWindow = false;
    if (backendUrl && !isAllowedProtectedBackendUrl(`${backendUrl}/health`)) {
      throw new Error('The anti-cheat backend URL is not an approved origin.');
    }
    if (backendUrl) {
      config.backendUrl = backendUrl.replace(/\/$/, '');
    }
    if (parsed.protocol === 'anticheat:' && parsed.hostname === 'launch') {
      const ticket = String(parsed.searchParams.get('ticket') || '').trim();
      if (!ticket) return;
      await redeemLaunchTicket(ticket);
      const canContinue = await ensureProtectedLaunchPreflight();
      if (!canContinue) return;
      if (launcherWindow) {
        launcherWindow.close();
        launcherWindow = null;
      }
      if (!mainWindow) {
        createMainWindow();
        createdMainWindow = true;
      } else {
        focusWindow(mainWindow);
        applyRuntimeProfileToWindow();
      }
    } else if (parsed.protocol === 'anticheat:' && parsed.hostname === 'open') {
      const screenMode = String(parsed.searchParams.get('screen') || '').trim().toLowerCase();
      const wantsSettings = screenMode === 'settings';
      const launchUrl = String(parsed.searchParams.get('launchUrl') || parsed.searchParams.get('url') || '').trim();
      if (launchUrl) {
        if (activeClientSessionToken || desktopSession) {
          try {
            applyLaunchTarget({ launchUrl }, { persist: false });
          } catch (error) {}
        } else {
          pendingLaunchTarget = normalizeLaunchUrl(launchUrl);
        }
      }
      const wantsMainWindow = screenMode === 'lms' || screenMode === 'browser' || Boolean(launchUrl);
      if (!activeClientSessionToken && !desktopSession) {
        await showLoginOrLauncher(wantsMainWindow);
      } else {
        showDesktopEntryWindow(wantsSettings, wantsMainWindow);
      }
      return;
    } else {
      const targetUrl = url.replace('anticheat://', 'https://');
      if (!isAllowedDesktopBridgeTarget(targetUrl)) {
        throw new Error('The requested anti-cheat page is not an approved application origin.');
      }
      config.quizUrl = targetUrl;
    }
    if (mainWindow && config.quizUrl && !createdMainWindow) {
      await mainWindow.loadURL(config.quizUrl);
      mainWindow.focus();
    }
  } catch (error) {
    dialog.showErrorBox('Launch Failed', error instanceof Error ? error.message : 'The anti-cheat launch ticket could not be redeemed.');
  }
}

async function reportToLMS(eventType: string, details: any = {}) {
  if (!config.reportingUrl || config.reportingUrl.includes('university-lms.com')) return;
  try {
    const targetUrl = eventType === 'heartbeat' && activeHeartbeatUrl ? activeHeartbeatUrl : config.reportingUrl;
    if (!isAllowedProtectedBackendUrl(targetUrl)) return;
    const payload = {
      student: studentIdentity,
      studentId: studentIdentity?.id || '',
      courseId: activeProtectedCourseId,
      quizId: activeProtectedQuizId,
      clientSessionToken: activeClientSessionToken,
      timestamp: new Date().toISOString(),
      event: eventType,
      status: details?.status || '',
      details: details
    };
    await axios.post(targetUrl, payload, { timeout: 1500 }).catch(() => {});
  } catch (err) {}
}

function shouldShowSecurityDialogs() {
  return getEffectiveTestSettings().securityDialogs !== false;
}

function canUseDebugTools() {
  return getEffectiveTestSettings().allowDebugTools === true;
}

async function checkBlockedProcesses(): Promise<string | null> {
  return new Promise((resolve) => {
    const processListCommand = process.platform === 'win32' ? 'tasklist' : 'ps -eo comm=,args=';
    exec(processListCommand, (err, stdout) => {
      if (err) return resolve(null);
      const lowerStdout = stdout.toLowerCase();
      for (const proc of getEffectiveBlockedProcesses()) {
        if (lowerStdout.includes(proc.toLowerCase())) {
          return resolve(proc);
        }
      }
      resolve(null);
    });
  });
}

async function scanProcesses() {
  const effective = getEffectiveTestSettings();
  if (isScanning || !effective.processScanning) return;
  isScanning = true;
  const blockedProc = await checkBlockedProcesses();
  if (blockedProc) {
    reportToLMS('security_violation', { reason: `Blocked software active: ${blockedProc}` });
    if (mainWindow) {
      if (getEffectiveTestSettings().violationScreen) {
        mainWindow.hide();
        createViolationWindow(`Security Breach: ${blockedProc} is running.`);
      } else if (shouldShowSecurityDialogs()) {
        dialog.showMessageBox({ type: 'warning', title: 'Security Warning', message: `${blockedProc} was detected while the quiz is running.` });
      }
    }
  }
  isScanning = false;
}

function createViolationWindow(reason: string) {
  reportToLMS('security_violation', { reason });
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  const violationWin = new BrowserWindow({
    width, height, kiosk: true, fullscreen: true, frame: false, alwaysOnTop: true,
    webPreferences: { nodeIntegration: false, contextIsolation: true }
  });
  violationWin.loadFile(path.join(__dirname, 'ui', 'violation.html'));
  violationWin.webContents.on('did-finish-load', () => {
    violationWin.webContents.executeJavaScript(`document.getElementById('reason').innerText = "${reason.replace(/"/g, '\\"')}";`);
  });
  globalShortcut.register('CommandOrControl+Shift+Alt+' + config.secretExitKey, () => app.quit());
}

function createDesktopLoginWindow() {
  if (launcherWindow && !launcherWindow.isDestroyed()) {
    launcherWindow.close();
    launcherWindow = null;
  }
  if (loginWindow && !loginWindow.isDestroyed()) {
    loginWindow.loadFile(path.join(__dirname, 'ui', 'login.html')).catch(() => {});
    focusWindow(loginWindow);
    return;
  }
  loginWindow = new BrowserWindow({
    width: 720, height: 680, frame: true, resizable: true, center: true,
    title: "Anti-Cheat Sign In",
    backgroundColor: '#0b1120',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });
  loginWindow.loadFile(path.join(__dirname, 'ui', 'login.html'));
  loginWindow.once('ready-to-show', () => {
    loginWindow?.show();
    loginWindow?.focus();
  });
  loginWindow.on('closed', () => {
    loginWindow = null;
    if (!mainWindow && !launcherWindow) app.quit();
  });
}

function createSettingsWindow() {
  if (!desktopSession && !activeClientSessionToken) {
    createDesktopLoginWindow();
    return;
  }
  if (loginWindow && !loginWindow.isDestroyed()) {
    loginWindow.close();
    loginWindow = null;
  }
  if (launcherWindow && !launcherWindow.isDestroyed()) {
    launcherWindow.loadFile(path.join(__dirname, 'ui', 'settings.html')).catch(() => {});
    focusWindow(launcherWindow);
    return;
  }
  launcherWindow = new BrowserWindow({
    width: 980, height: 760, frame: true, resizable: true, center: true,
    title: "Anti-Cheat Launcher",
    backgroundColor: '#0b1120',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });
  launcherWindow.loadFile(path.join(__dirname, 'ui', 'settings.html'));
  launcherWindow.once('ready-to-show', () => {
    launcherWindow?.show();
    launcherWindow?.focus();
  });
  launcherWindow.on('closed', () => {
    launcherWindow = null;
    if (!mainWindow && !loginWindow) app.quit();
  });
}

function createMainWindow() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    focusWindow(mainWindow);
    applyRuntimeProfileToWindow();
    return;
  }
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  const effective = getEffectiveTestSettings();
  const profile = getRuntimeProfile();
  
  mainWindow = new BrowserWindow({
    width: effective.kioskMode ? width : 1200,
    height: effective.kioskMode ? height : 800,
    show: false,
    backgroundColor: '#0b1120',
    kiosk: effective.kioskMode,
    fullscreen: effective.kioskMode,
    frame: !effective.kioskMode,
    alwaysOnTop: effective.kioskMode,
    skipTaskbar: effective.kioskMode,
    type: effective.kioskMode ? 'screen-saver' : undefined,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: profile !== 'browsing',
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow.webContents.setUserAgent(getAntiCheatUserAgent(profile));

  if (!requestHeaderHookRegistered) {
    session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
      if (activeClientSessionToken && isAllowedProtectedBackendUrl(details.url)) {
        details.requestHeaders['X-Protected-Client-Session'] = activeClientSessionToken;
        details.requestHeaders['Authorization'] = `Bearer ${activeClientSessionToken}`;
      }
      callback({ requestHeaders: details.requestHeaders });
    });
    requestHeaderHookRegistered = true;
  }

  if (effective.kioskMode) {
    mainWindow.setAlwaysOnTop(true, 'screen-saver');
    mainWindow.setContentProtection(true);
    Menu.setApplicationMenu(null);
  }

  mainWindow.loadFile(path.join(__dirname, 'ui', 'splash.html'));

  mainWindow.once('ready-to-show', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
      const targetUrl = String(
        activeClientSessionToken
          ? (config.quizUrl || '')
          : (testSettings.launchUrl || config.quizUrl || getDefaultDesktopTestUrl())
      ).trim();
      if (targetUrl) {
        setTimeout(() => { mainWindow?.loadURL(targetUrl); }, 1200);
      }
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    clearRuntimeIntervals();
    if (!launcherWindow && !loginWindow) app.quit();
  });

  mainWindow.webContents.on('did-finish-load', () => {
    if (!mainWindow || mainWindow.webContents.isDestroyed()) return;
    applyRuntimeProfileToWindow();
  });

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL, isMainFrame) => {
    if (!isMainFrame) return;
    if (String(validatedURL || '').startsWith('file:') || String(validatedURL || '').startsWith('data:')) return;
    if (errorCode === -3) return;
    reportToLMS('load_failure', { errorCode, errorDescription, url: validatedURL });
    if (!activeClientSessionToken) {
      createSettingsWindow();
      mainWindow?.close();
      dialog.showErrorBox('Launch Failed', `Could not open ${validatedURL || 'the requested page'}.\n\n${errorDescription || 'The page failed to load.'}`);
      return;
    }
    showMainWindowLoadFailure(validatedURL, `Error ${errorCode}: ${errorDescription || 'The page failed to load.'}`);
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (String(url || '').startsWith('anticheat://')) {
      event.preventDefault();
      handleOpenUrl(url).then(() => showDesktopEntryWindow(false, true));
      return;
    }
    if (!isNavigationBlocked(url)) return;
    event.preventDefault();
    reportToLMS('security_violation', { reason: `Attempted unauthorized navigation to: ${url}` });
    if (shouldShowSecurityDialogs()) {
      dialog.showMessageBox({ type: 'warning', title: 'Access Denied', message: 'Unauthorized website access blocked.' });
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (String(url || '').startsWith('anticheat://')) {
      handleOpenUrl(url).then(() => showDesktopEntryWindow(false, true));
      return { action: 'deny' };
    }
    if (!isNavigationBlocked(url)) return { action: 'allow' };
    reportToLMS('security_violation', { reason: `Blocked popup: ${url}` });
    if (shouldShowSecurityDialogs()) {
      dialog.showMessageBox({ type: 'warning', title: 'Blocked Popup', message: 'Unauthorized popup access was blocked.' });
    }
    return { action: 'deny' };
  });

  ipcMain.on('set-student-identity', (event, identity) => {
    studentIdentity = identity && typeof identity === 'object'
      ? { ...studentIdentity, ...identity }
      : studentIdentity;
  });

  ipcMain.on('report-custom-violation', (e, r) => { reportToLMS('security_violation', { r, source: 'web' }); });

  globalShortcut.register('CommandOrControl+Shift+Alt+' + config.secretExitKey, () => app.quit());

  mainWindow.webContents.on('before-input-event', (e, i) => {
    const { key, control, alt, meta, shift } = i;
    const normalizedKey = String(key || '').trim();
    if (canUseDebugTools() && (normalizedKey === 'F12' || (control && shift && normalizedKey.toLowerCase() === 'i'))) {
      e.preventDefault();
      if (!mainWindow?.webContents.isDevToolsOpened()) {
        mainWindow?.webContents.openDevTools({ mode: 'detach' });
      } else {
        mainWindow?.webContents.focus();
      }
      return;
    }
    const effective = getEffectiveTestSettings();
    if (getRuntimeProfile() !== 'protected' || !effective.inputBlocking) return;
    const blocked = ['F12', 'PrintScreen', 'Tab', 'l', 'c', 'v', 'r'];
    if (normalizedKey === 'F12') {
      e.preventDefault();
      return;
    }
    if (blocked.includes(normalizedKey) && (control || alt || meta)) { if (normalizedKey !== 'Tab' || alt) e.preventDefault(); }
  });

  mainWindow.on('blur', () => {
    const effective = getEffectiveTestSettings();
    if (getRuntimeProfile() !== 'protected' || !effective.focusProtection) return;
    reportToLMS('focus_loss', { detail: 'Focus lost' });
    mainWindow?.focus();
  });

  clearRuntimeIntervals();
  const protectedPolicy = getEffectiveTestSettings();
  heartbeatInterval = setInterval(() => { reportToLMS('heartbeat', { status: 'active' }); }, protectedPolicy.heartbeatMs || 2000);
  processScanInterval = setInterval(scanProcesses, protectedPolicy.processScanMs || 1500);
  syncClipboardInterval();
  startProtectedSessionControlLoop();
}

ipcMain.handle('launch-configured-url', async (_event, payload = {}) => {
  try {
    const launchUrl = String(payload?.launchUrl || payload?.url || '').trim();
    if (!launchUrl) {
      return { ok: false, error: 'Launch target is required.' };
    }
    applyLaunchTarget({ launchUrl }, { persist: payload?.persist !== false });
    return { ok: true };
  } catch (error: any) {
    return { ok: false, error: String(error?.message || error || 'Launch target could not be opened.') };
  }
});

ipcMain.handle('desktop-login', async (_event, credentials = {}) => {
  try {
    const email = String(credentials?.email || '').trim();
    const password = String(credentials?.password || '');
    const staySignedIn = credentials?.staySignedIn !== false;
    if (!email || !password) {
      return { ok: false, error: 'Email and password are required.' };
    }
    const nextSession = await loginDesktopSession(email, password, staySignedIn);
    createSettingsWindow();
    return { ok: true, desktopSession: nextSession };
  } catch (error: any) {
    return { ok: false, error: String(error?.response?.data?.error || error?.message || error || 'Sign in failed.') };
  }
});

ipcMain.handle('desktop-logout', async () => {
  if (activeClientSessionToken) {
    return { ok: false, error: 'Logout is disabled while a protected exam or quiz session is active.' };
  }
  await logoutDesktopSession();
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.close();
  }
  createDesktopLoginWindow();
  return { ok: true };
});

ipcMain.handle('get-current-desktop-session', async () => ({
  ok: true,
  desktopSession,
  capabilities: desktopSession?.capabilities || getDesktopRoleCapabilities('student')
}));

ipcMain.handle('restore-desktop-session', async () => {
  const restored = await validateDesktopSession();
  if (!restored) return { ok: false, error: 'No valid saved desktop session.' };
  createSettingsWindow();
  return { ok: true, desktopSession: restored, capabilities: restored.capabilities };
});

ipcMain.handle('get-login-prefs', async () => ({
  ok: true,
  ...readLoginPrefs()
}));

ipcMain.handle('get-portal-back-state', async () => ({
  visible: shouldOfferPortalBackNavigation(),
  label: 'Back to Dashboard'
}));

ipcMain.handle('return-to-launcher', async () => {
  if (activeClientSessionToken) {
    return {
      ok: false,
      error: 'You cannot leave the dashboard while a protected exam or quiz session is active.'
    };
  }
  showDesktopEntryWindow(true, false);
  return { ok: true };
});

ipcMain.handle('get-launch-settings', async () => ({
  ...testSettings,
  launchUrl: getCurrentLauncherTargetUrl()
}));

ipcMain.handle('get-launch-diagnostics', async () => ({
  blockedProcesses: Array.isArray(config.blockedProcesses) ? [...config.blockedProcesses] : [],
  allowedDomains: Array.isArray(config.allowedDomains) ? [...config.allowedDomains] : [],
  backendUrl: String(config.backendUrl || '').trim(),
  quizUrl: String(config.quizUrl || '').trim(),
  vmKeywords: ['virtualbox', 'vmware', 'qemu', 'parallels', 'virtual machine', 'kvm'],
  hardwareDiagnostics: await resolveHardwareDiagnostics()
}));

function canManageAntiCheatPolicies() {
  return String(desktopSession?.account?.role || '').trim().toLowerCase() === 'admin'
    && desktopSession?.capabilities?.canUseStaffTools === true;
}

ipcMain.handle('get-anti-cheat-policies', async () => {
  if (!canManageAntiCheatPolicies()) {
    return { ok: false, error: 'Only administrators can manage anti-cheat policies.' };
  }
  try {
    const response = await axios.get(
      `${String(config.backendUrl || '').replace(/\/$/, '')}/api/protected-quizzes/admin/policies`,
      { headers: { 'X-Portal-Session': String(desktopSession?.token || '') }, timeout: 5000 }
    );
    return { ok: true, ...response.data };
  } catch (error: any) {
    return {
      ok: false,
      error: String(error?.response?.data?.error || error?.message || 'Anti-cheat policies could not be loaded.')
    };
  }
});

ipcMain.handle('save-anti-cheat-policy', async (_event, payload = {}) => {
  if (!canManageAntiCheatPolicies()) {
    return { ok: false, error: 'Only administrators can manage anti-cheat policies.' };
  }
  try {
    const response = await axios.post(
      `${String(config.backendUrl || '').replace(/\/$/, '')}/api/protected-quizzes/admin/policies`,
      payload,
      { headers: { 'X-Portal-Session': String(desktopSession?.token || '') }, timeout: 5000 }
    );
    return { ok: true, ...response.data };
  } catch (error: any) {
    return {
      ok: false,
      error: String(error?.response?.data?.error || error?.message || 'Anti-cheat policy could not be saved.')
    };
  }
});

ipcMain.handle('check-service-health', async () => {
  const frontendUrl = String(config.quizUrl || config.appUrl || '').trim();
  const backendUrl = String(config.backendUrl || '').trim();
  const check = async (url: string) => {
    try {
      const response = await axios.get(url, {
        timeout: 10000,
        validateStatus: () => true
      });
      return response.status >= 200 && response.status < 400;
    } catch (error) {
      return false;
    }
  };
  const [frontendOk, backendOk] = await Promise.all([
    check(frontendUrl),
    check(`${backendUrl}/health`)
  ]);
  return { frontendOk, backendOk };
});

ipcMain.handle('clear-launch-cache', async () => {
  try {
    await session.defaultSession.clearCache();
    await session.defaultSession.clearStorageData({
      storages: ['cachestorage', 'cookies', 'filesystem', 'indexdb', 'localstorage', 'serviceworkers', 'websql']
    });
    return { ok: true };
  } catch (error: any) {
    return { ok: false, error: String(error?.message || error || 'Failed to clear launch cache') };
  }
});

ipcMain.handle('open-main-devtools', async () => {
  if (!desktopSession?.capabilities?.canOpenDevTools) {
    return { ok: false, error: 'DevTools are only available to staff roles.' };
  }
  if (!mainWindow || mainWindow.isDestroyed()) {
    return { ok: false, error: 'The anti-cheat browser window is not open yet.' };
  }
  try {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
    focusWindow(mainWindow);
    return { ok: true };
  } catch (error: any) {
    return { ok: false, error: String(error?.message || error || 'Failed to open DevTools.') };
  }
});

app.on('will-quit', () => {
  reportToLMS('app_closed');
  try {
    desktopBridgeServer?.close();
  } catch (error) {}
  globalShortcut.unregisterAll();
});
