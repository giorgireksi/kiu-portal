import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const BASE_URL = process.env.KIU_BASE_URL || 'http://127.0.0.1:8894';
const OUTPUT_DIR = resolve(process.cwd(), process.env.KIU_OUTPUT_DIR || 'artifacts');

const RUNS = [
    {
        mode: 'efficient-desktop',
        viewport: { width: 1440, height: 960 },
        reducedMotion: 'reduce',
        cpuThrottleRate: 4,
        emulateLowSpec: true,
        output: 'exams-efficient-desktop-summary.json'
    },
    {
        mode: 'mobile',
        viewport: { width: 390, height: 844 },
        reducedMotion: 'no-preference',
        cpuThrottleRate: 1,
        emulateLowSpec: false,
        output: 'exams-mobile-summary.json'
    }
];

const AUTH_STATE = {
    id: 'exams-admin',
    name: 'Exams Admin',
    nameEn: 'Exams Admin',
    email: 'exams.admin@kiu.edu.ge',
    role: 'admin',
    faculty: 'ECON',
    facultyCode: 'ECON',
    avatar: ''
};

const EXAM_TEMPLATE = {
    id: 'exam-template-1',
    title: 'Microeconomics Midterm',
    subjectId: 'ECON101',
    subjectName: 'Microeconomics I',
    faculty: 'ECON',
    courseNumber: '1',
    courseCode: '221',
    examType: 'digital',
    durationMinutes: 90,
    passingScore: 50,
    gradingWeight: 30,
    status: 'approved',
    createdBy: 'exams-admin',
    createdByName: 'Exams Admin',
    updatedAt: new Date().toISOString(),
    questionBank: [
        {
            id: 'q1',
            type: 'mcq',
            text: 'Which curve shifts when demand increases?',
            score: 5,
            optionCount: 4,
            options: ['Supply', 'Demand', 'Marginal cost', 'Average fixed cost'],
            correctOption: 1
        },
        {
            id: 'q2',
            type: 'written',
            text: 'Explain one reason price controls can create shortages.',
            score: 10,
            optionCount: 2,
            options: ['', ''],
            correctOption: 0
        }
    ],
    variants: [
        {
            id: 'variant-a',
            label: 'Variant A',
            questionIds: ['q1', 'q2'],
            shuffleQuestions: true,
            shuffleOptions: true
        }
    ]
};

const EXAM_SESSION = {
    id: 'exam-session-1',
    templateId: 'exam-template-1',
    title: 'Microeconomics Midterm',
    subjectId: 'ECON101',
    subjectName: 'Microeconomics I',
    faculty: 'ECON',
    variantLabel: 'Variant A',
    startAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    endAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    durationMinutes: 90,
    placeLabel: 'Main Hall',
    roomLabel: 'Lab 301',
    roomCapacity: 24,
    observerNames: ['Exams Admin'],
    assignedStudentIds: ['student-qa'],
    assignedStudents: [
        {
            id: 'student-qa',
            name: 'QA Student Alpha',
            facultyCode: 'ECON',
            facultyLabel: 'School of Economics',
            groupNames: ['G1']
        }
    ],
    questionsSnapshot: [
        { id: 'q1', type: 'mcq', score: 5 },
        { id: 'q2', type: 'written', score: 10 }
    ],
    protectedCourseId: 'exam-session::exam-session-1',
    protectedQuizId: 'exam-session-1',
    published: true,
    status: 'live'
};

const ATTEMPTS_PAYLOAD = {
    attempts: [
        {
            student: {
                id: 'student-qa',
                name: 'QA Student Alpha',
                facultyCode: 'ECON',
                facultyLabel: 'School of Economics',
                groupNames: ['G1']
            },
            attempt: {
                studentId: 'student-qa',
                status: 'submitted',
                autoScoreRaw: 5,
                manualScoreRaw: 0,
                finalScoreRaw: 5,
                warningCount: 0,
                blocked: false,
                clientType: 'desktop-app',
                responseSummary: {
                    answeredQuestions: 2,
                    totalQuestions: 2,
                    writtenQuestions: 1
                },
                questionResults: [
                    {
                        questionId: 'q2',
                        type: 'written',
                        manualMax: 10,
                        manualScoreAwarded: 0,
                        scoreAwarded: 0,
                        needsManualReview: true
                    }
                ]
            }
        }
    ]
};

function buildInitScript() {
    return ({ lowSpec, authState, attemptsPayload }) => {
        localStorage.setItem('KIU_AUTH_STATE', JSON.stringify(authState));
        localStorage.setItem('currentUserRole', authState.role);
        localStorage.setItem('currentFaculty', authState.faculty);
        localStorage.removeItem('KIU_PENDING_ROLE_SWITCH_ROLE');
        localStorage.removeItem('KIU_PORTAL_SESSION_TOKEN');
        sessionStorage.removeItem('KIU_ACTIVE_ROLE_IMPERSONATION');
        sessionStorage.setItem('KIU_ACTIVE_SESSION_USER_ID', authState.id);

        if (lowSpec) {
            Object.defineProperty(navigator, 'deviceMemory', {
                configurable: true,
                get: () => 4
            });
            Object.defineProperty(navigator, 'hardwareConcurrency', {
                configurable: true,
                get: () => 4
            });
        }

        window.__kiuExamsPerfProbe = {
            longTasks: [],
            longTaskTotalMs: 0
        };

        window.fetchProtectedQuizAttempts = async () => structuredClone(attemptsPayload);
        window.performProtectedQuizStudentAction = async () => ({ ok: true });
        window.saveProtectedQuizManualGrade = async (_courseId, _quizId, payload) => ({ ok: true, payload });
        window.syncExamSessionRecord = async (session) => session;
        window.getActiveCurriculum = () => [
            {
                id: 'ECON101',
                name: 'Microeconomics I',
                facultyCode: 'ECON'
            }
        ];

        try {
            const observer = new PerformanceObserver((list) => {
                const target = window.__kiuExamsPerfProbe;
                if (!target) return;
                for (const entry of list.getEntries()) {
                    const duration = Number(entry.duration || 0);
                    target.longTasks.push({
                        name: entry.name || 'longtask',
                        duration
                    });
                    target.longTaskTotalMs += duration;
                }
            });
            observer.observe({ type: 'longtask', buffered: true });
        } catch (_) {
            // Best-effort only.
        }
    };
}

async function isExamsReady(page) {
    return page.evaluate(() => {
        const body = document.body;
        const root = document.getElementById('admin-exams-root');
        if (!body || body.classList.contains('kiu-shell-loading') || !root) return false;
        return Boolean(root.querySelector('.ex2-shell') && root.textContent.trim().length > 200);
    });
}

async function waitForExamsReady(page) {
    await page.waitForFunction(
        () => {
            const body = document.body;
            const root = document.getElementById('admin-exams-root');
            if (!body || body.classList.contains('kiu-shell-loading') || !root) return false;
            return Boolean(root.querySelector('.ex2-shell') && root.textContent.trim().length > 200);
        },
        undefined,
        { timeout: 20000 }
    );
}

async function measureInteraction(action, ready) {
    const start = Date.now();
    await action();
    await ready();
    return Date.now() - start;
}

async function seedExamData(page) {
    await page.evaluate(({ authState, template, session, attemptsPayload }) => {
        const liveState = typeof KIU_STATE === 'object' && KIU_STATE ? KIU_STATE : (window.KIU_STATE = window.KIU_STATE || {});
        const emptyState = typeof KIU_EMPTY_STATE === 'object' && KIU_EMPTY_STATE ? KIU_EMPTY_STATE : (window.KIU_EMPTY_STATE = window.KIU_EMPTY_STATE || {});
        liveState.facultyProfiles = liveState.facultyProfiles || {};
        liveState.facultyProfiles.ECON = {
            name: 'School of Economics',
            fullName: 'School of Economics'
        };
        emptyState.facultyProfiles = emptyState.facultyProfiles || liveState.facultyProfiles;
        liveState.users = [
            authState,
            {
                id: 'student-qa',
                name: 'QA Student Alpha',
                nameEn: 'QA Student Alpha',
                email: 'qa.student@kiu.edu.ge',
                role: 'student',
                faculty: 'ECON',
                facultyCode: 'ECON'
            },
            {
                id: 'prof-qa',
                name: 'Professor QA',
                nameEn: 'Professor QA',
                email: 'prof.qa@kiu.edu.ge',
                role: 'professor',
                faculty: 'ECON',
                facultyCode: 'ECON'
            }
        ];
        liveState.examTemplatesByFaculty = {
            ECON: [structuredClone(template)]
        };
        liveState.examTemplateLinksByTemplateId = {};
        liveState.examSessionsById = {
            [session.id]: structuredClone(session)
        };
        window.KIU_STATE = liveState;
        window.KIU_EMPTY_STATE = emptyState;
        window.fetchProtectedQuizAttempts = async () => structuredClone(attemptsPayload);
        window.performProtectedQuizStudentAction = async () => ({ ok: true });
        window.saveProtectedQuizManualGrade = async (_courseId, _quizId, payload) => ({ ok: true, payload });
        window.syncExamSessionRecord = async (nextSession) => nextSession;
        window.getActiveCurriculum = () => [
            {
                id: 'ECON101',
                name: 'Microeconomics I',
                facultyCode: 'ECON'
            }
        ];
        if (typeof window.renderAdminExamSection === 'function') {
            window.renderAdminExamSection();
        }
    }, {
        authState: AUTH_STATE,
        template: EXAM_TEMPLATE,
        session: EXAM_SESSION,
        attemptsPayload: ATTEMPTS_PAYLOAD
    });
}

async function captureRun(browser, run) {
    const context = await browser.newContext({
        viewport: run.viewport,
        colorScheme: 'dark'
    });
    await context.route('https://unpkg.com/**', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/javascript',
            body: 'window.jspdf = { jsPDF: function jsPDF() {} }; window.jsPDF = function jsPDF() {}; window.docx = { Document:function(){}, Packer:{ toBlob: async () => new Blob([]) }, Paragraph:function(){}, TextRun:function(){}, HeadingLevel:{ HEADING_1: 1, HEADING_2: 2 }, AlignmentType:{ CENTER: "center" }, BorderStyle:{ SINGLE: "single" }, TableRow:function(){}, TableCell:function(){}, Table:function(){}, WidthType:{ DXA: "dxa" } }; window.saveAs = function saveAs() {};'
        });
    });
    await context.route('http://127.0.0.1:48933/**', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({})
        });
    });
    await context.route('http://localhost:48933/**', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({})
        });
    });
    await context.addInitScript(buildInitScript(), {
        lowSpec: run.emulateLowSpec,
        authState: AUTH_STATE,
        attemptsPayload: ATTEMPTS_PAYLOAD
    });

    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
    page.on('console', (message) => {
        if (message.type() === 'error') errors.push(`console: ${message.text()}`);
    });

    await page.emulateMedia({ reducedMotion: run.reducedMotion });
    const cdp = await context.newCDPSession(page);
    if (run.cpuThrottleRate > 1) {
        await cdp.send('Emulation.setCPUThrottlingRate', { rate: run.cpuThrottleRate });
    }

    const start = Date.now();
    await page.goto(`${BASE_URL}/exams.html`, { waitUntil: 'domcontentloaded' });
    await waitForExamsReady(page);
    const ready = await isExamsReady(page);
    if (!ready) {
        throw new Error('Exams route did not reach a ready state within the expected settle window.');
    }
    const firstReadyMs = Date.now() - start;

    await seedExamData(page);
    await waitForExamsReady(page);

    const builderOpenMs = await measureInteraction(
        async () => {
            await page.evaluate(() => window.beginExamTemplateCreation());
        },
        async () => {
            await page.waitForFunction(() => Boolean(document.querySelector('.ex2-builder-fullscreen')), { timeout: 15000 });
        }
    );

    await page.evaluate(() => window.cancelExamDraft());
    await page.waitForFunction(() => !document.querySelector('.ex2-builder-fullscreen'), { timeout: 15000 });

    const gradingOpenMs = await measureInteraction(
        async () => {
            await page.evaluate(async () => {
                window.setExamTab('results');
                await window.selectExamSession('exam-session-1', 'results');
            });
        },
        async () => {
            await page.waitForFunction(() => Boolean(document.querySelector('[id^="exam-manual-grade-"]')), { timeout: 15000 });
        }
    );

    const metrics = await page.evaluate(() => {
        const probe = window.__kiuExamsPerfProbe || { longTasks: [], longTaskTotalMs: 0 };
        const mobileNav = document.getElementById('mobile-bottom-nav');
        return {
            title: document.title,
            url: window.location.href,
            bodyClass: document.body.className,
            performanceTier: document.body.dataset.luxPerformance || '',
            builderVisible: Boolean(document.querySelector('.ex2-builder-fullscreen')),
            manualGradeVisible: Boolean(document.querySelector('[id^="exam-manual-grade-"]')),
            resultSessionCards: document.querySelectorAll('.ex2-select-card').length,
            mobileNavVisible: mobileNav ? getComputedStyle(mobileNav).display !== 'none' : false,
            longTaskCount: Array.isArray(probe.longTasks) ? probe.longTasks.length : 0,
            longTaskTotalMs: Number(probe.longTaskTotalMs || 0)
        };
    });

    await context.close();

    return {
        mode: run.mode,
        viewport: `${run.viewport.width}x${run.viewport.height}`,
        cpuThrottleRate: run.cpuThrottleRate,
        reducedMotion: run.reducedMotion,
        firstReadyMs,
        builderOpenMs,
        gradingOpenMs,
        errors,
        ...metrics
    };
}

async function main() {
    const browser = await chromium.launch({ headless: true });
    try {
        mkdirSync(OUTPUT_DIR, { recursive: true });
        for (const run of RUNS) {
            const summary = await captureRun(browser, run);
            const outputPath = resolve(OUTPUT_DIR, run.output);
            writeFileSync(outputPath, JSON.stringify(summary, null, 2));
            console.log(`Wrote ${outputPath}`);
        }
    } finally {
        await browser.close();
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
