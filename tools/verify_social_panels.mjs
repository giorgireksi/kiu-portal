import { chromium } from 'playwright';

const BASE_URL = process.env.KIU_BASE_URL || 'http://127.0.0.1:8876';

const DESKTOP_PANELS = [
    'feed',
    'messages',
    'community',
    'events',
    'surveys',
    'projects',
    'photography',
    'lost-and-found'
];

const PANEL_CHECKS = {
    feed: {
        label: 'Feed composer',
        selector: '.social-neo[data-panel="feed"] [data-bind="composer-text"]'
    },
    messages: {
        label: 'Messages inbox or thread',
        selector: '.social-neo[data-panel="messages"] .social-neo-messages, .social-neo[data-panel="messages"] .social-neo-chat-item'
    },
    community: {
        label: 'Community layout',
        selector: '.social-neo[data-panel="community"] .social-neo-community-layout'
    },
    events: {
        label: 'Events shell',
        selector: '.social-neo[data-panel="events"] .social-neo-events-shell, .social-neo[data-panel="events"] .social-neo-events-hero'
    },
    surveys: {
        label: 'Surveys shell',
        selector: '.social-neo[data-panel="surveys"] .social-neo-surveys-shell, .social-neo[data-panel="surveys"] .social-neo-surveys-hero'
    },
    projects: {
        label: 'Portfolio shell',
        selector: '.social-neo[data-panel="projects"] .social-neo-portfolio-shell, .social-neo[data-panel="projects"] .social-projects-shell'
    },
    photography: {
        label: 'Photography shell',
        selector: '.social-neo[data-panel="photography"] .social-photo-shell'
    },
    'lost-and-found': {
        label: 'Lost & found shell',
        selector: '.social-neo[data-panel="lost-and-found"] .social-neo-lost-found-shell, .social-neo[data-panel="lost-and-found"] .social-neo-lost-found-hero'
    }
};

const MOBILE_TAB_ACTIONS = [
    { panel: 'feed', click: 'bottom-nav', selector: '#mob-nav-home' },
    { panel: 'community', click: 'bottom-nav', selector: '#mob-nav-community' },
    { panel: 'photography', click: 'bottom-nav', selector: '#mob-nav-photography' },
    { panel: 'events', click: 'bottom-nav', selector: '#mob-nav-events' },
    { panel: 'lost-and-found', click: 'bottom-nav', selector: '#mob-nav-lost-found' },
    { panel: 'messages', click: 'bottom-nav', selector: '#mob-nav-inbox' },
    { panel: 'surveys', click: 'more-sheet', selector: '.mob-sheet-nav-btn[data-social-panel="surveys"]' },
    { panel: 'projects', click: 'more-sheet', selector: '.mob-sheet-nav-btn[data-social-panel="projects"]' }
];

const AUTH_STATE = {
    id: 'social-student',
    name: 'Social Student',
    nameEn: 'Social Student',
    email: 'social@student.kiu.edu.ge',
    role: 'student',
    faculty: 'ECON',
    facultyCode: 'ECON',
    avatar: ''
};

function buildSocialBootstrap() {
    return {
        social: {
            profiles: {
                'social-student': {
                    defaultAudience: 'campus'
                }
            },
            pages: [
                {
                    id: 'page-kiu',
                    name: 'KIU Campus',
                    description: 'Official campus updates and notices.',
                    visibility: 'public',
                    followerCount: 240,
                    isFollowing: true,
                    isManager: false
                }
            ],
            groups: [
                {
                    id: 'group-study',
                    name: 'ECON Study Circle',
                    description: 'Collaborative prep and question review.',
                    visibility: 'public',
                    memberCount: 18,
                    membershipState: 'member',
                    tags: ['study']
                }
            ],
            projects: [],
            relationships: [],
            events: [
                {
                    id: 'event-1',
                    title: 'Faculty Q&A Session',
                    description: 'Drop in for timetable and registration help.',
                    category: 'academic',
                    startsAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
                    location: 'Room 201',
                    attendeeSummary: { going: 12, interested: 8 },
                    viewerRsvpStatus: 'interested'
                }
            ],
            rsvps: [],
            reports: [],
            lostFoundItems: [
                {
                    id: 'lf-1',
                    title: 'Black notebook',
                    description: 'Left near the library entrance.',
                    kind: 'lost',
                    status: 'open'
                }
            ],
            savedPosts: []
        }
    };
}

function buildFeedItems() {
    const now = Date.now();
    return {
        items: Array.from({ length: 12 }, (_, index) => ({
            id: `post-${index + 1}`,
            authorUserId: index % 2 === 0 ? 'social-student' : 'peer-1',
            body: `Campus update ${index + 1}: shared social feed performance seed.`,
            createdAt: new Date(now - index * 60000).toISOString(),
            updatedAt: new Date(now - index * 60000).toISOString(),
            comments: [
                {
                    id: `comment-${index + 1}`,
                    authorUserId: 'peer-2',
                    body: `Comment ${index + 1}`,
                    createdAt: new Date(now - index * 30000).toISOString()
                }
            ]
        }))
    };
}

function buildAccounts() {
    return {
        items: [
            AUTH_STATE,
            {
                id: 'peer-1',
                name: 'Peer One',
                nameEn: 'Peer One',
                email: 'peer1@kiu.edu.ge',
                role: 'student',
                faculty: 'ECON',
                facultyCode: 'ECON',
                avatar: '',
                online: true
            },
            {
                id: 'peer-2',
                name: 'Peer Two',
                nameEn: 'Peer Two',
                email: 'peer2@kiu.edu.ge',
                role: 'student',
                faculty: 'ECON',
                facultyCode: 'ECON',
                avatar: '',
                online: false
            }
        ]
    };
}

function buildNotifications() {
    return {
        items: [
            {
                id: 'notif-1',
                recipientUserId: 'social-student',
                title: 'Mention',
                body: 'You were mentioned in a social thread.',
                isRead: false,
                createdAt: new Date().toISOString(),
                routePage: 'social',
                routeData: { chatId: 'chat-1' }
            }
        ],
        stories: []
    };
}

function buildMessengerSnapshot() {
    const now = Date.now();
    const messages = Array.from({ length: 20 }, (_, index) => ({
        id: `msg-${index + 1}`,
        senderId: index % 2 === 0 ? 'peer-1' : 'social-student',
        text: `Thread message ${index + 1}`,
        sentAt: new Date(now - index * 45000).toISOString(),
        seenBy: ['social-student', 'peer-1']
    }));
    return {
        chats: [
            {
                id: 'chat-1',
                type: 'direct',
                members: ['social-student', 'peer-1'],
                updatedAt: new Date().toISOString(),
                messages
            }
        ],
        calls: [],
        accounts: [
            {
                id: 'peer-1',
                name: 'Peer One',
                nameEn: 'Peer One',
                email: 'peer1@kiu.edu.ge',
                role: 'student',
                faculty: 'ECON',
                facultyCode: 'ECON',
                avatar: '',
                online: true
            }
        ]
    };
}

function buildInitScript() {
    return () => {
        localStorage.setItem('KIU_AUTH_STATE', JSON.stringify({
            id: 'social-student',
            name: 'Social Student',
            nameEn: 'Social Student',
            email: 'social@student.kiu.edu.ge',
            role: 'student',
            faculty: 'ECON',
            facultyCode: 'ECON',
            avatar: ''
        }));
        localStorage.setItem('currentUserRole', 'student');
        localStorage.setItem('currentFaculty', 'ECON');
        localStorage.setItem('KIU_PORTAL_SESSION_TOKEN', 'social-session-token');
        localStorage.removeItem('KIU_PENDING_ROLE_SWITCH_ROLE');
        sessionStorage.removeItem('KIU_ACTIVE_ROLE_IMPERSONATION');
        sessionStorage.setItem('KIU_ACTIVE_SESSION_USER_ID', 'social-student');
    };
}

async function installSocialRoutes(context) {
    await context.route(/\/api\/portal\/session(?:\?.*)?$/i, async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                session: { token: 'social-session-token' },
                account: { ...AUTH_STATE }
            })
        });
    });

    await context.route('**/api/bootstrap**', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ ok: true, state: {} })
        });
    });

    await context.route('**/api/platform/config**', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ config: {} })
        });
    });

    await context.route('**/api/portal/state', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ ok: true })
        });
    });

    await context.route('**/api/social/bootstrap**', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(buildSocialBootstrap())
        });
    });

    await context.route('**/api/social/feed**', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(buildFeedItems())
        });
    });

    await context.route('**/api/social/surveys**', async (route) => {
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
            body: JSON.stringify(buildAccounts())
        });
    });

    await context.route('**/api/notifications**', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(buildNotifications())
        });
    });

    await context.route('**/api/messenger/snapshot**', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(buildMessengerSnapshot())
        });
    });

    await context.route('**/api/social/posts/resolve', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ items: [] })
        });
    });
}

function attachErrorCollectors(page, errors) {
    page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
    page.on('console', (message) => {
        if (message.type() === 'error') errors.push(`console: ${message.text()}`);
    });
}

async function waitForSocialReady(page) {
    await page.waitForFunction(
        () => Boolean(document.querySelector('#public-social-root .social-neo[data-panel] .social-neo-post-card, #public-social-root .social-neo[data-panel="feed"] [data-bind="composer-text"]')),
        { timeout: 25000 }
    );
}

async function waitForPanelSelector(page, selector, timeout = 15000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
        const ready = await page.evaluate(
            (panelSelector) => Boolean(document.querySelector(panelSelector)),
            selector
        ).catch(() => false);
        if (ready) return;
        await page.waitForTimeout(160);
    }
    throw new Error(`Timed out after ${timeout}ms waiting for selector: ${selector}`);
}

async function readPanelState(page) {
    return page.evaluate(() => {
        const root = document.querySelector('#social-neo-root.social-neo, #public-social-root .social-neo');
        return {
            dataPanel: root?.getAttribute('data-panel') || '',
            title: document.title,
            url: window.location.href
        };
    });
}

async function clickDesktopPanelTab(page, panel) {
    const shellSelector = `.social-neo-shell-nav-btn[data-action="panel-${panel}"]`;
    const workspaceSelector = `.social-neo-workspace-nav-btn[data-action="panel-${panel}"]`;
    const fallbackSelector = `[data-action="panel-${panel}"]`;

    if (await page.locator(shellSelector).count()) {
        await page.locator(shellSelector).first().evaluate((node) => node.click());
        return 'shell-nav';
    }
    if (await page.locator(workspaceSelector).count()) {
        await page.locator(workspaceSelector).first().evaluate((node) => node.click());
        return 'workspace-nav';
    }
    await page.locator(fallbackSelector).first().evaluate((node) => node.click());
    return 'fallback';
}

async function verifyPanelDom(page, panel) {
    const check = PANEL_CHECKS[panel];
    const hasDom = await page.evaluate((selector) => Boolean(document.querySelector(selector)), check.selector);
    const state = await readPanelState(page);
    const panelMatches = state.dataPanel === panel;

    return {
        pass: hasDom && panelMatches,
        dataPanel: state.dataPanel,
        expectedPanel: panel,
        panelMatches,
        domFound: hasDom,
        checkLabel: check.label,
        checkSelector: check.selector
    };
}

async function openDesktopPanel(page, panel) {
    const navUsed = await clickDesktopPanelTab(page, panel);
    const check = PANEL_CHECKS[panel];

    await waitForPanelSelector(page, check.selector, 15000);

    if (panel === 'messages') {
        const hasThread = await page.evaluate(
            () => Boolean(document.querySelector('.social-neo[data-panel="messages"] .social-neo-messages'))
        );
        if (!hasThread) {
            const chatItem = page.locator('.social-neo[data-panel="messages"] .social-neo-chat-item').first();
            if (await chatItem.count()) {
                await chatItem.evaluate((node) => node.click());
                await waitForPanelSelector(
                    page,
                    '.social-neo[data-panel="messages"] .social-neo-messages',
                    15000
                );
            }
        }
    }

    const result = await verifyPanelDom(page, panel);
    return { ...result, navUsed };
}

async function waitForMobileNav(page) {
    await page.waitForFunction(() => {
        const nav = document.getElementById('mobile-bottom-nav');
        if (!nav || nav.hidden) return false;
        return getComputedStyle(nav).display !== 'none';
    }, { timeout: 15000 });
}

async function openMoreSheet(page) {
    await waitForMobileNav(page);
    await page.locator('#mob-nav-more').evaluate((node) => node.click());
    await page.waitForFunction(() => {
        const sheet = document.getElementById('mobile-action-sheet');
        return Boolean(sheet && !sheet.hidden);
    }, { timeout: 10000 });
}

async function clickMobileTab(page, action) {
    if (action.click === 'more-sheet') {
        await openMoreSheet(page);
        await page.locator(action.selector).first().evaluate((node) => node.click());
        return action.click;
    }

    await waitForMobileNav(page);
    await page.locator(action.selector).first().evaluate((node) => node.click());
    return action.click;
}

async function verifyDesktopPanels(page, errors) {
    const results = {};
    const dataPanelsObserved = [];

    for (const panel of DESKTOP_PANELS) {
        try {
            const outcome = await openDesktopPanel(page, panel);
            results[panel] = outcome;
            if (outcome.dataPanel) dataPanelsObserved.push(outcome.dataPanel);
        } catch (error) {
            const state = await readPanelState(page).catch(() => ({ dataPanel: '' }));
            results[panel] = {
                pass: false,
                dataPanel: state.dataPanel,
                expectedPanel: panel,
                panelMatches: state.dataPanel === panel,
                domFound: false,
                error: error.message
            };
            if (state.dataPanel) dataPanelsObserved.push(state.dataPanel);
            errors.push(`desktop:${panel}: ${error.message}`);
        }
    }

    return { results, dataPanelsObserved };
}

async function verifyMobilePanels(page, errors) {
    const results = {};
    const dataPanelsObserved = [];

    for (const action of MOBILE_TAB_ACTIONS) {
        const { panel } = action;
        try {
            const navUsed = await clickMobileTab(page, action);
            const check = PANEL_CHECKS[panel];
            await waitForPanelSelector(page, check.selector, 15000);

            if (panel === 'messages') {
                const hasThread = await page.evaluate(
                    () => Boolean(document.querySelector('.social-neo[data-panel="messages"] .social-neo-messages'))
                );
                if (!hasThread) {
                    const chatItem = page.locator('.social-neo[data-panel="messages"] .social-neo-chat-item').first();
                    if (await chatItem.count()) {
                        await chatItem.evaluate((node) => node.click());
                        await waitForPanelSelector(
                            page,
                            '.social-neo[data-panel="messages"] .social-neo-messages',
                            15000
                        );
                    }
                }
            }

            const outcome = await verifyPanelDom(page, panel);
            results[panel] = { ...outcome, navUsed };
            if (outcome.dataPanel) dataPanelsObserved.push(outcome.dataPanel);
        } catch (error) {
            const state = await readPanelState(page).catch(() => ({ dataPanel: '' }));
            results[panel] = {
                pass: false,
                dataPanel: state.dataPanel,
                expectedPanel: panel,
                panelMatches: state.dataPanel === panel,
                domFound: false,
                navUsed: action.click,
                error: error.message
            };
            if (state.dataPanel) dataPanelsObserved.push(state.dataPanel);
            errors.push(`mobile:${panel}: ${error.message}`);
        }
    }

    return { results, dataPanelsObserved };
}

async function runVerification() {
    const errors = [];
    const browser = await chromium.launch({ headless: true });

    try {
        const desktopContext = await browser.newContext({
            viewport: { width: 1440, height: 960 },
            colorScheme: 'dark'
        });
        await installSocialRoutes(desktopContext);
        await desktopContext.addInitScript(buildInitScript());

        const desktopPage = await desktopContext.newPage();
        attachErrorCollectors(desktopPage, errors);

        await desktopPage.goto(`${BASE_URL}/social.html`, { waitUntil: 'domcontentloaded' });
        await waitForSocialReady(desktopPage);

        const desktop = await verifyDesktopPanels(desktopPage, errors);
        await desktopContext.close();

        const mobileContext = await browser.newContext({
            viewport: { width: 390, height: 844 },
            colorScheme: 'dark'
        });
        await installSocialRoutes(mobileContext);
        await mobileContext.addInitScript(buildInitScript());

        const mobilePage = await mobileContext.newPage();
        attachErrorCollectors(mobilePage, errors);

        await mobilePage.goto(`${BASE_URL}/social.html`, { waitUntil: 'domcontentloaded' });
        await waitForSocialReady(mobilePage);

        const mobile = await verifyMobilePanels(mobilePage, errors);
        await mobileContext.close();

        const desktopPassCount = Object.values(desktop.results).filter((entry) => entry.pass).length;
        const mobilePassCount = Object.values(mobile.results).filter((entry) => entry.pass).length;
        const desktopTotal = Object.keys(desktop.results).length;
        const mobileTotal = Object.keys(mobile.results).length;

        const report = {
            ok: desktopPassCount === desktopTotal && mobilePassCount === mobileTotal && errors.length === 0,
            baseUrl: `${BASE_URL}/social.html`,
            summary: {
                desktop: { pass: desktopPassCount, total: desktopTotal },
                mobile: { pass: mobilePassCount, total: mobileTotal },
                jsErrors: errors.length
            },
            errors: [...new Set(errors)],
            desktop: desktop.results,
            mobile: mobile.results,
            dataPanelValuesObserved: [...new Set([...desktop.dataPanelsObserved, ...mobile.dataPanelsObserved])]
        };

        return report;
    } finally {
        await browser.close();
    }
}

async function main() {
    const report = await runVerification();
    console.log(JSON.stringify(report, null, 2));
    if (!report.ok) process.exitCode = 1;
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});