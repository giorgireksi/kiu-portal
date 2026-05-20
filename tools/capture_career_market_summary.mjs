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
        output: 'career-market-efficient-desktop-summary.json'
    },
    {
        mode: 'mobile',
        viewport: { width: 390, height: 844 },
        reducedMotion: 'no-preference',
        cpuThrottleRate: 1,
        emulateLowSpec: false,
        output: 'career-market-mobile-summary.json'
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
            localStorage.setItem('KIU_CAREER_HISTORY', '[]');
            localStorage.setItem('KIU_CAREER_REPORTS', '[]');
            localStorage.setItem('KIU_CAREER_VACANCIES', '[]');
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

async function waitForCareerReady(page) {
    await page.waitForFunction(
        () => {
            const body = document.body;
            const pageRoot = document.getElementById('page-career-market');
            const history = document.getElementById('career-history-items');
            const input = document.getElementById('career-message-input');
            const debug = window.__kiuCareerDebug;
            return Boolean(
                body
                && !body.classList.contains('kiu-shell-loading')
                && pageRoot
                && history
                && input
                && debug
                && typeof debug.appendMessage === 'function'
                && typeof debug.setCareerView === 'function'
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
    await page.goto(`${BASE_URL}/career-market.html`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await waitForCareerReady(page);

    const firstReadyMs = Date.now() - start;

    const lazyStateBefore = await page.evaluate(() => ({
        providerModalMounted: Boolean(document.getElementById('career-provider-modal')),
        toolModalMounted: Boolean(document.getElementById('career-tool-modal')),
        instructionsModalMounted: Boolean(document.getElementById('career-instructions-modal'))
    }));

    const providerOpenMs = await page.evaluate(async () => {
        const startMark = performance.now();
        document.getElementById('career-provider-settings')?.click();
        await new Promise((resolve, reject) => {
            const deadline = performance.now() + 5000;
            const tick = () => {
                const modal = document.getElementById('career-provider-modal');
                if (modal?.classList.contains('is-open')) {
                    resolve();
                    return;
                }
                if (performance.now() > deadline) {
                    reject(new Error('Provider modal did not open.'));
                    return;
                }
                requestAnimationFrame(tick);
            };
            tick();
        });
        return Math.round(performance.now() - startMark);
    });

    const providerSwitchMs = await page.evaluate(async () => {
        const select = document.getElementById('career-provider-select');
        if (!select) throw new Error('Provider select missing.');
        const startMark = performance.now();
        select.value = 'openai';
        select.dispatchEvent(new Event('change', { bubbles: true }));
        await new Promise((resolve, reject) => {
            const deadline = performance.now() + 5000;
            const tick = () => {
                const status = document.getElementById('career-provider-status');
                if (status?.textContent?.trim() === 'OpenAI') {
                    resolve();
                    return;
                }
                if (performance.now() > deadline) {
                    reject(new Error('Provider status did not switch.'));
                    return;
                }
                requestAnimationFrame(tick);
            };
            tick();
        });
        return Math.round(performance.now() - startMark);
    });

    await page.evaluate(() => {
        document.getElementById('career-provider-close')?.click();
    });

    const reportsViewMs = await page.evaluate(async () => {
        const trigger = document.querySelector('[data-career-view="reports"]');
        if (!trigger) throw new Error('Reports trigger missing.');
        const startMark = performance.now();
        trigger.click();
        await new Promise((resolve, reject) => {
            const deadline = performance.now() + 5000;
            const tick = () => {
                if (document.getElementById('career-reports-new')) {
                    resolve();
                    return;
                }
                if (performance.now() > deadline) {
                    reject(new Error('Reports workspace did not render.'));
                    return;
                }
                requestAnimationFrame(tick);
            };
            tick();
        });
        return Math.round(performance.now() - startMark);
    });

    const vacanciesViewMs = await page.evaluate(async () => {
        const trigger = document.querySelector('[data-career-view="vacancies"]');
        if (!trigger) throw new Error('Vacancies trigger missing.');
        const startMark = performance.now();
        trigger.click();
        await new Promise((resolve, reject) => {
            const deadline = performance.now() + 5000;
            const tick = () => {
                if (document.getElementById('career-run-vacancy-intel')) {
                    resolve();
                    return;
                }
                if (performance.now() > deadline) {
                    reject(new Error('Vacancies workspace did not render.'));
                    return;
                }
                requestAnimationFrame(tick);
            };
            tick();
        });
        return Math.round(performance.now() - startMark);
    });

    const transcriptScrollMs = await page.evaluate(async () => {
        const debug = window.__kiuCareerDebug;
        if (!debug || typeof debug.appendMessage !== 'function' || typeof debug.setCareerView !== 'function') {
            throw new Error('Career debug hooks missing.');
        }
        debug.setCareerView('chat');
        const list = document.getElementById('career-message-list');
        if (!list) throw new Error('Career message list missing.');
        list.innerHTML = '';
        list.classList.remove('has-messages');
        for (let index = 0; index < 36; index += 1) {
            debug.appendMessage(`Seeded transcript message ${index + 1}`, index % 2 === 0 ? 'assistant' : 'user');
        }
        await new Promise((resolve) => requestAnimationFrame(resolve));
        const startMark = performance.now();
        list.scrollTop = list.scrollHeight;
        await new Promise((resolve) => requestAnimationFrame(resolve));
        list.scrollTop = Math.max(0, list.scrollHeight - Math.round(list.clientHeight * 1.2));
        await new Promise((resolve) => requestAnimationFrame(resolve));
        return Math.round(performance.now() - startMark);
    });

    const finalSnapshot = await page.evaluate(() => ({
        historyItemCount: document.querySelectorAll('#career-history-items .career-history-item').length,
        transcriptMessageCount: document.querySelectorAll('#career-message-list .career-bubble').length,
        providerModalMounted: Boolean(document.getElementById('career-provider-modal')),
        toolModalMounted: Boolean(document.getElementById('career-tool-modal')),
        instructionsModalMounted: Boolean(document.getElementById('career-instructions-modal')),
        currentView: document.querySelector('[data-career-view].is-active')?.getAttribute('data-career-view') || '',
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
        providerOpenMs,
        providerSwitchMs,
        reportsViewMs,
        vacanciesViewMs,
        transcriptScrollMs,
        errors,
        title: await page.title(),
        url: page.url(),
        bodyClass: await page.getAttribute('body', 'class'),
        lazyStateBefore,
        ...finalSnapshot
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
