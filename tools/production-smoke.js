const baseUrl = String(process.env.KIU_SMOKE_BASE_URL || process.argv[2] || '').trim().replace(/\/$/, '');
const requireReady = !['0', 'false', 'no', 'off'].includes(String(process.env.KIU_SMOKE_REQUIRE_READY || 'true').trim().toLowerCase());

if (!baseUrl) {
    console.error('Usage: KIU_SMOKE_BASE_URL=https://lms.youruniversity.edu npm run smoke:production');
    process.exit(1);
}

let parsedBaseUrl;
try {
    parsedBaseUrl = new URL(baseUrl);
} catch (error) {
    console.error(`Invalid smoke base URL: ${baseUrl}`);
    process.exit(1);
}

if (parsedBaseUrl.protocol !== 'https:') {
    console.error('Production smoke checks require an HTTPS base URL.');
    process.exit(1);
}

const checks = [
    { name: 'health endpoint', path: '/health', expected: [200] },
    { name: 'readiness endpoint', path: '/ready', expected: requireReady ? [200] : [200, 503] },
    { name: 'login page', path: '/login.html', expected: [200] },
    { name: 'blocked environment file', path: '/.env.production', expected: [404] },
    { name: 'blocked backend source path', path: '/backend/platform/server.js', expected: [404] }
];

async function request(pathname) {
    const response = await fetch(`${baseUrl}${pathname}`, {
        redirect: 'manual',
        signal: AbortSignal.timeout(15000)
    });
    return {
        status: response.status,
        contentType: response.headers.get('content-type') || ''
    };
}

(async () => {
    const results = [];
    for (const check of checks) {
        try {
            const result = await request(check.path);
            const passed = check.expected.includes(result.status);
            results.push({ ...check, ...result, passed });
        } catch (error) {
            results.push({
                ...check,
                status: null,
                error: error.message || String(error),
                passed: false
            });
        }
    }

    results.forEach(result => {
        const suffix = result.error ? ` (${result.error})` : ` [${result.status}]`;
        console.log(`${result.passed ? 'PASS' : 'FAIL'} ${result.name}${suffix}`);
    });

    const failed = results.filter(result => !result.passed);
    if (failed.length) {
        console.error(`\nProduction smoke failed: ${failed.length} check(s).`);
        process.exit(1);
    }
    console.log(`\nProduction smoke passed: ${results.length} checks.`);
})();
