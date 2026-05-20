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
        output: 'profile-efficient-desktop-summary.json'
    },
    {
        mode: 'mobile',
        viewport: { width: 390, height: 844 },
        reducedMotion: 'no-preference',
        cpuThrottleRate: 1,
        emulateLowSpec: false,
        output: 'profile-mobile-summary.json'
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
            localStorage.setItem('KIU_REAL_TESTING_CLEANUP_V6', '6');
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

async function waitForProfileReady(page) {
    await page.waitForFunction(
        () => {
            const body = document.body;
            const infoTab = document.getElementById('profile-tab-info');
            const tabs = document.querySelectorAll('[data-profile-tab]');
            return Boolean(
                body
                && !body.classList.contains('kiu-shell-loading')
                && infoTab
                && getComputedStyle(infoTab).display !== 'none'
                && tabs.length >= 4
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
    await page.goto(`${BASE_URL}/profile.html`, { waitUntil: 'domcontentloaded' });
    await waitForProfileReady(page);
    const firstReadyMs = Date.now() - start;

    const emailTabOpenMs = await measureInteraction(
        async () => {
            await page.locator('[data-profile-tab="email"]').evaluate((node) => node.click());
        },
        async () => {
            await page.waitForFunction(
                () => {
                    const panel = document.getElementById('profile-tab-email');
                    return Boolean(
                        panel
                        && getComputedStyle(panel).display !== 'none'
                        && panel.dataset.profileMounted === '1'
                        && document.getElementById('profile-email-input')
                    );
                },
                undefined,
                { timeout: 15000 }
            );
        }
    );

    const passwordTabOpenMs = await measureInteraction(
        async () => {
            await page.locator('[data-profile-tab="password"]').evaluate((node) => node.click());
        },
        async () => {
            await page.waitForFunction(
                () => {
                    const panel = document.getElementById('profile-tab-password');
                    return Boolean(
                        panel
                        && getComputedStyle(panel).display !== 'none'
                        && panel.dataset.profileMounted === '1'
                    );
                },
                undefined,
                { timeout: 15000 }
            );
        }
    );

    const calendarTabOpenMs = await measureInteraction(
        async () => {
            await page.locator('[data-profile-tab="calendar"]').evaluate((node) => node.click());
        },
        async () => {
            await page.waitForFunction(
                () => {
                    const panel = document.getElementById('profile-tab-calendar');
                    return Boolean(
                        panel
                        && getComputedStyle(panel).display !== 'none'
                        && panel.dataset.profileMounted === '1'
                        && (document.getElementById('profile-calendar-container')?.children.length || 0) > 0
                    );
                },
                undefined,
                { timeout: 15000 }
            );
        }
    );

    const metrics = await page.evaluate(() => {
        const mobileNav = document.getElementById('mobile-bottom-nav');
        const editFlowPresent = Boolean(
            document.querySelector('[data-profile-action], [data-edit-profile], #profile-edit-form, #profile-save-btn')
        );
        const attachmentPattern = /\b(attach|attachment|attachments|upload|uploads|file|files|document|documents|photo|photos|avatar|image|images|pdf)\b/i;
        const pageRoot = document.getElementById('page-profile');
        const attachmentFlowPresent = Boolean(
            Array.from(pageRoot?.querySelectorAll('button, a, input, label') || []).some((node) => {
                const haystack = `${node.textContent || ''} ${node.id || ''} ${node.placeholder || ''}`;
                return attachmentPattern.test(haystack);
            })
        );
        return {
            title: document.title,
            url: window.location.href,
            bodyClass: document.body.className,
            visiblePanels: Array.from(document.querySelectorAll('[id^="profile-tab-"]'))
                .filter((node) => getComputedStyle(node).display !== 'none')
                .map((node) => node.id),
            calendarNodeCount: document.getElementById('profile-calendar-container')?.children.length || 0,
            messengerPlaceholder: document.getElementById('portal-messenger-container')?.textContent?.trim() || '',
            modalCount: document.querySelectorAll('#modal-overlay .modal-content').length,
            editFlowPresent,
            attachmentFlowPresent,
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
        emailTabOpenMs,
        passwordTabOpenMs,
        calendarTabOpenMs,
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
