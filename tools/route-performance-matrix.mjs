import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const BASE_URL = String(process.env.KIU_BASE_URL || 'http://127.0.0.1:8895').replace(/\/$/, '');
const OUTPUT_PATH = resolve(
    process.cwd(),
    process.env.KIU_OUTPUT_PATH || 'artifacts/route-performance-matrix.json'
);
const EXECUTABLE_PATH = String(process.env.KIU_PLAYWRIGHT_EXECUTABLE || '/usr/bin/chromium').trim();
const VIEWPORT = {
    width: Number(process.env.KIU_VIEWPORT_WIDTH || 1440),
    height: Number(process.env.KIU_VIEWPORT_HEIGHT || 960)
};
const CPU_THROTTLE_RATE = Number(process.env.KIU_CPU_THROTTLE_RATE || 4);
const SETTLE_MS = Number(process.env.KIU_PERF_SETTLE_MS || 600);
const RUN_WARM = process.env.KIU_RUN_WARM !== '0';
const READY_TIMEOUT_MS = Number(process.env.KIU_READY_TIMEOUT_MS || 5000);
const NAVIGATION_TIMEOUT_MS = Number(process.env.KIU_NAVIGATION_TIMEOUT_MS || 15000);
const ROUTE_FILTER = String(process.env.KIU_ROUTES || '').split(',').map((entry) => entry.trim()).filter(Boolean);
const SESSION_TOKEN = String(process.env.KIU_SESSION_TOKEN || '').trim();

const USERS = {
    admin: {
        id: 'perf-admin-demo', name: 'Admin Demo', nameEn: 'Admin Demo',
        email: 'admin.demo@kiu.edu.ge', role: 'admin', faculty: '', facultyCode: '', avatar: ''
    },
    professor: {
        id: 'perf-professor-demo', name: 'Professor Demo', nameEn: 'Professor Demo',
        email: 'professor.demo@kiu.edu.ge', role: 'professor', faculty: 'ECON', facultyCode: 'ECON', avatar: ''
    },
    student: {
        id: 'perf-student-demo', name: 'Student Demo', nameEn: 'Student Demo',
        email: 'student.demo@kiu.edu.ge', role: 'student', faculty: 'ECON', facultyCode: 'ECON', avatar: ''
    },
    student_service: {
        id: 'perf-student-service-demo', name: 'Student Service Demo', nameEn: 'Student Service Demo',
        email: 'student.service.demo@kiu.edu.ge', role: 'student_service', faculty: 'ECON', facultyCode: 'ECON', avatar: ''
    }
};

const ROUTES = [
    ['index.html?view=student#home', 'student', 'home'],
    ['social.html', 'student', 'social'],
    ['lms.html', 'professor', 'lms'],
    ['timetable.html', 'student', 'timetable'],
    ['admin-tools.html', 'admin', 'admin-tools'],
    ['news.html', 'student', 'news'],
    ['library.html', 'student', 'library'],
    ['orders.html', 'student', 'orders'],
    ['registration.html', 'student', 'registration'],
    ['student-service.html', 'student_service', 'student-service'],
    ['students-admin.html', 'admin', 'students-admin'],
    ['staff.html', 'admin', 'staff'],
    ['admin-scheduler.html', 'admin', 'admin-scheduler'],
    ['faculty-gradebook.html', 'professor', 'faculty-gradebook'],
    ['study-card.html', 'student', 'study-card'],
    ['programs.html', 'student', 'programs'],
    ['personal-data.html', 'student', 'personal-data'],
    ['profile-view.html', 'admin', 'profile-view'],
    ['chancellery.html', 'student_service', 'chancellery'],
    ['exams.html', 'professor', 'exams'],
    ['exam-portal.html', null, 'exam-portal'],
    ['login.html', null, 'login']
];

function buildAuthState(role) {
    return role ? USERS[role] : null;
}

function numeric(value) {
    return Number.isFinite(Number(value)) ? Number(value) : 0;
}

async function installProbe(context, role) {
    await context.addInitScript(({ authState, roleName, sessionToken }) => {
        try {
            localStorage.clear();
            sessionStorage.clear();
        } catch (_) {}

        if (authState) {
            localStorage.setItem('KIU_AUTH_STATE', JSON.stringify(authState));
            localStorage.setItem('kiuAuthState', JSON.stringify(authState));
            sessionStorage.setItem('KIU_TAB_AUTH_STATE', JSON.stringify(authState));
            localStorage.setItem('currentUserRole', roleName);
            sessionStorage.setItem('KIU_TAB_CURRENT_ROLE', roleName);
            localStorage.setItem('currentFaculty', String(authState.facultyCode || authState.faculty || 'ECON'));
            sessionStorage.setItem('KIU_TAB_CURRENT_FACULTY', String(authState.facultyCode || authState.faculty || 'ECON'));
            sessionStorage.setItem('KIU_ACTIVE_SESSION_USER_ID', authState.id);
        }
        if (sessionToken) {
            localStorage.setItem('KIU_PORTAL_SESSION_TOKEN', sessionToken);
            sessionStorage.setItem('KIU_TAB_PORTAL_SESSION_TOKEN', sessionToken);
        }

        window.__kiuRoutePerf = {
            firstControlMs: 0,
            firstShellMs: 0,
            longTaskCount: 0,
            longTaskTotalMs: 0,
            layoutShiftTotal: 0,
            layoutShiftEntries: 0,
            largestContentfulPaintMs: 0
        };

        const probe = window.__kiuRoutePerf;
        const visible = (node) => {
            if (!node || node.hidden) return false;
            const style = getComputedStyle(node);
            const rect = node.getBoundingClientRect();
            return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
        };
        const markFirstControl = () => {
            if (probe.firstControlMs) return;
            const control = document.querySelector('button, a[href], input, select, textarea, [role="button"]');
            if (visible(control)) probe.firstControlMs = performance.now();
        };
        const markShell = () => {
            if (probe.firstShellMs) return;
            const shell = document.querySelector('#lux-shell, #app-content, .page-section.active-page');
            if (visible(shell)) probe.firstShellMs = performance.now();
        };
        const observer = new MutationObserver(() => {
            markFirstControl();
            markShell();
        });
        const observationRoot = document.documentElement || document;
        if (observationRoot) {
            observer.observe(observationRoot, { subtree: true, childList: true, attributes: true, attributeFilter: ['class', 'hidden', 'style'] });
        }
        document.addEventListener('DOMContentLoaded', () => {
            markFirstControl();
            markShell();
        }, { once: true });

        try {
            new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    probe.longTaskCount += 1;
                    probe.longTaskTotalMs += Number(entry.duration || 0);
                }
            }).observe({ type: 'longtask', buffered: true });
        } catch (_) {}

        try {
            new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.hadRecentInput) continue;
                    probe.layoutShiftTotal += Number(entry.value || 0);
                    probe.layoutShiftEntries += 1;
                }
            }).observe({ type: 'layout-shift', buffered: true });
        } catch (_) {}

        try {
            new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    probe.largestContentfulPaintMs = Number(entry.startTime || 0);
                }
            }).observe({ type: 'largest-contentful-paint', buffered: true });
        } catch (_) {}
    }, { authState: buildAuthState(role), roleName: role || '', sessionToken: SESSION_TOKEN });
}

async function waitForRouteReady(page) {
    try {
        await page.waitForFunction(() => {
            const body = document.body;
            if (!body) return false;
            if (body.classList.contains('kiu-shell-loading')) return false;
            return Boolean(document.querySelector('#lux-shell, #app-content, .page-section.active-page, main'));
        }, { timeout: READY_TIMEOUT_MS });
    } catch (_) {
        // Some public/error routes intentionally do not expose the portal shell.
    }
    await page.waitForTimeout(SETTLE_MS);
}

async function readMetrics(page, route, phase, startedAt, errors, failedRequests) {
    const metrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        const paints = Object.fromEntries(
            performance.getEntriesByType('paint').map((entry) => [entry.name, Number(entry.startTime || 0)])
        );
        const resources = performance.getEntriesByType('resource');
        const probe = window.__kiuRoutePerf || {};
        const marks = performance.getEntriesByType('mark').map((entry) => ({ name: entry.name, startTime: entry.startTime }));
        const transferBytes = resources.reduce((total, entry) => total + Number(entry.transferSize || 0), 0);
        const encodedBytes = resources.reduce((total, entry) => total + Number(entry.encodedBodySize || 0), 0);
        const apiResources = resources.filter((entry) => /\/api\//i.test(entry.name));
        const scripts = resources.filter((entry) => entry.initiatorType === 'script');
        const styles = resources.filter((entry) => entry.initiatorType === 'link' || entry.initiatorType === 'css');
        const activePage = document.querySelector('.page-section.active-page');

        return {
            url: location.href,
            title: document.title,
            activePage: activePage?.id || '',
            shellLoading: document.body?.classList.contains('kiu-shell-loading') || false,
            domNodes: document.querySelectorAll('*').length,
            visibleControls: Array.from(document.querySelectorAll('button, a[href], input, select, textarea, [role="button"]'))
                .filter((node) => {
                    const rect = node.getBoundingClientRect();
                    const style = getComputedStyle(node);
                    return !node.hidden && style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
                }).length,
            navigation: navigation ? {
                domContentLoadedMs: Number(navigation.domContentLoadedEventEnd || 0),
                loadEventMs: Number(navigation.loadEventEnd || 0),
                responseStartMs: Number(navigation.responseStart || 0),
                domInteractiveMs: Number(navigation.domInteractive || 0),
                transferSize: Number(navigation.transferSize || 0),
                decodedBodySize: Number(navigation.decodedBodySize || 0)
            } : null,
            paints,
            largestContentfulPaintMs: Number(probe.largestContentfulPaintMs || performance.getEntriesByType('largest-contentful-paint').at(-1)?.startTime || 0),
            firstControlMs: Number(probe.firstControlMs || 0),
            firstShellMs: Number(probe.firstShellMs || 0),
            longTaskCount: Number(probe.longTaskCount || 0),
            longTaskTotalMs: Number(probe.longTaskTotalMs || 0),
            layoutShiftTotal: Number(probe.layoutShiftTotal || 0),
            layoutShiftEntries: Number(probe.layoutShiftEntries || 0),
            resourceCount: resources.length,
            scriptResourceCount: scripts.length,
            styleResourceCount: styles.length,
            apiResourceCount: apiResources.length,
            transferBytes,
            encodedBytes,
            routeBootMarks: marks.filter((entry) => /boot|ready|shell/i.test(entry.name)).slice(-30)
        };
    });

    return {
        route,
        phase,
        elapsedMs: Date.now() - startedAt,
        errors,
        failedRequests,
        ...metrics
    };
}

async function captureRoute(browser, route, role) {
    const context = await browser.newContext({ viewport: VIEWPORT, colorScheme: 'dark' });
    await installProbe(context, role);
    const page = await context.newPage();
    const errors = [];
    const failedRequests = [];
    page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
    page.on('console', (message) => {
        if (message.type() === 'error') errors.push(`console: ${message.text()}`);
    });
    page.on('requestfailed', (request) => {
        failedRequests.push({ url: request.url(), error: request.failure()?.errorText || 'unknown' });
    });

    const captures = [];
    const load = async (phase, reload = false) => {
        const startedAt = Date.now();
        errors.length = 0;
        failedRequests.length = 0;
        try {
            if (reload) {
                await page.reload({ waitUntil: 'domcontentloaded', timeout: NAVIGATION_TIMEOUT_MS });
            } else {
                await page.goto(`${BASE_URL}/${route}`, { waitUntil: 'domcontentloaded', timeout: NAVIGATION_TIMEOUT_MS });
            }
            await waitForRouteReady(page);
            captures.push(await readMetrics(page, route, phase, startedAt, [...errors], [...failedRequests]));
        } catch (error) {
            captures.push({ route, phase, elapsedMs: Date.now() - startedAt, errors: [...errors, `navigation: ${error.message}`], failedRequests: [...failedRequests] });
        }
    };

    await load('cold');
    if (RUN_WARM) await load('warm', true);
    await context.close();
    return captures;
}

function writeOutput(results) {
    const output = {
        measuredAt: new Date().toISOString(),
        baseUrl: BASE_URL,
        viewport: VIEWPORT,
        cpuThrottleRate: CPU_THROTTLE_RATE,
        settleMs: SETTLE_MS,
        warmRun: RUN_WARM,
        routeFilter: ROUTE_FILTER,
        routes: results
    };
    mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
    writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));
}

async function main() {
    const browser = await chromium.launch({ headless: true, executablePath: EXECUTABLE_PATH });
    const results = [];
    const selectedRoutes = ROUTE_FILTER.length
        ? ROUTES.filter(([route, , name]) => ROUTE_FILTER.includes(route) || ROUTE_FILTER.includes(name))
        : ROUTES;
    try {
        for (const [route, role, name] of selectedRoutes) {
            process.stdout.write(`Measuring ${name} (${route})...\n`);
            results.push(...await captureRoute(browser, route, role));
            writeOutput(results);
        }
    } finally {
        await browser.close();
    }

    writeOutput(results);
    console.log(`Wrote ${OUTPUT_PATH}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
