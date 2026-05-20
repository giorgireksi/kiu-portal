import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const BASE_URL = process.env.KIU_BASE_URL || 'http://127.0.0.1:8895';
const OUTPUT_PATH = resolve(
    process.cwd(),
    process.env.KIU_OUTPUT_PATH || 'artifacts/home-role-startup-efficient-desktop-summary.json'
);
const VIEWPORT = { width: 1440, height: 960 };
const CPU_THROTTLE_RATE = 4;
const REDUCED_MOTION = 'reduce';
const HOME_READY_TIMEOUT_MS = 20000;
const HOME_SETTLE_MS = 1200;

const ROLE_RUNS = [
    { view: 'student', authRole: 'student', faculty: 'ECON', name: 'Student Demo', email: 'student.demo@kiu.edu.ge' },
    { view: 'professor', authRole: 'professor', faculty: 'ECON', name: 'Professor Demo', email: 'professor.demo@kiu.edu.ge' },
    { view: 'admin', authRole: 'admin', faculty: 'ECON', name: 'Admin Demo', email: 'admin.demo@kiu.edu.ge' },
    { view: 'ta', authRole: 'ta', faculty: 'ECON', name: 'TA Demo', email: 'ta.demo@kiu.edu.ge' },
    { view: 'student_service', authRole: 'student_service', faculty: 'ECON', name: 'Student Service Demo', email: 'student.service.demo@kiu.edu.ge' }
];

function buildAuthState(definition) {
    return {
        id: `perf-${definition.view}-demo`,
        name: definition.name,
        nameEn: definition.name,
        email: definition.email,
        role: definition.authRole,
        faculty: definition.faculty,
        facultyCode: definition.faculty,
        avatar: ''
    };
}

async function captureRoleStartup(browser, definition) {
    const authState = buildAuthState(definition);
    const errors = [];
    const context = await browser.newContext({
        viewport: VIEWPORT,
        colorScheme: 'dark'
    });

    await context.addInitScript(
        ({ seededAuthState, seededRole, seededFaculty }) => {
            localStorage.setItem('KIU_AUTH_STATE', JSON.stringify(seededAuthState));
            localStorage.setItem('currentUserRole', seededRole);
            localStorage.setItem('currentFaculty', seededFaculty);
            localStorage.removeItem('KIU_PENDING_ROLE_SWITCH_ROLE');
            localStorage.removeItem('KIU_PORTAL_SESSION_TOKEN');
            sessionStorage.setItem('KIU_ACTIVE_SESSION_USER_ID', seededAuthState.id);
            sessionStorage.removeItem('KIU_ACTIVE_ROLE_IMPERSONATION');

            Object.defineProperty(navigator, 'deviceMemory', {
                configurable: true,
                get: () => 4
            });
            Object.defineProperty(navigator, 'hardwareConcurrency', {
                configurable: true,
                get: () => 4
            });

            window.__kiuHomePerfProbe = {
                longTasks: [],
                longTaskTotalMs: 0
            };

            try {
                const observer = new PerformanceObserver((list) => {
                    const target = window.__kiuHomePerfProbe;
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
                // Long-task observation is best-effort only.
            }
        },
        {
            seededAuthState: authState,
            seededRole: definition.authRole,
            seededFaculty: definition.faculty
        }
    );

    const page = await context.newPage();
    page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
    page.on('console', (message) => {
        if (message.type() === 'error') errors.push(`console: ${message.text()}`);
    });

    await page.emulateMedia({ reducedMotion: REDUCED_MOTION });
    const cdp = await context.newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU_THROTTLE_RATE });

    const start = Date.now();
    await page.goto(`${BASE_URL}/index.html?view=${definition.view}#home`, {
        waitUntil: 'domcontentloaded'
    });

    await page.waitForFunction(
        () => {
            const body = document.body;
            const homeShell = document.getElementById('lux-home-shell');
            if (!body || body.classList.contains('kiu-shell-loading')) return false;
            if (!homeShell || !homeShell.textContent.trim()) return false;
            return Boolean(
                homeShell.querySelector('[data-dashboard-canvas="1"], .lux-grid-widget, .lux-dashboard-section, .lux-widget-stack')
            );
        },
        { timeout: HOME_READY_TIMEOUT_MS }
    );

    const firstReadyMs = Date.now() - start;
    await page.waitForTimeout(HOME_SETTLE_MS);

    const metrics = await page.evaluate(() => {
        const queryAll = (selector) => Array.from(document.querySelectorAll(selector));
        const widgetNodes = queryAll('#lux-home-shell [data-widget-id]');
        const widgetTitles = widgetNodes
            .map((node) => {
                const label = node.querySelector('.lux-card-title, .lux-grid-widget-title, strong, [data-widget-label]');
                return String(label?.textContent || '').trim();
            })
            .filter(Boolean);
        const perfProbe = window.__kiuHomePerfProbe || { longTasks: [], longTaskTotalMs: 0 };

        return {
            title: document.title,
            url: window.location.href,
            bodyClass: document.body.className,
            shellRole: document.body.dataset.shellRole || '',
            activePageId: document.querySelector('.page-section.active-page')?.id || '',
            performanceTier: document.body.dataset.luxPerformance || '',
            hydratedElementCount: document.querySelectorAll('*').length,
            pageSectionCount: document.querySelectorAll('.page-section').length,
            externalScriptCount: queryAll('script[src]').length,
            widgetCount: widgetNodes.length,
            widgetTitles,
            dashboardSectionCount: queryAll('#lux-home-shell .lux-dashboard-section').length,
            pickerButtonCount: queryAll('#lux-topbar .lux-picker-btn').length,
            pickerPanelCount: queryAll('.lux-picker-panel').length,
            utilityPanelCount: queryAll('.lux-utility-panel').length,
            userMenuCount: queryAll('#lux-user-menu').length,
            dashboardEditVisible: Boolean(document.getElementById('lux-dashboard-edit-btn') && !document.getElementById('lux-dashboard-edit-btn').hidden),
            mobileNavPresent: Boolean(document.getElementById('mobile-bottom-nav')),
            mobileActionSheetPresent: Boolean(document.getElementById('mobile-action-sheet')),
            longTaskCount: Array.isArray(perfProbe.longTasks) ? perfProbe.longTasks.length : 0,
            longTaskTotalMs: Number(perfProbe.longTaskTotalMs || 0)
        };
    });

    await context.close();

    return {
        role: definition.view,
        faculty: definition.faculty,
        authRole: definition.authRole,
        firstReadyMs,
        cpuThrottleRate: CPU_THROTTLE_RATE,
        reducedMotion: REDUCED_MOTION,
        viewport: `${VIEWPORT.width}x${VIEWPORT.height}`,
        errors,
        ...metrics
    };
}

async function main() {
    const browser = await chromium.launch({ headless: true });
    try {
        const roleSummaries = [];
        for (const definition of ROLE_RUNS) {
            roleSummaries.push(await captureRoleStartup(browser, definition));
        }

        const output = {
            mode: 'efficient-desktop-role-matrix',
            urlBase: BASE_URL,
            cpuThrottleRate: CPU_THROTTLE_RATE,
            reducedMotion: REDUCED_MOTION,
            viewport: `${VIEWPORT.width}x${VIEWPORT.height}`,
            roles: roleSummaries
        };

        mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
        writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));
        console.log(`Wrote ${OUTPUT_PATH}`);
    } finally {
        await browser.close();
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
