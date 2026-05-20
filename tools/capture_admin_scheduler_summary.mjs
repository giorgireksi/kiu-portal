import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const BASE_URL = process.env.KIU_BASE_URL || 'http://127.0.0.1:8897';
const OUTPUT_DIR = resolve(process.cwd(), process.env.KIU_OUTPUT_DIR || 'artifacts');

const RUNS = [
    {
        mode: 'efficient-desktop',
        viewport: { width: 1440, height: 960 },
        reducedMotion: 'reduce',
        cpuThrottleRate: 4,
        emulateLowSpec: true,
        output: 'admin-scheduler-efficient-desktop-summary.json'
    },
    {
        mode: 'mobile',
        viewport: { width: 390, height: 844 },
        reducedMotion: 'no-preference',
        cpuThrottleRate: 1,
        emulateLowSpec: false,
        output: 'admin-scheduler-mobile-summary.json'
    }
];

const AUTH_STATE = {
    id: 'perf-admin-scheduler',
    name: 'Admin Scheduler Perf',
    nameEn: 'Admin Scheduler Perf',
    email: 'admin.scheduler.perf@kiu.edu.ge',
    role: 'admin',
    faculty: 'ECON',
    facultyCode: 'ECON',
    avatar: ''
};

function buildInitScript(mode) {
    return ({ seededAuthState, lowSpec }) => {
        localStorage.setItem('KIU_AUTH_STATE', JSON.stringify(seededAuthState));
        localStorage.setItem('currentUserRole', 'admin');
        localStorage.setItem('currentFaculty', 'ECON');
        localStorage.removeItem('KIU_PENDING_ROLE_SWITCH_ROLE');
        localStorage.removeItem('KIU_PORTAL_SESSION_TOKEN');
        sessionStorage.removeItem('KIU_ACTIVE_ROLE_IMPERSONATION');

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

        window.__kiuSchedulerPerfProbe = {
            longTasks: [],
            longTaskTotalMs: 0
        };

        try {
            const observer = new PerformanceObserver((list) => {
                const target = window.__kiuSchedulerPerfProbe;
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

async function waitForSchedulerReady(page) {
    await page.waitForFunction(
        () => {
            const body = document.body;
            if (!body || body.classList.contains('kiu-shell-loading')) return false;
            const grid = document.getElementById('scheduler-grid');
            if (!grid) return false;
            return Boolean(
                grid.querySelector('.sch-header-row')
                && (grid.querySelector('[data-scheduler-slot-day]') || grid.querySelector('.sch-grid-empty'))
            );
        },
        { timeout: 20000 }
    );
}

async function measureInteraction(page, action, ready) {
    const start = Date.now();
    await action();
    await ready();
    return Date.now() - start;
}

async function dispatchClick(locator) {
    await locator.evaluate((node) => {
        node.click();
    });
}

async function closeSchedulerModalIfOpen(page) {
    const closeButton = page.locator('[data-admin-scheduler-modal-close="true"]').first();
    if (await page.locator('#schModalOverlay.open').count()) {
        await closeButton.click();
        await page.waitForFunction(() => !document.getElementById('schModalOverlay')?.classList.contains('open'));
    }
}

async function ensureEditableSchedulerEvent(page, runMode) {
    const existingEditButton = page.locator('[data-scheduler-session-action="edit"]').first();
    if (await existingEditButton.count()) {
        return { createdSeedSession: false };
    }

    const seed = await page.evaluate((mode) => {
        const weekStart = typeof window.getSchedulerWeekStart === 'function'
            ? window.getSchedulerWeekStart()
            : '';
        const semester = parseInt(document.getElementById('admin-tt-semester')?.value || '3', 10) || 3;
        const faculty = document.getElementById('admin-tt-faculty')?.value
            || document.getElementById('grid-view-fac')?.value
            || localStorage.getItem('currentFaculty')
            || 'ECON';
        const day = typeof window.normalizeSchedulerDayLabel === 'function'
            ? window.normalizeSchedulerDayLabel('Monday', 'ge')
            : 'Monday';
        const courseId = 'BM101';
        const courseName = 'Business Foundations';

        KIU_STATE.availableGroups = KIU_STATE.availableGroups || {};
        KIU_STATE.availableGroups[courseId] = [{
            id: mode === 'mobile' ? 'mob1' : 'desk1',
            name: mode === 'mobile' ? 'MOB1' : 'DESK1',
            title: courseName,
            courseName,
            faculty,
            semester,
            day,
            time: '09:00',
            endTime: '10:50',
            duration: '110min',
            room: mode === 'mobile' ? 'LAB-1' : 'A-101',
            prof: 'Prof. Demo',
            ta: '',
            capacity: 40,
            registered: 0,
            startWeek: weekStart,
            endWeek: weekStart,
            weekOverrides: {}
        }];
        if (typeof window.renderGrid === 'function') window.renderGrid();
        return document.querySelectorAll('[data-scheduler-session-action="edit"]').length > 0;
    }, runMode);

    if (!seed) return { createdSeedSession: false };

    await page.waitForFunction(() => {
        const editButtons = document.querySelectorAll('[data-scheduler-session-action="edit"]').length;
        return editButtons > 0;
    });

    return { createdSeedSession: true };
}

async function captureRun(browser, run) {
    const context = await browser.newContext({
        viewport: run.viewport,
        colorScheme: 'dark'
    });

    await context.addInitScript(buildInitScript(run.mode), {
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
    await page.goto(`${BASE_URL}/admin-scheduler.html`, { waitUntil: 'domcontentloaded' });
    await waitForSchedulerReady(page);
    const firstReadyMs = Date.now() - start;
    await page.waitForTimeout(800);

    const initialWeekLabel = await page.locator('#scheduler-week-label').textContent();
    const weekRenderMs = await measureInteraction(
        page,
        async () => {
            await dispatchClick(page.locator('[data-admin-scheduler-week="next"]'));
        },
        async () => {
            await page.waitForFunction(
                (label) => {
                    const current = document.getElementById('scheduler-week-label')?.textContent || '';
                    return current.trim() !== String(label || '').trim();
                },
                initialWeekLabel || ''
            );
        }
    );

    const slotButton = page.locator('[data-scheduler-slot-day]').first();
    const slotOpenMs = await measureInteraction(
        page,
        async () => {
            await dispatchClick(slotButton);
        },
        async () => {
            await page.waitForFunction(() => document.getElementById('schModalOverlay')?.classList.contains('open'));
        }
    );

    const seedResult = await ensureEditableSchedulerEvent(page, run.mode);
    await closeSchedulerModalIfOpen(page);

    const editButton = page.locator('[data-scheduler-session-action="edit"]').first();
    let editModalOpenMs = null;
    let editModalAvailable = false;
    if (await editButton.count()) {
        editModalAvailable = true;
        editModalOpenMs = await measureInteraction(
            page,
            async () => {
                await dispatchClick(editButton);
            },
            async () => {
                await page.waitForFunction(() => {
                    const overlay = document.getElementById('schModalOverlay');
                    const mode = document.getElementById('sch-edit-mode');
                    return Boolean(overlay?.classList.contains('open') && mode?.value === 'edit');
                });
            }
        );
    }

    const metrics = await page.evaluate(() => {
        const probe = window.__kiuSchedulerPerfProbe || { longTasks: [], longTaskTotalMs: 0 };
        return {
            title: document.title,
            url: window.location.href,
            bodyClass: document.body.className,
            performanceTier: document.body.dataset.luxPerformance || '',
            mobileNavVisible: (() => {
                const nav = document.getElementById('mobile-bottom-nav');
                if (!nav) return false;
                const style = window.getComputedStyle(nav);
                return style.display !== 'none' && style.visibility !== 'hidden';
            })(),
            gridDayCount: document.querySelectorAll('#scheduler-grid .sch-day-col').length,
            slotCount: document.querySelectorAll('#scheduler-grid [data-scheduler-slot-day]').length,
            eventCount: document.querySelectorAll('#scheduler-grid [data-scheduler-session-action="edit"]').length,
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
        weekRenderMs,
        slotOpenMs,
        editModalOpenMs,
        editModalAvailable,
        createdSeedSession: Boolean(seedResult.createdSeedSession),
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
