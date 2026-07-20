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
            'student-1': {
                id: 'student-1',
                email: 'student.one@kiu.edu.ge',
                name: 'Student One',
                nameEn: 'Student One',
                displayName: 'Student One',
                role: 'student',
                faculty: 'ECON',
                facultyCode: 'ECON',
                accountStatus: 'active',
                activationRequired: false,
                mustChangePassword: false,
                createdAt: now,
                updatedAt: now
            },
            'student-2': {
                id: 'student-2',
                email: 'student.two@kiu.edu.ge',
                name: 'Student Two',
                nameEn: 'Student Two',
                displayName: 'Student Two',
                role: 'student',
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
                studentServiceQuestions: [{
                    id: 'svc-question-e2e',
                    title: 'Appeal timing',
                    body: 'When does the appeal window open?',
                    category: 'Academic Process',
                    facultyCode: 'ECON',
                    authorUserId: 'student-1',
                    authorDisplayName: 'Student One',
                    authorRole: 'student',
                    status: 'published',
                    anonymousMode: true,
                    helpfulVotes: [],
                    updatedAt: now
                }],
                studentServiceAnswers: [{
                    id: 'svc-answer-legacy-e2e',
                    questionId: 'svc-question-e2e',
                    responderUserId: 'student-2',
                    authorDisplayName: 'Student Two',
                    authorRole: 'student',
                    body: 'Legacy comment stored with responderUserId only.',
                    status: 'published',
                    createdAt: now,
                    updatedAt: now
                }]
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
    const response = await fetch(url, options);
    const payload = await response.json().catch(() => null);
    return { ok: response.ok, status: response.status, payload };
}

async function main() {
    const tmpState = path.join(os.tmpdir(), `kiu-student-service-reply-e2e-${process.pid}.json`);
    const port = 48000 + Math.floor(Math.random() * 2000);
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
    const credential = store.ensureCredential('student-2');
    if (credential) {
        credential.activationRequired = false;
        credential.mustChangePassword = false;
    }

    const session = store.createSessionForAccount('student-2', { identityProvider: 'portal' });
    if (!session?.session?.token) {
        throw new Error(`Failed to create student session: ${session?.error || 'missing token'}`);
    }

    const baseUrl = `http://127.0.0.1:${port}`;
    const token = session.session.token;
    const headers = {
        'Content-Type': 'application/json',
        'x-portal-session': token
    };

    try {
        const normalizedLegacy = store.ensureStudentServiceState().answers.find(answer => answer.id === 'svc-answer-legacy-e2e');
        if (!normalizedLegacy) {
            throw new Error('Legacy seeded answer was not loaded into student service state.');
        }
        if (String(normalizedLegacy.authorUserId || '').trim() !== 'student-2') {
            throw new Error('Legacy answer authorUserId was not normalized from responderUserId.');
        }

        const legacyDelete = await fetchJson(
            `${baseUrl}/api/student-service/questions/svc-question-e2e/answers/${encodeURIComponent('svc-answer-legacy-e2e')}/delete`,
            { method: 'POST', headers, body: JSON.stringify({}) }
        );
        if (!legacyDelete.ok) {
            throw new Error(`Delete legacy answer failed (${legacyDelete.status}): ${legacyDelete.payload?.error || 'unknown error'}`);
        }
        const remainingLegacy = (legacyDelete.payload?.question?.answers || []).find(answer => answer.id === 'svc-answer-legacy-e2e');
        if (remainingLegacy) {
            throw new Error('Deleted legacy answer still present in question snapshot.');
        }

        const topLevel = await fetchJson(`${baseUrl}/api/student-service/questions/svc-question-e2e/answers`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ body: 'Top-level comment from e2e.' })
        });
        if (!topLevel.ok) {
            throw new Error(`Top-level answer failed (${topLevel.status}): ${topLevel.payload?.error || 'unknown error'}`);
        }
        const parentAnswer = (topLevel.payload?.question?.answers || []).find(answer => !answer.parentAnswerId);
        if (!parentAnswer?.id) {
            throw new Error('Top-level answer did not return a parent answer id.');
        }

        const nested = await fetchJson(`${baseUrl}/api/student-service/questions/svc-question-e2e/answers`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                body: 'Nested reply from e2e.',
                parentAnswerId: parentAnswer.id
            })
        });
        if (!nested.ok) {
            throw new Error(`Nested answer failed (${nested.status}): ${nested.payload?.error || 'unknown error'}`);
        }
        const childAnswer = (nested.payload?.question?.answers || []).find(answer => answer.parentAnswerId === parentAnswer.id);
        if (!childAnswer?.id) {
            throw new Error('Nested answer was not persisted with parentAnswerId.');
        }

        const persisted = store.ensureStudentServiceState().answers.find(answer => answer.id === childAnswer.id);
        if (!persisted || String(persisted.parentAnswerId || '') !== parentAnswer.id) {
            throw new Error('Store state missing nested parentAnswerId linkage.');
        }

        const deleted = await fetchJson(
            `${baseUrl}/api/student-service/questions/svc-question-e2e/answers/${encodeURIComponent(childAnswer.id)}/delete`,
            { method: 'POST', headers, body: JSON.stringify({}) }
        );
        if (!deleted.ok) {
            throw new Error(`Delete nested answer failed (${deleted.status}): ${deleted.payload?.error || 'unknown error'}`);
        }
        const remainingChild = (deleted.payload?.question?.answers || []).find(answer => answer.id === childAnswer.id);
        if (remainingChild) {
            throw new Error('Deleted nested answer still present in question snapshot.');
        }

        console.log(JSON.stringify({
            ok: true,
            questionId: 'svc-question-e2e',
            legacyAnswerId: 'svc-answer-legacy-e2e',
            legacyDeleteOk: true,
            parentAnswerId: parentAnswer.id,
            childAnswerId: childAnswer.id,
            deleteOk: true
        }, null, 2));
    } finally {
        await new Promise(resolve => listener.close(resolve));
        fs.rmSync(tmpState, { force: true });
    }
}

main().catch(error => {
    console.error(error?.stack || error?.message || String(error));
    process.exit(1);
});