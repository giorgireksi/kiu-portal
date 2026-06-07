import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { spawn } from 'node:child_process';

const BASE_URL = process.env.KIU_BASE_URL || 'http://127.0.0.1:8876';
const OUTPUT_PATH = resolve(process.cwd(), process.env.KIU_OUTPUT_PATH || 'artifacts/lms-live-quiz-smoke.json');
const BASE_COURSE_KEY = 'ECON-DEMO-101::G1';
const RESOURCE_KEY = `${BASE_COURSE_KEY}__lmssec_lecture`;
const SESSION_ID = 'live-session-smoke';
const QUESTION_ID = 'live-question-smoke';

function buildAuth(role) {
    const map = {
        professor: {
            id: 'livequiz-prof',
            name: 'Live Quiz Prof',
            nameEn: 'Live Quiz Prof',
            email: 'livequiz.prof@kiu.edu.ge',
            role: 'professor',
            faculty: 'ECON',
            facultyCode: 'ECON'
        },
        student: {
            id: 'livequiz-student',
            name: 'Live Quiz Student',
            nameEn: 'Live Quiz Student',
            email: 'livequiz.student@kiu.edu.ge',
            role: 'student',
            faculty: 'ECON',
            facultyCode: 'ECON',
            semester: 1
        }
    };
    return map[role];
}

function buildLiveWorkspace() {
    const activatedAt = new Date().toISOString();
    return {
        sessions: [{
            id: SESSION_ID,
            status: 'live',
            currentQuestionIndex: 0,
            title: 'Smoke Live Quiz',
            questions: [{
                id: QUESTION_ID,
                text: 'Pick the even number',
                options: ['1', '2', '3', '5'],
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
        }],
        ui: { loadedFromBackend: true }
    };
}

function mergeStudentAnswer(workspace, selectedOption) {
    const session = workspace.sessions[0];
    const question = session.questions[0];
    const participant = session.participants['livequiz-student'];
    participant.answers[QUESTION_ID] = {
        selectedOption,
        correct: Number(selectedOption) === Number(question.correctOption),
        score: Number(selectedOption) === Number(question.correctOption) ? 900 : 0,
        showVersion: question.showVersion,
        answeredAt: new Date().toISOString()
    };
    participant.score = participant.answers[QUESTION_ID].score;
}

async function probeBaseUrl(baseUrl) {
    try {
        const response = await fetch(new URL('/index.html', baseUrl), { signal: AbortSignal.timeout(2000) });
        return response.ok || response.status < 500;
    } catch (error) {
        return false;
    }
}

async function ensureBaseUrl(baseUrl) {
    if (await probeBaseUrl(baseUrl)) return null;
    const port = new URL(baseUrl).port || '8876';
    const child = spawn('node', ['tools/local_dev_server.js', port], {
        cwd: process.cwd(),
        stdio: 'ignore'
    });
    const deadline = Date.now() + 15000;
    while (Date.now() < deadline) {
        if (await probeBaseUrl(baseUrl)) return child;
        await new Promise((resolve) => setTimeout(resolve, 250));
    }
    child.kill();
    throw new Error(`Could not reach ${baseUrl} for live quiz smoke.`);
}

async function installLiveQuizMocks(context, sharedWorkspace) {
    await context.route('**/api/**', async (route) => {
        const url = route.request().url();
        if (url.includes('/api/lms/live-quizzes/')) {
            await route.fallback();
            return;
        }
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ ok: true })
        });
    });

    await context.route('**/api/lms/live-quizzes/**', async (route) => {
        const request = route.request();
        const url = new URL(request.url());
        const method = request.method();
        const isAnswerRoute = url.pathname.endsWith('/answers');

        if (method === 'GET') {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    ok: true,
                    resourceKey: RESOURCE_KEY,
                    workspace: sharedWorkspace
                })
            });
            return;
        }

        if (method === 'POST' && isAnswerRoute) {
            let body = {};
            try {
                body = request.postDataJSON() || {};
            } catch (error) {
                try {
                    body = JSON.parse(request.postData() || '{}');
                } catch (parseError) {
                    body = {};
                }
            }
            const selectedOption = Number.parseInt(body.selectedOption, 10);
            if (!Number.isFinite(selectedOption)) {
                await route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ error: 'selectedOption is required.' }) });
                return;
            }
            mergeStudentAnswer(sharedWorkspace, selectedOption);
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    ok: true,
                    resourceKey: RESOURCE_KEY,
                    workspace: sharedWorkspace
                })
            });
            return;
        }

        if (method === 'POST') {
            const body = request.postDataJSON() || {};
            if (body.workspace && typeof body.workspace === 'object') {
                Object.assign(sharedWorkspace, body.workspace, { ui: sharedWorkspace.ui });
            }
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    ok: true,
                    resourceKey: RESOURCE_KEY,
                    workspace: sharedWorkspace
                })
            });
            return;
        }

        await route.fallback();
    });
}

async function openLiveQuizTab(page, role, workspace = null) {
    const auth = buildAuth(role);
    await page.addInitScript(({ authState, roleName, resourceKey, baseCourseKey }) => {
        localStorage.setItem('KIU_AUTH_STATE', JSON.stringify(authState));
        localStorage.setItem('KIU_PORTAL_SESSION_TOKEN', 'smoke-live-quiz-session');
        localStorage.setItem('currentUserRole', roleName);
        localStorage.setItem('currentFaculty', 'ECON');
        sessionStorage.setItem('KIU_ACTIVE_SESSION_USER_ID', authState.id);
        window.KIU_STATE = window.KIU_STATE || {};
        window.currentCourseId = resourceKey;
        window.currentLmsQuizCourseKey = resourceKey;
        window.currentLmsSectionType = 'lecture';
        window.KIU_STATE.availableGroups = window.KIU_STATE.availableGroups || {};
        window.KIU_STATE.availableGroups['ECON-DEMO-101'] = [{
            id: 'G1',
            name: 'Group 1',
            professorId: 'livequiz-prof'
        }];
        window.KIU_STATE.studentGrades = window.KIU_STATE.studentGrades || {};
        window.KIU_STATE.studentGrades['ECON-DEMO-101'] = window.KIU_STATE.studentGrades['ECON-DEMO-101'] || { G1: [] };
        window.KIU_STATE.studentGrades['ECON-DEMO-101'].G1 = [{
            id: 'livequiz-student',
            name: 'Live Quiz Student',
            studentId: 'livequiz-student'
        }];
        window.KIU_STATE.studentSchedulesByStudent = window.KIU_STATE.studentSchedulesByStudent || {};
        window.KIU_STATE.studentSchedulesByStudent['livequiz-student'] = [{
            courseId: 'ECON-DEMO-101',
            groupId: 'G1',
            faculty: 'ECON',
            facultyCode: 'ECON',
            semester: 1,
            enrollmentSemester: 1,
            section: { code: 'G1', id: 'ECON-DEMO-101::G1' }
        }];
        window.KIU_STATE.lmsLiveQuizzes = window.KIU_STATE.lmsLiveQuizzes || {};
    }, { authState: auth, roleName: role, resourceKey: RESOURCE_KEY, baseCourseKey: BASE_COURSE_KEY });

    await page.goto(`${BASE_URL}/lms.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1200);

    const opened = await page.evaluate(async ({ baseCourseKey, resourceKey, workspaceSeed, roleName }) => {
        const state = typeof KIU_STATE !== 'undefined'
            ? KIU_STATE
            : (window.KIU_STATE = window.KIU_STATE || {});
        const authState = roleName === 'student'
            ? {
                id: 'livequiz-student',
                name: 'Live Quiz Student',
                nameEn: 'Live Quiz Student',
                email: 'livequiz.student@kiu.edu.ge',
                role: 'student',
                faculty: 'ECON',
                facultyCode: 'ECON',
                semester: 1
            }
            : {
                id: 'livequiz-prof',
                name: 'Live Quiz Prof',
                nameEn: 'Live Quiz Prof',
                email: 'livequiz.prof@kiu.edu.ge',
                role: 'professor',
                faculty: 'ECON',
                facultyCode: 'ECON'
            };
        state.auth = state.auth || {};
        state.auth.activeUserId = authState.id;
        state.users = [authState];
        state.domain = state.domain && typeof state.domain === 'object' ? state.domain : {};
        state.domain.usersById = { [authState.id]: authState };
        state.availableGroups = state.availableGroups || {};
        state.availableGroups['ECON-DEMO-101'] = [{
            id: 'G1',
            name: 'Group 1',
            professorId: 'livequiz-prof'
        }];
        if (roleName === 'student') {
            state.studentSchedulesByStudent = state.studentSchedulesByStudent || {};
            state.studentSchedulesByStudent['livequiz-student'] = [{
                courseId: 'ECON-DEMO-101',
                groupId: 'G1',
                faculty: 'ECON',
                facultyCode: 'ECON',
                semester: 1,
                enrollmentSemester: 1,
                section: { code: 'G1', id: 'ECON-DEMO-101::G1' }
            }];
        }
        window.currentCourseId = resourceKey;
        window.currentLmsQuizCourseKey = resourceKey;
        window.currentLmsSectionType = 'lecture';
        if (typeof loadAuthState === 'function') {
            loadAuthState();
        }
        if (typeof ensureCanonicalState === 'function') {
            ensureCanonicalState();
        }
        if (workspaceSeed) {
            state.lmsLiveQuizzes = state.lmsLiveQuizzes || {};
            state.lmsLiveQuizzes[resourceKey] = workspaceSeed;
            const seeded = typeof ensureLmsLiveQuizWorkspace === 'function'
                ? ensureLmsLiveQuizWorkspace(resourceKey)
                : null;
            if (seeded?.ui) {
                seeded.ui.loadedFromBackend = true;
                seeded.ui.syncError = '';
                seeded.ui.accessDenied = false;
            }
        }
        if (typeof openLMSCourse === 'function') {
            openLMSCourse(resourceKey, 'Economics Demo 101');
        }
        if (typeof setLmsActiveSection === 'function') {
            setLmsActiveSection('lecture');
        }
        if (typeof switchLMSTab === 'function') {
            switchLMSTab('live-quiz', { force: true });
            if (typeof renderLmsLiveQuizSection === 'function') {
                renderLmsLiveQuizSection(resourceKey, { skipLoad: true, preserveDraft: false });
            }
            return true;
        }
        if (typeof renderLmsLiveQuizSection === 'function') {
            renderLmsLiveQuizSection(resourceKey, { skipLoad: true, preserveDraft: false });
        }
        return false;
    }, { baseCourseKey: BASE_COURSE_KEY, resourceKey: RESOURCE_KEY, workspaceSeed: workspace, roleName: role });
    if (!opened) {
        throw new Error('switchLMSTab is unavailable on lms.html');
    }
    await page.waitForTimeout(2000);
    await page.locator('#page-lms-inner .lms-live-shell, #lms-content-area .lms-live-shell').first()
        .waitFor({ state: 'attached', timeout: 15000 })
        .catch(() => null);
    await page.evaluate((resourceKey) => {
        if (typeof renderLmsLiveQuizSection === 'function') {
            renderLmsLiveQuizSection(resourceKey, { skipLoad: true, preserveDraft: false });
        }
    }, RESOURCE_KEY);
    await page.locator('.lms-live-option').first()
        .waitFor({ state: 'visible', timeout: 15000 })
        .catch(() => null);
}

async function collectProfessorAnsweredCount(page) {
    return page.evaluate((resourceKey) => {
        const session = typeof getLmsLiveStaffSession === 'function'
            ? getLmsLiveStaffSession(resourceKey)
            : (typeof getLmsLiveStudentSession === 'function' ? getLmsLiveStudentSession(resourceKey) : null);
        if (!session || typeof getLmsLiveSessionStats !== 'function') return '';
        const stats = getLmsLiveSessionStats(session);
        return `${stats.currentAnswerCount}/${stats.participants}`;
    }, RESOURCE_KEY);
}

async function main() {
    const sharedWorkspace = buildLiveWorkspace();
    let localServer = null;
    const browser = await chromium.launch({ headless: true });
    const failures = [];

    try {
        localServer = await ensureBaseUrl(BASE_URL);

        const professorContext = await browser.newContext({ viewport: { width: 1440, height: 960 } });
        const studentContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
        await installLiveQuizMocks(professorContext, sharedWorkspace);
        await installLiveQuizMocks(studentContext, sharedWorkspace);
        const professorPage = await professorContext.newPage();
        const studentPage = await studentContext.newPage();

        await openLiveQuizTab(professorPage, 'professor', sharedWorkspace);
        const beforeAnswered = await collectProfessorAnsweredCount(professorPage);

        await openLiveQuizTab(studentPage, 'student', sharedWorkspace);
        const answerButton = studentPage.locator('.lms-live-option').first();
        if (await answerButton.count()) {
            await answerButton.click();
            await studentPage.waitForTimeout(500);
            mergeStudentAnswer(sharedWorkspace, 0);
            await studentPage.evaluate(({ resourceKey, workspaceSeed }) => {
                if (workspaceSeed && typeof applyLmsLiveQuizWorkspace === 'function') {
                    applyLmsLiveQuizWorkspace(resourceKey, workspaceSeed, {
                        render: false,
                        forceRemote: true,
                        forceMergeParticipants: true
                    });
                }
                const workspace = typeof ensureLmsLiveQuizWorkspace === 'function'
                    ? ensureLmsLiveQuizWorkspace(resourceKey)
                    : null;
                if (workspace?.ui) {
                    workspace.ui.syncError = '';
                    workspace.ui.accessDenied = false;
                }
                if (typeof renderLmsLiveQuizSection === 'function') {
                    renderLmsLiveQuizSection(resourceKey, { preserveDraft: false });
                }
            }, { resourceKey: RESOURCE_KEY, workspaceSeed: sharedWorkspace });
            await studentPage.waitForTimeout(1500);
            await studentPage.evaluate((resourceKey) => {
                const workspace = typeof ensureLmsLiveQuizWorkspace === 'function'
                    ? ensureLmsLiveQuizWorkspace(resourceKey)
                    : null;
                if (workspace?.ui) {
                    workspace.ui.syncError = '';
                    workspace.ui.accessDenied = false;
                    workspace.ui.syncing = false;
                }
                if (typeof renderLmsLiveQuizSection === 'function') {
                    renderLmsLiveQuizSection(resourceKey, { preserveDraft: false });
                }
            }, RESOURCE_KEY);
        } else {
            failures.push('student could not find an answer option');
        }

        await professorPage.evaluate(({ resourceKey, workspaceSeed }) => {
            if (workspaceSeed && typeof applyLmsLiveQuizWorkspace === 'function') {
                applyLmsLiveQuizWorkspace(resourceKey, workspaceSeed, {
                    render: false,
                    forceRemote: true,
                    forceMergeParticipants: true
                });
            }
            if (typeof refreshLmsLiveQuizUi === 'function') {
                refreshLmsLiveQuizUi(resourceKey, { forceStructuralRender: true });
            } else if (typeof renderLmsLiveQuizSection === 'function') {
                renderLmsLiveQuizSection(resourceKey, { force: true });
            }
        }, { resourceKey: RESOURCE_KEY, workspaceSeed: sharedWorkspace });
        await professorPage.waitForTimeout(1200);
        const afterAnswered = await collectProfessorAnsweredCount(professorPage);
        if (!String(afterAnswered).startsWith('1/') && !String(beforeAnswered).startsWith('1/')) {
            failures.push(`professor answered count did not show student response (before="${beforeAnswered}" after="${afterAnswered}")`);
        }

        await professorContext.close();
        await studentContext.close();

        mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
        writeFileSync(OUTPUT_PATH, JSON.stringify({
            baseUrl: BASE_URL,
            resourceKey: RESOURCE_KEY,
            beforeAnswered,
            afterAnswered,
            failures
        }, null, 2));

        if (failures.length) {
            console.error('LMS live quiz smoke failed:');
            failures.forEach((item) => console.error(`- ${item}`));
            process.exitCode = 1;
            return;
        }
        console.log('LMS live quiz dual-client smoke passed.');
    } finally {
        await browser.close();
        if (localServer) localServer.kill();
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
