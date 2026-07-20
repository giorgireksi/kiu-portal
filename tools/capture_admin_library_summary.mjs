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
        output: 'admin-library-efficient-desktop-summary.json'
    },
    {
        mode: 'mobile',
        viewport: { width: 390, height: 844 },
        reducedMotion: 'no-preference',
        cpuThrottleRate: 1,
        emulateLowSpec: false,
        output: 'admin-library-mobile-summary.json'
    }
];

const AUTH_STATE = {
    id: 'admin-econ-001',
    name: 'Admin Library QA',
    nameEn: 'Admin Library QA',
    avatar: '',
    email: 'admin.library@kiu.edu.ge',
    role: 'admin',
    faculty: 'ECON',
    facultyCode: 'ECON'
};

const SEEDED_BOOKS = [
    {
        id: 'LIB-ALGO-001',
        title: 'Algorithms for Campus Systems',
        subtitle: 'Applied Scheduling and Search',
        year: 2025,
        author: 'Dana Nadir',
        thematic: 'Computer Science',
        language: 'English',
        status: 'Active',
        pdfLink: 'https://example.com/algo-campus.pdf'
    },
    {
        id: 'LIB-BUS-002',
        title: 'Business Intelligence for Student Success',
        subtitle: 'Operational Dashboards',
        year: 2024,
        author: 'Mira Patel',
        thematic: 'Economics',
        language: 'English',
        status: 'Active',
        pdfLink: ''
    },
    {
        id: 'LIB-GEO-003',
        title: 'ქართული აკადემიური კომუნიკაცია',
        subtitle: 'Language and Research',
        year: 2023,
        author: 'Nino Gelashvili',
        thematic: 'Mathematics',
        language: 'Georgian',
        status: 'Archived',
        pdfLink: ''
    }
];

function buildInitScript() {
    return ({ lowSpec, authState, books }) => {
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
            localStorage.setItem('KIU_PERSISTENT_STATE', JSON.stringify({
                meta: { manualTestingSanitizedVersion: 6 },
                auth: { activeUserId: authState.id },
                adminLibrary: {
                    params: {
                        thematic: ['Mathematics', 'Computer Science', 'Economics'],
                        language: ['English', 'Georgian'],
                        status: ['Active', 'Archived']
                    },
                    books
                }
            }));
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

async function waitForAdminLibraryReady(page) {
    await page.waitForFunction(
        () => {
            const tbody = document.getElementById('book-catalog-body');
            const totalMetric = document.getElementById('admin-library-total-metric');
            return Boolean(
                tbody
                && totalMetric
                && tbody.children.length > 0
                && totalMetric.textContent?.trim() === '3'
            );
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

async function captureRun(browser, run) {
    const context = await browser.newContext({
        viewport: run.viewport,
        colorScheme: 'dark'
    });
    await context.addInitScript(buildInitScript(), {
        lowSpec: run.emulateLowSpec,
        authState: AUTH_STATE,
        books: SEEDED_BOOKS
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
    await page.goto(`${BASE_URL}/admin-library.html`, { waitUntil: 'domcontentloaded' });
    await waitForAdminLibraryReady(page);
    const firstReadyMs = Date.now() - start;

    const filterMs = await measureInteraction(
        async () => {
            await page.locator('#library-filter-search').fill('Algorithms');
        },
        async () => {
            await page.waitForFunction(
                () => document.getElementById('admin-library-filtered-metric')?.textContent?.trim() === '1',
                undefined,
                { timeout: 15000 }
            );
        }
    );

    const modalOpenMs = await measureInteraction(
        async () => {
            await page.locator('[data-admin-library-open-schema-editor="true"]').evaluate((node) => node.click());
        },
        async () => {
            await page.waitForFunction(
                () => getComputedStyle(document.getElementById('library-schema-overlay')).display === 'flex',
                undefined,
                { timeout: 15000 }
            );
        }
    );

    const metrics = await page.evaluate(() => {
        const overlay = document.getElementById('library-schema-overlay');
        const mobileNav = document.getElementById('mobile-bottom-nav');
        return {
            title: document.title,
            url: window.location.href,
            bodyClass: document.body.className,
            totalMetric: document.getElementById('admin-library-total-metric')?.textContent?.trim() || '',
            filteredMetric: document.getElementById('admin-library-filtered-metric')?.textContent?.trim() || '',
            rowCount: document.querySelectorAll('#book-catalog-body tr').length,
            emptyStateVisible: Boolean(document.querySelector('.library-empty-row')),
            modalVisible: overlay ? getComputedStyle(overlay).display === 'flex' : false,
            schemaFieldCount: document.querySelectorAll('#schema-fields-list .admin-library-schema-field-row').length,
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
        filterMs,
        modalOpenMs,
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
