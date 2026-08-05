const { URL } = require('url');

const env = process.env;
const environment = String(env.KIU_ENVIRONMENT || env.NODE_ENV || '').trim().toLowerCase();
const PLACEHOLDER_RE = /(?:replace-with|change-me|youruniversity|example\.com|203\.0\.113\.)/i;
const WEAK_SECRET_RE = /(?:password|admin|staging|changeme|change-me|secret|default|qwerty)/i;

function hasConfiguredValue(value, minimumLength = 1) {
    const normalized = String(value || '').trim();
    return normalized.length >= minimumLength
        && !PLACEHOLDER_RE.test(normalized)
        && !/^0+$/.test(normalized.replace(/-/g, ''));
}

function hasStrongSecret(value, minimumLength = 16) {
    const normalized = String(value || '').trim();
    return hasConfiguredValue(normalized, minimumLength) && !WEAK_SECRET_RE.test(normalized);
}

function isHostname(value) {
    const normalized = String(value || '').trim();
    return hasConfiguredValue(normalized)
        && !normalized.includes('://')
        && !/[/?#\s]/.test(normalized)
        && normalized.includes('.');
}

const required = [
    ['KIU_ENVIRONMENT or NODE_ENV', environment === 'production' || environment === 'prod'],
    ['KIU_PUBLIC_HOSTNAME', isHostname(env.KIU_PUBLIC_HOSTNAME)],
    ['KIU_DATABASE_URL', hasConfiguredValue(env.KIU_DATABASE_URL)],
    ['KIU_DATABASE_TABLE_NAME', /^[A-Za-z_][A-Za-z0-9_]*$/.test(String(env.KIU_DATABASE_TABLE_NAME || '').trim())],
    ['KIU_ALLOW_LOCAL_PLATFORM_FALLBACK=false', ['0', 'false', 'no', 'off'].includes(String(env.KIU_ALLOW_LOCAL_PLATFORM_FALLBACK || '').trim().toLowerCase())],
    ['KIU_SINGLE_WRITER_MODE=true', String(env.KIU_SINGLE_WRITER_MODE || '').trim().toLowerCase() === 'true'],
    ['KIU_PUBLIC_APP_URL', isHttpsUrl(env.KIU_PUBLIC_APP_URL)],
    ['KIU_PUBLIC_BACKEND_URL', isHttpsUrl(env.KIU_PUBLIC_BACKEND_URL)],
    ['KIU_PUBLIC_APP_URL and KIU_PUBLIC_BACKEND_URL share one origin', sameOrigin(env.KIU_PUBLIC_APP_URL, env.KIU_PUBLIC_BACKEND_URL)],
    ['KIU_TRUST_PROXY_HOPS is configured for the HTTPS proxy', Number(env.KIU_TRUST_PROXY_HOPS) >= 1],
    ['KIU_MICROSOFT_TENANT_ID', hasConfiguredValue(env.KIU_MICROSOFT_TENANT_ID)],
    ['KIU_MICROSOFT_CLIENT_ID', hasConfiguredValue(env.KIU_MICROSOFT_CLIENT_ID)],
    ['KIU_MICROSOFT_CLIENT_SECRET', hasConfiguredValue(env.KIU_MICROSOFT_CLIENT_SECRET)],
    ['KIU_MICROSOFT_REDIRECT_URI', isHttpsUrl(env.KIU_MICROSOFT_REDIRECT_URI)],
    ['KIU_MICROSOFT_MAIL_REDIRECT_URI', isHttpsUrl(env.KIU_MICROSOFT_MAIL_REDIRECT_URI)],
    ['KIU_MICROSOFT_TOKEN_ENCRYPTION_KEY', hasStrongSecret(env.KIU_MICROSOFT_TOKEN_ENCRYPTION_KEY, 32)],
    ['KIU_VAPID_PUBLIC_KEY', hasConfiguredValue(env.KIU_VAPID_PUBLIC_KEY)],
    ['KIU_VAPID_PRIVATE_KEY', hasConfiguredValue(env.KIU_VAPID_PRIVATE_KEY)],
    ['KIU_FIREBASE_PROJECT_ID', hasConfiguredValue(env.KIU_FIREBASE_PROJECT_ID)],
    ['KIU_FIREBASE_SERVICE_ACCOUNT_FILE or JSON', hasConfiguredValue(env.KIU_FIREBASE_SERVICE_ACCOUNT_FILE || env.KIU_FIREBASE_SERVICE_ACCOUNT_JSON)],
    ['KIU_FIREBASE_SERVICE_ACCOUNT_HOST_PATH', hasConfiguredValue(env.KIU_FIREBASE_SERVICE_ACCOUNT_HOST_PATH)],
    ['KIU_ADMIN_EMAIL', hasConfiguredValue(env.KIU_ADMIN_EMAIL)],
    ['KIU_ADMIN_PASSWORD', hasStrongSecret(env.KIU_ADMIN_PASSWORD, 16)],
    ['KIU_TURN_URLS', hasConfiguredValue(env.KIU_TURN_URLS)],
    ['KIU_TURN_USERNAME', hasConfiguredValue(env.KIU_TURN_USERNAME)],
    ['KIU_TURN_CREDENTIAL', hasStrongSecret(env.KIU_TURN_CREDENTIAL, 16)]
];

const recommended = [
    ['KIU_AUTH_RATE_LIMIT_MAX', Boolean(String(env.KIU_AUTH_RATE_LIMIT_MAX || '').trim())],
    ['KIU_RESET_RATE_LIMIT_MAX', Boolean(String(env.KIU_RESET_RATE_LIMIT_MAX || '').trim())],
    ['KIU_AUDIT_RETENTION_DAYS', Number(env.KIU_AUDIT_RETENTION_DAYS || 0) >= 365],
    ['KIU_FILE_STORAGE_MODE', Boolean(String(env.KIU_FILE_STORAGE_MODE || '').trim())],
    ['KIU_STORAGE_DRIVER=postgres', String(env.KIU_STORAGE_DRIVER || '').trim().toLowerCase() === 'postgres'],
    ['KIU_ANTI_CHEAT_WINDOWS_URL or KIU_ANTI_CHEAT_WINDOWS_PATH', hasConfiguredValue(env.KIU_ANTI_CHEAT_WINDOWS_URL || env.KIU_ANTI_CHEAT_WINDOWS_PATH)]
];

function isHttpsUrl(value) {
    try {
        return new URL(String(value || '').trim()).protocol === 'https:';
    } catch (error) {
        return false;
    }
}

function sameOrigin(left, right) {
    try {
        return new URL(String(left || '').trim()).origin === new URL(String(right || '').trim()).origin;
    } catch (error) {
        return false;
    }
}

function printGroup(title, items) {
    console.log(`\n${title}`);
    items.forEach(([label, ok]) => {
        console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`);
    });
}

printGroup('Required production gates', required);
printGroup('Recommended production settings', recommended);

const failedRequired = required.filter(([, ok]) => !ok);
const failedRecommended = recommended.filter(([, ok]) => !ok);

console.log(`\nSummary: ${required.length - failedRequired.length}/${required.length} required gates passed, ${recommended.length - failedRecommended.length}/${recommended.length} recommendations passed.`);

if (failedRequired.length) {
    console.error('\nProduction readiness failed. Fix every required gate before deploying for real students.');
    process.exit(1);
}

console.log('\nProduction readiness gates passed.');
