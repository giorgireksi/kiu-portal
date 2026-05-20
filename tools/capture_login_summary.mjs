import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const BASE_URL = process.env.KIU_BASE_URL || 'http://127.0.0.1:8876';
const OUTPUT_DIR = resolve(process.cwd(), process.env.KIU_OUTPUT_DIR || 'artifacts');

const RUNS = [
    {
        mode: 'efficient-desktop',
        viewport: { width: 1440, height: 960 },
        reducedMotion: 'reduce',
        cpuThrottleRate: 4,
        emulateLowSpec: true,
        output: 'login-efficient-desktop-summary.json'
    },
    {
        mode: 'mobile',
        viewport: { width: 390, height: 844 },
        reducedMotion: 'no-preference',
        cpuThrottleRate: 1,
        emulateLowSpec: false,
        output: 'login-mobile-summary.json'
    }
];

function buildScenarioInitScript() {
    return (config = {}) => {
        try {
            localStorage.removeItem('KIU_AUTH_STATE');
            localStorage.removeItem('currentUserRole');
            localStorage.removeItem('KIU_PENDING_ROLE_SWITCH_ROLE');
            localStorage.removeItem('KIU_PORTAL_SESSION_TOKEN');
            localStorage.removeItem('KIU_FACULTY_CONTEXT');
            localStorage.removeItem('currentFaculty');
            localStorage.removeItem('KIU_PERSISTENT_STATE');
            sessionStorage.removeItem('KIU_ACTIVE_SESSION_USER_ID');
            sessionStorage.removeItem('KIU_ACTIVE_ROLE_IMPERSONATION');
            sessionStorage.removeItem('KIU_PENDING_PROTECTED_QUIZ_LAUNCH');
            sessionStorage.removeItem('KIU_PENDING_PROTECTED_QUIZ_POPUP_RETURN_TO');
            sessionStorage.removeItem('KIU_PENDING_PROTECTED_QUIZ_POPUP_REASON');
        } catch (error) {}
        if (config.authState) {
            try { localStorage.setItem('KIU_AUTH_STATE', JSON.stringify(config.authState)); } catch (error) {}
            try { localStorage.setItem('currentUserRole', String(config.authState.role || 'student')); } catch (error) {}
            try { localStorage.setItem('currentFaculty', String(config.authState.faculty || 'ECON')); } catch (error) {}
            try { localStorage.setItem('KIU_FACULTY_CONTEXT', String(config.authState.faculty || 'ECON')); } catch (error) {}
        }
        if (config.sessionToken) {
            try { localStorage.setItem('KIU_PORTAL_SESSION_TOKEN', String(config.sessionToken)); } catch (error) {}
        }
        if (config.persistedState) {
            try { localStorage.setItem('KIU_PERSISTENT_STATE', JSON.stringify(config.persistedState)); } catch (error) {}
        }
    };
}

async function wireScenarioRoutes(page, scenario = {}) {
    await page.route('**/api/portal/microsoft/config', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(scenario.microsoftConfig || { enabled: true })
        });
    });

    await page.route('**/api/portal/microsoft/start?*', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                authorizeUrl: scenario.microsoftAuthorizeUrl || `${BASE_URL}/login.html?microsoft_stub=1`
            })
        });
    });

    await page.route('**/api/portal/microsoft/complete', async (route) => {
        const payload = route.request().postDataJSON?.() || {};
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(scenario.microsoftCompletePayload || {
                session: { token: 'microsoft-session-token' },
                account: {
                    id: 'microsoft-student',
                    name: 'Microsoft Student',
                    nameEn: 'Microsoft Student',
                    avatar: '',
                    email: 'microsoft.student@kiu.edu.ge',
                    role: 'student',
                    faculty: 'ECON',
                    handoff: String(payload.handoff || '')
                }
            })
        });
    });

    await page.route('**/api/portal/session/login', async (route) => {
        const payload = route.request().postDataJSON?.() || {};
        const email = String(payload.email || '').trim();
        const normalizedRole = email.toLowerCase().includes('admin') ? 'admin' : 'student';
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                session: { token: `${normalizedRole}-session-token` },
                account: {
                    id: normalizedRole === 'admin' ? 'login-admin' : 'login-student',
                    name: normalizedRole === 'admin' ? 'Login Admin' : 'Login Student',
                    nameEn: normalizedRole === 'admin' ? 'Login Admin' : 'Login Student',
                    avatar: '',
                    email,
                    role: normalizedRole,
                    faculty: 'ECON'
                }
            })
        });
    });

    await page.route('**/api/auth/activate', async (route) => {
        const payload = route.request().postDataJSON?.() || {};
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                account: {
                    id: String(payload.id || 'activated-user'),
                    email: 'activated.student@kiu.edu.ge',
                    role: 'student',
                    faculty: 'ECON'
                }
            })
        });
    });

    await page.route(/\/api\/portal\/session(?:\?.*)?$/i, async (route) => {
        if (Object.prototype.hasOwnProperty.call(scenario, 'sessionPayload')) {
            if (scenario.sessionPayload) {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify(scenario.sessionPayload)
                });
                return;
            }
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ expired: true })
            });
            return;
        }
        await route.fulfill({
            status: 404,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Session not found.' })
        });
    });
}

async function waitForLoginReady(page) {
    await page.waitForFunction(
        () => Boolean(document.querySelector('.login-wrapper') && document.querySelector('.login-title')),
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

async function waitForPageUrl(page, matcher, timeoutMs = 20000) {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeoutMs) {
        const currentUrl = page.url();
        if (matcher.test(currentUrl)) return currentUrl;
        await page.waitForTimeout(50);
    }
    throw new Error(`Timed out waiting for URL ${matcher} from ${page.url()}`);
}

async function createScenarioPage(context, run, errors, initConfig = {}) {
    const page = await context.newPage();
    page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
    page.on('console', (message) => {
        if (message.type() === 'error') errors.push(`console: ${message.text()}`);
    });
    await page.addInitScript(buildScenarioInitScript(), initConfig);
    await wireScenarioRoutes(page, initConfig);
    await page.emulateMedia({ reducedMotion: run.reducedMotion });
    const cdp = await context.newCDPSession(page);
    if (run.cpuThrottleRate > 1) {
        await cdp.send('Emulation.setCPUThrottlingRate', { rate: run.cpuThrottleRate });
    }
    return page;
}

async function captureRun(browser, run) {
    const context = await browser.newContext({
        viewport: run.viewport,
        colorScheme: 'dark'
    });
    const errors = [];
    const readyPage = await createScenarioPage(context, run, errors);
    const firstReadyStart = Date.now();
    await readyPage.goto(`${BASE_URL}/login.html`, { waitUntil: 'domcontentloaded' });
    await waitForLoginReady(readyPage);
    const firstReadyMs = Date.now() - firstReadyStart;

    const activateTabOpenMs = await measureInteraction(
        async () => {
            await readyPage.locator('[data-login-tab="activate"]').evaluate((node) => node.click());
        },
        async () => {
            await readyPage.waitForFunction(
                () => document.getElementById('form-activate')?.classList.contains('active'),
                undefined,
                { timeout: 15000 }
            );
        }
    );
    await readyPage.close();

    const studentPage = await createScenarioPage(context, run, errors);
    await studentPage.goto(`${BASE_URL}/login.html`, { waitUntil: 'domcontentloaded' });
    await waitForLoginReady(studentPage);
    const studentLoginRedirectMs = await measureInteraction(
        async () => {
            await studentPage.locator('#login-email').fill('student@kiu.edu.ge');
            await studentPage.locator('#login-password').fill('Password123!');
            await studentPage.locator('[data-login-action="login-submit"]').evaluate((node) => node.click());
        },
        async () => {
            await studentPage.waitForURL('**/index.html', { waitUntil: 'commit', timeout: 20000 });
        }
    );
    await studentPage.close();

    const adminPage = await createScenarioPage(context, run, errors);
    await adminPage.goto(`${BASE_URL}/login.html`, { waitUntil: 'domcontentloaded' });
    await waitForLoginReady(adminPage);
    const adminLoginRedirectMs = await measureInteraction(
        async () => {
            await adminPage.locator('#login-email').fill('admin@kiu.edu.ge');
            await adminPage.locator('#login-password').fill('Password123!');
            await adminPage.locator('[data-login-action="login-submit"]').evaluate((node) => node.click());
        },
        async () => {
            await adminPage.waitForURL('**/students-admin.html', { waitUntil: 'commit', timeout: 20000 });
        }
    );
    await adminPage.close();

    const microsoftStartPage = await createScenarioPage(context, run, errors);
    await microsoftStartPage.goto(`${BASE_URL}/login.html`, { waitUntil: 'domcontentloaded' });
    await waitForLoginReady(microsoftStartPage);
    const microsoftStartMs = await measureInteraction(
        async () => {
            await microsoftStartPage.locator('[data-login-action="microsoft-login"]').evaluate((node) => node.click());
        },
        async () => {
            await microsoftStartPage.waitForURL('**/login.html?microsoft_stub=1', { waitUntil: 'commit', timeout: 20000 });
            await waitForLoginReady(microsoftStartPage);
        }
    );
    const metrics = await microsoftStartPage.evaluate(() => ({
        title: document.title,
        url: window.location.href,
        bodyClass: document.body.className,
        activeTab: document.querySelector('.login-tab.active')?.textContent?.trim() || '',
        microsoftEnabled: !document.getElementById('microsoft-login-btn')?.disabled,
        microsoftStartUrl: window.location.href,
        errorText: document.getElementById('error-msg')?.textContent?.trim() || '',
        successText: document.getElementById('success-msg')?.textContent?.trim() || ''
    }));
    await microsoftStartPage.close();

    const existingAuthState = {
        id: 'existing-student',
        name: 'Existing Student',
        nameEn: 'Existing Student',
        avatar: '',
        email: 'existing.student@kiu.edu.ge',
        role: 'student',
        faculty: 'ECON'
    };
    const existingSessionPage = await createScenarioPage(context, run, errors, {
        authState: existingAuthState,
        sessionToken: 'existing-session-token',
        sessionPayload: {
            session: { token: 'existing-session-token' },
            account: existingAuthState
        }
    });
    const existingSessionRedirectStart = Date.now();
    await existingSessionPage.goto(`${BASE_URL}/login.html`, { waitUntil: 'domcontentloaded' });
    await waitForPageUrl(existingSessionPage, /\/index\.html$/i, 20000);
    const existingSessionRedirectMs = Date.now() - existingSessionRedirectStart;
    await existingSessionPage.close();

    const expiredSessionPage = await createScenarioPage(context, run, errors, {
        authState: existingAuthState,
        sessionToken: 'expired-session-token',
        sessionPayload: null
    });
    await expiredSessionPage.goto(`${BASE_URL}/login.html`, { waitUntil: 'domcontentloaded' });
    const expiredSessionFallbackMs = await measureInteraction(
        async () => {},
        async () => {
            await expiredSessionPage.waitForFunction(
                () => document.getElementById('error-msg')?.textContent?.includes('session expired'),
                undefined,
                { timeout: 15000 }
            );
        }
    );
    const expiredSessionState = await expiredSessionPage.evaluate(() => ({
        errorText: document.getElementById('error-msg')?.textContent?.trim() || '',
        authState: localStorage.getItem('KIU_AUTH_STATE'),
        sessionToken: localStorage.getItem('KIU_PORTAL_SESSION_TOKEN')
    }));
    await expiredSessionPage.close();

    const noTokenPage = await createScenarioPage(context, run, errors, {
        authState: existingAuthState
    });
    await noTokenPage.goto(`${BASE_URL}/login.html`, { waitUntil: 'domcontentloaded' });
    const noTokenFallbackMs = await measureInteraction(
        async () => {},
        async () => {
            await noTokenPage.waitForFunction(
                () => !localStorage.getItem('KIU_AUTH_STATE') && !localStorage.getItem('KIU_PORTAL_SESSION_TOKEN'),
                undefined,
                { timeout: 15000 }
            );
        }
    );
    const noTokenState = await noTokenPage.evaluate(() => ({
        authState: localStorage.getItem('KIU_AUTH_STATE'),
        sessionToken: localStorage.getItem('KIU_PORTAL_SESSION_TOKEN')
    }));
    await noTokenPage.close();

    const microsoftCallbackPage = await createScenarioPage(context, run, errors, {
        microsoftCompletePayload: {
            session: { token: 'microsoft-session-token' },
            account: {
                id: 'microsoft-student',
                name: 'Microsoft Student',
                nameEn: 'Microsoft Student',
                avatar: '',
                email: 'microsoft.student@kiu.edu.ge',
                role: 'student',
                faculty: 'ECON'
            }
        }
    });
    const microsoftCallbackStart = Date.now();
    await microsoftCallbackPage.goto(`${BASE_URL}/login.html?microsoft_status=success&microsoft_handoff=microsoft-session-handoff`, { waitUntil: 'domcontentloaded' });
    await waitForPageUrl(microsoftCallbackPage, /\/index\.html$/i, 20000);
    const microsoftCallbackRedirectMs = Date.now() - microsoftCallbackStart;
    await microsoftCallbackPage.close();

    await context.close();

    return {
        mode: run.mode,
        viewport: `${run.viewport.width}x${run.viewport.height}`,
        cpuThrottleRate: run.cpuThrottleRate,
        reducedMotion: run.reducedMotion,
        firstReadyMs,
        activateTabOpenMs,
        studentLoginRedirectMs,
        adminLoginRedirectMs,
        existingSessionRedirectMs,
        expiredSessionFallbackMs,
        expiredSessionClearedAuth: expiredSessionState.authState === null,
        expiredSessionClearedToken: expiredSessionState.sessionToken === null,
        expiredSessionErrorText: expiredSessionState.errorText,
        noTokenFallbackMs,
        noTokenClearedAuth: noTokenState.authState === null,
        noTokenClearedToken: noTokenState.sessionToken === null,
        microsoftStartMs,
        microsoftCallbackRedirectMs,
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
