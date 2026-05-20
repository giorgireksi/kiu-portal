const { URL } = require('url');

const env = process.env;
const environment = String(env.KIU_ENVIRONMENT || env.NODE_ENV || '').trim().toLowerCase();

const required = [
    ['KIU_ENVIRONMENT or NODE_ENV', environment === 'production' || environment === 'prod'],
    ['KIU_DATABASE_URL', Boolean(String(env.KIU_DATABASE_URL || '').trim())],
    ['KIU_ALLOW_LOCAL_PLATFORM_FALLBACK=false', ['0', 'false', 'no', 'off'].includes(String(env.KIU_ALLOW_LOCAL_PLATFORM_FALLBACK || '').trim().toLowerCase())],
    ['KIU_SINGLE_WRITER_MODE=true', String(env.KIU_SINGLE_WRITER_MODE || '').trim().toLowerCase() === 'true'],
    ['KIU_PUBLIC_APP_URL', isHttpsUrl(env.KIU_PUBLIC_APP_URL)],
    ['KIU_PUBLIC_BACKEND_URL', isHttpsUrl(env.KIU_PUBLIC_BACKEND_URL)],
    ['KIU_MICROSOFT_TENANT_ID', Boolean(String(env.KIU_MICROSOFT_TENANT_ID || '').trim())],
    ['KIU_MICROSOFT_CLIENT_ID', Boolean(String(env.KIU_MICROSOFT_CLIENT_ID || '').trim())],
    ['KIU_MICROSOFT_CLIENT_SECRET', Boolean(String(env.KIU_MICROSOFT_CLIENT_SECRET || '').trim())],
    ['KIU_MICROSOFT_REDIRECT_URI', isHttpsUrl(env.KIU_MICROSOFT_REDIRECT_URI)],
    ['KIU_MICROSOFT_TOKEN_ENCRYPTION_KEY', String(env.KIU_MICROSOFT_TOKEN_ENCRYPTION_KEY || '').trim().length >= 32],
    ['KIU_VAPID_PUBLIC_KEY', Boolean(String(env.KIU_VAPID_PUBLIC_KEY || '').trim())],
    ['KIU_VAPID_PRIVATE_KEY', Boolean(String(env.KIU_VAPID_PRIVATE_KEY || '').trim())]
];

const recommended = [
    ['KIU_AUTH_RATE_LIMIT_MAX', Boolean(String(env.KIU_AUTH_RATE_LIMIT_MAX || '').trim())],
    ['KIU_RESET_RATE_LIMIT_MAX', Boolean(String(env.KIU_RESET_RATE_LIMIT_MAX || '').trim())],
    ['KIU_AUDIT_RETENTION_DAYS', Number(env.KIU_AUDIT_RETENTION_DAYS || 0) >= 365],
    ['KIU_FILE_STORAGE_MODE', Boolean(String(env.KIU_FILE_STORAGE_MODE || '').trim())],
    ['KIU_STORAGE_DRIVER=postgres', String(env.KIU_STORAGE_DRIVER || '').trim().toLowerCase() === 'postgres'],
    ['KIU_ANTI_CHEAT_WINDOWS_URL or KIU_ANTI_CHEAT_WINDOWS_PATH', Boolean(String(env.KIU_ANTI_CHEAT_WINDOWS_URL || env.KIU_ANTI_CHEAT_WINDOWS_PATH || '').trim())]
];

function isHttpsUrl(value) {
    try {
        return new URL(String(value || '').trim()).protocol === 'https:';
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
