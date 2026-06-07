import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const BASE_URL = process.env.KIU_BASE_URL || 'http://127.0.0.1:8876';
const OUTPUT_PATH = resolve(
    process.cwd(),
    process.env.KIU_OUTPUT_PATH || 'artifacts/runtime-shell-smoke.json'
);
const SCREENSHOT_OUTPUT_DIR = resolve(
    process.cwd(),
    process.env.KIU_SCREENSHOT_OUTPUT_DIR || 'artifacts/runtime-shell-smoke-screenshots'
);
const DEV_SERVER_COMMAND = process.env.KIU_LOCAL_SERVER_COMMAND || 'python';
const DEV_SERVER_START_TIMEOUT_MS = Number(process.env.KIU_LOCAL_SERVER_TIMEOUT_MS || 15000);

const ROUTES = [
    {
        label: 'home-student',
        path: 'index.html?view=student#home',
        role: 'student',
        expected: {
            navCountMin: 1,
            activeNavCount: 1,
            activeNavTarget: 'home',
            shellExists: true,
            topbarExists: true,
            homeShellMinLength: 200,
            firstClickTarget: 'library'
        }
    },
    {
        label: 'profile-view-admin',
        path: 'profile-view.html?type=professor&id=prof-1&fac=ECON',
        role: 'admin',
        expected: {
            navCountMin: 1,
            activeNavCount: 1,
            activeNavTarget: 'profile-view',
            shellExists: true,
            topbarExists: true,
            firstClickTarget: 'orders'
        }
    },
    {
        label: 'faculty-gradebook-professor',
        path: 'faculty-gradebook.html',
        role: 'professor',
        expected: {
            navCountMin: 1,
            activeNavCount: 1,
            activeNavTarget: 'faculty-gradebook',
            shellExists: true,
            topbarExists: true,
            firstClickTarget: 'timetable'
        }
    },
    {
        label: 'admin-orders-admin',
        path: 'admin-orders.html',
        role: 'admin',
        expected: {
            navCountMin: 1,
            activeNavCount: 1,
            activeNavTarget: 'orders',
            shellExists: true,
            topbarExists: true,
            firstClickTarget: 'students-admin'
        }
    },
    {
        label: 'staff-admin',
        path: 'staff.html',
        role: 'admin',
        expected: {
            navCountMin: 1,
            activeNavCount: 1,
            activeNavTarget: 'staff',
            shellExists: true,
            topbarExists: true,
            firstClickTarget: 'students-admin'
        }
    },
    {
        label: 'student-service-role',
        path: 'student-service.html',
        role: 'student_service',
        expected: {
            navCountMin: 1,
            activeNavCount: 1,
            activeNavTarget: 'student-service',
            shellExists: true,
            topbarExists: true,
            firstClickTarget: 'orders'
        }
    }
];

function buildAuthState(role, label) {
    return {
        id: `runtime-smoke-${label}-${role}`,
        name: `${role} demo`,
        nameEn: `${role} demo`,
        email: `${role}.${label}@kiu.edu.ge`,
        role,
        faculty: 'ECON',
        facultyCode: 'ECON',
        avatar: ''
    };
}

function canAutoStartLocalServer(baseUrl) {
    try {
        const url = new URL(baseUrl);
        return url.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(url.hostname);
    } catch (error) {
        return false;
    }
}

function getLocalServerPort(baseUrl) {
    const url = new URL(baseUrl);
    return String(url.port || (url.protocol === 'https:' ? '443' : '80'));
}

async function probeBaseUrl(baseUrl) {
    try {
        const response = await fetch(new URL('/index.html', baseUrl), {
            redirect: 'manual',
            signal: AbortSignal.timeout(2000)
        });
        return response.ok || response.status < 500;
    } catch (error) {
        return false;
    }
}

async function waitForBaseUrl(baseUrl, timeoutMs) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        if (await probeBaseUrl(baseUrl)) return true;
        await new Promise((resolveDelay) => setTimeout(resolveDelay, 250));
    }
    return false;
}

async function ensureBaseUrlIsReachable(baseUrl) {
    if (await probeBaseUrl(baseUrl)) {
        return { mode: 'existing', child: null };
    }
    if (!canAutoStartLocalServer(baseUrl)) {
        throw new Error(
            `Runtime shell smoke could not reach ${baseUrl}. Start the target server first or point KIU_BASE_URL at a running local instance.`
        );
    }

    const port = getLocalServerPort(baseUrl);
    const command = DEV_SERVER_COMMAND;
    const args = ['tools/local_dev_server.py', port];
    const stderrLines = [];
    const child = spawn(command, args, {
        cwd: process.cwd(),
        stdio: ['ignore', 'pipe', 'pipe']
    });

    child.stderr?.on('data', (chunk) => {
        const text = String(chunk || '').trim();
        if (text) stderrLines.push(text);
    });

    const exitPromise = new Promise((resolveExit) => {
        child.once('exit', (code, signal) => resolveExit({ code, signal }));
        child.once('error', (error) => resolveExit({ error }));
    });

    const ready = await Promise.race([
        waitForBaseUrl(baseUrl, DEV_SERVER_START_TIMEOUT_MS),
        exitPromise.then((result) => result)
    ]);

    if (ready === true) {
        return { mode: 'autostarted', child };
    }

    child.kill();
    const failure = ready && typeof ready === 'object'
        ? ready.error
            ? ready.error.message
            : `process exited before readiness (code=${ready.code ?? 'unknown'}, signal=${ready.signal ?? 'none'})`
        : `timed out after ${DEV_SERVER_START_TIMEOUT_MS}ms`;
    const stderrSuffix = stderrLines.length ? ` stderr: ${stderrLines.join(' | ')}` : '';
    throw new Error(
        `Runtime shell smoke could not auto-start ${baseUrl} with \`${command} ${args.join(' ')}\`: ${failure}.${stderrSuffix}`
    );
}

async function stubSocialRuntime(context, seededAuth) {
    await context.route('**/api/social/bootstrap**', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                social: {
                    profiles: {},
                    pages: [],
                    groups: [],
                    projects: [],
                    relationships: [],
                    events: [],
                    rsvps: [],
                    reports: [],
                    lostFoundItems: [],
                    savedPosts: []
                }
            })
        });
    });
    await context.route('**/api/social/feed**', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ items: [] })
        });
    });
    await context.route('**/api/admin/accounts**', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ items: [seededAuth] })
        });
    });
    await context.route('**/api/notifications**', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ items: [], stories: [] })
        });
    });
    await context.route('**/api/messenger/snapshot**', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ chats: [], calls: [], accounts: [] })
        });
    });
    await context.route('**/api/social/posts/resolve**', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ items: [] })
        });
    });
}

function collectRouteFailures(summary, expected) {
    const failures = [];
    const ignorableUnauthorizedSessionError = summary.diagnosticKind === 'unauthorized-session'
        && summary.errors.length > 0
        && summary.errors.every((error) => String(error || '').includes('401 (Unauthorized)'));
    if (summary.errors.length && !ignorableUnauthorizedSessionError) {
        failures.push(`route emitted runtime errors: ${summary.errors.join(' | ')}`);
    }
    if (expected.shellExists && !summary.shellExists) failures.push('lux shell did not render');
    if (expected.topbarExists && !summary.topbarExists) failures.push('lux topbar did not render');
    if ((expected.navCountMin || 0) > 0 && summary.navCount < expected.navCountMin) {
        failures.push(`nav count ${summary.navCount} was below ${expected.navCountMin}`);
    }
    if ((expected.homeShellMinLength || 0) > 0 && summary.homeShellTextLength < expected.homeShellMinLength) {
        failures.push(`home shell length ${summary.homeShellTextLength} was below ${expected.homeShellMinLength}`);
    }
    if ((expected.activeNavCount || 0) > 0 && summary.activeNavCount !== expected.activeNavCount) {
        failures.push(`active nav count ${summary.activeNavCount} did not equal ${expected.activeNavCount}`);
    }
    if (expected.activeNavTarget && summary.activeNavTarget !== expected.activeNavTarget) {
        failures.push(`active nav target ${summary.activeNavTarget || '(none)'} did not equal ${expected.activeNavTarget}`);
    }
    if (expected.firstClickTarget) {
        if (!summary.firstClickNavigation?.targetExists) {
            failures.push(`nav target ${expected.firstClickTarget} was not rendered in the shell`);
        } else if (!summary.firstClickNavigation?.succeeded) {
            failures.push(`first click navigation to ${expected.firstClickTarget} did not complete`);
        }
    }
    return failures;
}

function shouldIgnoreRuntimeShellError(message) {
    return String(message || '').includes('Failed to load resource: net::ERR_CONNECTION_REFUSED');
}

async function collectShellSummary(page) {
    return await page.evaluate(() => {
        const activeNavItems = Array.from(document.querySelectorAll('#lux-nav .lux-nav-item.is-active'));
        return {
            url: window.location.href,
            title: document.title,
            shellExists: Boolean(document.getElementById('lux-shell')),
            topbarExists: Boolean(document.getElementById('lux-topbar')),
            navCount: document.querySelectorAll('#lux-nav .lux-nav-item').length,
            activeNavCount: activeNavItems.length,
            activeNavTarget: activeNavItems[0]?.dataset?.navTarget || '',
            homeShellTextLength: (document.getElementById('lux-home-shell')?.textContent || '').trim().length,
            diagnosticKind: document.getElementById('kiu-portal-runtime-diagnostic')?.getAttribute('data-diagnostic-kind') || ''
        };
    });
}

async function verifyFirstClickNavigation(page, targetPage) {
    const targetLocator = page.locator(`#lux-nav [data-nav-target="${targetPage}"]`).first();
    const targetExists = await targetLocator.count();
    if (!targetExists) {
        return {
            targetPage,
            targetExists: false,
            succeeded: false
        };
    }

    const beforeHref = page.url();
    await targetLocator.click();
    await page.waitForFunction(
        ({ href, target }) => (
            window.location.href !== href
            || document.querySelector('#lux-nav .lux-nav-item.is-active')?.dataset?.navTarget === target
        ),
        { href: beforeHref, target: targetPage },
        { timeout: 7000 }
    ).catch(() => null);
    await page.waitForLoadState('domcontentloaded', { timeout: 3000 }).catch(() => null);
    await page.waitForTimeout(1500);

    const afterSummary = await collectShellSummary(page);
    return {
        targetPage,
        targetExists: true,
        beforeHref,
        afterHref: afterSummary.url,
        afterActiveNavTarget: afterSummary.activeNavTarget,
        succeeded: afterSummary.url !== beforeHref || afterSummary.activeNavTarget === targetPage
    };
}

async function captureRoute(browser, routeDefinition) {
    const seededAuth = buildAuthState(routeDefinition.role, routeDefinition.label);
    const context = await browser.newContext({
        viewport: { width: 1440, height: 960 },
        colorScheme: 'dark'
    });

    await context.addInitScript(({ authState, role }) => {
        localStorage.setItem('KIU_AUTH_STATE', JSON.stringify(authState));
        localStorage.setItem('currentUserRole', role);
        localStorage.setItem('currentFaculty', 'ECON');
        localStorage.removeItem('KIU_PENDING_ROLE_SWITCH_ROLE');
        localStorage.removeItem('KIU_PORTAL_SESSION_TOKEN');
        sessionStorage.setItem('KIU_ACTIVE_SESSION_USER_ID', authState.id);
        sessionStorage.removeItem('KIU_ACTIVE_ROLE_IMPERSONATION');
    }, { authState: seededAuth, role: routeDefinition.role });

    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => {
        const message = `pageerror: ${error.message}`;
        if (!shouldIgnoreRuntimeShellError(message)) errors.push(message);
    });
    page.on('console', (message) => {
        if (message.type() !== 'error') return;
        const text = `console: ${message.text()}`;
        if (!shouldIgnoreRuntimeShellError(text)) errors.push(text);
    });

    await page.goto(`${BASE_URL}/${routeDefinition.path}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2500);

    const summary = await collectShellSummary(page);
    mkdirSync(SCREENSHOT_OUTPUT_DIR, { recursive: true });
    const screenshotPath = resolve(SCREENSHOT_OUTPUT_DIR, `${routeDefinition.label}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    const firstClickNavigation = routeDefinition.expected.firstClickTarget
        ? await verifyFirstClickNavigation(page, routeDefinition.expected.firstClickTarget)
        : null;

    await context.close();

    return {
        label: routeDefinition.label,
        path: routeDefinition.path,
        role: routeDefinition.role,
        errors,
        screenshotPath,
        firstClickNavigation,
        ...summary
    };
}

async function main() {
    let localServer = null;
    const browser = await chromium.launch({ headless: true });
    try {
        const reachability = await ensureBaseUrlIsReachable(BASE_URL);
        localServer = reachability.child;
        const summaries = [];
        for (const routeDefinition of ROUTES) {
            const summary = await captureRoute(browser, routeDefinition);
            summary.failures = collectRouteFailures(summary, routeDefinition.expected);
            summaries.push(summary);
        }

        const output = {
            baseUrl: BASE_URL,
            serverMode: reachability.mode,
            routes: summaries
        };
        mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
        writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));
        console.log(`Wrote ${OUTPUT_PATH}`);

        const failures = summaries.flatMap((summary) => summary.failures.map((failure) => `${summary.label}: ${failure}`));
        if (failures.length) {
            console.error('Runtime shell smoke failed:');
            failures.forEach((failure) => console.error(`- ${failure}`));
            process.exitCode = 1;
        }

        const { spawnSync } = await import('node:child_process');
        const liveQuizSmoke = spawnSync(process.execPath, ['tools/lms_live_quiz_smoke.mjs'], {
            cwd: process.cwd(),
            encoding: 'utf8',
            env: { ...process.env, KIU_BASE_URL: BASE_URL }
        });
        if (liveQuizSmoke.status === 0) {
            console.log('LMS live quiz smoke passed (runtime shell suite).');
        } else if (liveQuizSmoke.status === null) {
            console.warn('LMS live quiz smoke skipped (spawn failed).');
        } else {
            const output = `${liveQuizSmoke.stdout || ''}\n${liveQuizSmoke.stderr || ''}`.trim();
            console.error('LMS live quiz smoke failed:');
            console.error(output || `exit ${liveQuizSmoke.status}`);
            process.exitCode = 1;
        }
    } finally {
        await browser.close();
        if (localServer) {
            localServer.kill();
        }
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
