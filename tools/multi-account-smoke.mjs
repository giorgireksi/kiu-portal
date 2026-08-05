const baseUrl = String(process.env.KIU_MULTI_ACCOUNT_BASE_URL || process.argv[2] || 'http://127.0.0.1:47833').trim().replace(/\/$/, '');
const adminEmail = String(process.env.KIU_ADMIN_EMAIL || 'admin@staging.local').trim();
const adminPassword = String(process.env.KIU_ADMIN_PASSWORD || 'StagingAdmin-2026!').trim();
const accountCount = Math.max(2, Math.min(100, Number(process.env.KIU_MULTI_ACCOUNT_COUNT || process.argv[3] || 10)));
const prefix = String(process.env.KIU_MULTI_ACCOUNT_PREFIX || `multi-smoke-${Date.now()}`).trim();
const cleanup = String(process.env.KIU_MULTI_ACCOUNT_CLEANUP || '').trim().toUpperCase() === 'YES';

async function request(pathname, options = {}) {
    const response = await fetch(`${baseUrl}${pathname}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(options.token ? { 'X-Portal-Session': options.token } : {}),
            ...(options.headers || {})
        },
        body: options.body && typeof options.body !== 'string' ? JSON.stringify(options.body) : options.body,
        signal: options.signal || AbortSignal.timeout(15000)
    });
    const text = await response.text();
    let payload = null;
    try {
        payload = text ? JSON.parse(text) : null;
    } catch (error) {
        payload = text;
    }
    if (!response.ok) {
        throw new Error(`${options.method || 'GET'} ${pathname} returned ${response.status}: ${typeof payload === 'string' ? payload.slice(0, 200) : JSON.stringify(payload)}`);
    }
    return { response, payload };
}

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

async function waitForBackend() {
    const deadline = Date.now() + 30000;
    let lastError = null;
    while (Date.now() < deadline) {
        try {
            const response = await fetch(`${baseUrl}/health`, { signal: AbortSignal.timeout(2000) });
            if (response.ok) return;
            lastError = new Error(`health returned ${response.status}`);
        } catch (error) {
            lastError = error;
        }
        await new Promise(resolve => setTimeout(resolve, 250));
    }
    throw new Error(`Backend did not become healthy: ${lastError?.message || 'unknown error'}`);
}

async function login(email, password) {
    const result = await request('/api/auth/login', {
        method: 'POST',
        body: { email, password }
    });
    const token = String(result.payload?.session?.token || '').trim();
    assert(token, `No session token returned for ${email}.`);
    return { ...result.payload, token };
}

async function openEventStream(token, userId) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    try {
        const response = await fetch(`${baseUrl}/api/events?userId=${encodeURIComponent(userId)}`, {
            headers: {
                Accept: 'text/event-stream',
                'X-Portal-Session': token
            },
            signal: controller.signal
        });
        assert(response.ok, `SSE returned ${response.status}.`);
        assert(String(response.headers.get('content-type') || '').includes('text/event-stream'), 'SSE did not return text/event-stream.');
        return true;
    } finally {
        clearTimeout(timeout);
        controller.abort();
    }
}

async function main() {
    await waitForBackend();
    const admin = await login(adminEmail, adminPassword);
    const accounts = Array.from({ length: accountCount }, (_, index) => ({
        id: `${prefix}-${index + 1}`,
        name: `Multi Account ${index + 1}`,
        nameEn: `Multi Account ${index + 1}`,
        displayName: `Multi Account ${index + 1}`,
        email: `${prefix}.${index + 1}@staging.local`,
        password: `Smoke-${prefix}-${index + 1}!`,
        role: 'student',
        facultyCode: 'ECON',
        accountStatus: 'active'
    }));

    await Promise.all(accounts.map(account => request('/api/admin/accounts', {
        method: 'POST',
        token: admin.token,
        body: account
    })));

    const sessions = await Promise.all(accounts.map(account => login(account.email, account.password)));
    assert(sessions.length === accountCount, 'Not every account could log in.');
    sessions.forEach((session, index) => {
        assert(session.account?.id === accounts[index].id, `Account isolation mismatch for ${accounts[index].email}.`);
    });

    const accountViews = await Promise.all(sessions.map(session => request('/api/accounts', { token: session.token })));
    accountViews.forEach((result, index) => {
        assert(result.payload?.account?.id === accounts[index].id, `Self-account response mismatch for ${accounts[index].email}.`);
        assert(Array.isArray(result.payload?.accounts) && result.payload.accounts.length === 1, `Account listing leaked data for ${accounts[index].email}.`);
    });

    await Promise.all(sessions.map(session => request('/api/bootstrap', { token: session.token })));
    await Promise.all(sessions.slice(0, Math.min(5, sessions.length)).map(session => openEventStream(session.token, session.account.id)));
    const adminAccounts = await request('/api/admin/accounts', { token: admin.token });
    const createdIds = new Set(accounts.map(account => account.id));
    const found = (adminAccounts.payload?.items || []).filter(account => createdIds.has(account.id));
    assert(found.length === accounts.length, `Admin account listing found ${found.length}/${accounts.length} created accounts.`);
    await Promise.all(sessions.map(session => request('/api/auth/logout', { method: 'POST', token: session.token })));

    if (cleanup) {
        await request('/api/admin/reset-platform-state', {
            method: 'POST',
            token: admin.token,
            body: { preserveAdmin: true }
        });
    }

    console.log(JSON.stringify({
        ok: true,
        baseUrl,
        accountCount,
        sseStreamsChecked: Math.min(5, sessions.length),
        cleanup
    }, null, 2));
}

main().catch(error => {
    console.error(`Multi-account smoke failed: ${error.message || error}`);
    process.exit(1);
});
