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
        output: 'faculty-gradebook-efficient-desktop-summary.json'
    },
    {
        mode: 'mobile',
        viewport: { width: 390, height: 844 },
        reducedMotion: 'no-preference',
        cpuThrottleRate: 1,
        emulateLowSpec: false,
        output: 'faculty-gradebook-mobile-summary.json'
    }
];

const AUTH_STATE = {
    id: 'prof-qa-001',
    name: 'QA Prof Alpha',
    nameEn: 'QA Prof Alpha',
    avatar: '',
    email: 'qa.prof.alpha@kiu.edu.ge',
    role: 'professor',
    faculty: 'ECON',
    facultyCode: 'ECON'
};

function buildPersistedState() {
    return {
        meta: { manualTestingSanitizedVersion: 6 },
        auth: { activeUserId: AUTH_STATE.id },
        users: [
            AUTH_STATE,
            { id: 'student-qa-001', name: 'QA Student One', nameEn: 'QA Student One', role: 'student', faculty: 'ECON', facultyCode: 'ECON' },
            { id: 'student-qa-002', name: 'QA Student Two', nameEn: 'QA Student Two', role: 'student', faculty: 'ECON', facultyCode: 'ECON' },
            { id: 'student-qa-003', name: 'QA Student Three', nameEn: 'QA Student Three', role: 'student', faculty: 'ECON', facultyCode: 'ECON' }
        ],
        curriculum: [
            { id: 'ECON-301', code: 'ECON-301', name: 'Advanced Economics', icon: 'fas fa-chart-line', faculty: 'ECON' },
            { id: 'ECON-401', code: 'ECON-401', name: 'Behavioral Finance', icon: 'fas fa-coins', faculty: 'ECON' }
        ],
        availableGroups: {
            'ECON-301': [
                {
                    id: 'g1',
                    name: 'Group G1',
                    prof: 'QA Prof Alpha',
                    ta: 'QA TA Alpha',
                    day: 'Mon',
                    time: '09:00',
                    duration: '110min',
                    room: 'B-201',
                    semester: '3',
                    faculty: 'ECON',
                    capacity: 30,
                    registered: 2
                }
            ],
            'ECON-401': [
                {
                    id: 'g4',
                    name: 'Group G4',
                    prof: 'QA Prof Alpha',
                    ta: 'QA TA Alpha',
                    day: 'Wed',
                    time: '11:00',
                    duration: '110min',
                    room: 'B-305',
                    semester: '4',
                    faculty: 'ECON',
                    capacity: 25,
                    registered: 1
                }
            ]
        },
        studentSchedulesByStudent: {
            'student-qa-001': [{ courseId: 'ECON-301', groupId: 'g1', faculty: 'ECON' }],
            'student-qa-002': [{ courseId: 'ECON-301', groupId: 'g1', faculty: 'ECON' }],
            'student-qa-003': [{ courseId: 'ECON-401', groupId: 'g4', faculty: 'ECON' }]
        },
        studentGrades: {
            econ301_g1: [
                { id: 'student-qa-001', name: 'QA Student One', q1: 8, qa: 90, mid: 78, final: 0, assessments: {} },
                { id: 'student-qa-002', name: 'QA Student Two', q1: 7, qa: 84, mid: 74, final: 0, assessments: {} }
            ],
            econ401_g4: [
                { id: 'student-qa-003', name: 'QA Student Three', q1: 10, qa: 95, mid: 88, final: 0, assessments: {} }
            ]
        },
        facultyProfiles: {
            ECON: {
                name: 'Management & Business',
                fullName: 'Management & Business',
                professors: [{ id: AUTH_STATE.id, name: AUTH_STATE.name, nameEn: AUTH_STATE.nameEn, facultyCode: 'ECON', faculty: 'ECON' }],
                tas: [{ id: 'ta-qa-001', name: 'QA TA Alpha', nameEn: 'QA TA Alpha', facultyCode: 'ECON', faculty: 'ECON' }],
                students: []
            }
        }
    };
}

function buildInitScript() {
    return ({ lowSpec, authState, persistedState }) => {
        try {
            localStorage.setItem('KIU_AUTH_STATE', JSON.stringify(authState));
            localStorage.setItem('currentUserRole', authState.role);
            localStorage.setItem('currentFaculty', authState.faculty);
            localStorage.setItem('KIU_FACULTY_CONTEXT', authState.faculty);
            localStorage.setItem('KIU_REAL_TESTING_CLEANUP_V6', '6');
            localStorage.removeItem('KIU_PENDING_ROLE_SWITCH_ROLE');
            localStorage.removeItem('KIU_PORTAL_SESSION_TOKEN');
            localStorage.setItem('KIU_PERSISTENT_STATE', JSON.stringify(persistedState));
            sessionStorage.removeItem('KIU_ACTIVE_ROLE_IMPERSONATION');
            sessionStorage.setItem('KIU_ACTIVE_SESSION_USER_ID', authState.id);
        } catch (error) {}

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
    };
}

async function waitForRouteReady(page) {
    await page.waitForFunction(
        () => document.querySelectorAll('.course-card').length > 0,
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

async function captureRun(browser, run) {
    const context = await browser.newContext({
        viewport: run.viewport,
        colorScheme: 'dark'
    });
    await context.addInitScript(buildInitScript(), {
        lowSpec: run.emulateLowSpec,
        authState: AUTH_STATE,
        persistedState: buildPersistedState()
    });

    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
    page.on('console', (message) => {
        if (message.type() === 'error') errors.push(`console: ${message.text()}`);
    });

    await page.route('http://127.0.0.1:48933/**', async (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }));
    await page.route('http://localhost:48933/**', async (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }));

    await page.emulateMedia({ reducedMotion: run.reducedMotion });
    const cdp = await context.newCDPSession(page);
    if (run.cpuThrottleRate > 1) {
        await cdp.send('Emulation.setCPUThrottlingRate', { rate: run.cpuThrottleRate });
    }

    const start = Date.now();
    await page.goto(`${BASE_URL}/faculty-gradebook.html`, { waitUntil: 'domcontentloaded' });
    await waitForRouteReady(page);
    const firstReadyMs = Date.now() - start;

    const filterChangeMs = await measureInteraction(
        async () => {
            await page.evaluate(() => {
                const select = document.getElementById('fs-filter-sem');
                select.value = '4';
                select.dispatchEvent(new Event('change', { bubbles: true }));
            });
        },
        async () => {
            await page.waitForFunction(
                () => {
                    const firstCard = document.querySelector('.course-card .lms-route-title');
                    return Boolean(firstCard && /ECON-401/i.test(firstCard.textContent || ''));
                },
                undefined,
                { timeout: 15000 }
            );
        }
    );

    await page.evaluate(() => {
        const select = document.getElementById('fs-filter-sem');
        select.value = '3';
        select.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await page.waitForFunction(
        () => {
            const firstCard = document.querySelector('.course-card .lms-route-title');
            return Boolean(firstCard && /ECON-301/i.test(firstCard.textContent || ''));
        },
        undefined,
        { timeout: 15000 }
    );

    const gradeTableOpenMs = await measureInteraction(
        async () => {
            await page.locator('.course-card').first().evaluate((node) => node.click());
        },
        async () => {
            await page.waitForFunction(
                () => document.querySelectorAll('#gradebook-body tr').length === 2,
                undefined,
                { timeout: 15000 }
            );
        }
    );

    const historyOpenMs = await measureInteraction(
        async () => {
            await page.evaluate(() => {
                const button = Array.from(document.querySelectorAll('button'))
                    .find((node) => (node.textContent || '').includes('View all history'));
                button?.click();
            });
        },
        async () => {
            await page.waitForFunction(
                () => Boolean(document.getElementById('student-evaluation-history-modal')),
                undefined,
                { timeout: 15000 }
            );
        }
    );

    const metrics = await page.evaluate(() => {
        const mobileNav = document.getElementById('mobile-bottom-nav');
        return {
            title: document.title,
            url: window.location.href,
            bodyClass: document.body.className,
            rosterCardCount: document.querySelectorAll('.course-card').length,
            gradeTableRowCount: document.querySelectorAll('#gradebook-body tr').length,
            historyModalVisible: Boolean(document.getElementById('student-evaluation-history-modal')),
            historyModalTitle: document.querySelector('#student-evaluation-history-modal h2')?.textContent?.trim() || '',
            dynamicTitle: document.getElementById('dynamic-gb-title')?.textContent?.trim() || '',
            mobileNavVisible: mobileNav ? getComputedStyle(mobileNav).display !== 'none' : false
        };
    });

    await context.close();

    return {
        mode: run.mode,
        viewport: `${run.viewport.width}x${run.viewport.height}`,
        cpuThrottleRate: run.cpuThrottleRate,
        reducedMotion: run.reducedMotion,
        firstReadyMs,
        filterChangeMs,
        gradeTableOpenMs,
        historyOpenMs,
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
