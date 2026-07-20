import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const BASE_URL = process.env.KIU_BASE_URL || 'http://127.0.0.1:8894';
const OUTPUT_DIR = resolve(process.cwd(), process.env.KIU_OUTPUT_DIR || 'artifacts');

const RUNS = [
    {
        mode: 'efficient-desktop',
        viewport: { width: 1440, height: 960 },
        reducedMotion: 'reduce',
        cpuThrottleRate: 4,
        emulateLowSpec: true,
        output: 'staff-efficient-desktop-summary.json'
    },
    {
        mode: 'mobile',
        viewport: { width: 390, height: 844 },
        reducedMotion: 'no-preference',
        cpuThrottleRate: 1,
        emulateLowSpec: false,
        output: 'staff-mobile-summary.json'
    }
];

const AUTH_STATE = {
    id: 'staff-admin',
    name: 'Staff Admin',
    nameEn: 'Staff Admin',
    email: 'staff.admin@kiu.edu.ge',
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

        window.__kiuStaffPerfProbe = {
            longTasks: [],
            longTaskTotalMs: 0
        };

        try {
            const observer = new PerformanceObserver((list) => {
                const target = window.__kiuStaffPerfProbe;
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

async function isStaffReady(page) {
    return page.evaluate(() => {
        const body = document.body;
        const content = document.getElementById('staff-content');
        if (!body || body.classList.contains('kiu-shell-loading') || !content) return false;
        return Boolean(
            content.classList.contains('staff-command-root')
            && (content.querySelector('.staff-hub-surface, .staff-hub-profile') || content.textContent.trim().length > 200)
        );
    });
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
    await context.addInitScript(buildInitScript(), { lowSpec: run.emulateLowSpec, authState: AUTH_STATE });

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
    await page.goto(`${BASE_URL}/staff.html`, { waitUntil: 'domcontentloaded' });
    if (run.mode === 'efficient-desktop') {
        await page.waitForTimeout(20000);
    } else {
        await page.waitForFunction(
            () => {
                const body = document.body;
                const content = document.getElementById('staff-content');
                if (!body || body.classList.contains('kiu-shell-loading') || !content) return false;
                return Boolean(
                    content.classList.contains('staff-command-root')
                    && (content.querySelector('.staff-hub-surface, .staff-hub-profile') || content.textContent.trim().length > 200)
                );
            },
            undefined,
            { timeout: 15000 }
        );
    }
    const ready = await isStaffReady(page);
    if (!ready) {
        throw new Error('Staff route did not reach a ready state within the expected settle window.');
    }
    const firstReadyMs = Date.now() - start;

    let profileOpenMs = null;
    if (run.mode === 'efficient-desktop') {
        const selectButton = page.locator('[data-staff-action="select"]').first();
        if (await selectButton.count()) {
            profileOpenMs = await measureInteraction(
                async () => {
                    await selectButton.click({ timeout: 15000 });
                },
                async () => {
                    await page.waitForFunction(() => Boolean(document.querySelector('.staff-hub-profile')), { timeout: 15000 });
                }
            );
        }
    }

    let actionSheetOpenMs = null;
    if (run.mode === 'mobile') {
        actionSheetOpenMs = await measureInteraction(
            async () => {
                await page.locator('#mob-nav-more').click({ timeout: 15000 });
            },
            async () => {
                await page.waitForFunction(() => document.getElementById('mobile-action-sheet')?.classList.contains('is-open'), { timeout: 15000 });
            }
        );
    }

    const metrics = await page.evaluate(() => {
        const probe = window.__kiuStaffPerfProbe || { longTasks: [], longTaskTotalMs: 0 };
        const mobileNav = document.getElementById('mobile-bottom-nav');
        return {
            title: document.title,
            url: window.location.href,
            bodyClass: document.body.className,
            performanceTier: document.body.dataset.luxPerformance || '',
            surfaceCount: document.querySelectorAll('#staff-content .staff-hub-surface').length,
            directorySelectCount: document.querySelectorAll('[data-staff-action="select"]').length,
            profileVisible: Boolean(document.querySelector('.staff-hub-profile')),
            mobileNavVisible: mobileNav ? getComputedStyle(mobileNav).display !== 'none' : false,
            actionSheetOpen: document.getElementById('mobile-action-sheet')?.classList.contains('is-open') || false,
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
        profileOpenMs,
        actionSheetOpenMs,
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
