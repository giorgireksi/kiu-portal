import { chromium } from 'playwright';

const BASE_URL = process.env.KIU_BASE_URL || 'http://127.0.0.1:8876';
const VIEWPORT = { width: 1440, height: 960 };

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
            portfolios: [],
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
            surveys: [],
            surveyResponses: [],
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
            body: `Campus update ${index + 1}: dialog verification seed.`,
            createdAt: new Date(now - index * 60000).toISOString(),
            updatedAt: new Date(now - index * 60000).toISOString(),
            comments: []
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
            }
        ]
    };
}

function buildNotifications() {
    return { items: [], stories: [] };
}

function buildMessengerSnapshot() {
    return { chats: [], calls: [], accounts: [] };
}

function buildPortfolioMe() {
    return {
        userId: AUTH_STATE.id,
        status: 'draft',
        visibilityMode: 'staff_only',
        basics: {
            name: AUTH_STATE.name,
            email: AUTH_STATE.email,
            headline: '',
            summary: '',
            links: []
        },
        sectionOrder: ['education', 'experience', 'projects', 'skills'],
        sections: {
            education: { builtinKey: 'education', label: 'Education', repeatable: true, visible: true, fieldDefinitions: [], entries: [] },
            experience: { builtinKey: 'experience', label: 'Experience', repeatable: true, visible: true, fieldDefinitions: [], entries: [] },
            projects: { builtinKey: 'projects', label: 'Projects', repeatable: true, visible: true, fieldDefinitions: [], entries: [] },
            skills: {
                builtinKey: 'skills',
                label: 'Skills',
                repeatable: false,
                visible: true,
                fieldDefinitions: [],
                entries: [{ id: 'skills-default', order: 0, fields: { tags: { type: 'text', value: '' } } }]
            }
        }
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

    await context.route('**/api/social/portfolio/me**', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ ok: true, portfolio: buildPortfolioMe() })
        });
    });

    await context.route('**/api/social/portfolio/discover**', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ ok: true, portfolios: [] })
        });
    });
}

const DIALOG_CASES = [
    {
        id: 'survey-create',
        action: 'survey-create-open',
        panel: 'surveys',
        card: '.lux-glass-dialog-card--survey-create',
        ready: () => Boolean(document.querySelector('[data-action="survey-create-open"]'))
    },
    {
        id: 'event-create',
        action: 'event-create-open',
        panel: 'events',
        card: '.lux-glass-dialog-card--event-create',
        ready: () => Boolean(document.querySelector('[data-action="event-create-open"]'))
    },
    {
        id: 'page-create',
        action: 'page-create-open',
        panel: 'pages',
        card: '.lux-glass-dialog-card--page-create',
        ready: () => Boolean(document.querySelector('[data-action="page-create-open"]'))
    },
    {
        id: 'portfolio-editor',
        action: 'portfolio-create-open',
        panel: 'projects',
        card: '.lux-glass-dialog-card--portfolio-editor',
        ready: () => Boolean(document.querySelector('[data-action="portfolio-create-open"]'))
    },
    {
        id: 'lost-found-create',
        action: 'lost-found-create-open',
        panel: 'lost-and-found',
        card: '.lux-glass-dialog-card--lost-found-create',
        ready: () => Boolean(document.querySelector('[data-action="lost-found-create-open"]'))
    }
];

async function waitForSocialReady(page) {
    await page.waitForFunction(
        () => Boolean(document.querySelector('#public-social-root .social-neo[data-panel="feed"] .social-neo-post-card')),
        { timeout: 20000 }
    );
}

async function clickPanel(page, panel) {
    const selector = `.social-neo-shell-nav-btn[data-action="panel-${panel}"]`;
    await page.locator(selector).first().waitFor({ state: 'visible', timeout: 15000 });
    await page.locator(selector).first().evaluate((node) => node.click());
}

async function waitForPanelReady(page, condition, timeout = 15000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
        const ready = await page.evaluate(condition).catch(() => false);
        if (ready) return;
        await page.waitForTimeout(120);
    }
    throw new Error(`Timed out after ${timeout}ms waiting for panel readiness.`);
}

async function waitForDialogCard(page, cardSelector, timeout = 10000) {
    await page.waitForFunction(
        (selector) => Boolean(document.querySelector(`#social-neo-overlay-portal ${selector}, .lux-glass-dialog-backdrop ${selector}`)),
        cardSelector,
        { timeout }
    );
}

async function dialogCardVisible(page, cardSelector) {
    return page.evaluate((selector) => {
        const node = document.querySelector(`#social-neo-overlay-portal ${selector}`)
            || document.querySelector(`.lux-glass-dialog-backdrop ${selector}`);
        if (!node) return false;
        const backdrop = node.closest('.lux-glass-dialog-backdrop');
        const style = backdrop ? getComputedStyle(backdrop) : getComputedStyle(node);
        return style.display !== 'none' && style.visibility !== 'hidden';
    }, cardSelector);
}

async function closeDialog(page, cardSelector) {
    const closeButton = page.locator(`${cardSelector} .lux-glass-dialog-close-btn[data-action="dialog-close"], ${cardSelector} [data-action="dialog-close"].lux-glass-dialog-cancel-btn`).first();
    await closeButton.waitFor({ state: 'visible', timeout: 5000 });
    await closeButton.evaluate((node) => node.click());
    await page.waitForFunction(
        (selector) => {
            const node = document.querySelector(`#social-neo-overlay-portal ${selector}`)
                || document.querySelector(`.lux-glass-dialog-backdrop ${selector}`);
            return !node;
        },
        cardSelector,
        { timeout: 10000 }
    );
}

async function verifySurveyCreateExtras(page, cardSelector) {
    return page.evaluate((selector) => {
        const dialog = document.querySelector(`#social-neo-overlay-portal ${selector}`)
            || document.querySelector(selector);
        if (!dialog) {
            return { pass: false, error: 'Survey create dialog not found for extras check.' };
        }
        const hasRail = Boolean(dialog.querySelector('.social-neo-survey-question-rail'));
        const hasPrevNext = Boolean(
            dialog.querySelector('[data-action="survey-question-prev"], [data-action="survey-question-next"]')
        );
        if (!hasRail && !hasPrevNext) {
            return { pass: false, error: 'Missing question rail and prev/next controls.' };
        }
        return {
            pass: true,
            hasQuestionRail: hasRail,
            hasPrevNextButtons: hasPrevNext
        };
    }, cardSelector);
}

async function verifyEventCreateExtras(page, cardSelector) {
    await page.waitForFunction(
        (selector) => {
            const scopeSelect = document.querySelector(`${selector} select[name="eventScope"]`);
            if (!scopeSelect) return false;
            const field = scopeSelect.closest('.lux-picker-field');
            return scopeSelect.getAttribute('data-lux-picker-enhanced') === 'true'
                && Boolean(field?.querySelector('.lux-picker-btn'));
        },
        cardSelector,
        { timeout: 8000 }
    ).catch(() => null);

    return page.evaluate((selector) => {
        const dialog = document.querySelector(`#social-neo-overlay-portal ${selector}`)
            || document.querySelector(selector);
        if (!dialog) {
            return { pass: false, error: 'Event create dialog not found for extras check.' };
        }
        const scopeSelect = dialog.querySelector('select[name="eventScope"]');
        if (!scopeSelect) {
            return { pass: false, error: 'select[name="eventScope"] not found.' };
        }
        const field = scopeSelect.closest('.lux-picker-field');
        const enhanced = scopeSelect.getAttribute('data-lux-picker-enhanced') === 'true';
        const hasLuxPickerBtn = Boolean(field?.querySelector('.lux-picker-btn'));
        if (!enhanced || !hasLuxPickerBtn) {
            return {
                pass: false,
                error: 'eventScope select is not enhanced with .lux-picker-btn.',
                enhanced,
                hasLuxPickerBtn
            };
        }
        return { pass: true, enhanced, hasLuxPickerBtn };
    }, cardSelector);
}

async function verifyPortfolioPanelTabs(page) {
    const result = {
        id: 'portfolio-panel-tabs',
        pass: false,
        checks: {},
        error: null
    };

    try {
        await clickPanel(page, 'projects');
        await waitForPanelReady(page, () => Boolean(document.querySelector('.portfolio-panel-tab[data-portfolio-tab="mine"]')), 15000);

        const mineTab = page.locator('.portfolio-panel-tab[data-portfolio-tab="mine"]').first();
        await mineTab.evaluate((node) => node.click());
        await page.waitForFunction(() => {
            const minePressed = document.querySelector('.portfolio-panel-tab[data-portfolio-tab="mine"]')?.getAttribute('aria-pressed') === 'true';
            const minePanel = Boolean(document.querySelector('.portfolio-editor-stack'));
            return minePressed && minePanel;
        }, { timeout: 15000 });

        result.checks.mineTabActive = await page.evaluate(() => (
            document.querySelector('.portfolio-panel-tab[data-portfolio-tab="mine"]')?.getAttribute('aria-pressed') === 'true'
        ));
        result.checks.minePanelVisible = await page.evaluate(() => Boolean(document.querySelector('.portfolio-editor-stack')));

        const discoverTab = page.locator('.portfolio-panel-tab[data-portfolio-tab="discover"]').first();
        await discoverTab.evaluate((node) => node.click());
        await page.waitForFunction(() => {
            const discoverPressed = document.querySelector('.portfolio-panel-tab[data-portfolio-tab="discover"]')?.getAttribute('aria-pressed') === 'true';
            const discoverPanel = Boolean(document.querySelector('.social-portfolio-search-row'));
            const mineHidden = !document.querySelector('.portfolio-editor-stack');
            return discoverPressed && discoverPanel && mineHidden;
        }, { timeout: 15000 });

        result.checks.discoverTabActive = await page.evaluate(() => (
            document.querySelector('.portfolio-panel-tab[data-portfolio-tab="discover"]')?.getAttribute('aria-pressed') === 'true'
        ));
        result.checks.discoverPanelVisible = await page.evaluate(() => Boolean(document.querySelector('.social-portfolio-search-row')));
        result.checks.minePanelHidden = await page.evaluate(() => !document.querySelector('.portfolio-editor-stack'));

        result.pass = Object.values(result.checks).every(Boolean);
        if (!result.pass) {
            result.error = 'Portfolio panel tab switching did not update visible content as expected.';
        }
    } catch (error) {
        result.error = error.message;
    }

    return result;
}

async function verifyDialog(page, dialogCase) {
    const result = {
        id: dialogCase.id,
        action: dialogCase.action,
        pass: false,
        open: false,
        close: false,
        extras: null,
        error: null
    };

    try {
        await clickPanel(page, dialogCase.panel);
        await waitForPanelReady(page, dialogCase.ready, 15000);

        const trigger = page.locator(`[data-action="${dialogCase.action}"]`).first();
        await trigger.waitFor({ state: 'visible', timeout: 10000 });
        await trigger.evaluate((node) => node.click());

        await waitForDialogCard(page, dialogCase.card, 12000);
        result.open = await dialogCardVisible(page, dialogCase.card);
        if (!result.open) {
            throw new Error(`Dialog card ${dialogCase.card} did not become visible.`);
        }

        if (dialogCase.id === 'survey-create') {
            result.extras = await verifySurveyCreateExtras(page, dialogCase.card);
            if (!result.extras.pass) {
                throw new Error(result.extras.error || 'Survey create extras failed.');
            }
        }

        if (dialogCase.id === 'event-create') {
            result.extras = await verifyEventCreateExtras(page, dialogCase.card);
            if (!result.extras.pass) {
                throw new Error(result.extras.error || 'Event create extras failed.');
            }
        }

        await closeDialog(page, dialogCase.card);
        result.close = !(await dialogCardVisible(page, dialogCase.card));
        if (!result.close) {
            throw new Error('dialog-close did not remove the dialog card.');
        }

        result.pass = true;
    } catch (error) {
        result.error = error.message;
    }

    return result;
}

async function main() {
    const browser = await chromium.launch({ headless: true });
    const errors = [];
    const dialogResults = [];
    let portfolioPanelTabs = null;

    try {
        const context = await browser.newContext({ viewport: VIEWPORT, colorScheme: 'dark' });
        await installSocialRoutes(context);
        await context.addInitScript(buildInitScript());

        const page = await context.newPage();
        page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
        page.on('console', (message) => {
            if (message.type() === 'error') errors.push(`console: ${message.text()}`);
        });

        await page.goto(`${BASE_URL}/social.html`, { waitUntil: 'domcontentloaded' });
        await waitForSocialReady(page);

        for (const dialogCase of DIALOG_CASES) {
            dialogResults.push(await verifyDialog(page, dialogCase));
        }

        portfolioPanelTabs = await verifyPortfolioPanelTabs(page);
        await context.close();
    } finally {
        await browser.close();
    }

    const summary = {
        url: `${BASE_URL}/social.html`,
        viewport: `${VIEWPORT.width}x${VIEWPORT.height}`,
        dialogs: dialogResults,
        portfolioPanelTabs,
        errors,
        pass: dialogResults.every((entry) => entry.pass)
            && Boolean(portfolioPanelTabs?.pass)
            && errors.length === 0
    };

    console.log(JSON.stringify(summary, null, 2));
    process.exitCode = summary.pass ? 0 : 1;
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});