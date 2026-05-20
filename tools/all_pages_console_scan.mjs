import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const BASE_URL = process.env.KIU_BASE_URL || 'http://127.0.0.1:8876';
const BACKEND_URL = process.env.KIU_BACKEND_URL || 'http://127.0.0.1:48933';
const OUTPUT_PATH = resolve(
    process.cwd(),
    process.env.KIU_OUTPUT_PATH || 'artifacts/all-pages-console-scan.json'
);

const ROOT_PAGES = [
    'admin-library.html',
    'admin-orders.html',
    'admin-scheduler.html',
    'admin-tools.html',
    'calendar.html',
    'career-market.html',
    'chancellery.html',
    'exam-portal.html',
    'exams.html',
    'faculty-gradebook.html',
    'faculty-schedule.html',
    'gradebook.html',
    'index.html',
    'library.html',
    'lms.html',
    'login.html',
    'news.html',
    'orders.html',
    'personal-data.html',
    'profile.html',
    'profile-view.html',
    'programs.html',
    'protected-launch.html',
    'registration.html',
    'social.html',
    'staff.html',
    'students-admin.html',
    'student-service.html',
    'study-card.html',
    'timetable.html'
];

const AUTH_USERS = {
    admin: {
        id: 'admin-root',
        name: 'Portal Administrator',
        nameEn: 'Portal Administrator',
        email: 'admin@kiu.local',
        role: 'admin',
        faculty: '',
        facultyCode: '',
        avatar: ''
    },
    professor: {
        id: 'admin-testing-econ-professor',
        name: 'QA Prof Alpha',
        nameEn: 'QA Prof Alpha',
        email: 'qa.prof.alpha@kiu.edu.ge',
        role: 'professor',
        faculty: 'ECON',
        facultyCode: 'ECON',
        avatar: ''
    },
    student: {
        id: 'admin-testing-econ-student',
        name: 'QA Student Alpha',
        nameEn: 'QA Student Alpha',
        email: 'qa.student.alpha@student.kiu.edu.ge',
        role: 'student',
        faculty: 'ECON',
        facultyCode: 'ECON',
        avatar: ''
    },
    student_service: {
        id: 'admin-testing-econ-student-service',
        name: 'QA Service Alpha',
        nameEn: 'QA Service Alpha',
        email: 'qa.service.alpha@kiu.edu.ge',
        role: 'student_service',
        faculty: 'ECON',
        facultyCode: 'ECON',
        avatar: ''
    },
    public: null
};

const PAGE_ROLES = {
    'admin-library.html': 'admin',
    'admin-orders.html': 'admin',
    'admin-scheduler.html': 'admin',
    'admin-tools.html': 'admin',
    'calendar.html': 'student',
    'career-market.html': 'student',
    'chancellery.html': 'student_service',
    'exam-portal.html': 'public',
    'exams.html': 'professor',
    'faculty-gradebook.html': 'professor',
    'faculty-schedule.html': 'professor',
    'gradebook.html': 'professor',
    'index.html': 'student',
    'library.html': 'student',
    'lms.html': 'professor',
    'login.html': 'public',
    'news.html': 'student',
    'orders.html': 'student',
    'personal-data.html': 'student',
    'profile.html': 'student',
    'profile-view.html': 'admin',
    'programs.html': 'student',
    'protected-launch.html': 'student',
    'registration.html': 'student',
    'social.html': 'student',
    'staff.html': 'admin',
    'students-admin.html': 'admin',
    'student-service.html': 'student',
    'study-card.html': 'student',
    'timetable.html': 'student'
};

async function fetchAdminPortalSessionToken() {
    const response = await fetch(`${BACKEND_URL}/api/portal/session/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            email: 'admin@kiu.local',
            password: 'change-me-admin'
        })
    });
    const payload = await response.json().catch(() => null);
    const token = String(payload?.session?.token || '').trim();
    if (!response.ok || !token) {
        throw new Error(`Could not acquire admin portal session token from ${BACKEND_URL}.`);
    }
    return token;
}

async function capturePage(browser, pageName, adminToken) {
    const role = PAGE_ROLES[pageName] || 'student';
    const authState = AUTH_USERS[role] || null;
    const context = await browser.newContext({
        viewport: { width: 1440, height: 960 },
        colorScheme: 'dark'
    });

    await context.addInitScript(({ authState, role, adminToken }) => {
        try {
            localStorage.clear();
            sessionStorage.clear();
        } catch (error) {}

        if (authState) {
            localStorage.setItem('KIU_AUTH_STATE', JSON.stringify(authState));
            localStorage.setItem('currentUserRole', role);
            localStorage.setItem('currentFaculty', String(authState.facultyCode || authState.faculty || 'ECON'));
            sessionStorage.setItem('KIU_ACTIVE_SESSION_USER_ID', authState.id);
            if (role === 'admin') {
                localStorage.setItem('KIU_PORTAL_SESSION_TOKEN', adminToken);
            }
        }
    }, {
        authState,
        role,
        adminToken
    });

    const page = await context.newPage();
    const errors = [];
    const warnings = [];
    const networkFailures = [];

    page.on('pageerror', (error) => {
        errors.push(`pageerror: ${error.message}`);
    });

    page.on('console', (message) => {
        if (message.type() === 'error') errors.push(`console: ${message.text()}`);
        if (message.type() === 'warning') warnings.push(`warning: ${message.text()}`);
    });

    page.on('requestfailed', (request) => {
        const failure = request.failure();
        networkFailures.push({
            url: request.url(),
            errorText: failure?.errorText || 'unknown failure'
        });
    });

    try {
        await page.goto(`${BASE_URL}/${pageName}`, {
            waitUntil: 'domcontentloaded',
            timeout: 30000
        });
        await page.waitForTimeout(3000);
        const summary = await page.evaluate(() => ({
            finalUrl: window.location.href,
            title: document.title,
            diagnosticKind: document.getElementById('kiu-portal-runtime-diagnostic')?.getAttribute('data-diagnostic-kind') || '',
            shellExists: Boolean(document.getElementById('lux-shell')),
            navCount: document.querySelectorAll('#lux-nav .lux-nav-item').length,
            bodyTextSample: (document.body?.innerText || '').trim().slice(0, 180)
        }));
        await context.close();
        return {
            page: pageName,
            role,
            errors,
            warnings,
            networkFailures,
            ...summary
        };
    } catch (error) {
        await context.close();
        return {
            page: pageName,
            role,
            errors: [...errors, `goto: ${error.message}`],
            warnings,
            networkFailures,
            finalUrl: '',
            title: '',
            diagnosticKind: '',
            shellExists: false,
            navCount: 0,
            bodyTextSample: ''
        };
    }
}

async function main() {
    const adminToken = await fetchAdminPortalSessionToken();
    const browser = await chromium.launch({ headless: true });
    try {
        const results = [];
        for (const pageName of ROOT_PAGES) {
            results.push(await capturePage(browser, pageName, adminToken));
        }
        const output = {
            baseUrl: BASE_URL,
            backendUrl: BACKEND_URL,
            scannedAt: new Date().toISOString(),
            results
        };
        mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
        writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));
        console.log(`Wrote ${OUTPUT_PATH}`);

        const failures = results.filter(result => result.errors.length);
        if (failures.length) {
            console.error('All-pages console scan found runtime failures:');
            failures.forEach((failure) => {
                console.error(`- ${failure.page}: ${failure.errors.join(' | ')}`);
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
