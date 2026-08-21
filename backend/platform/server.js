const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const dotenv = require('dotenv');
const QRCode = require('qrcode');
const webPush = require('web-push');
const { registerAdminIntegrationsRoutes } = require('./routes/admin-integrations-routes');
const { registerAcademicRoutes } = require('./routes/academic-routes');
const { registerAdminSupportRoutes } = require('./routes/admin-support-routes');
const { registerAuthRoutes } = require('./routes/auth-routes');
const { registerBackgroundGalleryRoutes } = require('./routes/background-gallery-routes');
const { registerFileRoutes } = require('./routes/files-routes');
const { registerLmsLiveQuizRoutes } = require('./routes/lms-live-quiz-routes');
const { registerLmsWhiteboardRoutes } = require('./routes/lms-whiteboard-routes');
const { registerLmsPersonalDashboardRoutes } = require('./routes/lms-personal-dashboard-routes');
const { registerAuthMaintenanceRoutes } = require('./routes/auth-maintenance-routes');
const { registerMailRoutes } = require('./routes/mail-routes');
const { registerMessengerCallsRoutes } = require('./routes/messenger-calls-routes');
const { registerMicrosoftAuthRoutes } = require('./routes/microsoft-auth-routes');
const { registerNewsRoutes } = require('./routes/news-routes');
const { registerPlatformOpsRoutes } = require('./routes/platform-ops-routes');
const { registerPortalSupportRoutes } = require('./routes/portal-support-routes');
const { registerProtectedExamRoutes } = require('./routes/protected-exam-routes');
const { registerSocialRoutes } = require('./routes/social-routes');
const { registerStudentServiceRoutes } = require('./routes/student-service-routes');
const { registerOrdersRoutes } = require('./routes/orders-routes');
const { registerChancelleryRoutes } = require('./routes/chancellery-routes');
const { registerSystemRoutes } = require('./routes/system-routes');
const { PlatformStore } = require('./store');
const { isPortalImpersonationRole } = require('./domains/auth-session-service');
const { sendFirebaseNotification } = require('./domains/firebase-push-service');
const { SOCIAL_PIN_API_VERSION } = require('./domains/social-pin-service');
const { STUDENT_SERVICE_API_MANIFEST_VERSION } = require('./contracts/student-service-api-contract');
const lmsLiveQuizService = require('./domains/lms-live-quiz-service');
const { asArray, uniqueStrings } = require('./utils');

const ROOT_DIR = path.resolve(__dirname, '..', '..');
dotenv.config({ path: path.join(ROOT_DIR, '.env') });

const HOST = process.env.KIU_REALTIME_HOST || process.env.KIU_LOCAL_BACKEND_BIND_HOST || '127.0.0.1';
const PORT = Number(process.env.KIU_REALTIME_PORT || 48933);
const APP_URL = String(process.env.KIU_PUBLIC_APP_URL || process.env.KIU_PORTAL_LOGIN_URL || 'http://127.0.0.1:8876').replace(/\/$/, '');
const BACKEND_URL = String(process.env.KIU_PUBLIC_BACKEND_URL || `http://${HOST}:${PORT}`).replace(/\/$/, '');
const UPLOADS_DIR = path.join(ROOT_DIR, 'kiu-realtime-bridge', 'uploads');
const LOCAL_STATE_PATH = path.join(ROOT_DIR, 'backend', 'platform', '.local-platform-state.json');
const ANTI_CHEAT_ROOT = path.join(ROOT_DIR, 'anti-cheat');
const DATABASE_URL = String(process.env.KIU_DATABASE_URL || '').trim();
const DATABASE_TABLE_NAME = String(process.env.KIU_DATABASE_TABLE_NAME || '').trim();
const ALLOW_LOCAL_PLATFORM_FALLBACK = String(process.env.KIU_ALLOW_LOCAL_PLATFORM_FALLBACK || '').trim()
    ? !['0', 'false', 'no', 'off'].includes(String(process.env.KIU_ALLOW_LOCAL_PLATFORM_FALLBACK || '').trim().toLowerCase())
    : ['development', 'dev', 'local', 'test'].includes(String(process.env.KIU_ENVIRONMENT || process.env.NODE_ENV || 'development').trim().toLowerCase());
const MAIL_TOKEN_ENCRYPTION_KEY = String(process.env.KIU_MICROSOFT_TOKEN_ENCRYPTION_KEY || '').trim();
const CORE_ONLY_MODE = ['1', 'true', 'yes', 'on'].includes(String(process.env.KIU_CORE_ONLY_MODE || '').trim().toLowerCase());
const STAFF_ROLES = new Set(['admin', 'professor', 'ta']);
const ADMIN_ROLES = new Set(['admin']);
const INTEGRATION_ADMIN_ROLES = new Set(['admin']);
const SELF_SERVICE_ACCOUNT_MUTABLE_FIELDS = new Set([
    'name',
    'nameEn',
    'displayName',
    'username',
    'handle',
    'avatar',
    'photo',
    'bio',
    'location',
    'website',
    'birthday',
    'interests',
    'availability',
    'officeHours',
    'coverImage'
]);
const CURRENT_ENVIRONMENT = String(process.env.KIU_ENVIRONMENT || process.env.NODE_ENV || 'development').trim().toLowerCase();
const IS_PRODUCTION_ENVIRONMENT = ['production', 'prod'].includes(CURRENT_ENVIRONMENT);
const LOGIN_RATE_LIMIT_WINDOW_MS = Number(process.env.KIU_AUTH_RATE_LIMIT_WINDOW_MS || 10 * 60 * 1000);
const LOGIN_RATE_LIMIT_MAX = Number(process.env.KIU_AUTH_RATE_LIMIT_MAX || 20);
const ACTIVATION_RATE_LIMIT_WINDOW_MS = Number(process.env.KIU_ACTIVATION_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000);
const ACTIVATION_RATE_LIMIT_MAX = Number(process.env.KIU_ACTIVATION_RATE_LIMIT_MAX || 5);
const RESET_RATE_LIMIT_WINDOW_MS = Number(process.env.KIU_RESET_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000);
const RESET_RATE_LIMIT_MAX = Number(process.env.KIU_RESET_RATE_LIMIT_MAX || 10);
const SSE_MAX_CONNECTIONS_PER_USER = Math.max(1, Number(process.env.KIU_SSE_MAX_CONNECTIONS_PER_USER || 4));
const SSE_MAX_CONNECTIONS_TOTAL = Math.max(SSE_MAX_CONNECTIONS_PER_USER, Number(process.env.KIU_SSE_MAX_CONNECTIONS_TOTAL || 200));
const EXAM_PORTAL_AUTH_RATE_LIMIT_WINDOW_MS = Number(process.env.KIU_EXAM_PORTAL_AUTH_RATE_LIMIT_WINDOW_MS || 10 * 60 * 1000);
const EXAM_PORTAL_AUTH_RATE_LIMIT_MAX = Number(process.env.KIU_EXAM_PORTAL_AUTH_RATE_LIMIT_MAX || 10);
const RAW_WEB_PUSH_CONTACT = String(process.env.KIU_WEB_PUSH_CONTACT || process.env.KIU_ADMIN_EMAIL || 'admin@kiu.local').trim();
const WEB_PUSH_CONTACT = /^[a-z]+:/i.test(RAW_WEB_PUSH_CONTACT)
    ? RAW_WEB_PUSH_CONTACT
    : (RAW_WEB_PUSH_CONTACT.includes('@') ? `mailto:${RAW_WEB_PUSH_CONTACT}` : 'mailto:admin@kiu.local');
const WEB_PUSH_VAPID_PUBLIC_KEY = String(process.env.KIU_VAPID_PUBLIC_KEY || '').trim();
const WEB_PUSH_VAPID_PRIVATE_KEY = String(process.env.KIU_VAPID_PRIVATE_KEY || '').trim();
const ANTI_CHEAT_RELEASE_CATALOG = {
    windows: {
        key: 'windows',
        label: 'Windows Desktop',
        eyebrow: 'Anti-Cheat Desktop App',
        title: 'Open the installed Windows app or install it if missing',
        description: 'This page tries to detect whether the anti-cheat desktop app is already registered on this Windows device. If it is installed, it should open immediately. If it does not, download the installer and run it once.',
        installLabel: 'Download Windows Installer',
        protocolUrl: 'anticheat://open?screen=settings&source=download-page&platform=windows',
        supportsProtocolCheck: true,
        installNotes: [
            'Install the desktop app once, then return to LMS and launch the quiz again.',
            'The anti-cheat app will register itself as the system handler for protected quiz links.'
        ],
        searchPaths: [
            process.env.KIU_ANTI_CHEAT_WINDOWS_PATH,
            path.join(ANTI_CHEAT_ROOT, 'out', 'make', 'squirrel.windows', 'x64', 'anti-cheat-1.0.0 Setup.exe'),
            path.join(ANTI_CHEAT_ROOT, 'out', 'anti-cheat-win32-x64', 'anti-cheat.exe')
        ],
        filenameByPath: (filePath) => /\.exe$/i.test(String(filePath || '')) && /setup/i.test(path.basename(filePath))
            ? 'anti-cheat-setup.exe'
            : 'anti-cheat.exe',
        publicUrl: String(process.env.KIU_ANTI_CHEAT_WINDOWS_URL || '').trim()
    },
    android: {
        key: 'android',
        label: 'Android',
        eyebrow: 'Anti-Cheat Android App',
        title: 'Install the Android anti-cheat app',
        description: 'Android students can install the anti-cheat APK directly. If the app is already installed, the open button should hand off to the protected anti-cheat browser.',
        installLabel: 'Download Android APK',
        protocolUrl: (() => {
            const params = new URLSearchParams({
                screen: 'launcher',
                source: 'download-page',
                platform: 'android',
                appUrl: APP_URL,
                backendUrl: BACKEND_URL,
                quizUrl: `${APP_URL}/lms.html`,
                examPortalUrl: `${APP_URL}/exam-portal.html`
            });
            return `anticheat://open?${params.toString()}`;
        })(),
        supportsProtocolCheck: true,
        installNotes: [
            'After downloading, allow installation from this source if Android asks.',
            'Open the app once after installation, then return to LMS and launch the quiz again.'
        ],
        searchPaths: [
            process.env.KIU_ANTI_CHEAT_ANDROID_PATH,
            path.join(ANTI_CHEAT_ROOT, 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk'),
            path.join(ANTI_CHEAT_ROOT, 'android', 'app', 'release', 'app-release.apk')
        ],
        filenameByPath: () => 'anti-cheat-android.apk',
        publicUrl: String(process.env.KIU_ANTI_CHEAT_ANDROID_URL || '').trim()
    },
    macos: {
        key: 'macos',
        label: 'macOS',
        eyebrow: 'Anti-Cheat Desktop App',
        title: 'Install the macOS anti-cheat app',
        description: 'Use the macOS anti-cheat app to open protected quizzes on Apple desktop devices.',
        installLabel: 'Download macOS Build',
        protocolUrl: 'anticheat://open?screen=settings&source=download-page&platform=macos',
        supportsProtocolCheck: true,
        installNotes: [
            'macOS builds usually need signing and notarization before student rollout.',
            'If this page says the build is unavailable, publish the signed macOS package first.'
        ],
        searchPaths: [
            process.env.KIU_ANTI_CHEAT_MACOS_PATH,
            path.join(ANTI_CHEAT_ROOT, 'out', 'make', 'zip', 'darwin', 'x64', 'anti-cheat-darwin-x64.zip'),
            path.join(ANTI_CHEAT_ROOT, 'out', 'make', 'zip', 'darwin', 'arm64', 'anti-cheat-darwin-arm64.zip'),
            path.join(ANTI_CHEAT_ROOT, 'out', 'make', 'dmg', 'x64', 'anti-cheat.dmg')
        ],
        filenameByPath: (filePath) => path.basename(String(filePath || '')) || 'anti-cheat-macos.zip',
        publicUrl: String(process.env.KIU_ANTI_CHEAT_MACOS_URL || '').trim()
    },
    linux: {
        key: 'linux',
        label: 'Linux',
        eyebrow: 'Anti-Cheat Desktop App',
        title: 'Install the Linux anti-cheat app',
        description: 'Use the Linux anti-cheat package on supported desktop environments.',
        installLabel: 'Download Linux Build',
        protocolUrl: 'anticheat://open?screen=settings&source=download-page&platform=linux',
        supportsProtocolCheck: true,
        installNotes: [
            'Publish the package format that matches your student environment, such as .deb or .rpm.',
            'If no Linux package is listed yet, Windows should remain the required exam platform.'
        ],
        searchPaths: [
            process.env.KIU_ANTI_CHEAT_LINUX_PATH,
            path.join(ANTI_CHEAT_ROOT, 'out', 'make', 'deb', 'x64', 'anti-cheat_1.0.0_amd64.deb'),
            path.join(ANTI_CHEAT_ROOT, 'out', 'make', 'rpm', 'x64', 'anti-cheat-1.0.0.x86_64.rpm'),
            path.join(ANTI_CHEAT_ROOT, 'out', 'make', 'zip', 'linux', 'x64', 'anti-cheat-linux-x64.zip')
        ],
        filenameByPath: (filePath) => path.basename(String(filePath || '')) || 'anti-cheat-linux.zip',
        publicUrl: String(process.env.KIU_ANTI_CHEAT_LINUX_URL || '').trim()
    }
};
const APP_ORIGIN = (() => {
    try {
        return new URL(APP_URL).origin;
    } catch (error) {
        return APP_URL;
    }
})();
const EXTRA_CORS_ORIGINS = String(process.env.KIU_EXTRA_CORS_ORIGINS || '')
    .split(',')
    .map((value) => String(value || '').trim())
    .filter(Boolean);

function isLoopbackOrigin(origin) {
    try {
        const parsed = new URL(String(origin || '').trim());
        return ['127.0.0.1', 'localhost'].includes(parsed.hostname);
    } catch (error) {
        return false;
    }
}

const ALLOWED_CORS_ORIGINS = (() => {
    const allowed = new Set();
    if (APP_ORIGIN) {
        allowed.add(APP_ORIGIN);
    }
    EXTRA_CORS_ORIGINS.forEach((origin) => allowed.add(origin));
    const includeDefaultLoopbackOrigins = !IS_PRODUCTION_ENVIRONMENT || isLoopbackOrigin(APP_ORIGIN);
    if (includeDefaultLoopbackOrigins) {
        allowed.add('http://127.0.0.1:8876');
        allowed.add('http://localhost:8876');
    }
    try {
        const parsed = new URL(APP_URL);
        if (includeDefaultLoopbackOrigins && parsed.hostname === '127.0.0.1') {
            allowed.add(`http://localhost${parsed.port ? `:${parsed.port}` : ''}`);
        } else if (includeDefaultLoopbackOrigins && parsed.hostname === 'localhost') {
            allowed.add(`http://127.0.0.1${parsed.port ? `:${parsed.port}` : ''}`);
        }
    } catch (error) {}
    return allowed;
})();

function parseRtcServerUrls(value) {
    return String(value || '')
        .split(',')
        .map(entry => String(entry || '').trim())
        .filter(Boolean);
}

function buildRtcConfig() {
    const turnUrls = parseRtcServerUrls(process.env.KIU_TURN_URLS || '');
    const stunUrls = parseRtcServerUrls(process.env.KIU_STUN_URLS || 'stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302');
    return {
        iceServers: [
            ...stunUrls.map(url => ({ urls: url })),
            ...(turnUrls.length ? [{
                urls: turnUrls,
                username: String(process.env.KIU_TURN_USERNAME || '').trim(),
                credential: String(process.env.KIU_TURN_CREDENTIAL || '').trim()
            }] : [])
        ]
    };
}

let cachedWebPushConfig = null;

function getWebPushConfig() {
    if (cachedWebPushConfig) return cachedWebPushConfig;
    let publicKey = WEB_PUSH_VAPID_PUBLIC_KEY;
    let privateKey = WEB_PUSH_VAPID_PRIVATE_KEY;
    let generated = false;
    if ((!publicKey || !privateKey) && !IS_PRODUCTION_ENVIRONMENT) {
        const generatedKeys = webPush.generateVAPIDKeys();
        publicKey = publicKey || generatedKeys.publicKey;
        privateKey = privateKey || generatedKeys.privateKey;
        generated = true;
    }
    const enabled = Boolean(publicKey && privateKey);
    if (enabled) {
        webPush.setVapidDetails(WEB_PUSH_CONTACT, publicKey, privateKey);
    }
    cachedWebPushConfig = {
        enabled,
        publicKey,
        privateKey,
        contact: WEB_PUSH_CONTACT,
        generated
    };
    return cachedWebPushConfig;
}

let store = null;
let activeServer = null;
let shutdownStarted = false;
const inMemoryRateLimits = new Map();

const app = express();
app.disable('x-powered-by');
app.set(
    'trust proxy',
    Number.isFinite(Number(process.env.KIU_TRUST_PROXY_HOPS))
        ? Number(process.env.KIU_TRUST_PROXY_HOPS)
        : (IS_PRODUCTION_ENVIRONMENT ? 1 : 0)
);
// Gallery uploads arrive as data URLs, which are roughly one third larger than
// the original file. This allows a 100 MB gallery asset without changing the
// ordinary per-file upload cap.
app.use(express.json({ limit: process.env.KIU_MAX_JSON_BODY_BYTES || '160mb' }));
app.use((request, response, next) => {
    const origin = String(request.headers.origin || '').trim();
    if (origin && ALLOWED_CORS_ORIGINS.has(origin)) {
        response.setHeader('Access-Control-Allow-Origin', origin);
        response.setHeader('Vary', 'Origin');
    }
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('X-Frame-Options', 'SAMEORIGIN');
    response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.setHeader('Permissions-Policy', 'camera=(self), microphone=(self), geolocation=()');
    if (APP_URL.startsWith('https://') || BACKEND_URL.startsWith('https://')) {
        response.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    response.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Portal-Session, X-Exam-Portal-Token, X-Protected-Client-Session');
    if (request.method === 'OPTIONS') {
        if (origin && !ALLOWED_CORS_ORIGINS.has(origin)) {
            response.status(403).end();
            return;
        }
        response.status(204).end();
        return;
    }
    next();
});

registerSystemRoutes(app, {
    buildProductionReadinessStatus,
    detectDownloadPlatformFromRequest,
    enforceRateLimit,
    getAntiCheatDownloadCatalog,
    normalizeDownloadPlatformKey,
    renderAntiCheatDownloadPage,
    resolveAntiCheatDownload,
    resolveRequestedDownloadPlatform,
    sendAntiCheatDownloadFile,
    sendError,
    requireSessionAccount,
    socialPinApiVersion: SOCIAL_PIN_API_VERSION,
    studentServiceApiManifestVersion: STUDENT_SERVICE_API_MANIFEST_VERSION
});

const sseClients = new Map();

function sendError(response, status, error, extra = {}) {
    response.status(status).json({ ok: false, error, ...extra });
}

function normalizeDownloadPlatformKey(value = '') {
    const normalized = String(value || '').trim().toLowerCase();
    if (!normalized) return '';
    if (['windows', 'win', 'desktop', 'pc'].includes(normalized)) return 'windows';
    if (['android', 'apk'].includes(normalized)) return 'android';
    if (['linux', 'deb', 'rpm'].includes(normalized)) return 'linux';
    if (['macos', 'mac', 'osx', 'darwin'].includes(normalized)) return 'macos';
    return '';
}

function detectDownloadPlatformFromRequest(request) {
    const userAgent = String(request.headers['user-agent'] || '').toLowerCase();
    if (/android/.test(userAgent)) return 'android';
    if (/iphone|ipad|ipod/.test(userAgent)) return 'ios';
    if (/macintosh|mac os x/.test(userAgent)) return 'macos';
    if (/linux|x11/.test(userAgent) && !/android/.test(userAgent)) return 'linux';
    if (/windows|win64|wow64/.test(userAgent)) return 'windows';
    return 'windows';
}

function resolveRequestedDownloadPlatform(request) {
    const requested = normalizeDownloadPlatformKey(request.query.platform || request.params.platform || '');
    if (requested) return requested;
    const detected = detectDownloadPlatformFromRequest(request);
    return normalizeDownloadPlatformKey(detected) || 'windows';
}

function resolveAntiCheatDownload(platformKey) {
    const entry = ANTI_CHEAT_RELEASE_CATALOG[platformKey] || null;
    if (!entry) return null;
    if (entry.publicUrl) {
        return {
            platform: platformKey,
            filename: entry.filenameByPath(entry.publicUrl),
            publicUrl: entry.publicUrl,
            path: '',
            available: true
        };
    }
    const localPath = (entry.searchPaths || [])
        .map(candidate => String(candidate || '').trim())
        .find(candidate => candidate && fs.existsSync(candidate));
    if (!localPath) {
        return {
            platform: platformKey,
            filename: entry.filenameByPath(''),
            publicUrl: '',
            path: '',
            available: false
        };
    }
    return {
        platform: platformKey,
        filename: entry.filenameByPath(localPath),
        publicUrl: '',
        path: localPath,
        available: true
    };
}

function sendAntiCheatDownloadFile(response, download, platformKey) {
    const entry = ANTI_CHEAT_RELEASE_CATALOG[platformKey] || null;
    if (!entry || !download?.available) {
        sendError(response, 404, `${entry?.label || 'Requested'} anti-cheat build is not available on this server yet.`);
        return;
    }
    if (download.publicUrl) {
        response.redirect(download.publicUrl);
        return;
    }
    response.download(download.path, download.filename);
}

function getAntiCheatDownloadCatalog() {
    return Object.values(ANTI_CHEAT_RELEASE_CATALOG).map(entry => {
        const resolved = resolveAntiCheatDownload(entry.key);
        return {
            key: entry.key,
            label: entry.label,
            available: Boolean(resolved?.available),
            filename: resolved?.filename || '',
            pageUrl: `${BACKEND_URL}/download/${encodeURIComponent(entry.key)}`,
            fileUrl: `${BACKEND_URL}/download/${encodeURIComponent(entry.key)}/file`,
            protocolUrl: entry.protocolUrl || '',
            publicUrl: resolved?.publicUrl || ''
        };
    });
}

function escapeHtml(value = '') {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function renderAntiCheatDownloadPage({ selectedPlatform = 'windows', selectedDownload = null } = {}) {
    const entry = ANTI_CHEAT_RELEASE_CATALOG[selectedPlatform] || ANTI_CHEAT_RELEASE_CATALOG.windows;
    const directDownloadUrl = `${BACKEND_URL}/download/${encodeURIComponent(entry.key)}/file`;
    const protocolUrl = entry.protocolUrl || 'anticheat://open?screen=settings&source=download-page';
    const installAvailability = selectedDownload?.available
        ? `Installer file: <code>${escapeHtml(selectedDownload.filename)}</code>`
        : 'Build not uploaded yet for this platform.';
    const platformCards = Object.values(ANTI_CHEAT_RELEASE_CATALOG).map(item => {
        const platformDownload = resolveAntiCheatDownload(item.key);
        const isSelected = item.key === entry.key;
        return `
            <a class="platform-card${isSelected ? ' is-selected' : ''}" href="${escapeHtml(`${BACKEND_URL}/download/${item.key}`)}">
                <div class="platform-card-title">${escapeHtml(item.label)}</div>
                <div class="platform-card-copy">${platformDownload?.available ? 'Build available' : 'Build not published yet'}</div>
            </a>
        `;
    }).join('');
    const installNotesMarkup = (entry.installNotes || [])
        .map(note => `<div>${escapeHtml(note)}</div>`)
        .join('');
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Anti-Cheat Desktop App</title>
    <style>
        :root {
            color-scheme: dark;
            --bg: #08111f;
            --panel: rgba(15, 23, 42, 0.92);
            --line: rgba(148, 163, 184, 0.2);
            --text: #e2e8f0;
            --muted: #94a3b8;
            --accent: #60a5fa;
            --accent-strong: #2563eb;
            --ok-bg: rgba(22, 163, 74, 0.14);
            --ok-text: #86efac;
            --warn-bg: rgba(245, 158, 11, 0.14);
            --warn-text: #fcd34d;
        }
        * { box-sizing: border-box; }
        body {
            margin: 0;
            font-family: "Segoe UI", system-ui, sans-serif;
            background:
                radial-gradient(circle at top, rgba(37, 99, 235, 0.18), transparent 38%),
                linear-gradient(180deg, #0b1220 0%, #08111f 100%);
            color: var(--text);
            min-height: 100vh;
            display: grid;
            place-items: center;
            padding: 24px;
        }
        .panel {
            width: min(760px, 100%);
            background: var(--panel);
            border: 1px solid var(--line);
            border-radius: 24px;
            padding: 28px;
            box-shadow: 0 24px 70px rgba(0, 0, 0, 0.38);
        }
        .eyebrow {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            border-radius: 999px;
            background: rgba(96, 165, 250, 0.12);
            color: #bfdbfe;
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 0.04em;
            text-transform: uppercase;
        }
        h1 {
            margin: 18px 0 12px;
            font-size: 34px;
            line-height: 1.1;
        }
        p {
            margin: 0;
            color: var(--muted);
            line-height: 1.65;
        }
        .status {
            margin-top: 22px;
            padding: 16px 18px;
            border-radius: 18px;
            background: rgba(148, 163, 184, 0.1);
            border: 1px solid var(--line);
            font-size: 14px;
            line-height: 1.6;
        }
        .status.is-success {
            background: var(--ok-bg);
            color: var(--ok-text);
            border-color: rgba(34, 197, 94, 0.28);
        }
        .status.is-warning {
            background: var(--warn-bg);
            color: var(--warn-text);
            border-color: rgba(245, 158, 11, 0.26);
        }
        .actions {
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
            margin-top: 22px;
        }
        .platform-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 12px;
            margin-top: 18px;
        }
        .platform-card {
            display: grid;
            gap: 6px;
            padding: 14px 16px;
            border-radius: 16px;
            border: 1px solid var(--line);
            background: rgba(15, 23, 42, 0.6);
            color: var(--text);
            text-decoration: none;
        }
        .platform-card.is-selected {
            border-color: rgba(96, 165, 250, 0.44);
            background: rgba(37, 99, 235, 0.16);
        }
        .platform-card-title {
            font-size: 14px;
            font-weight: 800;
        }
        .platform-card-copy {
            font-size: 12px;
            color: var(--muted);
        }
        .btn {
            appearance: none;
            border: 0;
            cursor: pointer;
            text-decoration: none;
            padding: 13px 18px;
            border-radius: 14px;
            font-weight: 700;
            font-size: 14px;
            transition: transform 0.16s ease, opacity 0.16s ease, background 0.16s ease;
        }
        .btn:hover { transform: translateY(-1px); }
        .btn-primary {
            background: linear-gradient(135deg, var(--accent), var(--accent-strong));
            color: white;
        }
        .btn-secondary {
            background: rgba(148, 163, 184, 0.12);
            color: var(--text);
            border: 1px solid var(--line);
        }
        .meta {
            margin-top: 18px;
            padding-top: 18px;
            border-top: 1px solid var(--line);
            display: grid;
            gap: 8px;
            font-size: 13px;
            color: var(--muted);
        }
        code {
            font-family: Consolas, "Courier New", monospace;
            color: #dbeafe;
        }
        @media (max-width: 640px) {
            .panel { padding: 22px; border-radius: 20px; }
            h1 { font-size: 28px; }
            .actions { flex-direction: column; }
            .btn { width: 100%; text-align: center; }
        }
    </style>
</head>
<body>
    <main class="panel">
        <div class="eyebrow">${escapeHtml(entry.eyebrow)}</div>
        <h1>${escapeHtml(entry.title)}</h1>
        <p>${escapeHtml(entry.description)}</p>

        <div class="platform-grid">${platformCards}</div>

        <div id="status" class="status">${entry.supportsProtocolCheck ? 'Checking whether the anti-cheat app is already registered on this device...' : 'Choose the correct build for this device and install it before returning to LMS.'}</div>

        <div class="actions">
            ${entry.supportsProtocolCheck ? `<button id="open-app" type="button" class="btn btn-primary">Open Anti-Cheat App</button>` : ''}
            <a class="btn btn-secondary" href="${escapeHtml(directDownloadUrl)}">${escapeHtml(entry.installLabel)}</a>
        </div>

        <div class="meta">
            <div>App protocol: <code>${escapeHtml(protocolUrl)}</code></div>
            <div>${installAvailability}</div>
            <div>If the app opens, return to LMS and click the quiz again.</div>
            ${installNotesMarkup}
        </div>
    </main>
    <script>
        (function () {
            const protocolUrl = ${JSON.stringify(protocolUrl)};
            const statusEl = document.getElementById('status');
            const openButton = document.getElementById('open-app');
            const supportsProtocolCheck = ${entry.supportsProtocolCheck ? 'true' : 'false'};
            let settled = false;

            function setStatus(message, tone) {
                statusEl.textContent = message;
                statusEl.className = 'status' + (tone ? ' is-' + tone : '');
            }

            function markDetected() {
                if (settled) return;
                settled = true;
                cleanup();
                setStatus('Anti-cheat app detected. If the window did not come to the front, click "Open Anti-Cheat App" again.', 'success');
            }

            function markMissing() {
                if (settled) return;
                settled = true;
                cleanup();
                setStatus('The anti-cheat app did not respond to the system protocol check. Install it with the button below, then open it once and return to LMS.', 'warning');
            }

            function handleVisibilityChange() {
                if (document.visibilityState === 'hidden') {
                    markDetected();
                }
            }

            function cleanup() {
                window.removeEventListener('blur', markDetected, true);
                window.removeEventListener('pagehide', markDetected, true);
                document.removeEventListener('visibilitychange', handleVisibilityChange, true);
            }

            function attemptOpen() {
                if (!supportsProtocolCheck) return;
                settled = false;
                cleanup();
                window.addEventListener('blur', markDetected, true);
                window.addEventListener('pagehide', markDetected, true);
                document.addEventListener('visibilitychange', handleVisibilityChange, true);
                setStatus('Trying to open the anti-cheat app through the registered protocol handler...', '');
                window.location.href = protocolUrl;
                window.setTimeout(markMissing, 1600);
            }

            if (openButton && supportsProtocolCheck) {
                openButton.addEventListener('click', attemptOpen);
                window.setTimeout(attemptOpen, 250);
            }
        })();
    </script>
</body>
</html>`;
}

async function buildLocalSetupBootstrap() {
    const catalog = getAntiCheatDownloadCatalog();
    const androidEntry = catalog.find(entry => entry.key === 'android') || catalog[0] || null;
    const appOrigin = APP_ORIGIN || APP_URL;
    const backendOrigin = BACKEND_URL;
    const setupUrl = `${appOrigin}/wifi-setup.html`;
    const loginUrl = `${appOrigin}/login.html`;
    const lmsUrl = `${appOrigin}/lms.html`;
    const backendHealthUrl = `${backendOrigin}/health`;
    const androidDownloadPageUrl = `${appOrigin}/download?platform=android`;
    const androidDownloadFileUrl = `${appOrigin}/download?platform=android&download=file`;
    const androidProtocolUrl = androidEntry?.protocolUrl || '';
    const qrOptions = {
        errorCorrectionLevel: 'M',
        margin: 1,
        width: 320,
        color: {
            dark: '#0f172a',
            light: '#ffffff'
        }
    };
    const setupQrDataUrl = await QRCode.toDataURL(androidDownloadPageUrl, qrOptions);
    const loginQrDataUrl = await QRCode.toDataURL(loginUrl, qrOptions);
    return {
        ok: true,
        appUrl: appOrigin,
        backendUrl: backendOrigin,
        setupUrl,
        loginUrl,
        lmsUrl,
        backendHealthUrl,
        androidDownloadPageUrl,
        androidDownloadFileUrl,
        androidProtocolUrl,
        setupQrDataUrl,
        loginQrDataUrl,
        lanHost: new URL(appOrigin).hostname,
        useLanMode: appOrigin !== 'http://127.0.0.1:8876'
    };
}

function pruneSseClientsForUser(userId) {
    const key = String(userId || '').trim();
    const set = sseClients.get(key);
    if (!set) return;
    set.forEach((client) => {
        if (client?.writableEnded || client?.destroyed || client?.closed) {
            set.delete(client);
        }
    });
    if (!set.size) sseClients.delete(key);
}

function registerSseClient(userId, response) {
    const key = String(userId || '').trim();
    if (!key) return false;
    pruneSseClientsForUser(key);
    let currentSet = sseClients.get(key);
    let currentCount = currentSet?.size || 0;
    // At per-user cap, drop the oldest stream so a fresh tab can connect.
    while (currentCount >= SSE_MAX_CONNECTIONS_PER_USER && currentSet?.size) {
        const oldest = currentSet.values().next().value;
        if (!oldest) break;
        try {
            if (!oldest.writableEnded && !oldest.destroyed) oldest.end();
        } catch (error) {}
        unregisterSseClient(key, oldest);
        currentSet = sseClients.get(key);
        currentCount = currentSet?.size || 0;
    }
    if (getSseConnectionCount() >= SSE_MAX_CONNECTIONS_TOTAL) return false;
    if (!sseClients.has(key)) sseClients.set(key, new Set());
    sseClients.get(key).add(response);
    return true;
}

function unregisterSseClient(userId, response) {
    const key = String(userId || '').trim();
    const set = sseClients.get(key);
    if (!set) return;
    set.delete(response);
    if (!set.size) sseClients.delete(key);
}

function getSseConnectionCount() {
    return Array.from(sseClients.values()).reduce((sum, set) => sum + set.size, 0);
}

function emitToResponses(responses, payload) {
    const serialized = `data: ${JSON.stringify(payload)}\n\n`;
    responses.forEach(response => {
        try {
            response.write(serialized);
        } catch (error) {
            // ignored
        }
    });
}

function pushEvent(userIds, payload) {
    const targets = [...new Set((Array.isArray(userIds) ? userIds : [userIds]).map(id => String(id || '').trim()).filter(Boolean))];
    targets.forEach(userId => {
        const responses = sseClients.get(userId);
        if (responses?.size) emitToResponses(responses, payload);
    });
}

function broadcastAll(payload) {
    sseClients.forEach(responses => {
        if (responses?.size) emitToResponses(responses, payload);
    });
}

function getSessionToken(request) {
    const bearer = String(request.headers.authorization || '').trim();
    if (bearer.toLowerCase().startsWith('bearer ')) return bearer.slice(7).trim();
    const queryToken = String(request.query?.token || '').trim();
    if (queryToken) return queryToken;
    return String(request.headers['x-portal-session'] || request.body?.token || '').trim();
}

function getSessionAccount(request) {
    if (!store) return null;
    const token = getSessionToken(request);
    if (!token) return null;
    const session = store.getSession(token);
    if (!session) return null;
    const account = store.getAccountById(session.userId);
    return account ? { token, session, account } : null;
}

function getSessionRole(sessionAccount) {
    const actualRole = String(sessionAccount?.session?.actualRole || sessionAccount?.account?.role || '').trim().toLowerCase();
    if (actualRole === 'admin') {
        const impersonatedRole = String(sessionAccount?.session?.impersonatedRole || '').trim().toLowerCase();
        if (impersonatedRole) return impersonatedRole;
    }
    return actualRole;
}

function getActualSessionRole(sessionAccount) {
    return String(sessionAccount?.session?.actualRole || sessionAccount?.account?.role || '').trim().toLowerCase();
}

function getActualActorUserId(sessionAccount) {
    return String(sessionAccount?.session?.userId || sessionAccount?.account?.id || '').trim();
}

function isSessionImpersonating(sessionAccount) {
    if (!isActualAdminSession(sessionAccount)) return false;
    const impersonatedRole = String(sessionAccount?.session?.impersonatedRole || '').trim();
    const impersonatedUserId = String(sessionAccount?.session?.impersonatedUserId || '').trim();
    return Boolean(impersonatedRole || impersonatedUserId);
}

function resolveImpersonatedActorUserId(sessionAccount) {
    if (!isSessionImpersonating(sessionAccount)) return '';
    const explicitUserId = String(sessionAccount?.session?.impersonatedUserId || '').trim();
    if (explicitUserId) return explicitUserId;
    const impersonatedRole = String(sessionAccount?.session?.impersonatedRole || '').trim().toLowerCase();
    if (!impersonatedRole || impersonatedRole === 'admin') return '';
    const account = sessionAccount?.account || {};
    const session = sessionAccount?.session || {};
    const facultyCode = normalizeAccessFaculty(
        account.facultyCode
        || account.faculty
        || session.faculty
        || 'ECON'
    );
    const portalState = store.state.portal?.state && typeof store.state.portal.state === 'object'
        ? store.state.portal.state
        : {};
    const profile = portalState.facultyProfiles?.[facultyCode];
    const rosterKey = impersonatedRole === 'professor'
        ? 'professors'
        : impersonatedRole === 'ta'
            ? 'tas'
            : impersonatedRole === 'student'
                ? 'students'
                : '';
    const roster = rosterKey && profile && Array.isArray(profile[rosterKey]) ? profile[rosterKey] : [];
    const candidates = roster
        .map(member => ({
            id: String(member?.id || '').trim(),
            facultyCode: normalizeAccessFaculty(member?.facultyCode || member?.faculty || facultyCode)
        }))
        .filter(member => member.id);
    const pickCandidate = (list = []) => {
        if (!list.length) return '';
        const facultyMatch = list.find(member => member.facultyCode === facultyCode);
        return (facultyMatch || list[0]).id;
    };
    if (isActualAdminSession(sessionAccount)) {
        const testingCandidates = candidates.filter(member => member.id.toLowerCase().startsWith('admin-testing-'));
        const testingPick = pickCandidate(testingCandidates);
        if (testingPick) return testingPick;
    }
    const rosterPick = pickCandidate(candidates);
    if (rosterPick) return rosterPick;
    if (impersonatedRole === 'student_service') {
        const preferredServiceId = `admin-testing-${facultyCode.toLowerCase()}-service`;
        if (store.state.accounts?.[preferredServiceId]) return preferredServiceId;
        const serviceTestingAccounts = Object.values(store.state.accounts || {})
            .map(entry => ({
                id: String(entry?.id || '').trim(),
                facultyCode: normalizeAccessFaculty(entry?.facultyCode || entry?.faculty || facultyCode)
            }))
            .filter(entry => {
                const normalizedId = entry.id.toLowerCase();
                return normalizedId.startsWith('admin-testing-') && normalizedId.endsWith('-service');
            });
        const servicePick = pickCandidate(serviceTestingAccounts);
        if (servicePick) return servicePick;
    }
    const accountCandidates = Object.values(store.state.accounts || {})
        .filter(entry => String(entry?.role || '').trim().toLowerCase() === impersonatedRole)
        .map(entry => ({
            id: String(entry?.id || '').trim(),
            facultyCode: normalizeAccessFaculty(entry?.facultyCode || entry?.faculty || facultyCode)
        }))
        .filter(entry => entry.id);
    if (isActualAdminSession(sessionAccount)) {
        const testingAccounts = accountCandidates.filter(entry => entry.id.toLowerCase().startsWith('admin-testing-'));
        const testingPick = pickCandidate(testingAccounts);
        if (testingPick) return testingPick;
    }
    return pickCandidate(accountCandidates);
}

function getActorUserId(sessionAccount) {
    if (isSessionImpersonating(sessionAccount)) {
        const impersonatedUserId = String(sessionAccount?.session?.impersonatedUserId || '').trim();
        if (impersonatedUserId) return impersonatedUserId;
        const resolvedUserId = resolveImpersonatedActorUserId(sessionAccount);
        if (resolvedUserId) return resolvedUserId;
    }
    return getActualActorUserId(sessionAccount);
}

function resolveSessionActorAccount(sessionAccount = {}) {
    const actorUserId = getActorUserId(sessionAccount);
    if (!actorUserId) return sessionAccount?.account || sessionAccount || {};
    return store.getAccountById(actorUserId) || { id: actorUserId, userId: actorUserId };
}

function isActualAdminSession(sessionAccount) {
    return getActualSessionRole(sessionAccount) === 'admin';
}

function resolveSessionBoundUserId(sessionAccount, requestedUserId = '') {
    const actorUserId = getActorUserId(sessionAccount);
    const requested = String(requestedUserId || '').trim();
    if (isActualAdminSession(sessionAccount) && !isSessionImpersonating(sessionAccount) && requested) {
        return requested;
    }
    if (isSessionImpersonating(sessionAccount) && requested && requested !== actorUserId) {
        return actorUserId;
    }
    return actorUserId;
}

function buildSelfServiceAccountPayload(payload = {}, sessionAccount) {
    const sanitizedPayload = {};
    SELF_SERVICE_ACCOUNT_MUTABLE_FIELDS.forEach((field) => {
        if (Object.prototype.hasOwnProperty.call(payload || {}, field)) {
            sanitizedPayload[field] = payload[field];
        }
    });
    sanitizedPayload.id = getActualActorUserId(sessionAccount);
    sanitizedPayload.email = String(sessionAccount?.account?.email || payload?.email || '').trim().toLowerCase();
    return sanitizedPayload;
}

function cloneJson(value) {
    if (value == null) return value;
    try {
        return JSON.parse(JSON.stringify(value));
    } catch (error) {
        return null;
    }
}

function getLiveQuizActorName(sessionAccount) {
    const actorUserId = getActorUserId(sessionAccount);
    const actualActorUserId = getActualActorUserId(sessionAccount);
    if (actorUserId && actorUserId !== actualActorUserId) {
        const personaAccount = store?.getAccountById?.(actorUserId);
        const personaName = String(
            personaAccount?.displayName
            || personaAccount?.nameEn
            || personaAccount?.name
            || personaAccount?.email
            || ''
        ).trim();
        if (personaName) return personaName;
    }
    return String(
        sessionAccount?.account?.displayName
        || sessionAccount?.account?.nameEn
        || sessionAccount?.account?.name
        || sessionAccount?.account?.email
        || 'Student'
    ).trim() || 'Student';
}

function getLiveQuizMergeHelpers() {
    return {
        getActorUserId,
        getLiveQuizActorName
    };
}

function mergeStudentLiveQuizAnswer(existingWorkspace = {}, submittedWorkspace = {}, sessionAccount = null) {
    return lmsLiveQuizService.mergeStudentLiveQuizAnswer(
        existingWorkspace,
        submittedWorkspace,
        sessionAccount,
        getLiveQuizMergeHelpers()
    );
}

function mergeStudentLiveQuizJoin(existingWorkspace = {}, submittedWorkspace = {}, sessionAccount = null) {
    return lmsLiveQuizService.mergeStudentLiveQuizJoin(
        existingWorkspace,
        submittedWorkspace,
        sessionAccount,
        getLiveQuizMergeHelpers()
    );
}

function submitStudentLiveQuizAnswer(existingWorkspace = {}, payload = {}, sessionAccount = null) {
    return lmsLiveQuizService.submitStudentLiveQuizAnswer(
        existingWorkspace,
        payload,
        sessionAccount,
        getLiveQuizMergeHelpers()
    );
}

function submitStudentLiveQuizJoin(existingWorkspace = {}, payload = {}, sessionAccount = null) {
    return lmsLiveQuizService.submitStudentLiveQuizJoin(
        existingWorkspace,
        payload,
        sessionAccount,
        getLiveQuizMergeHelpers()
    );
}

function mergeStaffLiveQuizWorkspace(existingWorkspace = {}, submittedWorkspace = {}) {
    return lmsLiveQuizService.mergeStaffLiveQuizWorkspace(existingWorkspace, submittedWorkspace);
}

function getRequesterIp(request) {
    return String(
        request.headers['x-forwarded-for']
        || request.headers['x-real-ip']
        || request.socket?.remoteAddress
        || request.ip
        || 'unknown'
    ).split(',')[0].trim() || 'unknown';
}

function cleanupRateLimitBucket(bucket, windowMs, now) {
    const cutoff = now - windowMs;
    while (bucket.length && bucket[0] <= cutoff) bucket.shift();
}

function enforceRateLimit(request, response, key, max, windowMs) {
    const safeMax = Math.max(1, Number(max || 1));
    const safeWindowMs = Math.max(1000, Number(windowMs || 60000));
    const now = Date.now();
    const bucketKey = `${key}:${getRequesterIp(request)}`;
    const bucket = inMemoryRateLimits.get(bucketKey) || [];
    cleanupRateLimitBucket(bucket, safeWindowMs, now);
    if (bucket.length >= safeMax) {
        const retryAfterSeconds = Math.max(1, Math.ceil((bucket[0] + safeWindowMs - now) / 1000));
        response.setHeader('Retry-After', String(retryAfterSeconds));
        sendError(response, 429, 'Too many requests. Please try again shortly.', {
            retryAfterSeconds
        });
        return false;
    }
    bucket.push(now);
    inMemoryRateLimits.set(bucketKey, bucket);
    return true;
}

function buildProductionReadinessStatus() {
    const runtimeConfig = store?.getRuntimeConfig?.() || {};
    const webPushConfig = getWebPushConfig();
    const microsoftAppConfigured = Boolean(
        String(process.env.KIU_MICROSOFT_CLIENT_ID || '').trim()
        && String(process.env.KIU_MICROSOFT_CLIENT_SECRET || '').trim()
        && String(process.env.KIU_MICROSOFT_REDIRECT_URI || '').trim()
    );
    const microsoftMailConfigured = Boolean(
        String(process.env.KIU_MICROSOFT_CLIENT_ID || '').trim()
        && String(process.env.KIU_MICROSOFT_CLIENT_SECRET || '').trim()
        && String(process.env.KIU_MICROSOFT_MAIL_REDIRECT_URI || '').trim()
        && MAIL_TOKEN_ENCRYPTION_KEY
    );
    const turnConfigured = Boolean(
        parseRtcServerUrls(process.env.KIU_TURN_URLS || '').length
        && String(process.env.KIU_TURN_USERNAME || '').trim()
        && String(process.env.KIU_TURN_CREDENTIAL || '').trim()
    );
    const usingHttpsApp = APP_URL.startsWith('https://');
    const usingHttpsBackend = BACKEND_URL.startsWith('https://');
    const usingDatabase = Boolean(DATABASE_URL && DATABASE_TABLE_NAME);
    const productionReady =
        usingHttpsApp
        && usingHttpsBackend
        && usingDatabase
        && !ALLOW_LOCAL_PLATFORM_FALLBACK
        && (CORE_ONLY_MODE || (turnConfigured && microsoftMailConfigured && webPushConfig.enabled));
    const blockers = [];
    if (!usingHttpsApp) blockers.push('KIU_PUBLIC_APP_URL is not HTTPS.');
    if (!usingHttpsBackend) blockers.push('KIU_PUBLIC_BACKEND_URL is not HTTPS.');
    if (!usingDatabase) blockers.push('PostgreSQL runtime storage is not fully configured.');
    if (ALLOW_LOCAL_PLATFORM_FALLBACK) blockers.push('Local platform fallback is enabled.');
    if (!CORE_ONLY_MODE) {
        if (!turnConfigured) blockers.push('TURN server credentials are missing for reliable video/audio calls.');
        if (!microsoftAppConfigured) blockers.push('Microsoft sign-in OAuth is not fully configured.');
        if (!microsoftMailConfigured) blockers.push('Outlook mail OAuth or token encryption is not fully configured.');
        if (!webPushConfig.enabled) blockers.push('Web push VAPID keys are not configured.');
    }
    return {
        environment: CURRENT_ENVIRONMENT,
        coreOnlyMode: CORE_ONLY_MODE,
        productionReady,
        blockers,
        checks: {
            httpsApp: usingHttpsApp,
            httpsBackend: usingHttpsBackend,
            postgresConfigured: usingDatabase,
            localFallbackDisabled: !ALLOW_LOCAL_PLATFORM_FALLBACK,
            turnConfigured,
            microsoftAppConfigured,
            microsoftMailConfigured,
            browserPushImplemented: webPushConfig.enabled,
            fileStorageMode: runtimeConfig.fileStorageMode || 'external',
            storageDriver: runtimeConfig.storageDriver || 'postgres'
        }
    };
}

function buildPortalPageUrl(routePage = '', routeData = {}) {
    const page = String(routePage || '').trim().toLowerCase();
    const query = new URLSearchParams();
    Object.entries(routeData && typeof routeData === 'object' ? routeData : {}).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') return;
        query.set(String(key), String(value));
    });
    let pathname = 'index.html';
    if (page && !['home', 'dashboard'].includes(page)) {
        pathname = `${page}.html`;
    }
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return `${APP_URL}/${pathname}${suffix}`;
}

async function sendWebPushNotification(recipientUserId = '', notification = {}) {
    const normalizedUserId = String(recipientUserId || '').trim();
    if (!normalizedUserId || !store?.listPushSubscriptions) return;
    const webPushConfig = getWebPushConfig();
    if (!webPushConfig.enabled) return;
    const subscriptions = store.listPushSubscriptions(normalizedUserId);
    if (!subscriptions.length) return;
    const payload = JSON.stringify({
        title: String(notification.title || 'KIU update').trim() || 'KIU update',
        body: String(notification.body || '').trim(),
        tag: String(notification.type || notification.sourceDomain || 'kiu-update').trim() || 'kiu-update',
        url: buildPortalPageUrl(notification.routePage, notification.routeData || {}),
        data: {
            notificationId: String(notification.id || '').trim(),
            sourceDomain: String(notification.sourceDomain || '').trim(),
            routePage: String(notification.routePage || '').trim(),
            routeData: notification.routeData || {}
        }
    });
    for (const item of subscriptions) {
        try {
            await webPush.sendNotification({
                endpoint: item.endpoint,
                keys: {
                    auth: item.keys?.auth,
                    p256dh: item.keys?.p256dh
                }
            }, payload);
        } catch (error) {
            const statusCode = Number(error?.statusCode || 0);
            if ([404, 410].includes(statusCode)) {
                store.removePushSubscription(normalizedUserId, item.endpoint);
            }
        }
    }
}

function requireSessionAccount(request, response) {
    const sessionAccount = getSessionAccount(request);
    if (!sessionAccount) {
        sendError(response, 401, 'A valid LMS session is required.');
        return null;
    }
    return sessionAccount;
}

function requireSessionRole(request, response, allowedRoles = STAFF_ROLES) {
    const sessionAccount = requireSessionAccount(request, response);
    if (!sessionAccount) return null;
    const role = getSessionRole(sessionAccount);
    if (!allowedRoles.has(role)) {
        sendError(response, 403, 'You are not allowed to access this protected quiz route.');
        return null;
    }
    return sessionAccount;
}

function requireActualSessionRole(request, response, allowedRoles = STAFF_ROLES) {
    const sessionAccount = requireSessionAccount(request, response);
    if (!sessionAccount) return null;
    const actualRole = String(sessionAccount?.session?.actualRole || sessionAccount?.account?.role || '').trim().toLowerCase();
    if (!allowedRoles.has(actualRole)) {
        sendError(response, 403, 'You are not allowed to access this route.');
        return null;
    }
    return sessionAccount;
}

function getSessionActor(sessionAccount = {}) {
    const actorUserId = getActorUserId(sessionAccount);
    const actorRole = getSessionRole(sessionAccount);
    const actualActorUserId = getActualActorUserId(sessionAccount);
    let facultyCode = '';
    const personaAccount = actorUserId && actorUserId !== actualActorUserId
        ? store.getAccountById(actorUserId)
        : null;
    if (personaAccount) {
        facultyCode = normalizeAccessFaculty(personaAccount.facultyCode || personaAccount.faculty || '');
    } else {
        const account = sessionAccount.account || {};
        const session = sessionAccount.session || {};
        facultyCode = normalizeAccessFaculty(account.facultyCode || account.faculty || session.faculty || '');
    }
    return {
        actorUserId,
        actorRole,
        facultyCode
    };
}

function getRequestIpAddress(request) {
    const forwarded = String(request.headers['x-forwarded-for'] || '').split(',')[0].trim();
    return forwarded || String(request.socket?.remoteAddress || request.ip || '').trim();
}

function addRouteAuditEvent(request, sessionAccount, event = {}) {
    if (!store?.addAuditEvent) return null;
    const actor = getSessionActor(sessionAccount);
    const auditPayload = {
        actorUserId: actor.actorUserId,
        actorRole: actor.actorRole,
        requestId: String(request.headers['x-request-id'] || '').trim(),
        ipAddress: getRequestIpAddress(request),
        ...event
    };
    if (isSessionImpersonating(sessionAccount)) {
        auditPayload.actualActorUserId = getActualActorUserId(sessionAccount);
        auditPayload.actualActorRole = getActualSessionRole(sessionAccount);
    }
    return store.addAuditEvent(auditPayload);
}

function requireCourseStaffAccess(request, response, courseId, action = 'read', allowedRoles = STAFF_ROLES) {
    const sessionAccount = requireActualSessionRole(request, response, allowedRoles);
    if (!sessionAccount) return null;
    const actor = getSessionActor(sessionAccount);
    const normalizedCourseId = String(courseId || '').trim();
    if (!normalizedCourseId) {
        sendError(response, 400, 'Course id is required.');
        return null;
    }
    const parsedCourseId = parseLmsLiveQuizResourceKey(normalizedCourseId);
    const resolvedCourseId = String(parsedCourseId.courseId || normalizedCourseId).trim();
    if (!store.canAccessGradebookCourse(resolvedCourseId, actor.actorUserId, actor.actorRole, action)) {
        sendError(response, 403, 'You are not assigned to this course scope.');
        addRouteAuditEvent(request, sessionAccount, {
            eventDomain: 'course-access',
            eventType: 'scope-denied',
            entityType: 'course',
            entityId: parsedCourseId.resourceKey || normalizedCourseId,
            afterState: { action, courseId: resolvedCourseId, groupId: parsedCourseId.groupId || null }
        });
        return null;
    }
    return sessionAccount;
}

function getCourseIdFromResourceKey(resourceKey = '') {
    return parseLmsLiveQuizResourceKey(resourceKey).courseId;
}

function normalizeLmsLiveQuizScopeKey(value = '') {
    return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function stripLmsLiveQuizSectionSuffix(groupId = '') {
    const rawGroupId = String(groupId || '').trim();
    const sectionSuffixPrefix = '__lmssec_';
    const markerIndex = rawGroupId.lastIndexOf(sectionSuffixPrefix);
    if (markerIndex < 0) {
        return { groupId: rawGroupId, sectionType: '' };
    }
    const baseGroupId = rawGroupId.slice(0, markerIndex);
    const sectionType = rawGroupId.slice(markerIndex + sectionSuffixPrefix.length);
    return {
        groupId: baseGroupId || rawGroupId,
        sectionType: String(sectionType || '').trim().toLowerCase()
    };
}

function parseLmsLiveQuizResourceKey(resourceKey = '') {
    const raw = String(resourceKey || '').trim();
    if (!raw.includes('::')) {
        return { courseId: raw, groupId: null, resourceKey: raw, sectionType: '' };
    }
    const [courseId, ...groupParts] = raw.split('::');
    const sectionParts = stripLmsLiveQuizSectionSuffix(groupParts.join('::'));
    return {
        courseId: courseId || raw,
        groupId: sectionParts.groupId || null,
        resourceKey: raw,
        sectionType: sectionParts.sectionType || ''
    };
}

function getLmsLiveQuizEnrollmentGroupKey(enrollment = {}) {
    const sectionId = String(
        enrollment.sectionId
        || enrollment.section?.id
        || enrollment.section?.groupId
        || enrollment.groupId
        || ''
    ).trim();
    const sectionCode = String(enrollment.section?.code || enrollment.groupId || '').trim();
    if (!sectionId && !sectionCode) return '';
    const parsedSection = parseLmsLiveQuizResourceKey(sectionId || sectionCode);
    return parsedSection.groupId || sectionCode || sectionId;
}

function isStaffForLmsLiveQuizResource(parsedResourceKey = {}, userId = '', role = '') {
    const normalizedUserId = String(userId || '').trim();
    const normalizedRole = String(role || '').trim().toLowerCase();
    if (!normalizedUserId) return false;
    const courseId = String(parsedResourceKey.courseId || '').trim();
    const groupId = parsedResourceKey.groupId;
    const targetCourse = normalizeLmsLiveQuizScopeKey(courseId);
    const targetGroup = groupId ? normalizeLmsLiveQuizScopeKey(groupId) : '';
    return Object.values(store.state.sections || {}).some(section => {
        const parsedSectionCourse = parseLmsLiveQuizResourceKey(section?.courseId || '');
        const parsedSection = parseLmsLiveQuizResourceKey(section?.id || section?.code || '');
        const sectionCourseKeys = new Set([
            normalizeLmsLiveQuizScopeKey(section?.courseId || ''),
            normalizeLmsLiveQuizScopeKey(parsedSectionCourse.courseId || ''),
            normalizeLmsLiveQuizScopeKey(parsedSection.courseId || '')
        ].filter(Boolean));
        const sectionGroup = normalizeLmsLiveQuizScopeKey(parsedSection.groupId || section?.code || '');
        const courseMatches = sectionCourseKeys.has(targetCourse);
        if (!courseMatches) return false;
        if (targetGroup && sectionGroup && sectionGroup !== targetGroup) return false;
        const professorIds = [
            section?.professorId,
            section?.instructorUserId,
            section?.instructorId
        ].map(value => String(value || '').trim()).filter(Boolean);
        const taIds = [
            ...(Array.isArray(section?.taIds) ? section.taIds : []),
            section?.assistantUserId,
            section?.assistantId,
            section?.taId
        ].map(value => String(value || '').trim()).filter(Boolean);
        if (normalizedRole === 'professor') return professorIds.includes(normalizedUserId);
        if (normalizedRole === 'ta') return taIds.includes(normalizedUserId);
        return professorIds.includes(normalizedUserId) || taIds.includes(normalizedUserId);
    });
}

function isPortalCurriculumStaffForLiveQuiz(courseId = '', groupId = '', userId = '', role = '') {
    const portalState = store.state.portal?.state && typeof store.state.portal.state === 'object'
        ? store.state.portal.state
        : {};
    const normalizedRole = String(role || '').trim().toLowerCase();
    const normalizedUserId = String(userId || '').trim();
    if (!normalizedUserId || !['professor', 'ta'].includes(normalizedRole)) return false;
    const account = store.getAccountById(normalizedUserId);
    if (!account) return false;
    const facultyCode = normalizeAccessFaculty(account.facultyCode || account.faculty || '');
    const profile = portalState.facultyProfiles?.[facultyCode];
    if (!profile || typeof profile !== 'object') return false;
    const listed = normalizedRole === 'professor'
        ? asArray(profile.professors).some(member => String(member?.id || '').trim() === normalizedUserId)
        : asArray(profile.tas).some(member => String(member?.id || '').trim() === normalizedUserId);
    if (!listed) return false;
    const targetCourse = normalizeLmsLiveQuizScopeKey(courseId);
    const inCurriculum = asArray(profile.curriculum).some(subject =>
        normalizeLmsLiveQuizScopeKey(subject?.id || subject?.subjectId || '') === targetCourse
    );
    if (!inCurriculum) return false;
    if (!groupId) return true;
    const targetGroup = normalizeLmsLiveQuizScopeKey(groupId);
    const groups = asArray(portalState.availableGroups?.[courseId]);
    return groups.some(group => normalizeLmsLiveQuizScopeKey(group?.id || group?.name || '') === targetGroup);
}

function getLmsLiveQuizStaffIdentityTokens(userId = '') {
    const normalizedUserId = String(userId || '').trim();
    const tokens = new Set([normalizedUserId, normalizeLmsLiveQuizScopeKey(normalizedUserId)]);
    const account = store.getAccountById(normalizedUserId);
    if (!account) return tokens;
    [account.displayName, account.nameEn, account.name, account.email].forEach(value => {
        const token = String(value || '').trim();
        if (!token || token.toLowerCase() === 'tbd') return;
        tokens.add(token);
        tokens.add(normalizeLmsLiveQuizScopeKey(token));
    });
    return tokens;
}

function matchesLmsLiveQuizStaffToken(token = '', identityTokens = new Set()) {
    const raw = String(token || '').trim();
    if (!raw || raw.toLowerCase() === 'tbd') return false;
    return identityTokens.has(raw) || identityTokens.has(normalizeLmsLiveQuizScopeKey(raw));
}

function isAssignedViaLmsLiveQuizGroupRoster(courseId = '', groupId = '', userId = '', role = '') {
    const portalState = store.state.portal?.state && typeof store.state.portal.state === 'object'
        ? store.state.portal.state
        : {};
    const normalizedRole = String(role || '').trim().toLowerCase();
    const normalizedUserId = String(userId || '').trim();
    if (!normalizedUserId || !courseId) return false;
    const identityTokens = getLmsLiveQuizStaffIdentityTokens(normalizedUserId);
    const targetGroup = groupId ? normalizeLmsLiveQuizScopeKey(groupId) : '';
    return asArray(portalState.availableGroups?.[courseId]).some(group => {
        if (targetGroup && normalizeLmsLiveQuizScopeKey(group?.id || group?.name || '') !== targetGroup) return false;
        const profToken = String(group?.professorId || group?.prof || '').trim();
        const taToken = String(group?.taId || group?.assistantId || group?.ta || '').trim();
        if (normalizedRole === 'professor') return matchesLmsLiveQuizStaffToken(profToken, identityTokens);
        if (normalizedRole === 'ta') return matchesLmsLiveQuizStaffToken(taToken, identityTokens);
        return matchesLmsLiveQuizStaffToken(profToken, identityTokens)
            || matchesLmsLiveQuizStaffToken(taToken, identityTokens);
    });
}

function isStaffViaLmsCourseTeachingTeam(parsedResourceKey = {}, userId = '', role = '') {
    const normalizedUserId = String(userId || '').trim();
    const normalizedRole = String(role || '').trim().toLowerCase();
    if (!normalizedUserId) return false;
    const courseId = String(parsedResourceKey.courseId || '').trim();
    const groupId = String(parsedResourceKey.groupId || '').trim();
    const sectionType = String(parsedResourceKey.sectionType || '').trim().toLowerCase();
    const sectionSuffix = sectionType ? `__lmssec_${sectionType}` : '';
    const candidateKeys = uniqueStrings([
        parsedResourceKey.resourceKey,
        groupId ? `${courseId}::${groupId}${sectionSuffix}` : '',
        groupId ? `${courseId}::${groupId}` : '',
        courseId
    ]);
    return candidateKeys.some(key => {
        const lmsCourse = store.state.lmsCourses?.[key];
        const teachingTeam = Array.isArray(lmsCourse?.teachingTeam) ? lmsCourse.teachingTeam : [];
        return teachingTeam.some(member => {
            if (typeof member === 'string') return member === normalizedUserId;
            const memberId = String(member?.userId || member?.id || '').trim();
            const memberRole = String(member?.role || member?.assignmentRole || '').trim().toLowerCase();
            if (memberId !== normalizedUserId) return false;
            if (!normalizedRole || !memberRole) return true;
            return memberRole === normalizedRole
                || (normalizedRole === 'professor' && memberRole === 'instructor');
        });
    });
}

function isAdminTestingPersonaUserId(userId = '') {
    return String(userId || '').trim().toLowerCase().startsWith('admin-testing-');
}

function getAdminTestingPersonaFacultyCode(userId = '') {
    const normalized = String(userId || '').trim().toLowerCase();
    if (!normalized.startsWith('admin-testing-')) return '';
    const parts = normalized.split('-');
    if (parts.length < 3) return '';
    return normalizeAccessFaculty(parts[2]);
}

function isAdminTestingPersonaListedInFacultyProfile(profile = {}, userId = '', role = '') {
    const normalizedRole = String(role || '').trim().toLowerCase();
    const normalizedUserId = String(userId || '').trim();
    if (!normalizedUserId || !profile || typeof profile !== 'object') return false;
    if (normalizedRole === 'professor') {
        return asArray(profile.professors).some(member => String(member?.id || '').trim() === normalizedUserId);
    }
    if (normalizedRole === 'ta') {
        return asArray(profile.tas).some(member => String(member?.id || '').trim() === normalizedUserId);
    }
    return false;
}

function isAdminTestingPersonaCourseInFacultyScope(courseId = '', personaFaculty = '', profile = {}, portalState = {}) {
    const targetCourse = normalizeLmsLiveQuizScopeKey(courseId);
    if (!targetCourse || !personaFaculty) return false;
    if (asArray(profile.curriculum).some(subject =>
        normalizeLmsLiveQuizScopeKey(subject?.id || subject?.subjectId || '') === targetCourse
    )) {
        return true;
    }
    const structures = portalState.adminProgramStructures?.[personaFaculty];
    if (structures && typeof structures === 'object') {
        const tracks = ['prog', 'free', 'conc', 'minor'];
        const matchesProgramCourse = tracks.some(track => asArray(structures[track]).some(module =>
            asArray(module?.subModules).some(subject => {
                const ids = [
                    subject?.id,
                    subject?.sourceCourseId,
                    subject?.number,
                    subject?.n
                ].map(value => normalizeLmsLiveQuizScopeKey(value)).filter(Boolean);
                return ids.includes(targetCourse);
            })
        ));
        if (matchesProgramCourse) return true;
    }
    const courseFaculty = normalizeAccessFaculty(String(courseId || '').split('-')[0] || '');
    return Boolean(courseFaculty && courseFaculty === personaFaculty);
}

function isAdminTestingPersonaStudentForLiveQuiz(userId = '', courseId = '') {
    if (!isAdminTestingPersonaUserId(userId) || !courseId) return false;
    const account = store.getAccountById(userId);
    if (String(account?.role || '').trim().toLowerCase() !== 'student') return false;
    const personaFaculty = getAdminTestingPersonaFacultyCode(userId);
    if (!personaFaculty) return false;
    const portalState = store.state.portal?.state && typeof store.state.portal.state === 'object'
        ? store.state.portal.state
        : {};
    const profile = portalState.facultyProfiles?.[personaFaculty];
    return isAdminTestingPersonaCourseInFacultyScope(courseId, personaFaculty, profile, portalState);
}

function isAdminTestingPersonaStaffForLiveQuiz(userId = '', role = '', courseId = '') {
    if (!isAdminTestingPersonaUserId(userId) || !courseId) return false;
    const personaFaculty = getAdminTestingPersonaFacultyCode(userId);
    if (!personaFaculty) return false;
    const portalState = store.state.portal?.state && typeof store.state.portal.state === 'object'
        ? store.state.portal.state
        : {};
    const profile = portalState.facultyProfiles?.[personaFaculty];
    if (!isAdminTestingPersonaListedInFacultyProfile(profile, userId, role)) return false;
    return isAdminTestingPersonaCourseInFacultyScope(courseId, personaFaculty, profile, portalState);
}

function isAdminTestingImpersonationStaffForLiveQuiz(sessionAccount, courseId = '', groupId = '', userId = '', role = '') {
    if (!isSessionImpersonating(sessionAccount) || !isAdminTestingPersonaUserId(userId)) return false;
    if (isPortalCurriculumStaffForLiveQuiz(courseId, groupId, userId, role)) return true;
    return isAdminTestingPersonaStaffForLiveQuiz(userId, role, courseId);
}

function canAccessLmsLiveQuizAsStaff(sessionAccount, parsedResourceKey = {}, action = 'read') {
    if (isActualAdminSession(sessionAccount) && !isSessionImpersonating(sessionAccount)) return true;
    const actor = getSessionActor(sessionAccount);
    const courseId = String(parsedResourceKey.courseId || '').trim();
    const groupId = parsedResourceKey.groupId || null;
    const gradebookAction = action === 'write' ? 'score' : 'read';
    if (store.canAccessGradebookCourse(courseId, actor.actorUserId, actor.actorRole, gradebookAction)) {
        return true;
    }
    if (isStaffForLmsLiveQuizResource(parsedResourceKey, actor.actorUserId, actor.actorRole)) {
        return true;
    }
    if (isStaffViaLmsCourseTeachingTeam(parsedResourceKey, actor.actorUserId, actor.actorRole)) {
        return true;
    }
    if (isAssignedViaLmsLiveQuizGroupRoster(courseId, groupId, actor.actorUserId, actor.actorRole)) {
        return true;
    }
    if (isAdminTestingPersonaStaffForLiveQuiz(actor.actorUserId, actor.actorRole, courseId)) {
        return true;
    }
    if (isAdminTestingImpersonationStaffForLiveQuiz(sessionAccount, courseId, groupId, actor.actorUserId, actor.actorRole)) {
        return true;
    }
    return isPortalCurriculumStaffForLiveQuiz(courseId, groupId, actor.actorUserId, actor.actorRole);
}

function enrollmentMatchesLmsLiveQuizGroup(enrollment = {}, courseId = '', groupId = '') {
    if (normalizeLmsLiveQuizScopeKey(enrollment.courseId || enrollment.sourceCourseId || '') !== normalizeLmsLiveQuizScopeKey(courseId)) {
        return false;
    }
    if (!groupId) return true;
    const targetGroup = normalizeLmsLiveQuizScopeKey(groupId);
    const keys = new Set();
    const enrollmentGroupId = getLmsLiveQuizEnrollmentGroupKey(enrollment);
    if (enrollmentGroupId) keys.add(normalizeLmsLiveQuizScopeKey(enrollmentGroupId));
    const section = enrollment.section && typeof enrollment.section === 'object' ? enrollment.section : {};
    if (section.code) keys.add(normalizeLmsLiveQuizScopeKey(section.code));
    if (section.id) {
        const parsed = parseLmsLiveQuizResourceKey(section.id);
        if (parsed.groupId) keys.add(normalizeLmsLiveQuizScopeKey(parsed.groupId));
    }
    if (enrollment.groupId) keys.add(normalizeLmsLiveQuizScopeKey(enrollment.groupId));
    if (enrollment.groupName) keys.add(normalizeLmsLiveQuizScopeKey(enrollment.groupName));
    return keys.has(targetGroup);
}

/** Mirror client normalizeStudentScheduleValue — object-keyed maps must still grant LMS scope access. */
function normalizePortalStudentScheduleValue(schedule) {
    if (Array.isArray(schedule)) return schedule.filter(Boolean);
    if (schedule && typeof schedule === 'object') {
        if (Array.isArray(schedule.entries)) return schedule.entries.filter(Boolean);
        return Object.entries(schedule)
            .filter(([, value]) => value != null && value !== '')
            .map(([key, value]) => {
                if (value && typeof value === 'object' && !Array.isArray(value)) {
                    const hasEntryShape = Boolean(
                        value.courseId
                        || value.sourceCourseId
                        || value.groupName
                        || value.day
                        || value.time
                    );
                    if (hasEntryShape) {
                        return {
                            ...value,
                            courseId: value.courseId || value.sourceCourseId || (/^\d+$/.test(String(key)) ? '' : key),
                            groupId: typeof value.groupId === 'string' || typeof value.groupId === 'number'
                                ? value.groupId
                                : (value.groupName || '')
                        };
                    }
                }
                return { courseId: key, groupId: value };
            })
            .filter((entry) => entry.courseId || entry.groupId);
    }
    return [];
}

function isStudentViaLmsLiveQuizPortalSchedule(studentId = '', courseId = '', groupId = '') {
    const normalizedStudentId = String(studentId || '').trim();
    if (!normalizedStudentId || !courseId) return false;
    const portalState = store.state.portal?.state && typeof store.state.portal.state === 'object'
        ? store.state.portal.state
        : {};
    const schedule = normalizePortalStudentScheduleValue(
        portalState.studentSchedulesByStudent?.[normalizedStudentId]
    );
    if (!schedule.length) return false;
    return schedule.some(entry => enrollmentMatchesLmsLiveQuizGroup(entry, courseId, groupId));
}

function requireLmsLiveQuizWorkspaceAccess(request, response, resourceKey, action = 'read') {
    const sessionAccount = request.kiuSessionAccount || requireSessionAccount(request, response);
    if (!sessionAccount) return null;
    const actor = getSessionActor(sessionAccount);
    const parsedResourceKey = parseLmsLiveQuizResourceKey(resourceKey);
    const courseId = parsedResourceKey.courseId;
    const groupId = parsedResourceKey.groupId;
    if (!courseId) {
        sendError(response, 400, 'resourceKey is required.');
        return null;
    }
    if (STAFF_ROLES.has(actor.actorRole)) {
        if (!canAccessLmsLiveQuizAsStaff(sessionAccount, parsedResourceKey, action)) {
            sendError(response, 403, 'You are not assigned to this course scope.');
            addRouteAuditEvent(request, sessionAccount, {
                eventDomain: 'course-access',
                eventType: 'scope-denied',
                entityType: 'lms-live-quiz',
                entityId: parsedResourceKey.resourceKey || courseId,
                afterState: { action, courseId, groupId }
            });
            return null;
        }
        return sessionAccount;
    }
    if (actor.actorRole === 'student') {
        const enrollments = store.getStudentEnrollments(actor.actorUserId);
        const existingWorkspace = store.getLmsLiveQuizWorkspace(parsedResourceKey.resourceKey || resourceKey) || {};
        const isExplicitWorkspaceParticipant = asArray(existingWorkspace.sessions).some(session => (
            session?.participants
            && Object.prototype.hasOwnProperty.call(session.participants, actor.actorUserId)
        ));
        const canAccess = enrollments.some(enrollment =>
            enrollmentMatchesLmsLiveQuizGroup(enrollment, courseId, groupId)
        ) || isStudentViaLmsLiveQuizPortalSchedule(actor.actorUserId, courseId, groupId)
            || isExplicitWorkspaceParticipant
            || isAdminTestingPersonaStudentForLiveQuiz(actor.actorUserId, courseId);
        if (!canAccess) {
            sendError(response, 403, 'You are not assigned to this course scope.');
            return null;
        }
        return sessionAccount;
    }
    sendError(response, 403, 'You are not allowed to access this live quiz workspace.');
    return null;
}

function normalizeAccessFaculty(value = '') {
    return String(value || '').trim().toUpperCase();
}

function canAccessStudentAcademicRecord(sessionAccount, studentId = '') {
    const normalizedStudentId = String(studentId || '').trim();
    if (!normalizedStudentId) return false;
    if (isActualAdminSession(sessionAccount) && !isSessionImpersonating(sessionAccount)) return true;
    const actorUserId = getActorUserId(sessionAccount);
    if (actorUserId === normalizedStudentId) return true;
    const effectiveRole = getSessionRole(sessionAccount);
    if (['professor', 'ta'].includes(effectiveRole)) {
        return store.getStudentEnrollments(normalizedStudentId).some(enrollment =>
            store.isCourseTeachingStaff(enrollment.courseId, actorUserId, effectiveRole)
        );
    }
    if (effectiveRole === 'student_service') {
        const actor = getSessionActor(sessionAccount);
        const actorFaculty = normalizeAccessFaculty(actor.facultyCode || '');
        const studentAccount = store.getAccountById(normalizedStudentId);
        const studentFaculty = normalizeAccessFaculty(studentAccount?.facultyCode || studentAccount?.faculty || '');
        return !actorFaculty || !studentFaculty || actorFaculty === studentFaculty;
    }
    return false;
}

function getProtectedClientSessionToken(request, options = {}) {
    const allowBody = options.allowBody !== false;
    const allowQuery = options.allowQuery === true;
    const headerToken = String(request.headers['x-protected-client-session'] || '').trim();
    if (headerToken) return headerToken;
    const bearer = String(request.headers.authorization || '').trim();
    if (bearer.toLowerCase().startsWith('bearer ')) return bearer.slice(7).trim();
    if (allowBody) {
        const bodyToken = String(request.body?.clientSessionToken || '').trim();
        if (bodyToken) return bodyToken;
    }
    if (allowQuery) {
        const queryToken = String(request.query.clientSessionToken || '').trim();
        if (queryToken) return queryToken;
    }
    return '';
}

function requireProtectedQuizSession(request, response, courseId, quizId, options = {}) {
    const clientSessionToken = getProtectedClientSessionToken(request, options);
    if (!clientSessionToken) {
        sendError(response, 403, 'Protected quiz session token is required.');
        return null;
    }
    const current = store.getProtectedClientAttempt(courseId, quizId, clientSessionToken);
    if (!current) {
        sendError(response, 403, 'Protected quiz session is invalid or expired.');
        return null;
    }
    return { clientSessionToken, current };
}

function isAntiCheatBrowserRequest(request) {
    const userAgent = String(request.headers['user-agent'] || '').trim();
    const clientHeader = String(request.headers['x-protected-client-session'] || '').trim();
    return /AntiCheatBrowser\/\d+/i.test(userAgent) || Boolean(clientHeader);
}

function requireAntiCheatBrowserRequest(request, response) {
    if (isAntiCheatBrowserRequest(request)) return true;
    sendError(response, 403, 'This exam page must be opened in KIU Anti-Cheat Browser.');
    return false;
}

function getExamPortalToken(request, options = {}) {
    const allowBody = options.allowBody !== false;
    const headerToken = String(request.headers['x-exam-portal-token'] || '').trim();
    if (headerToken) return headerToken;
    if (allowBody) {
        const bodyToken = String(request.body?.token || '').trim();
        if (bodyToken) return bodyToken;
    }
    return '';
}

function requireExamPortalSession(request, response, options = {}) {
    const token = getExamPortalToken(request, options);
    if (!token) {
        sendError(response, 401, 'A valid exam portal session is required.');
        return null;
    }
    const session = store.getExamPortalSession(token);
    if (!session) {
        sendError(response, 401, 'Exam portal session is invalid or expired.');
        return null;
    }
    return { token, session };
}

app.use((request, response, next) => {
    const route = String(request.path || '').trim();
    const guardedPrefixes = ['/api/social', '/api/news', '/api/messenger', '/api/calls', '/api/notifications', '/api/events', '/api/lms/live-quizzes', '/api/lms/whiteboards'];
    const requiresBoundSession = guardedPrefixes.some(prefix => route === prefix || route.startsWith(`${prefix}/`));
    if (!requiresBoundSession) {
        next();
        return;
    }
    const sessionAccount = getSessionAccount(request);
    if (!sessionAccount) {
        sendError(response, 401, 'A valid LMS session is required.');
        return;
    }
    request.kiuSessionAccount = sessionAccount;
    request.body = request.body && typeof request.body === 'object' ? request.body : {};
    const actorUserId = getActorUserId(sessionAccount);
    if (route === '/api/events') {
        request.query.userId = resolveSessionBoundUserId(sessionAccount, request.query.userId);
    }
    if (route.startsWith('/api/news')) {
        request.query.userId = resolveSessionBoundUserId(sessionAccount, request.query.userId);
        request.body.actorId = actorUserId;
    }
    if (route.startsWith('/api/notifications')) {
        request.query.userId = resolveSessionBoundUserId(sessionAccount, request.query.userId);
        request.body.userId = resolveSessionBoundUserId(sessionAccount, request.body?.userId);
    }
    if (route.startsWith('/api/social')) {
        request.query.userId = resolveSessionBoundUserId(sessionAccount, request.query.userId);
        request.body.actorId = actorUserId;
        request.body.actorUserId = actorUserId;
        request.body.userId = resolveSessionBoundUserId(sessionAccount, request.body?.userId || request.body?.viewerUserId);
        request.body.viewerUserId = resolveSessionBoundUserId(sessionAccount, request.body?.viewerUserId || request.body?.userId);
        request.body.fromUserId = actorUserId;
    }
    if (route.startsWith('/api/messenger')) {
        request.query.userId = resolveSessionBoundUserId(sessionAccount, request.query.userId);
        request.query.actorId = actorUserId;
        request.body.actorId = actorUserId;
        request.body.senderId = actorUserId;
        request.body.fromUserId = actorUserId;
        request.body.userA = actorUserId;
    }
    if (route.startsWith('/api/calls')) {
        request.body.fromUserId = actorUserId;
        request.body.userId = actorUserId;
    }
    next();
});

function getMicrosoftConfig() {
    const tenantId = String(process.env.KIU_MICROSOFT_TENANT_ID || 'common').trim();
    const clientId = String(process.env.KIU_MICROSOFT_CLIENT_ID || '').trim();
    const clientSecret = String(process.env.KIU_MICROSOFT_CLIENT_SECRET || '').trim();
    return {
        enabled: Boolean(clientId && clientSecret),
        tenantId,
        clientId,
        clientSecret,
        redirectUri: String(process.env.KIU_MICROSOFT_REDIRECT_URI || `${BACKEND_URL}/api/portal/microsoft/callback`).trim(),
        scope: String(process.env.KIU_MICROSOFT_SCOPE || 'openid profile email User.Read').trim(),
        authorizeEndpoint: `https://login.microsoftonline.com/${encodeURIComponent(tenantId)}/oauth2/v2.0/authorize`,
        tokenEndpoint: `https://login.microsoftonline.com/${encodeURIComponent(tenantId)}/oauth2/v2.0/token`,
        graphMeEndpoint: 'https://graph.microsoft.com/v1.0/me?$select=id,displayName,mail,userPrincipalName'
    };
}

function getMicrosoftMailConfig() {
    const tenantId = String(process.env.KIU_MICROSOFT_TENANT_ID || 'common').trim();
    const clientId = String(process.env.KIU_MICROSOFT_CLIENT_ID || '').trim();
    const clientSecret = String(process.env.KIU_MICROSOFT_CLIENT_SECRET || '').trim();
    return {
        enabled: Boolean(clientId && clientSecret && MAIL_TOKEN_ENCRYPTION_KEY),
        tenantId,
        clientId,
        clientSecret,
        redirectUri: String(process.env.KIU_MICROSOFT_MAIL_REDIRECT_URI || `${BACKEND_URL}/api/mail/connect/callback`).trim(),
        scope: String(process.env.KIU_MICROSOFT_MAIL_SCOPE || 'offline_access openid profile email User.Read Mail.Read Mail.ReadWrite Mail.Send').trim(),
        authorizeEndpoint: `https://login.microsoftonline.com/${encodeURIComponent(tenantId)}/oauth2/v2.0/authorize`,
        tokenEndpoint: `https://login.microsoftonline.com/${encodeURIComponent(tenantId)}/oauth2/v2.0/token`,
        graphBaseUrl: 'https://graph.microsoft.com/v1.0'
    };
}

function getDefaultPortalLoginUrl() {
    return new URL('login.html', `${APP_URL.replace(/\/$/, '')}/`).toString();
}

function normalizeMicrosoftReturnTo(returnTo = '') {
    const fallback = getDefaultPortalLoginUrl();
    const candidateValue = String(returnTo || '').trim();
    if (!candidateValue) return fallback;
    try {
        const candidate = new URL(candidateValue, `${APP_URL.replace(/\/$/, '')}/`);
        const appOrigin = new URL(APP_URL).origin;
        if (candidate.origin !== appOrigin) return fallback;
        if (!/\/login(\.html)?$/i.test(candidate.pathname)) return fallback;
        candidate.hash = '';
        return candidate.toString();
    } catch (error) {
        return fallback;
    }
}

function buildMicrosoftPortalRedirect(returnTo = '', extras = {}) {
    const destination = new URL(normalizeMicrosoftReturnTo(returnTo));
    Object.entries(extras || {}).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') return;
        destination.searchParams.set(key, String(value));
    });
    return destination.toString();
}

function getDefaultPortalEmailUrl() {
    return new URL('index.html', `${APP_URL.replace(/\/$/, '')}/`).toString();
}

function normalizeMailReturnTo(returnTo = '') {
    const fallback = getDefaultPortalEmailUrl();
    const candidateValue = String(returnTo || '').trim();
    if (!candidateValue) return fallback;
    try {
        const candidate = new URL(candidateValue, `${APP_URL.replace(/\/$/, '')}/`);
        const appOrigin = new URL(APP_URL).origin;
        if (candidate.origin !== appOrigin) return fallback;
        candidate.hash = '';
        return candidate.toString();
    } catch (error) {
        return fallback;
    }
}

function buildMailPortalRedirect(returnTo = '', extras = {}) {
    const destination = new URL(normalizeMailReturnTo(returnTo));
    Object.entries(extras || {}).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') return;
        destination.searchParams.set(key, String(value));
    });
    return destination.toString();
}

function decodeJwtPayload(token = '') {
    const parts = String(token || '').trim().split('.');
    if (parts.length < 2) return null;
    try {
        const normalized = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
        const payload = Buffer.from(`${normalized}${padding}`, 'base64').toString('utf8');
        return JSON.parse(payload);
    } catch (error) {
        return null;
    }
}

async function exchangeMicrosoftAuthorizationCode(config, code) {
    const body = new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code: String(code || '').trim(),
        redirect_uri: config.redirectUri,
        grant_type: 'authorization_code',
        scope: config.scope
    });
    const tokenResponse = await fetch(config.tokenEndpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: body.toString()
    });
    const payload = await tokenResponse.json().catch(() => null);
    if (!tokenResponse.ok) {
        throw new Error(payload?.error_description || payload?.error || 'Microsoft token exchange failed.');
    }
    return payload || {};
}

async function fetchMicrosoftProfile(config, accessToken) {
    const token = String(accessToken || '').trim();
    if (!token) return null;
    const profileResponse = await fetch(config.graphMeEndpoint, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    const payload = await profileResponse.json().catch(() => null);
    if (!profileResponse.ok) {
        throw new Error(payload?.error?.message || 'Microsoft profile lookup failed.');
    }
    return payload || null;
}

async function exchangeMicrosoftRefreshToken(config, refreshToken) {
    const tokenValue = String(refreshToken || '').trim();
    if (!tokenValue) {
        throw new Error('Outlook mailbox refresh token is missing.');
    }
    const body = new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        refresh_token: tokenValue,
        redirect_uri: config.redirectUri,
        grant_type: 'refresh_token',
        scope: config.scope
    });
    const tokenResponse = await fetch(config.tokenEndpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: body.toString()
    });
    const payload = await tokenResponse.json().catch(() => null);
    if (!tokenResponse.ok) {
        throw new Error(payload?.error_description || payload?.error || 'Outlook token refresh failed.');
    }
    return payload || {};
}

async function fetchMicrosoftGraph(config, accessToken, graphPath, options = {}) {
    const token = String(accessToken || '').trim();
    if (!token) throw new Error('Microsoft Graph access token is missing.');
    const url = /^https?:\/\//i.test(String(graphPath || '').trim())
        ? String(graphPath || '').trim()
        : `${String(config.graphBaseUrl || 'https://graph.microsoft.com/v1.0').replace(/\/$/, '')}${String(graphPath || '').startsWith('/') ? '' : '/'}${String(graphPath || '').trim()}`;
    const response = await fetch(url, {
        method: options.method || 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: options.accept || 'application/json',
            ...(options.headers || {})
        },
        body: options.body
    });
    return response;
}

async function fetchMicrosoftGraphJson(config, accessToken, graphPath, options = {}) {
    const response = await fetchMicrosoftGraph(config, accessToken, graphPath, options);
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
        throw new Error(payload?.error?.message || payload?.error_description || payload?.error || 'Microsoft Graph request failed.');
    }
    return payload || {};
}

async function fetchMicrosoftGraphBinary(config, accessToken, graphPath, options = {}) {
    const response = await fetchMicrosoftGraph(config, accessToken, graphPath, options);
    const buffer = Buffer.from(await response.arrayBuffer());
    if (!response.ok) {
        const text = buffer.toString('utf8');
        let payload = null;
        try {
            payload = JSON.parse(text);
        } catch (error) {}
        throw new Error(payload?.error?.message || text || 'Microsoft Graph binary request failed.');
    }
    return {
        buffer,
        contentType: String(response.headers.get('content-type') || 'application/octet-stream').trim(),
        contentLength: Number(response.headers.get('content-length') || buffer.length || 0),
        contentDisposition: String(response.headers.get('content-disposition') || '').trim()
    };
}

function splitMicrosoftScope(scope = '') {
    return String(scope || '')
        .split(/\s+/)
        .map(value => String(value || '').trim())
        .filter(Boolean);
}

function getMailFolderDisplayName(folderKey = '') {
    const normalized = String(folderKey || '').trim().toLowerCase();
    if (normalized === 'sentitems') return 'Sent';
    if (normalized === 'drafts') return 'Drafts';
    return normalized ? `${normalized.charAt(0).toUpperCase()}${normalized.slice(1)}` : 'Inbox';
}

function mapGraphMailAddress(emailAddress = {}) {
    const current = emailAddress && typeof emailAddress === 'object' ? emailAddress : {};
    return {
        name: String(current.name || '').trim(),
        address: String(current.address || '').trim().toLowerCase()
    };
}

function mapGraphRecipientList(recipients = []) {
    return (Array.isArray(recipients) ? recipients : [])
        .map(item => mapGraphMailAddress(item?.emailAddress || item))
        .filter(item => item.address || item.name);
}

function extractGraphMessageBody(message = {}) {
    const body = message?.body && typeof message.body === 'object' ? message.body : {};
    return {
        contentType: String(body.contentType || '').trim().toLowerCase() || 'text',
        content: String(body.content || '').trim(),
        preview: String(message?.bodyPreview || '').trim()
    };
}

function mapGraphMessageSummary(message = {}, folderKey = '') {
    const from = mapGraphMailAddress(message?.from?.emailAddress || {});
    const body = extractGraphMessageBody(message);
    const attachments = Array.isArray(message?.attachments) ? message.attachments : [];
    return {
        id: String(message?.id || '').trim(),
        folderKey: String(folderKey || '').trim().toLowerCase() || 'inbox',
        internetMessageId: String(message?.internetMessageId || '').trim(),
        conversationId: String(message?.conversationId || '').trim(),
        subject: String(message?.subject || '(No subject)').trim() || '(No subject)',
        from,
        toRecipients: mapGraphRecipientList(message?.toRecipients || []),
        ccRecipients: mapGraphRecipientList(message?.ccRecipients || []),
        isRead: message?.isRead === true,
        hasAttachments: message?.hasAttachments === true || attachments.length > 0,
        attachmentCount: attachments.length,
        sentAt: String(message?.sentDateTime || '').trim(),
        receivedAt: String(message?.receivedDateTime || '').trim(),
        lastModifiedAt: String(message?.lastModifiedDateTime || '').trim(),
        webLink: String(message?.webLink || '').trim(),
        importance: String(message?.importance || '').trim().toLowerCase() || 'normal',
        snippet: body.preview,
        bodyPreview: body.preview,
        bodyType: body.contentType,
        body: body.content,
        cachedAt: new Date().toISOString(),
        attachments: attachments.map(item => ({
            id: String(item?.id || '').trim(),
            name: String(item?.name || '').trim(),
            contentType: String(item?.contentType || '').trim(),
            size: Number(item?.size || 0),
            isInline: item?.isInline === true
        }))
    };
}

function getMailMessageSortValue(message) {
    const value = String(message?.receivedAt || message?.sentAt || message?.lastModifiedAt || '').trim();
    const parsed = value ? new Date(value).getTime() : 0;
    return Number.isFinite(parsed) ? parsed : 0;
}

async function syncMicrosoftMailFolder(config, accessToken, folderKey, options = {}) {
    const normalizedFolderKey = String(folderKey || 'inbox').trim().toLowerCase() || 'inbox';
    const limit = Math.min(Math.max(Number(options.limit || 20), 1), 50);
    const unreadOnly = options.unreadOnly === true;
    const search = String(options.search || '').trim();
    const messageSelect = [
        'id',
        'subject',
        'from',
        'toRecipients',
        'ccRecipients',
        'receivedDateTime',
        'sentDateTime',
        'lastModifiedDateTime',
        'isRead',
        'hasAttachments',
        'bodyPreview',
        'importance',
        'conversationId',
        'internetMessageId',
        'webLink'
    ].join(',');

    let folderPayload = null;
    try {
        folderPayload = await fetchMicrosoftGraphJson(
            config,
            accessToken,
            `/me/mailFolders/${encodeURIComponent(normalizedFolderKey)}?$select=id,displayName,totalItemCount,unreadItemCount`
        );
    } catch (error) {
        folderPayload = null;
    }

    const basePath = search
        ? '/me/messages'
        : `/me/mailFolders/${encodeURIComponent(normalizedFolderKey)}/messages`;
    const listUrl = new URL(`${String(config.graphBaseUrl || 'https://graph.microsoft.com/v1.0').replace(/\/$/, '')}${basePath}`);
    listUrl.searchParams.set('$top', String(limit));
    listUrl.searchParams.set('$orderby', search ? 'receivedDateTime DESC' : 'receivedDateTime DESC');
    listUrl.searchParams.set('$select', messageSelect);
    if (unreadOnly) listUrl.searchParams.set('$filter', 'isRead eq false');
    if (search) {
        listUrl.searchParams.set('$search', `"${search.replace(/"/g, '\\"')}"`);
    }

    const listPayload = await fetchMicrosoftGraphJson(config, accessToken, listUrl.toString(), {
        headers: search ? { ConsistencyLevel: 'eventual' } : {}
    });
    const rawMessages = Array.isArray(listPayload?.value) ? listPayload.value : [];
    const messages = rawMessages
        .map(item => mapGraphMessageSummary(item, normalizedFolderKey))
        .filter(item => item.id)
        .sort((a, b) => getMailMessageSortValue(b) - getMailMessageSortValue(a));

    return {
        folderKey: normalizedFolderKey,
        displayName: String(folderPayload?.displayName || getMailFolderDisplayName(normalizedFolderKey)).trim(),
        totalCount: Number(folderPayload?.totalItemCount || messages.length || 0),
        unreadCount: Number(folderPayload?.unreadItemCount || messages.filter(item => !item.isRead).length || 0),
        messages,
        deltaLink: String(listPayload?.['@odata.deltaLink'] || '').trim(),
        syncedAt: new Date().toISOString()
    };
}

async function fetchMicrosoftMailMessage(config, accessToken, messageId) {
    const safeMessageId = String(messageId || '').trim();
    if (!safeMessageId) throw new Error('Message id is required.');
    const select = [
        'id',
        'subject',
        'from',
        'toRecipients',
        'ccRecipients',
        'receivedDateTime',
        'sentDateTime',
        'lastModifiedDateTime',
        'isRead',
        'hasAttachments',
        'bodyPreview',
        'body',
        'importance',
        'conversationId',
        'internetMessageId',
        'webLink'
    ].join(',');
    const payload = await fetchMicrosoftGraphJson(
        config,
        accessToken,
        `/me/messages/${encodeURIComponent(safeMessageId)}?$select=${encodeURIComponent(select)}&$expand=attachments($select=id,name,contentType,size,isInline)`
    );
    return mapGraphMessageSummary(payload, '');
}

async function buildGraphSendAttachments(rawAttachments = [], actorUserId = '') {
    const attachments = [];
    for (const item of Array.isArray(rawAttachments) ? rawAttachments : []) {
        const storageKey = String(item?.storageKey || item?.id || '').trim();
        if (!storageKey) continue;
        const file = store.getFile(storageKey);
        const ownerUserId = String(file?.ownerUserId || '').trim();
        const uploadedBy = String(file?.uploadedBy || '').trim();
        if (!file || (!ownerUserId && !uploadedBy) || (ownerUserId !== actorUserId && uploadedBy !== actorUserId)) continue;
        if (!file?.path || !fs.existsSync(file.path)) continue;
        const contentBytes = fs.readFileSync(file.path).toString('base64');
        attachments.push({
            '@odata.type': '#microsoft.graph.fileAttachment',
            name: String(file.name || item?.name || 'attachment.bin').trim() || 'attachment.bin',
            contentType: String(file.type || item?.type || 'application/octet-stream').trim() || 'application/octet-stream',
            contentBytes
        });
    }
    return attachments;
}

function updateMailConnectionStatus(userId, payload = {}) {
    return store.upsertMailConnection(userId, {
        lastSyncAt: payload.lastSyncAt || new Date().toISOString(),
        lastSyncStatus: payload.lastSyncStatus || 'completed',
        lastError: Object.prototype.hasOwnProperty.call(payload, 'lastError') ? payload.lastError : ''
    });
}

async function getMicrosoftMailAccess(userId) {
    const config = getMicrosoftMailConfig();
    if (!config.enabled) {
        throw new Error('Outlook mail integration is not configured.');
    }
    const connection = store.getMailConnection(userId, { includeSecrets: true });
    if (!connection?.connected) {
        throw new Error('Outlook mailbox is not connected for this account.');
    }
    if (!connection.refreshToken) {
        throw new Error('Outlook mailbox token is missing. Please reconnect your mailbox.');
    }
    let refreshed = null;
    try {
        refreshed = await exchangeMicrosoftRefreshToken(config, connection.refreshToken);
    } catch (error) {
        store.upsertMailConnection(userId, {
            lastSyncAt: new Date().toISOString(),
            lastSyncStatus: 'failed',
            lastError: error?.message || 'Outlook token refresh failed.'
        });
        throw error;
    }
    const grantedScopes = splitMicrosoftScope(refreshed.scope || config.scope);
    store.upsertMailConnection(userId, {
        refreshToken: String(refreshed.refresh_token || connection.refreshToken).trim(),
        grantedScopes,
        lastError: '',
        lastSyncStatus: 'connected'
    });
    return {
        config,
        accessToken: String(refreshed.access_token || '').trim(),
        grantedScopes,
        idClaims: decodeJwtPayload(refreshed.id_token || '') || {}
    };
}

function buildMailAuditEvent(userId, actorRole, eventType, entityType, entityId, extras = {}) {
    return store.addAuditEvent({
        actorUserId: String(userId || '').trim(),
        actorRole: String(actorRole || '').trim(),
        eventDomain: 'mail',
        eventType,
        entityType,
        entityId,
        sourceSystem: 'outlook-mail',
        beforeState: Object.prototype.hasOwnProperty.call(extras, 'beforeState') ? extras.beforeState : null,
        afterState: Object.prototype.hasOwnProperty.call(extras, 'afterState') ? extras.afterState : null,
        requestId: String(extras.requestId || '').trim(),
        ipAddress: String(extras.ipAddress || '').trim()
    });
}

async function syncMailboxCacheForUser(userId, actorRole, options = {}) {
    const startedAt = new Date().toISOString();
    const syncScope = String(options.syncScope || 'mailbox').trim();
    try {
        buildMailAuditEvent(userId, actorRole, 'sync-started', 'mail-cache', String(userId || '').trim(), {
            afterState: { syncScope }
        });
        updateMailConnectionStatus(userId, {
            lastSyncAt: startedAt,
            lastSyncStatus: 'running',
            lastError: ''
        });
        const { config, accessToken } = await getMicrosoftMailAccess(userId);
        const folderKeys = options.folderKey
            ? [String(options.folderKey || '').trim().toLowerCase()]
            : ['inbox', 'sentitems', 'drafts'];
        const folders = {};
        const messagesById = {};
        let seen = 0;
        let changed = 0;
        for (const folderKey of folderKeys) {
            const result = await syncMicrosoftMailFolder(config, accessToken, folderKey, {
                limit: options.limit || 20,
                unreadOnly: options.unreadOnly === true,
                search: options.search || ''
            });
            folders[result.folderKey] = {
                displayName: result.displayName,
                totalCount: result.totalCount,
                unreadCount: result.unreadCount,
                messageIds: result.messages.map(message => message.id),
                deltaLink: result.deltaLink,
                syncedAt: result.syncedAt
            };
            result.messages.forEach(message => {
                if (!message?.id) return;
                seen += 1;
                changed += 1;
                messagesById[message.id] = message;
            });
        }
        const cache = store.saveMailCache(userId, {
            folders,
            messagesById,
            lastFolderKey: options.folderKey || 'inbox',
            lastSyncedAt: new Date().toISOString()
        });
        updateMailConnectionStatus(userId, {
            lastSyncAt: new Date().toISOString(),
            lastSyncStatus: 'completed',
            lastError: ''
        });
        store.addSyncRun({
            systemCode: 'outlook-mail',
            syncScope,
            runStatus: 'completed',
            startedAt,
            finishedAt: new Date().toISOString(),
            recordsSeen: seen,
            recordsChanged: changed
        });
        buildMailAuditEvent(userId, actorRole, 'sync-completed', 'mail-cache', String(userId || '').trim(), {
            afterState: { syncScope, folders: folderKeys }
        });
        return cache;
    } catch (error) {
        updateMailConnectionStatus(userId, {
            lastSyncAt: new Date().toISOString(),
            lastSyncStatus: 'failed',
            lastError: error?.message || 'Outlook sync failed.'
        });
        store.addSyncRun({
            systemCode: 'outlook-mail',
            syncScope,
            runStatus: 'failed',
            startedAt,
            finishedAt: new Date().toISOString(),
            recordsSeen: 0,
            recordsChanged: 0,
            errorSummary: error?.message || 'Outlook sync failed.'
        });
        buildMailAuditEvent(userId, actorRole, 'sync-failed', 'mail-cache', String(userId || '').trim(), {
            afterState: { syncScope, error: error?.message || 'Outlook sync failed.' }
        });
        throw error;
    }
}

function getBootstrapMailFolderMessages(userId, folderKey, options = {}) {
    const bootstrap = store.createMailBootstrap(userId);
    const normalizedFolderKey = String(folderKey || 'inbox').trim().toLowerCase() || 'inbox';
    const search = String(options.search || '').trim().toLowerCase();
    const unreadOnly = options.unreadOnly === true;
    const limit = Math.min(Math.max(Number(options.limit || 20), 1), 100);
    const folder = bootstrap?.folders?.[normalizedFolderKey] || {
        folderKey: normalizedFolderKey,
        displayName: normalizedFolderKey === 'sentitems' ? 'Sent' : normalizedFolderKey.charAt(0).toUpperCase() + normalizedFolderKey.slice(1),
        unreadCount: 0,
        totalCount: 0,
        messages: []
    };
    const filteredMessages = (Array.isArray(folder.messages) ? folder.messages : [])
        .filter(message => !unreadOnly || message?.isRead !== true)
        .filter(message => {
            if (!search) return true;
            const haystack = [
                message?.subject,
                message?.snippet,
                message?.body,
                message?.from?.name,
                message?.from?.address,
                ...(Array.isArray(message?.toRecipients) ? message.toRecipients.flatMap(item => [item?.name, item?.address]) : []),
                ...(Array.isArray(message?.ccRecipients) ? message.ccRecipients.flatMap(item => [item?.name, item?.address]) : [])
            ].join('\n').toLowerCase();
            return haystack.includes(search);
        })
        .sort((left, right) => {
            const rightValue = String(right?.receivedAt || right?.sentAt || right?.createdAt || '');
            const leftValue = String(left?.receivedAt || left?.sentAt || left?.createdAt || '');
            return rightValue.localeCompare(leftValue);
        })
        .slice(0, limit);
    return {
        bootstrap,
        folderKey: normalizedFolderKey,
        displayName: folder.displayName,
        totalCount: filteredMessages.length,
        unreadCount: filteredMessages.filter(message => message?.isRead !== true).length,
        messages: filteredMessages
    };
}


registerPlatformOpsRoutes(app, {
    backendUrl: BACKEND_URL,
    buildLocalSetupBootstrap,
    buildProductionReadinessStatus,
    buildRtcConfig,
    fs,
    getAntiCheatDownloadCatalog,
    getMicrosoftConfig,
    getMicrosoftMailConfig,
    getStore: () => store,
    requireActualSessionRole,
    requireSessionAccount,
    sendError,
    uploadsDir: UPLOADS_DIR
});

registerMicrosoftAuthRoutes(app, {
    buildMicrosoftPortalRedirect,
    crypto,
    decodeJwtPayload,
    exchangeMicrosoftAuthorizationCode,
    fetchMicrosoftProfile,
    getMicrosoftConfig,
    getStore: () => store,
    normalizeMicrosoftReturnTo,
    sendError
});

registerMailRoutes(app, {
    backEndUrl: BACKEND_URL,
    buildGraphSendAttachments,
    buildMailAuditEvent,
    buildMailPortalRedirect,
    crypto,
    decodeJwtPayload,
    exchangeMicrosoftAuthorizationCode,
    fetchMicrosoftGraphBinary,
    fetchMicrosoftGraphJson,
    fetchMicrosoftMailMessage,
    fetchMicrosoftProfile,
    getBootstrapMailFolderMessages,
    getMicrosoftMailAccess,
    getMicrosoftMailConfig,
    getSessionRole,
    getStore: () => store,
    pushEvent,
    normalizeMailReturnTo,
    requireSessionAccount,
    sendError,
    splitMicrosoftScope,
    syncMailboxCacheForUser,
    uniqueStrings
});

registerPortalSupportRoutes(app, {
    addRouteAuditEvent,
    appOrigin: APP_ORIGIN,
    allowedCorsOrigins: ALLOWED_CORS_ORIGINS,
    broadcastAll,
    buildSelfServiceAccountPayload,
    getActorUserId,
    getSessionAccount,
    getSessionRole,
    getSessionToken,
    getStore: () => store,
    getWebPushConfig,
    isActualAdminSession,
    isSessionImpersonating,
    pushEvent,
    registerSseClient,
    requireSessionAccount,
    resolveSessionBoundUserId,
    sendError,
    unregisterSseClient
});

registerLmsLiveQuizRoutes(app, {
    broadcastAll,
    getSessionRole,
    getStore: () => store,
    mergeStaffLiveQuizWorkspace,
    mergeStudentLiveQuizJoin,
    mergeStudentLiveQuizAnswer,
    requireLmsLiveQuizWorkspaceAccess,
    sendError,
    staffRoles: STAFF_ROLES,
    submitStudentLiveQuizJoin,
    submitStudentLiveQuizAnswer
});

const {
    mergeStaffWhiteboardWorkspace,
    mergeStudentWhiteboardWorkspace,
    mergeStudentWhiteboardOps,
    stripLmsPersonalBoardScopeKey,
    isLmsPersonalBoardKey,
    isLmsStaffRole
} = require('./domains/lms-whiteboard-service');
const {
    savePersonalDashboardSnapshot,
    deletePersonalDashboardSnapshot,
    restorePersonalDashboardSnapshot,
    updatePersonalDashboardSnapshotShare,
    updatePersonalDashboardWorkspaceShare,
    updatePersonalDashboardPeerShares,
    listPersonalDashboardHistory,
    listPersonalDashboardSharedHistory,
    listPersonalDashboardShareStatus,
    listPersonalDashboardSharedWithMe,
    mergePersonalDashboardWorkspace,
    assertLmsPersonalBoardReadAccess,
    assertLmsPersonalBoardWriteAccess,
    redactPersonalWorkspaceForStaffViewer,
    redactPersonalWorkspaceForViewer,
    parsePersonalScopeMeta
} = require('./domains/lms-personal-dashboard-service');

registerLmsWhiteboardRoutes(app, {
    broadcastAll,
    getSessionRole,
    resolveSessionActorAccount,
    getStore: () => store,
    mergeStaffWhiteboardWorkspace,
    mergeStudentWhiteboardWorkspace,
    mergeStudentWhiteboardOps,
    mergePersonalDashboardWorkspace,
    requireLmsLiveQuizWorkspaceAccess,
    sendError,
    staffRoles: STAFF_ROLES,
    stripLmsPersonalBoardScopeKey,
    isLmsPersonalBoardKey,
    assertLmsPersonalBoardReadAccess,
    assertLmsPersonalBoardWriteAccess,
    redactPersonalWorkspaceForStaffViewer,
    redactPersonalWorkspaceForViewer,
    parsePersonalScopeMeta
});

registerLmsPersonalDashboardRoutes(app, {
    getSessionRole,
    resolveSessionActorAccount,
    getStore: () => store,
    mergePersonalDashboardWorkspace,
    savePersonalDashboardSnapshot,
    deletePersonalDashboardSnapshot,
    restorePersonalDashboardSnapshot,
    updatePersonalDashboardSnapshotShare,
    updatePersonalDashboardWorkspaceShare,
    updatePersonalDashboardPeerShares,
    listPersonalDashboardHistory,
    listPersonalDashboardSharedWithMe,
    listPersonalDashboardSharedHistory,
    listPersonalDashboardShareStatus,
    requireLmsLiveQuizWorkspaceAccess,
    sendError,
    stripLmsPersonalBoardScopeKey,
    isLmsPersonalBoardKey,
    isLmsStaffRole
});

registerStudentServiceRoutes(app, {
    broadcastAll,
    getActorUserId,
    getSessionRole,
    getStore: () => store,
    requireSessionAccount,
    sendError
});

registerOrdersRoutes(app, {
    getActorUserId,
    getActualSessionRole,
    getStore: () => store,
    pushEvent,
    requireSessionAccount,
    sendError
});

registerChancelleryRoutes(app, {
    getActorUserId,
    getActualSessionRole,
    getStore: () => store,
    requireSessionAccount,
    sendError
});

registerSocialRoutes(app, {
    addRouteAuditEvent,
    broadcastAll,
    getActorUserId,
    getStore: () => store,
    pushEvent,
    requireSessionAccount,
    sendError
});

if (['development', 'dev', 'local', 'test'].includes(CURRENT_ENVIRONMENT)) {
    console.info('[platform] POST /api/social/pins/toggle registered');
}

function handleLogin(request, response) {
    if (!enforceRateLimit(request, response, 'auth-login', LOGIN_RATE_LIMIT_MAX, LOGIN_RATE_LIMIT_WINDOW_MS)) {
        return;
    }
    const result = store.createSessionByCredentials(request.body?.email, request.body?.password);
    if (result?.error) {
        sendError(response, 401, 'Invalid email or password.');
        return;
    }
    response.json({ ok: true, ...result });
}

registerAuthRoutes(app, {
    getSessionToken,
    getStore: () => store,
    handleLogin,
    requireActualSessionRole,
    sendError
});

registerAuthMaintenanceRoutes(app, {
    activationRateLimitMax: ACTIVATION_RATE_LIMIT_MAX,
    activationRateLimitWindowMs: ACTIVATION_RATE_LIMIT_WINDOW_MS,
    enforceRateLimit,
    getSessionToken,
    getStore: () => store,
    isPortalImpersonationRole,
    loginRateLimitMax: LOGIN_RATE_LIMIT_MAX,
    loginRateLimitWindowMs: LOGIN_RATE_LIMIT_WINDOW_MS,
    requireActualSessionRole,
    requireSessionAccount,
    getActualActorUserId,
    resetRateLimitMax: RESET_RATE_LIMIT_MAX,
    resetRateLimitWindowMs: RESET_RATE_LIMIT_WINDOW_MS,
    sendError
});


registerNewsRoutes(app, {
    broadcastAll,
    getActorUserId,
    getStore: () => store,
    requireSessionAccount,
    resolveSessionBoundUserId,
    sendError
});


registerAdminIntegrationsRoutes(app, {
    addRouteAuditEvent,
    broadcastAll,
    getActorUserId,
    getStore: () => store,
    integrationAdminRoles: INTEGRATION_ADMIN_ROLES,
    pushEvent,
    requireActualSessionRole,
    requireSessionAccount,
    sendError
});

registerAdminSupportRoutes(app, {
    adminRoles: ADMIN_ROLES,
    getSessionActor,
    getStore: () => store,
    requireActualSessionRole,
    requireSessionAccount,
    sendError
});

registerFileRoutes(app, {
    addRouteAuditEvent,
    fs,
    getSessionActor,
    getStore: () => store,
    requireSessionAccount,
    sendError
});

registerBackgroundGalleryRoutes(app, {
    getSessionActor,
    getStore: () => store,
    isActualAdminSession,
    requireSessionAccount,
    sendError
});

registerMessengerCallsRoutes(app, {
    getActorUserId,
    getStore: () => store,
    pushEvent,
    requireSessionAccount,
    resolveSessionBoundUserId,
    sendError
});


registerAcademicRoutes(app, {
    canAccessStudentAcademicRecord,
    broadcastAll,
    getActorUserId,
    getSessionRole,
    getStore: () => store,
    isActualAdminSession,
    isSessionImpersonating,
    requireCourseStaffAccess,
    requireSessionAccount,
    sendError
});

registerProtectedExamRoutes(app, {
    enforceRateLimit,
    examPortalAuthRateLimitMax: EXAM_PORTAL_AUTH_RATE_LIMIT_MAX,
    examPortalAuthRateLimitWindowMs: EXAM_PORTAL_AUTH_RATE_LIMIT_WINDOW_MS,
    getActorUserId,
    getSessionRole,
    getStore: () => store,
    requireAntiCheatBrowserRequest,
    requireCourseStaffAccess,
    requireExamPortalSession,
    requireProtectedQuizSession,
    requireSessionAccount,
    sendError
});

app.use((request, response) => {
    sendError(response, 404, 'Route not found.');
});

app.use((error, request, response, next) => {
    if (response.headersSent) {
        next(error);
        return;
    }
    const status = Number(error?.status || error?.statusCode || 500);
    const safeStatus = status >= 400 && status < 500 ? status : 500;
    if (safeStatus === 413) {
        console.warn(`[http] request body too large: ${request.method} ${request.originalUrl}`);
        sendError(response, 413, 'Upload is too large for the server request limit.');
        return;
    }
    if (safeStatus >= 400 && safeStatus < 500) {
        sendError(response, safeStatus, error?.message || 'Invalid request.');
        return;
    }
    console.error(`[http] unhandled request error: ${request.method} ${request.originalUrl}`, error);
    sendError(response, 500, 'Internal server error.');
});

function ensureUploadStorageReady() {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    const probePath = path.join(UPLOADS_DIR, `.kiu-upload-probe-${process.pid}-${Date.now()}`);
    try {
        fs.writeFileSync(probePath, 'ok', { flag: 'wx' });
    } finally {
        try { fs.unlinkSync(probePath); } catch (error) {}
    }
}

async function shutdownServer(reason = 'shutdown', exitCode = 0) {
    if (shutdownStarted) return;
    shutdownStarted = true;
    console.warn(`[platform] shutting down (${reason})`);
    try {
        if (activeServer) {
            await new Promise((resolve) => activeServer.close(() => resolve()));
            activeServer = null;
        }
    } catch (error) {
        console.error('[platform] HTTP server shutdown failed:', error?.message || error);
    }
    try {
        const recordStore = store?.recordStore;
        if (typeof recordStore?.close === 'function') await recordStore.close();
    } catch (error) {
        console.error('[platform] record store shutdown failed:', error?.message || error);
    }
    if (exitCode !== null && exitCode !== undefined) {
        process.exitCode = exitCode;
    }
}

function installProcessLifecycleHandlers() {
    if (process.__kiuLifecycleHandlersInstalled) return;
    process.__kiuLifecycleHandlersInstalled = true;
    const fatal = (reason, error) => {
        console.error(`[platform] ${reason}`, error);
        void shutdownServer(reason, 1).finally(() => process.exit(1));
    };
    process.on('uncaughtException', (error) => fatal('uncaught exception', error));
    process.on('unhandledRejection', (error) => fatal('unhandled rejection', error));
    process.on('SIGTERM', () => void shutdownServer('SIGTERM', 0));
    process.on('SIGINT', () => void shutdownServer('SIGINT', 0));
}

async function startServer() {
    if (!store) {
        ensureUploadStorageReady();
        store = await PlatformStore.create({
            statePath: process.env.KIU_LOCAL_PLATFORM_STATE_PATH || LOCAL_STATE_PATH,
            uploadsDir: UPLOADS_DIR,
            appUrl: APP_URL,
            backendUrl: BACKEND_URL,
            rtc: buildRtcConfig(),
            environment: process.env.KIU_ENVIRONMENT || process.env.NODE_ENV || 'development',
            fileStorageMode: process.env.KIU_FILE_STORAGE_MODE || 'external',
            storageDriver: process.env.KIU_STORAGE_DRIVER || 'postgres',
            databaseUrl: DATABASE_URL,
            databaseTableName: DATABASE_TABLE_NAME,
            allowLocalFallback: ALLOW_LOCAL_PLATFORM_FALLBACK,
            mailTokenEncryptionKey: MAIL_TOKEN_ENCRYPTION_KEY,
            auditRetentionDays: process.env.KIU_AUDIT_RETENTION_DAYS || 2555,
            maxFileUploadBytes: process.env.KIU_MAX_FILE_UPLOAD_BYTES || (25 * 1024 * 1024),
            maxBackgroundGalleryUploadBytes: process.env.KIU_MAX_BACKGROUND_GALLERY_UPLOAD_BYTES || (100 * 1024 * 1024),
            bootstrapAdmin: {
                id: process.env.KIU_ADMIN_ID || 'admin-root',
                name: process.env.KIU_ADMIN_NAME || 'Portal Administrator',
                nameEn: process.env.KIU_ADMIN_NAME_EN || process.env.KIU_ADMIN_NAME || 'Portal Administrator',
                displayName: process.env.KIU_ADMIN_DISPLAY_NAME || process.env.KIU_ADMIN_NAME_EN || process.env.KIU_ADMIN_NAME || 'Portal Administrator',
                email: process.env.KIU_ADMIN_EMAIL || '',
                password: process.env.KIU_ADMIN_PASSWORD || '',
                facultyCode: process.env.KIU_ADMIN_FACULTY || ''
            }
        });
        if (store?.getRuntimeConfig?.().storageDriver === 'local-json') {
            console.warn(`PostgreSQL is unavailable. Falling back to local platform state at ${process.env.KIU_LOCAL_PLATFORM_STATE_PATH || LOCAL_STATE_PATH}`);
        }
        if (!store.__webPushHookInstalled) {
            const originalCreateNotification = store.createNotification.bind(store);
            store.createNotification = function createNotificationWithPush(payload = {}) {
                const notification = originalCreateNotification(payload);
                if (notification?.recipientUserId) {
                    sendWebPushNotification(notification.recipientUserId, notification).catch(() => null);
                    sendFirebaseNotification(
                        notification.recipientUserId,
                        notification,
                        store,
                        buildPortalPageUrl
                    ).catch(() => null);
                    pushEvent([notification.recipientUserId], {
                        type: 'notification:created',
                        notification: {
                            id: notification.id,
                            title: notification.title,
                            body: notification.body,
                            type: notification.type,
                            sourceDomain: notification.sourceDomain,
                            routePage: notification.routePage,
                            routeData: notification.routeData || {}
                        }
                    });
                }
                return notification;
            };
            store.__webPushHookInstalled = true;
        }
    }
    activeServer = app.listen(PORT, HOST, () => {
        console.log(`KIU platform server listening on http://${HOST}:${PORT}`);
    });
    activeServer.on('error', (error) => {
        console.error('[platform] HTTP server error:', error);
        void shutdownServer('HTTP server error', 1).finally(() => process.exit(1));
    });
    return activeServer;
}

if (require.main === module) {
    installProcessLifecycleHandlers();
    startServer().catch(error => {
        console.error('Failed to start KIU platform server.', error);
        process.exit(1);
    });
}

module.exports = {
    app,
    startServer,
    getStore: () => store,
    lmsLiveQuizService,
    mergeStaffLiveQuizWorkspace,
    mergeStudentLiveQuizJoin,
    mergeStudentLiveQuizAnswer,
    submitStudentLiveQuizJoin,
    submitStudentLiveQuizAnswer
};
