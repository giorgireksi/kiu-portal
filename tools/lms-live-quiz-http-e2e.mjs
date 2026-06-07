import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);

const RESOURCE_KEY = 'ECON-DEMO-101::G1__lmssec_lecture';
const SESSION_ID = 'live-session-http-e2e';
const QUESTION_ID = 'live-question-http-e2e';

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
            'livequiz-prof': {
                id: 'livequiz-prof',
                email: 'livequiz.prof@kiu.edu.ge',
                name: 'Live Quiz Prof',
                nameEn: 'Live Quiz Prof',
                displayName: 'Live Quiz Prof',
                role: 'professor',
                faculty: 'ECON',
                facultyCode: 'ECON',
                accountStatus: 'active',
                activationRequired: false,
                mustChangePassword: false,
                createdAt: now,
                updatedAt: now
            },
            'livequiz-student': {
                id: 'livequiz-student',
                email: 'livequiz.student@kiu.edu.ge',
                name: 'Live Quiz Student',
                nameEn: 'Live Quiz Student',
                displayName: 'Live Quiz Student',
                role: 'student',
                faculty: 'ECON',
                facultyCode: 'ECON',
                semester: 1,
                accountStatus: 'active',
                activationRequired: false,
                mustChangePassword: false,
                createdAt: now,
                updatedAt: now
            }
        },
        credentials: {},
        courses: {
            'ECON-DEMO-101': {
                id: 'ECON-DEMO-101',
                code: 'ECON-DEMO-101',
                name: 'Economics Demo 101',
                facultyCode: 'ECON',
                createdAt: now,
                updatedAt: now
            }
        },
        sections: {
            'ECON-DEMO-101::G1': {
                id: 'ECON-DEMO-101::G1',
                courseId: 'ECON-DEMO-101',
                code: 'G1',
                name: 'Group 1',
                facultyCode: 'ECON',
                sessionType: 'lecture',
                professorId: 'livequiz-prof',
                taIds: [],
                createdAt: now,
                updatedAt: now
            }
        },
        enrollments: {
            'enr::livequiz-student::ECON-DEMO-101::G1': {
                id: 'enr::livequiz-student::ECON-DEMO-101::G1',
                studentId: 'livequiz-student',
                courseId: 'ECON-DEMO-101',
                sectionId: 'ECON-DEMO-101::G1',
                status: 'active',
                registeredAt: now,
                createdAt: now,
                updatedAt: now
            }
        },
        portal: {
            state: {
                availableGroups: {
                    'ECON-DEMO-101': [{
                        id: 'G1',
                        name: 'Group 1',
                        professorId: 'livequiz-prof'
                    }]
                }
            },
            liveQuizWorkspaces: {}
        },
        lmsCourses: {},
        sessions: {},
        chats: {},
        notifications: {},
        auditEvents: []
    };
}

function buildLiveWorkspace() {
    const activatedAt = new Date().toISOString();
    return {
        sessions: [{
            id: SESSION_ID,
            status: 'live',
            currentQuestionIndex: 0,
            title: 'HTTP E2E Live Quiz',
            questions: [{
                id: QUESTION_ID,
                text: '2 + 2 = ?',
                options: ['3', '4', '5', '6'],
                correctOption: 1,
                timeLimit: 45,
                state: 'showing',
                showVersion: 1,
                activatedAt
            }],
            participants: {
                'livequiz-student': {
                    id: 'livequiz-student',
                    accountId: 'livequiz-student',
                    nickname: 'Live Quiz Student',
                    answers: {},
                    score: 0
                }
            }
        }]
    };
}

async function fetchJson(url, options = {}) {
    const response = await fetch(url, options);
    const text = await String(await response.text());
    let payload = null;
    try {
        payload = text ? JSON.parse(text) : null;
    } catch (error) {
        throw new Error(`Non-JSON response (${response.status}): ${text.slice(0, 240)}`);
    }
    if (!response.ok) {
        const message = payload?.error || payload?.message || text || `HTTP ${response.status}`;
        throw new Error(`${response.status} ${message}`);
    }
    return payload;
}

async function main() {
    const tmpState = path.join(os.tmpdir(), `kiu-live-quiz-http-e2e-${process.pid}.json`);
    const port = 46000 + Math.floor(Math.random() * 2000);
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
    ['livequiz-prof', 'livequiz-student'].forEach((accountId) => {
        const credential = store.ensureCredential(accountId);
        if (credential) {
            credential.activationRequired = false;
            credential.mustChangePassword = false;
        }
    });

    const profSession = store.createSessionForAccount('livequiz-prof', { identityProvider: 'portal' });
    const studentSession = store.createSessionForAccount('livequiz-student', { identityProvider: 'portal' });
    if (!profSession?.session?.token || !studentSession?.session?.token) {
        throw new Error(`Failed to create portal sessions: prof=${profSession?.error || 'missing'} student=${studentSession?.error || 'missing'}`);
    }
    const profToken = profSession.session.token;
    const studentToken = studentSession.session.token;
    const baseUrl = `http://127.0.0.1:${port}`;
    const encodedKey = encodeURIComponent(RESOURCE_KEY);

    try {
        const saved = await fetchJson(`${baseUrl}/api/lms/live-quizzes/${encodedKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-portal-session': profToken
            },
            body: JSON.stringify({
                workspace: buildLiveWorkspace(),
                reason: 'http-e2e-prof-sync'
            })
        });
        if (!saved?.workspace?.sessions?.[0]?.participants?.['livequiz-student']) {
            throw new Error('Professor sync did not seed student participant.');
        }

        await fetchJson(`${baseUrl}/api/lms/live-quizzes/${encodedKey}/answers`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-portal-session': studentToken
            },
            body: JSON.stringify({
                sessionId: SESSION_ID,
                questionId: QUESTION_ID,
                selectedOption: 1
            })
        });

        const reloaded = await fetchJson(`${baseUrl}/api/lms/live-quizzes/${encodedKey}`, {
            headers: { 'x-portal-session': profToken }
        });
        const studentReload = await fetchJson(`${baseUrl}/api/lms/live-quizzes/${encodedKey}`, {
            headers: { 'x-portal-session': studentToken }
        });
        const answer = reloaded?.workspace?.sessions?.[0]?.participants?.['livequiz-student']?.answers?.[QUESTION_ID];
        const studentAnswer = studentReload?.workspace?.sessions?.[0]?.participants?.['livequiz-student']?.answers?.[QUESTION_ID];
        if (!answer || Number(answer.selectedOption) !== 1) {
            throw new Error('Professor GET did not include the student answer.');
        }
        if (!studentAnswer || Number(studentAnswer.selectedOption) !== 1) {
            throw new Error('Student GET after answer did not include the saved answer.');
        }
        if (answer.correct !== true) {
            throw new Error('Student answer was not scored as correct.');
        }
        const studentScore = Number(studentReload?.workspace?.sessions?.[0]?.participants?.['livequiz-student']?.score || 0);
        if (studentScore <= 0) {
            throw new Error('Student score was not persisted on the server workspace.');
        }

        console.log('LMS live quiz HTTP e2e passed.');
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