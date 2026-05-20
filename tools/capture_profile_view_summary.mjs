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
        output: 'profile-view-efficient-desktop-summary.json'
    },
    {
        mode: 'mobile',
        viewport: { width: 390, height: 844 },
        reducedMotion: 'no-preference',
        cpuThrottleRate: 1,
        emulateLowSpec: false,
        output: 'profile-view-mobile-summary.json'
    }
];

const AUTH_STATE = {
    id: 'pv-admin',
    name: 'Profile Admin',
    nameEn: 'Profile Admin',
    email: 'profile.admin@kiu.edu.ge',
    role: 'admin',
    faculty: 'ECON',
    facultyCode: 'ECON',
    avatar: ''
};

function buildInitScript() {
    return ({ lowSpec, authState }) => {
        localStorage.setItem('KIU_AUTH_STATE', JSON.stringify(authState));
        localStorage.setItem('currentUserRole', authState.role);
        localStorage.setItem('currentFaculty', authState.faculty);
        localStorage.removeItem('KIU_PENDING_ROLE_SWITCH_ROLE');
        localStorage.removeItem('KIU_PORTAL_SESSION_TOKEN');
        sessionStorage.setItem('KIU_ACTIVE_SESSION_USER_ID', authState.id);
        sessionStorage.setItem('pv_type', 'professor');
        sessionStorage.setItem('pv_id', 'prof-1');
        sessionStorage.setItem('pv_fac', 'ECON');

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

        window.__kiuProfileViewPerfProbe = {
            longTasks: [],
            longTaskTotalMs: 0
        };

        try {
            const observer = new PerformanceObserver((list) => {
                const target = window.__kiuProfileViewPerfProbe;
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

async function waitForShellReady(page) {
    await page.waitForFunction(
        () => {
            const body = document.body;
            const root = document.getElementById('profile-view-root');
            return Boolean(body && root && root.textContent.trim().length > 0);
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

async function seedProfileViewData(page) {
    await page.evaluate(({ authState }) => {
        const liveState = typeof KIU_STATE === 'object' && KIU_STATE ? KIU_STATE : (window.KIU_STATE = window.KIU_STATE || {});
        const emptyState = typeof KIU_EMPTY_STATE === 'object' && KIU_EMPTY_STATE ? KIU_EMPTY_STATE : (window.KIU_EMPTY_STATE = window.KIU_EMPTY_STATE || {});

        liveState.facultyProfiles = liveState.facultyProfiles || {};
        liveState.facultyProfiles.ECON = {
            ...(liveState.facultyProfiles.ECON || {}),
            name: 'School of Economics',
            fullName: 'School of Economics',
            color: '#2563eb',
            professors: [
                {
                    id: 'prof-1',
                    name: 'Professor QA',
                    nameEn: 'Professor QA',
                    email: 'prof.qa@kiu.edu.ge',
                    phone: '+995555000111',
                    title: 'Professor',
                    office: 'A-101',
                    joinYear: 2022,
                    status: 'Active',
                    facultyCode: 'ECON',
                    subjects: ['ECON101'],
                    maxHours: 12
                }
            ],
            tas: [],
            students: [
                {
                    id: 'student-1',
                    name: 'QA Student Alpha',
                    nameEn: 'QA Student Alpha',
                    email: 'qa.student@kiu.edu.ge',
                    program: 'Economics',
                    semester: 1,
                    facultyCode: 'ECON',
                    status: 'Active'
                }
            ],
            curriculum: [
                { id: 'ECON101', name: 'Microeconomics I' }
            ]
        };
        emptyState.facultyProfiles = emptyState.facultyProfiles || liveState.facultyProfiles;

        liveState.users = [
            authState,
            {
                id: 'prof-1',
                name: 'Professor QA',
                nameEn: 'Professor QA',
                email: 'prof.qa@kiu.edu.ge',
                role: 'professor',
                faculty: 'ECON',
                facultyCode: 'ECON'
            },
            {
                id: 'student-1',
                name: 'QA Student Alpha',
                nameEn: 'QA Student Alpha',
                email: 'qa.student@kiu.edu.ge',
                role: 'student',
                faculty: 'ECON',
                facultyCode: 'ECON'
            }
        ];

        liveState.curriculum = [{ id: 'ECON101', name: 'Microeconomics I' }];
        liveState.studentGrades = { econ101_g1: [] };
        liveState.tuitionBalances = {};
        liveState.studentSchedulesByStudent = {
            'student-1': [
                {
                    courseId: 'ECON101',
                    groupId: 'G1',
                    day: 'Monday',
                    time: '09:00',
                    room: 'A-101',
                    duration: '110min'
                }
            ]
        };
        liveState.availableGroups = {
            ECON101: [
                {
                    id: 'G1',
                    name: 'G1',
                    day: 'Monday',
                    time: '09:00',
                    duration: '110min',
                    room: 'A-101',
                    prof: 'Professor QA',
                    ta: '',
                    capacity: 40,
                    semester: 1,
                    registered: 1,
                    faculty: 'ECON'
                }
            ]
        };

        window.KIU_STATE = liveState;
        window.KIU_EMPTY_STATE = emptyState;

        if (typeof renderProfile === 'function') {
            renderProfile('professor', 'prof-1', 'ECON');
        }
    }, { authState: AUTH_STATE });
}

async function captureRun(browser, run) {
    const context = await browser.newContext({
        viewport: run.viewport,
        colorScheme: 'dark'
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
        authState: AUTH_STATE
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
    await page.goto(`${BASE_URL}/profile-view.html?type=professor&id=prof-1&fac=ECON`, { waitUntil: 'domcontentloaded' });
    await waitForShellReady(page);
    await seedProfileViewData(page);
    await page.waitForFunction(
        () => Boolean(document.querySelector('.pv-name')?.textContent?.includes('Professor QA')),
        undefined,
        { timeout: 15000 }
    );
    const firstReadyMs = Date.now() - start;

    const scheduleTabOpenMs = await measureInteraction(
        async () => {
            await page.locator('[data-pv-tab-target="pvtab-1"]').evaluate((node) => node.click());
        },
        async () => {
            await page.waitForFunction(
                () => document.querySelector('[data-pv-tab-target="pvtab-1"]')?.classList.contains('active')
                    && document.getElementById('pvtab-1')?.classList.contains('active')
                    && document.getElementById('pvtab-1')?.dataset?.pvMounted === '1'
                    && Boolean(document.querySelector('#pvtab-1 [data-pv-action="open-session-modal"]')),
                { timeout: 15000 }
            );
        }
    );

    const sessionModalOpenMs = await measureInteraction(
        async () => {
            await page.locator('#pvtab-1 [data-pv-action="open-session-modal"]').first().evaluate((node) => node.click());
        },
        async () => {
            await page.waitForFunction(() => Boolean(document.getElementById('pv-session-modal')), { timeout: 15000 });
        }
    );

    await page.locator('[data-pv-remove-target="pv-session-modal"]').first().evaluate((node) => node.click());
    await page.waitForFunction(() => !document.getElementById('pv-session-modal'), { timeout: 15000 });

    const groupsTabOpenMs = await measureInteraction(
        async () => {
            await page.locator('[data-pv-tab-target="pvtab-2"]').evaluate((node) => node.click());
        },
        async () => {
            await page.waitForFunction(
                () => document.querySelector('[data-pv-tab-target="pvtab-2"]')?.classList.contains('active')
                    && document.getElementById('pvtab-2')?.classList.contains('active')
                    && document.getElementById('pvtab-2')?.dataset?.pvMounted === '1'
                    && Boolean(document.querySelector('#pvtab-2 [data-pv-action="edit-group"]')),
                { timeout: 15000 }
            );
        }
    );

    const groupEditOpenMs = await measureInteraction(
        async () => {
            await page.locator('#pvtab-2 [data-pv-action="edit-group"]').first().evaluate((node) => node.click());
        },
        async () => {
            await page.waitForFunction(() => Boolean(document.getElementById('pv-editgroup-modal')), { timeout: 15000 });
        }
    );

    const metrics = await page.evaluate(() => {
        const probe = window.__kiuProfileViewPerfProbe || { longTasks: [], longTaskTotalMs: 0 };
        const mobileNav = document.getElementById('mobile-bottom-nav');
        return {
            title: document.title,
            url: window.location.href,
            bodyClass: document.body.className,
            activeTabCount: document.querySelectorAll('.pv-tab.active').length,
            profileName: document.querySelector('.pv-name')?.textContent?.trim() || '',
            sessionModalVisible: Boolean(document.getElementById('pv-session-modal')),
            groupEditVisible: Boolean(document.getElementById('pv-editgroup-modal')),
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
        scheduleTabOpenMs,
        sessionModalOpenMs,
        groupsTabOpenMs,
        groupEditOpenMs,
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
