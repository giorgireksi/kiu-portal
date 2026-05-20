const fs = require('fs');
const path = require('path');
const {
    routeVisualClassification,
    allowedLuxuryShellInlineStylePages,
    routeCssSharedSelectorZeroBudgetFiles,
    getDedicatedRouteCss,
    getSharedRouteCssOverrideFindings
} = require('./visual-route-classification');

const ROOT = path.resolve(__dirname, '..');

const lineCountThresholds = [
    {
        file: 'backend/platform/store.js',
        maxLines: 5000,
        reason: 'Post-split ceiling now that bounded backend domain ownership has moved out of store.js.'
    },
    {
        file: 'backend/platform/server.js',
        maxLines: 3000,
        reason: 'Post-route-split ceiling now that server.js is acting as a composition root.'
    },
    {
        file: 'assets/js/pages/lms.js',
        maxLines: 3000,
        reason: 'Post-split ceiling now that LMS route ownership is distributed across focused runtime modules.'
    },
    {
        file: 'assets/js/features/index-luxury.js',
        maxLines: 2600,
        reason: 'Post-split ceiling now that shell chrome and home dashboard ownership live in dedicated luxury modules.'
    },
    {
        file: 'assets/js/pages/registration.js',
        maxLines: 2400,
        reason: 'Post-split ceiling now that registration shell and student-route ownership are separated.'
    },
    {
        file: 'assets/js/shared/faculty.js',
        maxLines: 2700,
        reason: 'Post-split ceiling now that faculty scheduling, people, and messenger-adjacent ownership are materially reduced.'
    },
    {
        file: 'assets/js/shared/messenger.js',
        maxLines: 2400,
        reason: 'Post-split ceiling now that orders/admin recipient ownership is removed from the shared messenger runtime.'
    }
];

const extractedRouteOwners = [
    {
        module: 'backend/platform/routes/files-routes.js',
        routes: [
            "app.post('/api/files/upload'",
            "app.get('/api/files/:id'"
        ]
    },
    {
        module: 'backend/platform/routes/auth-routes.js',
        routes: [
            "app.get('/api/portal/session'",
            "app.post('/api/portal/session/login'",
            "app.post('/api/portal/session/logout'",
            "app.delete('/api/session/impersonate-role'"
        ]
    },
    {
        module: 'backend/platform/routes/platform-ops-routes.js',
        routes: [
            "app.get('/api/platform/config'",
            "app.get('/api/platform/status'",
            "app.get('/api/platform/readiness'",
            "app.get('/api/platform/downloads'"
        ]
    },
    {
        module: 'backend/platform/routes/admin-integrations-routes.js',
        routes: [
            "app.get('/api/admin/accounts'",
            "app.post('/api/admin/accounts'",
            "app.post('/api/admin/accounts/:id/privileges'",
            "app.post('/api/admin/reset-platform-state'",
            "app.get('/api/admin/people'",
            "app.post('/api/admin/people'",
            "app.get('/api/integrations/systems'",
            "app.post('/api/integrations/systems'",
            "app.get('/api/integrations/sync-runs'",
            "app.post('/api/integrations/sync-runs'",
            "app.get('/api/integrations/conflicts'",
            "app.post('/api/integrations/conflicts'"
        ]
    },
    {
        module: 'backend/platform/routes/admin-support-routes.js',
        routes: [
            "app.get('/api/audit/events'",
            "app.post('/api/audit/events'",
            "app.post('/api/admin/holds'",
            "app.post('/api/admin/sections'",
            "app.post('/api/admin/import-jobs'",
            "app.get('/api/admin/import-jobs/:id'"
        ]
    },
    {
        module: 'backend/platform/routes/student-service-routes.js',
        routes: [
            "app.get('/api/student-service/bootstrap'",
            "app.post('/api/student-service/tickets'",
            "app.post('/api/student-service/tickets/:id/replies'",
            "app.post('/api/student-service/tickets/:id/status'",
            "app.post('/api/student-service/tickets/:id/assign'",
            "app.post('/api/student-service/tickets/:id/internal-notes'",
            "app.post('/api/student-service/tickets/:id/handoff'",
            "app.post('/api/student-service/articles'",
            "app.post('/api/student-service/questions'",
            "app.post('/api/student-service/questions/:id/answers'",
            "app.post('/api/student-service/questions/:id/feedback'",
            "app.post('/api/student-service/questions/:id/accept-answer'",
            "app.post('/api/student-service/questions/:id/publish'",
            "app.post('/api/student-service/questions/:id/flags'",
            "app.post('/api/student-service/questions/:id/convert-to-ticket'",
            "app.post('/api/student-service/questions/:id/convert-to-article'",
            "app.post('/api/student-service/questions/:id/merge'"
        ]
    },
    {
        module: 'backend/platform/routes/gradebook-routes.js',
        routes: [
            "app.get('/api/gradebook/courses/:id'",
            "app.post('/api/gradebook/scores'",
            "app.post('/api/gradebook/publish'",
            "app.post('/api/gradebook/finalize'"
        ]
    },
    {
        module: 'backend/platform/routes/protected-exam-routes.js',
        routes: [
            "app.post('/api/exam-portal/auth'",
            "app.get('/api/exam-portal/sessions'",
            "app.get('/api/exam-portal/session/:sessionId'",
            "app.post('/api/exam-portal/sessions/:sessionId/launch-ticket'",
            "app.post('/api/protected-quizzes/sync'",
            "app.post('/api/protected-quizzes/:quizId/launch-ticket'",
            "app.post('/api/protected-client/redeem-launch'",
            "app.get('/api/protected-quizzes/group/:groupKey/monitor'",
            "app.get('/api/protected-quizzes/:quizId/attempts'",
            "app.get('/api/protected-quizzes/:quizId/attempt'",
            "app.post('/api/protected-quizzes/:quizId/heartbeat'",
            "app.post('/api/protected-quizzes/:quizId/events'",
            "app.post('/api/protected-quizzes/:quizId/submit'",
            "app.post('/api/protected-quizzes/:quizId/students/:studentId/block'",
            "app.post('/api/protected-quizzes/:quizId/students/:studentId/unblock'",
            "app.post('/api/protected-quizzes/:quizId/students/:studentId/force-submit'",
            "app.post('/api/protected-quizzes/:quizId/students/:studentId/reset-warnings'",
            "app.post('/api/protected-quizzes/:quizId/students/:studentId/approve-reconnect'",
            "app.post('/api/protected-quizzes/:quizId/students/:studentId/override-status'",
            "app.post('/api/protected-quizzes/:quizId/manual-grade'"
        ]
    },
    {
        module: 'backend/platform/routes/messenger-calls-routes.js',
        routes: [
            "app.get('/api/messenger/snapshot'",
            "app.post('/api/messenger/direct'",
            "app.post('/api/messenger/message'",
            "app.delete('/api/messenger/chats/:chatId/messages/:messageId'",
            "app.post('/api/messenger/chats/:chatId/hide'",
            "app.post('/api/calls/start'",
            "app.post('/api/calls/accept'",
            "app.post('/api/calls/decline'",
            "app.post('/api/calls/end'",
            "app.post('/api/calls/join'",
            "app.post('/api/calls/leave'",
            "app.post('/api/calls/signal'"
        ]
    },
    {
        module: 'backend/platform/routes/social-routes.js',
        routes: [
            "app.get('/api/social/bootstrap'",
            "app.post('/api/social/state'",
            "app.post('/api/social/group-chat'",
            "app.get('/api/social/feed'",
            "app.post('/api/social/posts/resolve'",
            "app.get('/api/social/events'",
            "app.post('/api/social/pages'",
            "app.post('/api/social/groups'",
            "app.post('/api/social/projects'",
            "app.post('/api/social/relationships/request'",
            "app.post('/api/social/follows/toggle'",
            "app.post('/api/social/posts'",
            "app.post('/api/social/reports'",
            "app.post('/api/social/profiles/:id'",
            "app.post('/api/social/events/:id/rsvp'"
        ]
    },
    {
        module: 'backend/platform/routes/lms-live-quiz-routes.js',
        routes: [
            "app.get('/api/lms/live-quizzes/:resourceKey'",
            "app.post('/api/lms/live-quizzes/:resourceKey'"
        ]
    },
    {
        module: 'backend/platform/routes/academic-routes.js',
        routes: [
            "app.get('/api/catalog/courses'",
            "app.get('/api/catalog/sections'",
            "app.get('/api/students/:id/eligibility'",
            "app.get('/api/students/:id/enrollments'",
            "app.post('/api/registration/enroll'",
            "app.post('/api/registration/drop'",
            "app.get('/api/lms/courses/:id'",
            "app.post('/api/lms/assignments'",
            "app.post('/api/lms/materials'",
            "app.post('/api/exam-sessions/sync'"
        ]
    },
    {
        module: 'backend/platform/routes/news-routes.js',
        routes: [
            "app.get('/api/news/feed'",
            "app.get('/api/news/privileges'",
            "app.post('/api/news/posts'",
            "app.patch('/api/news/posts/:id'",
            "app.post('/api/news/posts/:id/replies'"
        ]
    },
    {
        module: 'backend/platform/routes/microsoft-auth-routes.js',
        routes: [
            "app.get('/api/portal/microsoft/config'",
            "app.get('/api/portal/microsoft/start'",
            "app.post('/api/portal/microsoft/complete'",
            "app.get('/api/portal/microsoft/callback'"
        ]
    },
    {
        module: 'backend/platform/routes/mail-routes.js',
        routes: [
            "app.get('/api/mail/bootstrap'",
            "app.get('/api/mail/connect/start'",
            "app.get('/api/mail/connect/callback'",
            "app.delete('/api/mail/connection'",
            "app.post('/api/mail/sync'",
            "app.get('/api/mail/messages'",
            "app.get('/api/mail/messages/:id'",
            "app.get('/api/mail/messages/:id/attachments/:attachmentId'",
            "app.post('/api/mail/messages/send'",
            "app.post('/api/mail/messages/:id/reply'",
            "app.post('/api/mail/messages/:id/read-state'"
        ]
    },
    {
        module: 'backend/platform/routes/portal-support-routes.js',
        routes: [
            "app.get('/api/bootstrap'",
            "app.get('/api/portal/bootstrap'",
            "app.post('/api/portal/state'",
            "app.get('/api/me'",
            "app.get('/api/events'",
            "app.get('/api/accounts'",
            "app.post('/api/accounts/upsert'",
            "app.get('/api/notifications'",
            "app.post('/api/notifications/read'",
            "app.post('/api/notifications/preferences'",
            "app.get('/api/push/public-config'",
            "app.post('/api/push/subscribe'",
            "app.post('/api/push/unsubscribe'"
        ]
    },
    {
        module: 'backend/platform/routes/system-routes.js',
        routes: [
            "app.get('/download'",
            "app.get('/download/file'",
            "app.get('/download/:platform'",
            "app.get('/download/:platform/file'",
            "app.get('/health'",
            "app.get('/ready'",
            "app.post('/api/ai/career-completion'"
        ]
    },
    {
        module: 'backend/platform/routes/auth-maintenance-routes.js',
        routes: [
            "app.post('/api/auth/login'",
            "app.post('/api/auth/logout'",
            "app.post('/api/session/impersonate-role'",
            "app.post('/api/auth/activate'",
            "app.post('/api/auth/request-reset'",
            "app.post('/api/auth/reset-password'"
        ]
    }
];

const routeModules = extractedRouteOwners.map(item => item.module);
const forbiddenRouteImports = [
    "require('./store')",
    "require('../store')",
    "require('./domains/",
    "require('../domains/"
];
const sharedMobileShellPages = Object.keys(routeVisualClassification).filter((page) => routeVisualClassification[page].mobileShell === 'shared-standalone');
const shellAliasWrapperPages = Object.keys(routeVisualClassification).filter((page) => routeVisualClassification[page].category === 'excluded-wrapper');

let failed = false;
const serverSource = readText('backend/platform/server.js');

console.log('Architecture guardrails');

for (const entry of lineCountThresholds) {
    const count = countLines(entry.file);
    const ok = count <= entry.maxLines;
    console.log(`${ok ? 'PASS' : 'FAIL'} line ceiling ${entry.file} ${count}/${entry.maxLines}`);
    if (!ok) {
        console.log(`  Reason: ${entry.reason}`);
        failed = true;
    }
}

for (const owner of extractedRouteOwners) {
    const routeSource = readText(owner.module);
    for (const routeSignature of owner.routes) {
        const ownedByModule = routeSource.includes(routeSignature);
        const absentFromServer = !serverSource.includes(routeSignature);
        console.log(`${ownedByModule ? 'PASS' : 'FAIL'} route owner ${owner.module} contains ${routeSignature}`);
        console.log(`${absentFromServer ? 'PASS' : 'FAIL'} server no longer owns ${routeSignature}`);
        if (!ownedByModule || !absentFromServer) {
            failed = true;
        }
    }
}

const routeModulesThatNeedStoreInjection = new Set([
    'backend/platform/routes/files-routes.js',
    'backend/platform/routes/auth-routes.js',
    'backend/platform/routes/platform-ops-routes.js',
    'backend/platform/routes/admin-integrations-routes.js',
    'backend/platform/routes/admin-support-routes.js',
    'backend/platform/routes/student-service-routes.js',
    'backend/platform/routes/gradebook-routes.js',
    'backend/platform/routes/protected-exam-routes.js',
    'backend/platform/routes/messenger-calls-routes.js',
    'backend/platform/routes/social-routes.js',
    'backend/platform/routes/lms-live-quiz-routes.js',
    'backend/platform/routes/academic-routes.js',
    'backend/platform/routes/news-routes.js',
    'backend/platform/routes/microsoft-auth-routes.js',
    'backend/platform/routes/mail-routes.js',
    'backend/platform/routes/portal-support-routes.js',
    'backend/platform/routes/auth-maintenance-routes.js'
]);

for (const routeModule of routeModules) {
    const routeSource = readText(routeModule);
    if (routeModulesThatNeedStoreInjection.has(routeModule)) {
        const usesGetStore = routeSource.includes('getStore');
        console.log(`${usesGetStore ? 'PASS' : 'FAIL'} injected store access ${routeModule}`);
        if (!usesGetStore) failed = true;
    }
    for (const forbidden of forbiddenRouteImports) {
        const ok = !routeSource.includes(forbidden);
        console.log(`${ok ? 'PASS' : 'FAIL'} forbidden import ${forbidden} in ${routeModule}`);
        if (!ok) failed = true;
    }
}

const rootHtmlPages = fs.readdirSync(ROOT)
    .filter((name) => name.toLowerCase().endsWith('.html'))
    .sort();
const classifiedPages = Object.keys(routeVisualClassification).sort();
const missingClassificationPages = rootHtmlPages.filter((name) => !routeVisualClassification[name]);
const extraClassificationPages = classifiedPages.filter((name) => !rootHtmlPages.includes(name));
console.log(`${missingClassificationPages.length === 0 ? 'PASS' : 'FAIL'} route classification coverage missing=${missingClassificationPages.length}`);
if (missingClassificationPages.length > 0) {
    console.log(`  Missing: ${missingClassificationPages.join(', ')}`);
    failed = true;
}
console.log(`${extraClassificationPages.length === 0 ? 'PASS' : 'FAIL'} route classification extras extra=${extraClassificationPages.length}`);
if (extraClassificationPages.length > 0) {
    console.log(`  Extra: ${extraClassificationPages.join(', ')}`);
    failed = true;
}

for (const htmlPage of classifiedPages) {
    const source = readText(htmlPage);
    const classification = routeVisualClassification[htmlPage];
    const actualDedicatedCss = getDedicatedRouteCss(source);
    const expectedDedicatedCss = [...classification.dedicatedCss].sort();
    const cssMatches = JSON.stringify(actualDedicatedCss) === JSON.stringify(expectedDedicatedCss);
    console.log(`${cssMatches ? 'PASS' : 'FAIL'} dedicated route css ${htmlPage}`);
    if (!cssMatches) {
        console.log(`  Expected: ${expectedDedicatedCss.join(', ') || '(none)'}`);
        console.log(`  Actual: ${actualDedicatedCss.join(', ') || '(none)'}`);
        failed = true;
    }
    const sharedCssOverrideDrift = actualDedicatedCss
        .filter((file) => routeCssSharedSelectorZeroBudgetFiles.has(file))
        .flatMap((file) => {
            const findings = getSharedRouteCssOverrideFindings(readText(file));
            return findings.length ? [{ file, findings }] : [];
        });
    const sharedCssOverrideOk = sharedCssOverrideDrift.length === 0;
    console.log(`${sharedCssOverrideOk ? 'PASS' : 'FAIL'} shared selector route css budget ${htmlPage}`);
    if (!sharedCssOverrideOk) {
        sharedCssOverrideDrift.forEach((entry) => {
            console.log(`  ${entry.file}: ${entry.findings.join(', ')}`);
        });
        failed = true;
    }

    const hasInlineBootstrap = source.includes('(function initMobileExperience(){');
    const hasStandaloneSharedShell = source.includes('assets/js/pages/standalone-mobile-shell.js');
    const hasStandaloneConfig = source.includes('window.__KIU_STANDALONE_MOBILE_SHELL_CONFIG = {');
    const hasIndexSharedShell = source.includes('assets/js/pages/index-mobile-shell.js');
    const hasSocialSharedShell = source.includes('assets/js/pages/social-mobile.js');
    const hasInlineStyle = source.includes('<style>');

    if (classification.mobileShell === 'legacy-inline') {
        const ok = hasInlineBootstrap && !hasStandaloneSharedShell;
        console.log(`${ok ? 'PASS' : 'FAIL'} legacy mobile shell mode ${htmlPage}`);
        if (!ok) failed = true;
    } else if (classification.mobileShell === 'shared-standalone') {
        const ok = hasStandaloneSharedShell && hasStandaloneConfig && !hasInlineBootstrap;
        console.log(`${ok ? 'PASS' : 'FAIL'} shared standalone mobile shell mode ${htmlPage}`);
        if (!ok) failed = true;
    } else if (classification.mobileShell === 'index-shared') {
        const ok = hasIndexSharedShell && !hasInlineBootstrap;
        console.log(`${ok ? 'PASS' : 'FAIL'} index shared mobile shell mode ${htmlPage}`);
        if (!ok) failed = true;
    } else if (classification.mobileShell === 'social-shared') {
        const ok = hasSocialSharedShell && !hasInlineBootstrap;
        console.log(`${ok ? 'PASS' : 'FAIL'} social shared mobile shell mode ${htmlPage}`);
        if (!ok) failed = true;
    } else {
        const ok = !hasInlineBootstrap && !hasStandaloneSharedShell;
        console.log(`${ok ? 'PASS' : 'FAIL'} no mobile shell bootstrap drift ${htmlPage}`);
        if (!ok) failed = true;
    }

    const shouldAllowInlineStyle = allowedLuxuryShellInlineStylePages.has(htmlPage);
    const usesLuxuryShell = source.includes('assets/css/index-luxury.css');
    if (usesLuxuryShell) {
        const inlineStyleOk = shouldAllowInlineStyle ? hasInlineStyle : !hasInlineStyle;
        console.log(`${inlineStyleOk ? 'PASS' : 'FAIL'} inline style budget ${htmlPage}`);
        if (!inlineStyleOk) failed = true;
    }
}

for (const htmlPage of sharedMobileShellPages) {
    const source = readText(htmlPage);
    const usesSharedBootstrap = source.includes('assets/js/pages/standalone-mobile-shell.js');
    const declaresSharedConfig = source.includes('window.__KIU_STANDALONE_MOBILE_SHELL_CONFIG = {');
    const avoidsInlineBootstrap = !source.includes('(function initMobileExperience(){');
    console.log(`${usesSharedBootstrap ? 'PASS' : 'FAIL'} shared mobile shell bootstrap ${htmlPage}`);
    console.log(`${declaresSharedConfig ? 'PASS' : 'FAIL'} mobile shell config ${htmlPage}`);
    console.log(`${avoidsInlineBootstrap ? 'PASS' : 'FAIL'} no inline mobile bootstrap ${htmlPage}`);
    if (!usesSharedBootstrap || !declaresSharedConfig || !avoidsInlineBootstrap) {
        failed = true;
    }
}

for (const htmlPage of shellAliasWrapperPages) {
    const source = readText(htmlPage);
    const redirectsToShell = source.includes("window.location.replace(target);");
    const staysRuntimeLight = !source.includes('assets/js/pages/news.js') && !source.includes('assets/js/pages/standalone-mobile-shell.js');
    const skipsStandaloneShellChrome = !source.includes('window.__KIU_STANDALONE_MOBILE_SHELL_CONFIG = {');
    console.log(`${redirectsToShell ? 'PASS' : 'FAIL'} shell alias redirect ${htmlPage}`);
    console.log(`${staysRuntimeLight ? 'PASS' : 'FAIL'} shell alias stays runtime-light ${htmlPage}`);
    console.log(`${skipsStandaloneShellChrome ? 'PASS' : 'FAIL'} shell alias avoids standalone chrome ${htmlPage}`);
    if (!redirectsToShell || !staysRuntimeLight || !skipsStandaloneShellChrome) {
        failed = true;
    }
}

if (failed) {
    console.error('\nArchitecture guardrails failed.');
    process.exit(1);
}

console.log('\nArchitecture guardrails passed.');

function resolveRelative(relativePath) {
    return path.join(ROOT, relativePath);
}

function readText(relativePath) {
    return fs.readFileSync(resolveRelative(relativePath), 'utf8');
}

function countLines(relativePath) {
    return readText(relativePath).split(/\r?\n/).length;
}
