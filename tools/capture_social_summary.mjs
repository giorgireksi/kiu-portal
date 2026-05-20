import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const BASE_URL = process.env.KIU_BASE_URL || 'http://127.0.0.1:8876';
const OUTPUT_DIR = resolve(process.cwd(), process.env.KIU_OUTPUT_DIR || 'artifacts');

const RUNS = [
    {
        mode: 'efficient-desktop',
        viewport: { width: 1440, height: 960 },
        reducedMotion: 'reduce',
        cpuThrottleRate: 4,
        emulateLowSpec: true,
        output: 'social-efficient-desktop-summary.json'
    },
    {
        mode: 'mobile',
        viewport: { width: 390, height: 844 },
        reducedMotion: 'no-preference',
        cpuThrottleRate: 1,
        emulateLowSpec: false,
        output: 'social-mobile-summary.json'
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
            }
        ],
        stories: []
    };
}

function buildMessengerSnapshot() {
    const now = Date.now();
    const messages = Array.from({ length: 80 }, (_, index) => ({
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
    return ({ lowSpec }) => {
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

        window.__kiuSocialPerfProbe = {
            longTasks: [],
            longTaskTotalMs: 0
        };

        try {
            const observer = new PerformanceObserver((list) => {
                const target = window.__kiuSocialPerfProbe;
                if (!target) return;
                for (const entry of list.getEntries()) {
                    const duration = Number(entry.duration || 0);
                    target.longTasks.push({
                        name: entry.name || 'longtask',
                        duration
                    });
                    target.longTaskTotalMs += duration;
                }
            });
            observer.observe({ type: 'longtask', buffered: true });
        } catch (_) {
            // Best-effort only.
        }
    };
}

async function installSocialRoutes(context) {
    await context.route(/\/api\/portal\/session(?:\?.*)?$/i, async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                session: {
                    token: 'social-session-token'
                },
                account: {
                    ...AUTH_STATE
                }
            })
        });
    });

    await context.route('**/api/bootstrap**', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                ok: true,
                state: {}
            })
        });
    });

    await context.route('**/api/platform/config**', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                config: {}
            })
        });
    });

    await context.route('**/api/portal/state', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                ok: true
            })
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
}

async function waitForSocialReady(page) {
    await page.waitForFunction(
        () => Boolean(document.querySelector('#public-social-root .social-neo[data-panel="feed"] .social-neo-post-card')),
        { timeout: 20000 }
    );
}

async function measureInteraction(action, ready) {
    const start = Date.now();
    await action();
    await ready();
    return Date.now() - start;
}

async function waitForMobileSocialNav(page) {
    await page.waitForFunction(() => {
        const nav = document.querySelector('.social-neo-mobile-tabbar');
        if (!nav) return false;
        return getComputedStyle(nav).display !== 'none'
            && Boolean(nav.querySelector('[data-action="panel-community"]'));
    }, { timeout: 15000 });
}

async function clickMobilePanelTab(page, panel) {
    await waitForMobileSocialNav(page);
    await page.locator(`.social-neo-mobile-tabbar [data-action="panel-${panel}"]`).first().evaluate((node) => node.click());
}

async function clickDesktopPanelTab(page, panel) {
    const selector = `.social-neo-shell-nav-btn[data-action="panel-${panel}"]`;
    if (await page.locator(selector).count()) {
        await page.locator(selector).first().evaluate((node) => node.click());
        return;
    }
    await page.locator(`[data-action="panel-${panel}"]`).first().evaluate((node) => node.click());
}

async function waitForPanelCondition(page, condition, timeout = 15000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
        const ready = await page.evaluate(condition).catch(() => false);
        if (ready) return;
        await page.waitForTimeout(160);
    }
    throw new Error(`Timed out after ${timeout}ms waiting for panel condition.`);
}

async function openMessagesPanel(page, mobile = false) {
    if (mobile) {
        await clickMobilePanelTab(page, 'messages');
    } else {
        await clickDesktopPanelTab(page, 'messages');
    }
    await waitForPanelCondition(
        page,
        () => Boolean(
            document.querySelector('.social-neo[data-panel="messages"] .social-neo-thread-messages')
            || document.querySelector('.social-neo[data-panel="messages"] .social-neo-chat-item')
        ),
        15000
    );
    const hasVisibleThread = await page.evaluate(
        () => Boolean(document.querySelector('.social-neo[data-panel="messages"] .social-neo-thread-messages'))
    );
    if (!hasVisibleThread) {
        await page.locator('.social-neo[data-panel="messages"] .social-neo-chat-item').first().evaluate((node) => node.click());
        await waitForPanelCondition(
            page,
            () => Boolean(document.querySelector('.social-neo[data-panel="messages"] .social-neo-thread-messages')),
            15000
        );
    }
}

async function openCommunityPanel(page, mobile = false) {
    if (mobile) {
        await clickMobilePanelTab(page, 'community');
    } else {
        await clickDesktopPanelTab(page, 'community');
    }
    await waitForPanelCondition(
        page,
        () => Boolean(document.querySelector('.social-neo-community-layout')),
        15000
    );
}

async function openFeedPanel(page, mobile = false) {
    if (mobile) {
        await clickMobilePanelTab(page, 'feed');
    } else {
        await clickDesktopPanelTab(page, 'feed');
    }
    await waitForPanelCondition(
        page,
        () => Boolean(document.querySelector('.social-neo[data-panel="feed"] [data-bind="composer-text"]')),
        15000
    );
}

async function captureRun(browser, run) {
    const context = await browser.newContext({
        viewport: run.viewport,
        colorScheme: 'dark'
    });
    await installSocialRoutes(context);
    await context.addInitScript(buildInitScript(), { lowSpec: run.emulateLowSpec });

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
    await page.goto(`${BASE_URL}/social.html`, { waitUntil: 'domcontentloaded' });
    await waitForSocialReady(page);
    const firstReadyMs = Date.now() - start;

    const communityOpenMs = await measureInteraction(
        () => openCommunityPanel(page, run.mode === 'mobile'),
        async () => {}
    );

    const communityPhase = await page.evaluate(() => ({
        directoryCardCount: document.querySelectorAll('.social-neo-directory-item').length,
        communityPanelVisible: Boolean(document.querySelector('.social-neo[data-panel="community"] .social-neo-community-layout'))
    }));

    const inboxOpenMs = await measureInteraction(
        () => openMessagesPanel(page, run.mode === 'mobile'),
        async () => {}
    );

    const messagesPhase = await page.evaluate(() => ({
        chatCount: document.querySelectorAll('.social-neo-chat-item').length,
        messageCount: document.querySelectorAll('.social-neo-message').length,
        threadVisible: Boolean(document.querySelector('.social-neo-thread-messages'))
    }));

    const threadScrollMs = await measureInteraction(
        async () => {
            await page.evaluate(() => {
                const thread = document.querySelector('.social-neo-thread-messages');
                if (thread) thread.scrollTop = thread.scrollHeight;
            });
        },
        async () => {
            await page.waitForFunction(() => {
                const thread = document.querySelector('.social-neo-thread-messages');
                return Boolean(thread && thread.scrollTop > 0);
            });
        }
    );

    const threadScrollTopAfter = await page.evaluate(() => Math.round(document.querySelector('.social-neo-thread-messages')?.scrollTop || 0));

    const composerOpenMs = await measureInteraction(
        async () => {
            await openFeedPanel(page, run.mode === 'mobile');
            await page.locator('[data-bind="composer-text"]').evaluate((node) => node.focus());
        },
        async () => {
            await page.waitForFunction(() => {
                const composer = document.querySelector('[data-bind="composer-text"]');
                return Boolean(composer && document.activeElement === composer);
            });
        }
    );

    const metrics = await page.evaluate(() => {
        const probe = window.__kiuSocialPerfProbe || { longTasks: [], longTaskTotalMs: 0 };
        const mobileNav = document.getElementById('mobile-bottom-nav');
        return {
            title: document.title,
            url: window.location.href,
            bodyClass: document.body.className,
            performanceTier: document.body.dataset.luxPerformance || '',
            panel: document.querySelector('.social-neo')?.getAttribute('data-panel') || '',
            postCount: document.querySelectorAll('.social-neo-post-card').length,
            chatCount: document.querySelectorAll('.social-neo-chat-item').length,
            messageCount: document.querySelectorAll('.social-neo-message').length,
            composerVisible: Boolean(document.querySelector('[data-bind="composer-text"]')),
            threadScrollTop: Math.round(document.querySelector('.social-neo-thread-messages')?.scrollTop || 0),
            mobileNavVisible: mobileNav ? getComputedStyle(mobileNav).display !== 'none' : false,
            longTaskCount: Array.isArray(probe.longTasks) ? probe.longTasks.length : 0,
            longTaskTotalMs: Number(probe.longTaskTotalMs || 0)
        };
    });

    await context.close();

    return {
        mode: run.mode,
        viewport: `${run.viewport.width}x${run.viewport.height}`,
        cpuThrottleRate: run.cpuThrottleRate,
        reducedMotion: run.reducedMotion,
        firstReadyMs,
        communityOpenMs,
        inboxOpenMs,
        composerOpenMs,
        threadScrollMs,
        threadScrollTopAfter,
        errors,
        ...communityPhase,
        ...messagesPhase,
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
