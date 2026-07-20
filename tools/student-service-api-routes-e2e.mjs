import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import {
    STUDENT_SERVICE_API_MANIFEST,
    STUDENT_SERVICE_API_MANIFEST_VERSION,
    normalizeStudentServiceApiPath
} from './student-service-api-manifest.mjs';

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
            },
            'svc-1': {
                id: 'svc-1',
                email: 'service.desk@kiu.edu.ge',
                name: 'Service Desk',
                nameEn: 'Service Desk',
                displayName: 'Service Desk',
                role: 'student_service',
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
                studentServiceTickets: [{
                    id: 'SVC-100',
                    studentId: 'student-1',
                    studentName: 'Student One',
                    category: 'Finance / Payments',
                    title: 'Fee receipt',
                    message: 'Need help with my receipt.',
                    facultyCode: 'ECON',
                    status: 'open'
                }],
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
                studentServiceAnswers: []
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

function isMissingRouteResponse(result) {
    return result?.status === 404 && String(result?.payload?.error || '').trim() === 'Route not found.';
}

function sessionHeaders(token) {
    return {
        'Content-Type': 'application/json',
        'x-portal-session': token
    };
}

function buildRouteUrl(baseUrl, pattern, ids = {}) {
    let resolved = pattern;
    if (resolved.startsWith('/api/student-service/tickets/')) {
        resolved = resolved.replace(':param', encodeURIComponent(ids.ticketId));
    } else {
        resolved = resolved.replace(':param', encodeURIComponent(ids.questionId));
    }
    resolved = resolved.replace(':param', encodeURIComponent(ids.answerId));
    return `${baseUrl}${resolved.replace(/:param/g, 'missing')}`;
}

async function main() {
    const tmpState = path.join(os.tmpdir(), `kiu-student-service-routes-e2e-${process.pid}.json`);
    const port = 49000 + Math.floor(Math.random() * 2000);
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

    ['student-1', 'student-2', 'svc-1'].forEach(accountId => {
        const credential = store.ensureCredential(accountId);
        if (credential) {
            credential.activationRequired = false;
            credential.mustChangePassword = false;
        }
    });

    const authorSession = store.createSessionForAccount('student-1', { identityProvider: 'portal' });
    const otherSession = store.createSessionForAccount('student-2', { identityProvider: 'portal' });
    const staffSession = store.createSessionForAccount('svc-1', { identityProvider: 'portal' });
    if (!authorSession?.session?.token || !otherSession?.session?.token || !staffSession?.session?.token) {
        throw new Error('Failed to create student service route e2e sessions.');
    }

    const baseUrl = `http://127.0.0.1:${port}`;
    const ids = {
        questionId: 'svc-question-e2e',
        ticketId: 'SVC-100',
        answerId: 'svc-answer-e2e'
    };
    const routeFailures = [];
    const destructiveRouteIds = new Set([
        'questionDelete',
        'questionAnswerDelete',
        'questionMerge',
        'questionConvertTicket',
        'questionConvertArticle'
    ]);

    try {
        const bootstrap = await fetchJson(`${baseUrl}/api/student-service/bootstrap`, {
            method: 'GET',
            headers: sessionHeaders(authorSession.session.token)
        });
        if (isMissingRouteResponse(bootstrap)) {
            routeFailures.push('GET /api/student-service/bootstrap returned Route not found');
        }

        const ownerResolved = await fetchJson(
            `${baseUrl}/api/student-service/questions/${encodeURIComponent(ids.questionId)}/owner-resolution`,
            {
                method: 'POST',
                headers: sessionHeaders(authorSession.session.token),
                body: JSON.stringify({ status: 'answered' })
            }
        );
        if (!ownerResolved.ok) {
            throw new Error(`Owner resolution author call failed (${ownerResolved.status}): ${ownerResolved.payload?.error || 'unknown error'}`);
        }
        if (ownerResolved.payload?.question?.ownerResolutionStatus !== 'answered') {
            throw new Error('Owner resolution author call did not persist answered status.');
        }

        const ownerDenied = await fetchJson(
            `${baseUrl}/api/student-service/questions/${encodeURIComponent(ids.questionId)}/owner-resolution`,
            {
                method: 'POST',
                headers: sessionHeaders(otherSession.session.token),
                body: JSON.stringify({ status: 'answered' })
            }
        );
        if (isMissingRouteResponse(ownerDenied)) {
            routeFailures.push('POST /api/student-service/questions/:param/owner-resolution returned Route not found for non-author');
        } else if (ownerDenied.status !== 403) {
            throw new Error(`Expected 403 for non-author owner-resolution, received ${ownerDenied.status}`);
        }

        const postRoutes = STUDENT_SERVICE_API_MANIFEST.filter(entry => entry.method === 'POST');
        for (const route of postRoutes) {
            if (destructiveRouteIds.has(route.id)) continue;
            const url = buildRouteUrl(baseUrl, route.pattern, ids);
            const token = route.id.startsWith('questionPublish') || route.id.startsWith('questionFlags')
                || route.id.startsWith('questionConvert') || route.id.startsWith('questionMerge')
                ? staffSession.session.token
                : authorSession.session.token;
            const result = await fetchJson(url, {
                method: 'POST',
                headers: sessionHeaders(token),
                body: JSON.stringify({})
            });
            if (isMissingRouteResponse(result)) {
                routeFailures.push(`${route.method} ${route.pattern} returned Route not found`);
            }
        }

        for (const routeId of destructiveRouteIds) {
            const route = postRoutes.find(entry => entry.id === routeId);
            if (!route) continue;
            const url = buildRouteUrl(baseUrl, route.pattern, ids);
            const result = await fetchJson(url, {
                method: 'POST',
                headers: sessionHeaders(staffSession.session.token),
                body: JSON.stringify({})
            });
            if (isMissingRouteResponse(result)) {
                routeFailures.push(`${route.method} ${route.pattern} returned Route not found`);
            }
        }

        if (routeFailures.length) {
            throw new Error(`Student service route smoke failures:\n- ${routeFailures.join('\n- ')}`);
        }

        console.log(JSON.stringify({
            ok: true,
            manifestVersion: STUDENT_SERVICE_API_MANIFEST_VERSION,
            routesChecked: postRoutes.length + 1,
            ownerResolutionAuthorStatus: ownerResolved.payload?.question?.ownerResolutionStatus,
            ownerResolutionDeniedStatus: ownerDenied.status,
            normalizedOwnerRoute: normalizeStudentServiceApiPath('/api/student-service/questions/svc-question-e2e/owner-resolution')
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