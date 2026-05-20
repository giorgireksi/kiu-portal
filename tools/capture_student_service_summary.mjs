import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const BASE_URL = process.env.KIU_BASE_URL || 'http://127.0.0.1:8898';
const OUTPUT_DIR = resolve(process.cwd(), process.env.KIU_OUTPUT_DIR || 'artifacts');

const RUNS = [
    {
        mode: 'efficient-desktop',
        viewport: { width: 1440, height: 960 },
        reducedMotion: 'reduce',
        cpuThrottleRate: 4,
        emulateLowSpec: true,
        output: 'student-service-efficient-desktop-summary.json'
    },
    {
        mode: 'mobile',
        viewport: { width: 390, height: 844 },
        reducedMotion: 'no-preference',
        cpuThrottleRate: 1,
        emulateLowSpec: false,
        output: 'student-service-mobile-summary.json'
    }
];

const AUTH_STATE = {
    id: 'perf-student-service',
    name: 'Student Service Perf',
    nameEn: 'Student Service Perf',
    email: 'student.service.perf@kiu.edu.ge',
    role: 'student_service',
    faculty: 'ECON',
    facultyCode: 'ECON',
    avatar: ''
};

function buildInitScript() {
    return ({ seededAuthState, lowSpec }) => {
        localStorage.setItem('KIU_AUTH_STATE', JSON.stringify(seededAuthState));
        localStorage.setItem('currentUserRole', 'student_service');
        localStorage.setItem('currentFaculty', 'ECON');
        localStorage.removeItem('KIU_PENDING_ROLE_SWITCH_ROLE');
        localStorage.removeItem('KIU_PORTAL_SESSION_TOKEN');
        sessionStorage.removeItem('KIU_ACTIVE_ROLE_IMPERSONATION');
        sessionStorage.setItem('KIU_ACTIVE_SESSION_USER_ID', seededAuthState.id);

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

        window.__kiuStudentServicePerfProbe = {
            longTasks: [],
            longTaskTotalMs: 0
        };

        try {
            const observer = new PerformanceObserver((list) => {
                const target = window.__kiuStudentServicePerfProbe;
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

async function waitForStudentServiceReady(page) {
    await page.waitForFunction(
        () => {
            const body = document.body;
            if (!body || body.classList.contains('kiu-shell-loading')) return false;
            return Boolean(
                document.querySelector('.student-service-lane-choice-card')
                || document.querySelector('[data-student-service-staff-workbench-shell="1"]')
            );
        },
        { timeout: 20000 }
    );
}

async function seedStudentServiceTickets(page) {
    await page.evaluate(() => {
        if (
            typeof ensureStudentServiceStores !== 'function'
            || typeof normalizeStudentServiceTicket !== 'function'
            || typeof renderStudentServicePage !== 'function'
        ) {
            return;
        }
        ensureStudentServiceStores();
        const now = Date.now();
        KIU_STATE.studentServiceTickets = Array.from({ length: 12 }, (_, index) => normalizeStudentServiceTicket({
            id: `SVC-SEED-${index + 1}`,
            studentId: `student-${index + 1}`,
            studentName: `Student ${index + 1}`,
            semester: (index % 4) + 1,
            category: index % 3 === 0
                ? 'Technical Portal Help'
                : index % 3 === 1
                    ? 'Registration / Enrollment'
                    : 'Documents / Certificates',
            serviceArea: index % 3 === 0
                ? 'portal'
                : index % 3 === 1
                    ? 'registration'
                    : 'documents',
            title: `Seed ticket ${index + 1}`,
            message: `This is seeded support ticket ${index + 1}.`,
            status: index % 4 === 0
                ? 'Open'
                : index % 4 === 1
                    ? 'In Review'
                    : index % 4 === 2
                        ? 'Waiting for Service'
                        : 'Waiting for Student',
            createdAt: new Date(now - index * 3600000).toISOString(),
            updatedAt: new Date(now - index * 1800000).toISOString(),
            faculty: 'ECON',
            assignedToRole: 'student_service',
            assignedToId: index % 2 === 0 ? 'perf-student-service' : '',
            assignedToName: index % 2 === 0 ? 'Student Service Perf' : '',
            thread: [{
                message: `Thread reply ${index + 1}`,
                createdAt: new Date(now - index * 1700000).toISOString(),
                authorName: 'Student',
                authorRole: 'student'
            }]
        }, index));
        renderStudentServicePage();
    });
}

async function measureInteraction(page, action, ready) {
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

    await context.route('**/api/student-service/bootstrap', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ studentService: {} })
        });
    });

    await context.addInitScript(buildInitScript(), {
        seededAuthState: AUTH_STATE,
        lowSpec: run.emulateLowSpec
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
    await page.goto(`${BASE_URL}/student-service.html`, { waitUntil: 'domcontentloaded' });
    await waitForStudentServiceReady(page);
    await seedStudentServiceTickets(page);
    const firstReadyMs = Date.now() - start;

    const laneOpenMs = await measureInteraction(
        page,
        async () => {
            await page.locator('.student-service-lane-choice-card--service').evaluate((node) => node.click());
        },
        async () => {
            await page.waitForFunction(
                () => Boolean(
                    document.querySelector('[data-student-service-staff-workbench-shell="1"]')
                    && document.querySelectorAll('.student-service-ticket-card').length > 0
                ),
                { timeout: 15000 }
            );
        }
    );

    const queueButtons = page.locator('[data-student-service-open-ticket]');
    const queueButtonCount = await queueButtons.count();
    let queueOpenMs = null;
    if (queueButtonCount > 1) {
        const targetTicketId = await queueButtons.nth(1).getAttribute('data-student-service-open-ticket');
        queueOpenMs = await measureInteraction(
            page,
            async () => {
                await queueButtons.nth(1).evaluate((node) => node.click());
            },
            async () => {
                await page.waitForFunction(
                    (ticketId) => Boolean(document.querySelector(`.student-service-ticket-card.is-selected[data-student-service-open-ticket="${ticketId}"]`)),
                    targetTicketId,
                    { timeout: 15000 }
                );
            }
        );
    }

    const articleSwitchButtons = page.locator('[data-student-service-panel-switch="articles"]');
    const articleSwitchIndex = (await articleSwitchButtons.count()) > 1 ? 1 : 0;
    const actionCompletionMs = await measureInteraction(
        page,
        async () => {
            await articleSwitchButtons.nth(articleSwitchIndex).evaluate((node) => node.click());
        },
        async () => {
            await page.waitForFunction(
                () => Boolean(
                    document.getElementById('student-service-article-search')
                    || document.querySelector('[data-student-service-start-new-article]')
                    || document.querySelector('[data-student-service-edit-article]')
                ),
                { timeout: 15000 }
            );
        }
    );

    await page.evaluate(() => window.scrollTo(0, 1400));
    await page.waitForTimeout(250);

    const metrics = await page.evaluate(() => {
        const probe = window.__kiuStudentServicePerfProbe || { longTasks: [], longTaskTotalMs: 0 };
        const mobileNav = document.getElementById('mobile-bottom-nav');
        const mobileNavVisible = mobileNav ? getComputedStyle(mobileNav).display !== 'none' : false;
        return {
            title: document.title,
            url: window.location.href,
            bodyClass: document.body.className,
            performanceTier: document.body.dataset.luxPerformance || '',
            laneButtonCount: document.querySelectorAll('[data-student-service-lane]').length,
            ticketCardCount: document.querySelectorAll('.student-service-ticket-card').length,
            articleCardCount: document.querySelectorAll('[data-student-service-edit-article]').length,
            mobileNavVisible,
            scrollYAfter: Math.round(window.scrollY),
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
        laneOpenMs,
        queueOpenMs,
        actionCompletionMs,
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
