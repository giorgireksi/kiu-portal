import { chromium } from 'playwright';

const BASE_URL = process.env.KIU_BASE_URL || 'http://127.0.0.1:8876';

const AUTH_STATE = {
    id: 'social-student',
    name: 'Social Student',
    email: 'social@student.kiu.edu.ge',
    role: 'student',
    faculty: 'ECON',
    facultyCode: 'ECON',
    avatar: ''
};

async function installRoutes(context) {
    await context.route(/\/api\/portal\/session(?:\?.*)?$/i, async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ session: { token: 't' }, account: AUTH_STATE })
        });
    });
    await context.route('**/api/bootstrap**', async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, state: {} }) });
    });
    await context.route('**/api/platform/config**', async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ config: {} }) });
    });
    await context.route('**/api/portal/state', async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
    });
    await context.route('**/api/social/bootstrap**', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                social: {
                    profiles: { 'social-student': { defaultAudience: 'campus' } },
                    groups: [],
                    pages: [],
                    projects: [],
                    portfolios: [],
                    relationships: [],
                    events: [],
                    lostFoundItems: [],
                    surveys: [],
                    savedPosts: []
                }
            })
        });
    });
    await context.route('**/api/social/feed**', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                items: [{
                    id: 'post-1',
                    authorUserId: 'social-student',
                    body: 'seed',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    comments: []
                }]
            })
        });
    });
    await context.route('**/api/admin/accounts**', async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [AUTH_STATE] }) });
    });
    await context.route('**/api/notifications**', async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [], stories: [] }) });
    });
    await context.route('**/api/messenger/snapshot**', async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ chats: [], calls: [], accounts: [] }) });
    });
    await context.route('**/api/social/posts/resolve', async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [] }) });
    });
    await context.route('**/api/social/portfolio/me**', async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, portfolio: { userId: AUTH_STATE.id, sections: {} } }) });
    });
    await context.route('**/api/social/portfolio/discover**', async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, portfolios: [] }) });
    });
}

async function main() {
    const browser = await chromium.launch({
        headless: true,
        executablePath: '/usr/bin/chromium'
    });
    const context = await browser.newContext({ viewport: { width: 1440, height: 960 } });
    await installRoutes(context);
    await context.addInitScript(() => {
        localStorage.setItem('KIU_AUTH_STATE', JSON.stringify({
            id: 'social-student',
            role: 'student',
            faculty: 'ECON',
            facultyCode: 'ECON',
            email: 'social@student.kiu.edu.ge',
            name: 'Social Student'
        }));
        localStorage.setItem('currentUserRole', 'student');
        localStorage.setItem('KIU_PORTAL_SESSION_TOKEN', 'social-session-token');
        sessionStorage.setItem('KIU_ACTIVE_SESSION_USER_ID', 'social-student');
    });

    const page = await context.newPage();
    const logs = [];
    page.on('console', (msg) => logs.push(`[${msg.type()}] ${msg.text()}`));
    page.on('pageerror', (err) => logs.push(`[pageerror] ${err.message}`));

    await page.goto(`${BASE_URL}/social.html`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    await page.locator('.social-neo-workspace-nav-btn[data-action="panel-groups"]').first().click();
    await page.waitForTimeout(2000);

    const diagBefore = await page.evaluate(() => ({
        shellLoading: document.body.classList.contains('kiu-shell-loading'),
        appContentPe: getComputedStyle(document.getElementById('app-content')).pointerEvents,
        hasHandler: typeof window.handleSocialGroupsClick === 'function',
        groupsLoaded: Boolean(window.__KIU_SOCIAL_GROUPS_MODULE_LOADED),
        root: Boolean(document.getElementById('public-social-root')),
        button: Boolean(document.querySelector('[data-action="group-create-open"]')),
        bound: document.getElementById('public-social-root')?.__kiuEventsBound
    }));

    await page.locator('[data-action="group-create-open"]').first().click();
    await page.waitForTimeout(1500);

    const diagAfter = await page.evaluate(() => ({
        socialDialog: window.__kiuSocialState?.()?.ui?.socialDialog
            || (typeof window.getPortalSocialRuntimeState === 'function' ? window.getPortalSocialRuntimeState()?.ui?.socialDialog : null),
        activeDialog: typeof window.activeDialog === 'function' ? window.activeDialog() : null,
        backdrop: Boolean(document.querySelector('#social-neo-overlay-portal .lux-glass-dialog-backdrop, .lux-glass-dialog-card--group-create')),
        portalHidden: document.getElementById('social-neo-overlay-portal')?.hidden,
        dialogRegionHtml: document.getElementById('lux-glass-dialog-region')?.innerHTML?.slice(0, 200) || ''
    }));

    console.log(JSON.stringify({ diagBefore, diagAfter, logs: logs.slice(-30) }, null, 2));
    await browser.close();
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
