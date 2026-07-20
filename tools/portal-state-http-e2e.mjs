import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);

function buildSeedState() {
    const now = new Date().toISOString();
    return {
        meta: {
            version: 2,
            storageDriver: 'local-json',
            createdAt: now,
            updatedAt: now
        },
        accounts: {
            'portal-state-admin': {
                id: 'portal-state-admin',
                email: 'portal.state@kiu.edu.ge',
                name: 'Portal State Admin',
                nameEn: 'Portal State Admin',
                displayName: 'Portal State Admin',
                role: 'admin',
                faculty: 'ECON',
                facultyCode: 'ECON',
                accountStatus: 'active',
                activationRequired: false,
                mustChangePassword: false,
                createdAt: now,
                updatedAt: now
            }
        },
        credentials: {},
        portal: {
            state: {
                calendarEvents: [{ id: 'seed-event', title: 'Seed Event' }]
            },
            meta: {
                portalStateSavedAt: now
            },
            liveQuizWorkspaces: {}
        },
        sessions: {},
        notifications: {},
        auditEvents: []
    };
}

async function fetchJson(url, options = {}) {
    const startedAt = Date.now();
    const response = await fetch(url, options);
    const payload = await response.json().catch(() => null);
    return {
        ok: response.ok,
        status: response.status,
        payload,
        elapsedMs: Date.now() - startedAt
    };
}

async function main() {
    const tmpState = path.join(os.tmpdir(), `kiu-portal-state-http-e2e-${process.pid}.json`);
    const port = 47000 + Math.floor(Math.random() * 2000);
    fs.writeFileSync(tmpState, JSON.stringify(buildSeedState(), null, 2));

    process.env.KIU_LOCAL_PLATFORM_STATE_PATH = tmpState;
    process.env.KIU_REALTIME_HOST = '127.0.0.1';
    process.env.KIU_REALTIME_PORT = String(port);
    process.env.KIU_ENVIRONMENT = 'test';
    process.env.KIU_ALLOW_LOCAL_PLATFORM_FALLBACK = '1';
    process.env.NODE_ENV = 'test';

    const serverPath = path.join(ROOT, 'backend/platform/server.js');
    delete require.cache[serverPath];
    const { startServer, getStore } = require(serverPath);
    const listener = await startServer();
    const store = getStore();
    const credential = store.ensureCredential('portal-state-admin');
    if (credential) {
        credential.activationRequired = false;
        credential.mustChangePassword = false;
    }

    const session = store.createSessionForAccount('portal-state-admin', { identityProvider: 'portal' });
    if (!session?.session?.token) {
        throw new Error(`Failed to create portal session: ${session?.error || 'missing token'}`);
    }

    const baseUrl = `http://127.0.0.1:${port}`;
    const token = session.session.token;

    try {
        const result = await fetchJson(`${baseUrl}/api/portal/state`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-portal-session': token
            },
            body: JSON.stringify({
                reason: 'http-e2e',
                token,
                state: {
                    calendarEvents: [{ id: 'updated-event', title: 'Updated Event' }],
                    homeDashboardPreferencesByUser: {
                        'portal-state-admin': { layout: 'compact' }
                    }
                }
            })
        });

        if (!result.ok) {
            throw new Error(`POST /api/portal/state failed (${result.status}): ${result.payload?.error || 'unknown error'}`);
        }
        if (!result.payload?.ok || !result.payload?.saved) {
            throw new Error('POST /api/portal/state returned unexpected payload.');
        }
        if (!Array.isArray(result.payload.bootstrapStateKeys) || !result.payload.bootstrapStateKeys.includes('calendarEvents')) {
            throw new Error('POST /api/portal/state did not return bootstrapStateKeys.');
        }
        if (result.elapsedMs > 5000) {
            throw new Error(`POST /api/portal/state took too long (${result.elapsedMs}ms).`);
        }

        const reloaded = store.createApplicationBootstrap(token);
        const calendarEvents = reloaded?.state?.calendarEvents || [];
        if (!calendarEvents.some((event) => event?.id === 'updated-event')) {
            throw new Error('Saved portal state was not persisted to the store.');
        }

        console.log(`Portal state HTTP e2e passed in ${result.elapsedMs}ms.`);
    } finally {
        await new Promise((resolve, reject) => {
            listener.close((error) => (error ? reject(error) : resolve()));
        });
        fs.unlinkSync(tmpState);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});