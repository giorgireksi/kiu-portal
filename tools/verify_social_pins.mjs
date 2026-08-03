#!/usr/bin/env node
// Smoke-check pin API. Remote LAN: KIU_BASE_URL=http://192.168.100.3:8876 node tools/verify_social_pins.mjs

const BACKEND_URL = String(process.env.KIU_BACKEND_URL || 'http://127.0.0.1:48933').replace(/\/$/, '');
const WEB_URL = String(process.env.KIU_BASE_URL || 'http://127.0.0.1:8876').replace(/\/$/, '');

async function checkPinHealth(label, baseUrl) {
    let response;
    try {
        response = await fetch(`${baseUrl}/health`, { cache: 'no-store' });
    } catch (error) {
        throw new Error(`${label}: /health request failed (${error?.message || error})`);
    }
    if (!response.ok) {
        throw new Error(`${label}: GET /health returned ${response.status}`);
    }
    const payload = await response.json().catch(() => null);
    if (!payload?.socialPinApiVersion) {
        throw new Error(`${label}: /health missing socialPinApiVersion — restart platform backend (npm run stop:local && npm run start:local)`);
    }
    console.log(`${label}: health OK (socialPinApiVersion=${payload.socialPinApiVersion})`);
}

async function checkPinToggleRoute(label, baseUrl) {
    let response;
    try {
        response = await fetch(`${baseUrl}/api/social/pins/toggle`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ module: 'survey', entityId: 'smoke-pin-entity', kind: 'personal' })
        });
    } catch (error) {
        throw new Error(`${label}: toggle request failed (${error?.message || error})`);
    }
    if (response.status === 404) {
        throw new Error(`${label}: POST /api/social/pins/toggle returned 404 — restart platform backend (npm run stop:local && npm run start:local)`);
    }
    if (response.status !== 401 && response.status !== 400) {
        const body = await response.text().catch(() => '');
        throw new Error(`${label}: unexpected toggle status ${response.status}${body ? ` — ${body.slice(0, 120)}` : ''}`);
    }
    console.log(`${label}: toggle OK (${response.status})`);
}

async function main() {
    await checkPinHealth('backend', BACKEND_URL);
    await checkPinHealth('web-proxy', WEB_URL);
    await checkPinToggleRoute('backend', BACKEND_URL);
    await checkPinToggleRoute('web-proxy', WEB_URL);
    console.log('social pin route smoke passed');
}

main().catch((error) => {
    console.error(error?.message || error);
    process.exit(1);
});
