import { chromium } from 'playwright';

const BASE_URL = process.env.KIU_BASE_URL || 'http://127.0.0.1:8876';

const LAZY_MODULES = [
    {
        panel: 'community',
        script: 'social-community.js',
        flag: '__KIU_SOCIAL_COMMUNITY_MODULE_LOADED',
        readySelector: '.social-neo[data-panel="community"] .social-neo-community-layout, .social-neo[data-panel="community"] .social-neo-community-card'
    },
    {
        panel: 'alerts',
        script: 'social-alerts.js',
        flag: '__KIU_SOCIAL_ALERTS_MODULE_LOADED',
        readySelector: '.social-neo[data-panel="alerts"] .sn-alerts-panel'
    },
    {
        panel: 'lost-and-found',
        script: 'social-lost-found.js',
        flag: '__KIU_SOCIAL_LOST_FOUND_MODULE_LOADED',
        readySelector: '.social-neo[data-panel="lost-and-found"] .social-neo-lost-found-shell, .social-neo[data-panel="lost-and-found"] .social-neo-lost-found-hero'
    },
    {
        panel: 'messages',
        script: 'social-messages.js',
        flag: '__KIU_SOCIAL_MESSAGES_MODULE_LOADED',
        readySelector: '.social-neo[data-panel="messages"] .social-neo-messages, .social-neo[data-panel="messages"] .social-neo-chat-item'
    },
    {
        panel: 'photography',
        script: 'social-photography.js',
        flag: '__KIU_SOCIAL_PHOTOGRAPHY_MODULE_LOADED',
        readySelector: '.social-neo[data-panel="photography"] .social-photo-discover-strip, .social-neo[data-panel="photography"] .social-photo-feed-card, .social-neo[data-panel="photography"] .social-photo-grid-skeleton'
    },
    {
        panel: 'surveys',
        script: 'social-surveys.js',
        flag: '__KIU_SOCIAL_SURVEYS_MODULE_LOADED',
        readySelector: '.social-neo[data-panel="surveys"] .social-neo-surveys-hero'
    }
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
                'social-student': { defaultAudience: 'campus' }
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
        items: Array.from({ length: 6 }, (_, index) => ({
            id: `post-${index + 1}`,
            authorUserId: index % 2 === 0 ? 'social-student' : 'peer-1',
            body: `Campus update ${index + 1}: lazy module verification seed.`,
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
                online: true,
                bio: 'Campus peer for connection smoke.'
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
            },
            {
                id: 'prof-1',
                name: 'Prof One',
                nameEn: 'Prof One',
                email: 'prof1@kiu.edu.ge',
                role: 'professor',
                faculty: 'ECON',
                facultyCode: 'ECON',
                avatar: '',
                online: true
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
            },
            {
                id: 'notif-2',
                recipientUserId: 'social-student',
                title: 'Grade posted',
                body: 'A new grade is available.',
                isRead: false,
                createdAt: new Date().toISOString(),
                routePage: 'lms',
                routeData: {}
            }
        ],
        stories: []
    };
}

function buildMessengerSnapshot() {
    const now = Date.now();
    const messages = Array.from({ length: 12 }, (_, index) => ({
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

    await context.route('**/api/social/relationships/request', async (route) => {
        const request = route.request();
        let body = {};
        try {
            body = request.postDataJSON() || {};
        } catch (error) {
            body = {};
        }
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                relationship: {
                    id: 'rel-smoke-1',
                    type: 'connection-request',
                    status: 'pending',
                    fromId: 'social-student',
                    toId: body?.targetUserId || 'peer-1',
                    toType: 'profile'
                }
            })
        });
    });

    await context.route(/\/api\/social\/posts\/[^/]+\/reactions(?:\?.*)?$/i, async (route) => {
        if (route.request().method() !== 'POST') {
            await route.continue();
            return;
        }
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                ok: true,
                reaction: { type: 'like', userId: 'social-student' },
                counts: { like: 1, total: 1 }
            })
        });
    });
}

function collectErrorsSince(errors, marker) {
    return errors.slice(marker);
}

async function clickPanel(page, panelId) {
    const action = panelId === 'lost-and-found' ? 'panel-lost-and-found' : `panel-${panelId}`;
    const selectors = [
        `.social-neo-shell-nav-btn[data-action="${action}"]`,
        `.social-neo-workspace-nav-btn[data-action="${action}"]`,
        `.social-neo-mobile-tab[data-action="${action}"]`,
        `[data-action="${action}"]`
    ];
    for (const selector of selectors) {
        const locator = page.locator(selector).first();
        if (await locator.count()) {
            await locator.evaluate((node) => node.click());
            return selector;
        }
    }
    throw new Error(`Panel trigger not found for ${panelId}`);
}

async function waitForPanelReady(page, moduleDef, timeout = 15000) {
    await page.waitForFunction(
        ({ panel, readySelector }) => {
            const root = document.querySelector('.social-neo');
            if (!root || root.getAttribute('data-panel') !== panel) return false;
            return Boolean(document.querySelector(readySelector));
        },
        { panel: moduleDef.panel, readySelector: moduleDef.readySelector },
        { timeout }
    );
}

async function inspectModuleLoad(page, moduleDef, networkLoads) {
    return page.evaluate(({ script, flag }) => {
        const scripts = Array.from(document.querySelectorAll('script[src]'))
            .map((node) => node.getAttribute('src') || '')
            .filter((src) => src.includes(script));
        return {
            scriptInDom: scripts.length > 0,
            scriptSrcs: scripts,
            moduleFlag: Boolean(window[flag])
        };
    }, { script: moduleDef.script, flag: moduleDef.flag }).then((pageState) => ({
        panel: moduleDef.panel,
        script: moduleDef.script,
        networkLoaded: networkLoads.some((url) => url.includes(moduleDef.script)),
        ...pageState,
        loaded: pageState.scriptInDom && pageState.moduleFlag
    }));
}

async function waitForSocialBoot(page) {
    await page.waitForFunction(() => Boolean(window.__KIU_SOCIAL_PAGE_REBUILT), { timeout: 30000 });
    await page.waitForFunction(
        () => !document.body.textContent.includes('Preparing campus social')
            && Boolean(document.querySelector('#public-social-root .social-neo[data-panel]')),
        { timeout: 30000 }
    );
    await page.waitForFunction(
        () => Boolean(document.querySelector('.social-neo[data-panel="feed"] [data-bind="composer-text"]')),
        { timeout: 20000 }
    );
}

async function main() {
    const browser = await chromium.launch({ headless: true });
    const errors = [];
    const networkScriptLoads = [];
    const moduleLoadStatus = [];
    const interactionResults = {
        boot: null,
        composer: null,
        postReact: null,
        connection: null
    };

    const context = await browser.newContext({
        viewport: { width: 1440, height: 960 },
        colorScheme: 'dark'
    });

    await installSocialRoutes(context);
    await context.addInitScript(buildInitScript());

    const page = await context.newPage();

    page.on('pageerror', (error) => {
        errors.push(`pageerror: ${error.message}`);
    });
    page.on('console', (message) => {
        if (message.type() === 'error') {
            errors.push(`console: ${message.text()}`);
        }
    });
    page.on('response', (response) => {
        const url = response.url();
        if (url.includes('/assets/js/pages/social-') && url.endsWith('.js') || /social-(community|alerts|lost-found|messages|photography|surveys)\.js/.test(url)) {
            networkScriptLoads.push(url);
        }
    });

    try {
        await page.goto(`${BASE_URL}/social.html`, { waitUntil: 'domcontentloaded', timeout: 30000 });
        const bootErrorMarker = errors.length;
        await waitForSocialBoot(page);

        interactionResults.boot = {
            ok: true,
            preparingCampusSocialVisible: await page.evaluate(
                () => document.body.textContent.includes('Preparing campus social')
            ),
            activePanel: await page.evaluate(
                () => document.querySelector('.social-neo')?.getAttribute('data-panel') || ''
            ),
            errors: collectErrorsSince(errors, bootErrorMarker)
        };

        for (const moduleDef of LAZY_MODULES) {
            const panelErrorMarker = errors.length;
            let navigatedVia = '';
            let panelReady = false;
            let panelError = null;

            try {
                navigatedVia = await clickPanel(page, moduleDef.panel);
                await waitForPanelReady(page, moduleDef);
                panelReady = true;
                await page.waitForTimeout(400);
            } catch (error) {
                panelError = error?.message || String(error);
            }

            const status = await inspectModuleLoad(page, moduleDef, networkScriptLoads);
            moduleLoadStatus.push({
                ...status,
                panelReady,
                navigatedVia,
                panelError,
                errors: collectErrorsSince(errors, panelErrorMarker)
            });
        }

        const feedErrorMarker = errors.length;
        await clickPanel(page, 'feed');
        await page.waitForFunction(
            () => document.querySelector('.social-neo')?.getAttribute('data-panel') === 'feed',
            { timeout: 10000 }
        );

        const composer = page.locator('[data-bind="composer-text"]').first();
        await composer.focus();
        const testText = 'lazy-module verify composer text';
        await composer.fill(testText);

        const composerValue = await composer.inputValue();
        interactionResults.composer = {
            ok: composerValue === testText,
            value: composerValue,
            focused: await page.evaluate(
                () => document.activeElement?.matches('[data-bind="composer-text"]') === true
            ),
            errors: collectErrorsSince(errors, feedErrorMarker)
        };

        const reactErrorMarker = errors.length;
        const reactButtons = page.locator('.social-neo[data-panel="feed"] [data-action="post-react"]');
        const reactCount = await reactButtons.count();
        if (reactCount > 0) {
            await reactButtons.first().click();
            await page.waitForTimeout(600);
            interactionResults.postReact = {
                attempted: true,
                ok: collectErrorsSince(errors, reactErrorMarker).length === 0,
                buttonCount: reactCount,
                errors: collectErrorsSince(errors, reactErrorMarker)
            };
        } else {
            interactionResults.postReact = {
                attempted: false,
                ok: true,
                buttonCount: 0,
                skipped: 'No post cards with post-react buttons on feed panel.',
                errors: []
            };
        }

        const connectionErrorMarker = errors.length;
        await clickPanel(page, 'community');
        await waitForPanelReady(page, LAZY_MODULES[0]);
        const connectionButton = page.locator(
            '.social-neo[data-panel="community"] [data-action^="connection-"]'
        ).first();
        const connectionCount = await page.locator(
            '.social-neo[data-panel="community"] [data-action^="connection-"]'
        ).count();

        if (connectionCount > 0) {
            const action = await connectionButton.getAttribute('data-action');
            await connectionButton.click();
            await page.waitForTimeout(600);
            interactionResults.connection = {
                attempted: true,
                ok: collectErrorsSince(errors, connectionErrorMarker).length === 0,
                buttonCount: connectionCount,
                action,
                errors: collectErrorsSince(errors, connectionErrorMarker)
            };
        } else {
            interactionResults.connection = {
                attempted: false,
                ok: true,
                buttonCount: 0,
                skipped: 'No connection buttons in community panel.',
                errors: []
            };
        }

        const report = {
            baseUrl: BASE_URL,
            moduleLoadStatus,
            interactionResults,
            errors,
            summary: {
                modulesLoaded: moduleLoadStatus.filter((item) => item.loaded).length,
                modulesTotal: moduleLoadStatus.length,
                panelsReady: moduleLoadStatus.filter((item) => item.panelReady).length,
                bootOk: interactionResults.boot?.ok === true && interactionResults.boot?.preparingCampusSocialVisible === false,
                composerOk: interactionResults.composer?.ok === true,
                postReactOk: interactionResults.postReact?.ok === true,
                connectionOk: interactionResults.connection?.ok === true,
                errorCount: errors.length
            }
        };

        console.log(JSON.stringify(report, null, 2));

        const failed = !report.summary.bootOk
            || report.summary.modulesLoaded !== report.summary.modulesTotal
            || !report.summary.composerOk
            || !report.summary.postReactOk
            || !report.summary.connectionOk
            || errors.length > 0;

        if (failed) {
            process.exitCode = 1;
        }
    } finally {
        await context.close();
        await browser.close();
    }
}

main().catch((error) => {
    console.error(JSON.stringify({
        fatal: true,
        message: error?.message || String(error),
        stack: error?.stack || ''
    }, null, 2));
    process.exitCode = 1;
});