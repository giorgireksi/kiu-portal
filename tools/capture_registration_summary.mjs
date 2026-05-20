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
        output: 'registration-efficient-desktop-summary.json'
    },
    {
        mode: 'mobile',
        viewport: { width: 390, height: 844 },
        reducedMotion: 'no-preference',
        cpuThrottleRate: 1,
        emulateLowSpec: false,
        output: 'registration-mobile-summary.json'
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

async function seedRegistrationRoute(page) {
    await page.evaluate((authState) => {
        const userId = authState.id;
        window.KIU_STATE = window.KIU_STATE || {};
        KIU_STATE.registrationOpen = true;
        KIU_STATE.activeSemester = 3;
        KIU_STATE.probationStatus = KIU_STATE.probationStatus || {};
        KIU_STATE.studentPassedCourses = KIU_STATE.studentPassedCourses || {};
        KIU_STATE.studentSchedulesByStudent = KIU_STATE.studentSchedulesByStudent || {};
        KIU_STATE.adminProgramStructures = KIU_STATE.adminProgramStructures || {};
        KIU_STATE.registrationCMSByFaculty = KIU_STATE.registrationCMSByFaculty || {};
        KIU_STATE.availableGroups = KIU_STATE.availableGroups || {};

        KIU_STATE.studentPassedCourses[userId] = [
            {
                courseId: 'WRIT101',
                courseName: 'Academic Writing Foundations',
                semester: 1,
                ects: 5
            }
        ];

        KIU_STATE.studentSchedulesByStudent[userId] = [
            {
                courseId: 'ECON101',
                groupId: 'G1',
                groupName: 'Lecture G1',
                courseName: 'Economics Basics',
                day: 'Monday',
                time: '10:00',
                room: 'B201',
                prof: 'Prof One',
                ects: 5,
                duration: '110'
            }
        ];

        KIU_STATE.availableGroups.ECON101 = [
            {
                id: 'G1',
                groupId: 'G1',
                name: 'Lecture G1',
                sessionType: 'lecture',
                day: 'Monday',
                time: '10:00',
                room: 'B201',
                prof: 'Prof One',
                ta: '',
                faculty: 'ECON',
                semester: 3,
                seatLimit: 40,
                enrolledCount: 12,
                courseName: 'Economics Basics'
            }
        ];

        KIU_STATE.adminProgramStructures.ECON = {
            prog: [
                {
                    id: 'econ-foundations',
                    letter: 'A',
                    name: 'Economics Foundations',
                    maxEcts: 10,
                    minEcts: 0,
                    subModules: [
                        {
                            courseId: 'ECON101',
                            id: '1',
                            n: '1',
                            title: 'Economics Basics',
                            ects: '5',
                            precondition: '',
                            semesterRuleMode: 'all',
                            allowedSemesters: '',
                            lectureCapacity: 40,
                            seminarCapacity: 20
                        }
                    ]
                }
            ],
            free: [],
            conc: [],
            minor: []
        };

        if (typeof renderStudentRegStructures === 'function') {
            renderStudentRegStructures(window.__studentRegActiveTab || 'prog');
        }
        if (typeof refreshRegistrationUI === 'function') {
            refreshRegistrationUI();
        }
        if (typeof updateEctsProgress === 'function') {
            updateEctsProgress();
        }
    }, AUTH_STATE);
}

async function waitForRegistrationReady(page) {
    await page.waitForFunction(
        () => {
            const body = document.body;
            const content = document.getElementById('student-reg-content-container');
            const tabs = document.querySelectorAll('.reg-tab[data-reg-tab]');
            return Boolean(
                body
                && !body.classList.contains('kiu-shell-loading')
                && content
                && content.textContent.trim().length > 0
                && tabs.length >= 6
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
    await page.goto(`${BASE_URL}/registration.html`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1500);
    await seedRegistrationRoute(page);
    await waitForRegistrationReady(page);
    const firstReadyMs = Date.now() - start;

    const selectedTabOpenMs = await page.evaluate(async () => {
        const target = document.querySelector('.reg-tab[data-reg-tab="selected"]');
        const content = document.getElementById('student-reg-content-container');
        if (!target || !content) throw new Error('Selected tab is unavailable.');
        const startMark = performance.now();
        target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        await new Promise((resolve, reject) => {
            const deadline = performance.now() + 5000;
            const tick = () => {
                const active = document.querySelectorAll('.reg-tab.active');
                const activeTab = active[0]?.getAttribute('data-reg-tab') || '';
                if (activeTab === 'selected' && /Economics Basics|No selected sections yet/i.test(content.textContent || '')) {
                    resolve();
                    return;
                }
                if (performance.now() > deadline) {
                    reject(new Error('Selected tab did not render.'));
                    return;
                }
                requestAnimationFrame(tick);
            };
            tick();
        });
        return Math.round(performance.now() - startMark);
    });

    const historyTabOpenMs = await page.evaluate(async () => {
        const target = document.querySelector('.reg-tab[data-reg-tab="history"]');
        const content = document.getElementById('student-reg-content-container');
        if (!target || !content) throw new Error('History tab is unavailable.');
        const startMark = performance.now();
        target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        await new Promise((resolve, reject) => {
            const deadline = performance.now() + 5000;
            const tick = () => {
                const active = document.querySelectorAll('.reg-tab.active');
                const activeTab = active[0]?.getAttribute('data-reg-tab') || '';
                if (activeTab === 'history' && /Academic Writing Foundations|No completed registration history yet/i.test(content.textContent || '')) {
                    resolve();
                    return;
                }
                if (performance.now() > deadline) {
                    reject(new Error('History tab did not render.'));
                    return;
                }
                requestAnimationFrame(tick);
            };
            tick();
        });
        return Math.round(performance.now() - startMark);
    });

    const programTabOpenMs = await page.evaluate(async () => {
        const target = document.querySelector('.reg-tab[data-reg-tab="program"]');
        const content = document.getElementById('student-reg-content-container');
        if (!target || !content) throw new Error('Program tab is unavailable.');
        const startMark = performance.now();
        target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        await new Promise((resolve, reject) => {
            const deadline = performance.now() + 5000;
            const tick = () => {
                const active = document.querySelectorAll('.reg-tab.active');
                const activeTab = active[0]?.getAttribute('data-reg-tab') || '';
                if (activeTab === 'program' && /Economics Foundations|Economics Basics/i.test(content.textContent || '')) {
                    resolve();
                    return;
                }
                if (performance.now() > deadline) {
                    reject(new Error('Program tab did not render.'));
                    return;
                }
                requestAnimationFrame(tick);
            };
            tick();
        });
        return Math.round(performance.now() - startMark);
    });

    const sectionPickerOpenMs = await page.evaluate(async () => {
        const button = document.querySelector('.registration-course-action button');
        if (!button) throw new Error('Section picker action is unavailable.');
        const startMark = performance.now();
        button.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        await new Promise((resolve, reject) => {
            const deadline = performance.now() + 5000;
            const tick = () => {
                if (document.getElementById('student-course-section-picker-modal')) {
                    resolve();
                    return;
                }
                if (performance.now() > deadline) {
                    reject(new Error('Section picker modal did not open.'));
                    return;
                }
                requestAnimationFrame(tick);
            };
            tick();
        });
        document.querySelector('[data-study-card-assessment-close], [aria-label="Close section picker"], #student-course-section-picker-modal .kiu-btn-outline')?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
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
        activeTabs: Array.from(document.querySelectorAll('.reg-tab.active')).map((node) => node.getAttribute('data-reg-tab')),
        visibleTabs: Array.from(document.querySelectorAll('.reg-tab[data-reg-tab]'))
            .filter((node) => getComputedStyle(node).display !== 'none')
            .map((node) => node.getAttribute('data-reg-tab')),
        ectsText: document.getElementById('ects-text')?.textContent?.trim() || '',
        selectedCountText: document.getElementById('registration-hero-selected')?.textContent?.trim() || '',
        moduleButtonCount: document.querySelectorAll('.registration-course-action button').length,
        pickerMounted: Boolean(document.getElementById('student-course-section-picker-modal')),
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
        selectedTabOpenMs,
        historyTabOpenMs,
        programTabOpenMs,
        sectionPickerOpenMs,
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
