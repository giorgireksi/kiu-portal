import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const BASE_URL = process.env.KIU_BASE_URL || 'http://127.0.0.1:8876';
const OUTPUT_PATH = resolve(
    process.cwd(),
    process.env.KIU_OUTPUT_PATH || 'artifacts/scroll-heavy-pages-benchmark.json'
);

const VIEWPORT = { width: 1440, height: 960 };

const PAGES = [
    { path: 'index.html?view=student#home', role: 'student', label: 'home' },
    { path: 'admin-orders.html', role: 'admin', label: 'admin-orders' },
    { path: 'admin-tools.html', role: 'admin', label: 'admin-tools' },
    { path: 'lms.html', role: 'professor', label: 'lms' },
    { path: 'social.html', role: 'student', label: 'social' },
    { path: 'registration.html', role: 'student', label: 'registration' },
    { path: 'student-service.html', role: 'student_service', label: 'student-service' },
    { path: 'timetable.html', role: 'student', label: 'timetable' },
    { path: 'news.html', role: 'student', label: 'news' },
    { path: 'career-market.html', role: 'student', label: 'career-market' }
];

function buildAuthState(role, label) {
    return {
        id: `scroll-benchmark-${label}-${role}`,
        name: `${role} benchmark`,
        nameEn: `${role} benchmark`,
        email: `${role}.${label}@kiu.edu.ge`,
        role,
        faculty: 'ECON',
        facultyCode: 'ECON',
        avatar: ''
    };
}

async function capturePage(browser, definition) {
    const authState = buildAuthState(definition.role, definition.label);
    const context = await browser.newContext({
        viewport: VIEWPORT,
        colorScheme: 'dark'
    });

    await context.addInitScript(({ authState, role }) => {
        localStorage.setItem('KIU_AUTH_STATE', JSON.stringify(authState));
        localStorage.setItem('currentUserRole', role);
        localStorage.setItem('currentFaculty', 'ECON');
        sessionStorage.setItem('KIU_ACTIVE_SESSION_USER_ID', authState.id);
    }, { authState, role: definition.role });

    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(`pageerror: ${error.message}`));
    page.on('console', (message) => {
        if (message.type() === 'error') pageErrors.push(`console: ${message.text()}`);
    });

    await page.goto(`${BASE_URL}/${definition.path}`, {
        waitUntil: 'domcontentloaded',
        timeout: 60000
    });
    await page.waitForTimeout(2500);

    const before = await page.evaluate(() => ({
        scrollHeight: document.documentElement.scrollHeight || document.body.scrollHeight || 0,
        nodeCount: document.querySelectorAll('*').length,
        observedSurfaceCount: document.querySelectorAll('[data-lux-observed-surface="1"]').length,
        offscreenObservedSurfaceCount: document.querySelectorAll('[data-lux-observed-surface="1"][data-lux-offscreen="1"]').length,
        transparentSurfaceCount: document.querySelectorAll('[data-lux-transparency-signature]').length
    }));

    const start = Date.now();
    await page.evaluate(async () => {
        const maxY = Math.max(0, (document.documentElement.scrollHeight || document.body.scrollHeight || 0) - window.innerHeight);
        const steps = 6;
        for (let index = 1; index <= steps; index += 1) {
            window.scrollTo(0, Math.round((maxY * index) / steps));
            await new Promise((resolve) => setTimeout(resolve, 120));
        }
    });
    const scrollElapsedMs = Date.now() - start;

    await page.waitForTimeout(400);

    const after = await page.evaluate(() => ({
        scrollY: window.scrollY || window.pageYOffset || 0,
        bodyScrollingFlag: document.body.dataset.luxScrolling || '',
        observedSurfaceCount: document.querySelectorAll('[data-lux-observed-surface="1"]').length,
        offscreenObservedSurfaceCount: document.querySelectorAll('[data-lux-observed-surface="1"][data-lux-offscreen="1"]').length,
        transparentSurfaceCount: document.querySelectorAll('[data-lux-transparency-signature]').length
    }));

    await context.close();

    return {
        page: definition.label,
        url: `${BASE_URL}/${definition.path}`,
        role: definition.role,
        pageErrors,
        scrollElapsedMs,
        before,
        after
    };
}

async function main() {
    const browser = await chromium.launch({ headless: true });
    try {
        const results = [];
        for (const page of PAGES) {
            results.push(await capturePage(browser, page));
        }
        const output = {
            baseUrl: BASE_URL,
            viewport: `${VIEWPORT.width}x${VIEWPORT.height}`,
            capturedAt: new Date().toISOString(),
            results
        };
        mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
        writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));
        console.log(`Wrote ${OUTPUT_PATH}`);
        const failures = results.filter((result) => result.pageErrors.length > 0);
        if (failures.length) {
            failures.forEach((failure) => {
                console.error(`${failure.page}: ${failure.pageErrors.join(' | ')}`);
            });
            process.exitCode = 1;
        }
    } finally {
        await browser.close();
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
