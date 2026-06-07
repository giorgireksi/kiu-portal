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
        output: 'timetable-efficient-desktop-summary.json'
    },
    {
        mode: 'mobile',
        viewport: { width: 390, height: 844 },
        reducedMotion: 'no-preference',
        cpuThrottleRate: 1,
        emulateLowSpec: false,
        output: 'timetable-mobile-summary.json'
    }
];

const AUTH_STATE = {
    id: 'admin-testing-econ-student',
    name: 'QA Student Alpha',
    nameEn: 'QA Student Alpha',
    avatar: '',
    email: 'qa.student.alpha@student.kiu.edu.ge',
    role: 'student',
    faculty: 'ECON',
    facultyCode: 'ECON'
};

function buildInitScript() {
    return ({ lowSpec, authState }) => {
        try {
            localStorage.setItem('KIU_AUTH_STATE', JSON.stringify(authState));
            localStorage.setItem('currentUserRole', authState.role);
            localStorage.setItem('currentFaculty', authState.faculty);
            localStorage.setItem('KIU_FACULTY_CONTEXT', authState.faculty);
            localStorage.setItem('KIU_REAL_TESTING_CLEANUP_V7', '7');
            localStorage.removeItem('KIU_PENDING_ROLE_SWITCH_ROLE');
            localStorage.removeItem('KIU_PORTAL_SESSION_TOKEN');
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

async function waitForTimetableReady(page) {
    await page.waitForFunction(
        () => {
            const body = document.body;
            const label = document.getElementById('timetable-month-label');
            const master = document.getElementById('timetable-master-container');
            return Boolean(
                body
                && !body.classList.contains('kiu-shell-loading')
                && label
                && label.textContent.trim().length > 0
                && master
                && (
                    master.querySelector('.schedule-sessions-board')
                    || master.querySelector('.schedule-grid-shell')
                    || master.textContent.trim().length > 0
                )
            );
        },
        undefined,
        { timeout: 20000 }
    );
}

async function captureRun(browser, run) {
    const context = await browser.newContext({
        viewport: run.viewport,
        reducedMotion: run.reducedMotion
    });
    const page = await context.newPage();
    const errors = [];

    page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
    });
    page.on('pageerror', (error) => {
        errors.push(String(error));
    });

    await page.addInitScript(buildInitScript(), {
        lowSpec: run.emulateLowSpec,
        authState: AUTH_STATE
    });

    const start = Date.now();
    await page.goto(`${BASE_URL}/timetable.html`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await waitForTimetableReady(page);
    const firstReadyMs = Date.now() - start;

    const weekSwitchMs = await page.evaluate(async () => {
        const label = document.getElementById('timetable-month-label');
        const button = document.querySelector('[data-timetable-week-shift="1"]');
        if (!label || !button) throw new Error('Week switch controls missing.');
        const before = label.textContent.trim();
        const startMark = performance.now();
        button.click();
        await new Promise((resolve, reject) => {
            const deadline = performance.now() + 5000;
            const tick = () => {
                if (label.textContent.trim() !== before) {
                    resolve();
                    return;
                }
                if (performance.now() > deadline) {
                    reject(new Error('Week label did not change.'));
                    return;
                }
                requestAnimationFrame(tick);
            };
            tick();
        });
        return Math.round(performance.now() - startMark);
    });

    const timetableViewMs = await page.evaluate(async () => {
        const button = document.getElementById('timetable-view-timetable');
        const master = document.getElementById('timetable-master-container');
        if (!button || !master) throw new Error('Timetable view controls missing.');
        const startMark = performance.now();
        button.click();
        await new Promise((resolve, reject) => {
            const deadline = performance.now() + 5000;
            const tick = () => {
                if (master.querySelector('.schedule-grid-shell')) {
                    resolve();
                    return;
                }
                if (performance.now() > deadline) {
                    reject(new Error('Timetable grid did not render.'));
                    return;
                }
                requestAnimationFrame(tick);
            };
            tick();
        });
        return Math.round(performance.now() - startMark);
    });

    const scrollMs = await page.evaluate(async () => {
        const scroller = document.scrollingElement || document.documentElement;
        const startMark = performance.now();
        window.scrollTo({ top: Math.max(0, scroller.scrollHeight - window.innerHeight), behavior: 'auto' });
        await new Promise((resolve) => requestAnimationFrame(resolve));
        window.scrollTo({ top: 0, behavior: 'auto' });
        await new Promise((resolve) => requestAnimationFrame(resolve));
        return Math.round(performance.now() - startMark);
    });

    const snapshot = await page.evaluate(() => ({
        weekLabel: document.getElementById('timetable-month-label')?.textContent?.trim() || '',
        sessionCardCount: document.querySelectorAll('.schedule-session-card').length,
        gridShellPresent: Boolean(document.querySelector('.schedule-grid-shell')),
        emptyStatePresent: /No timetable sessions found/i.test(document.getElementById('timetable-master-container')?.textContent || ''),
        sessionModalPresent: Boolean(document.querySelector('[id*="session-modal"], .schedule-session-modal, .timetable-session-modal')),
        mobileNavVisible: (() => {
            const nav = document.getElementById('mobile-bottom-nav');
            return Boolean(nav && getComputedStyle(nav).display !== 'none');
        })()
    }));

    const result = {
        mode: run.mode,
        viewport: `${run.viewport.width}x${run.viewport.height}`,
        cpuThrottleRate: run.cpuThrottleRate,
        reducedMotion: run.reducedMotion,
        firstReadyMs,
        weekSwitchMs,
        timetableViewMs,
        scrollMs,
        errors,
        title: await page.title(),
        url: page.url(),
        bodyClass: await page.getAttribute('body', 'class'),
        ...snapshot
    };

    await context.close();
    return result;
}

async function main() {
    mkdirSync(OUTPUT_DIR, { recursive: true });
    const browser = await chromium.launch({ headless: true });
    try {
        for (const run of RUNS) {
            const result = await captureRun(browser, run);
            const outputPath = resolve(OUTPUT_DIR, run.output);
            writeFileSync(outputPath, JSON.stringify(result, null, 2));
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
