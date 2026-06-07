const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const routeVisualClassification = {
    'admin-library.html': { category: 'standard-shell', dedicatedCss: ['assets/css/admin-library-route.css'], mobileShell: 'shared-standalone' },
    'admin-orders.html': { category: 'standard-shell', dedicatedCss: ['assets/css/admin-orders-route.css'], mobileShell: 'shared-standalone' },
    'admin-scheduler.html': { category: 'special-surface', dedicatedCss: ['assets/css/admin-scheduler-route.css'], mobileShell: 'shared-standalone' },
    'admin-tools.html': { category: 'special-surface', dedicatedCss: ['assets/css/admin-tools-luxury.css'], mobileShell: 'shared-standalone' },
    'calendar.html': { category: 'excluded-route', dedicatedCss: ['assets/css/redirect-route.css'], mobileShell: 'none' },
    'career-market.html': { category: 'special-surface', dedicatedCss: ['assets/css/career-market-route.css'], mobileShell: 'none' },
    'chancellery.html': { category: 'standard-shell', dedicatedCss: ['assets/css/chancellery-route.css'], mobileShell: 'shared-standalone' },
    'exam-portal.html': { category: 'excluded-route', dedicatedCss: ['assets/css/exam-portal-route.css'], mobileShell: 'none' },
    'exams.html': { category: 'special-surface', dedicatedCss: ['assets/css/exam-studio.css'], mobileShell: 'shared-standalone' },
    'faculty-gradebook.html': { category: 'standard-shell', dedicatedCss: ['assets/css/faculty-gradebook-route.css'], mobileShell: 'shared-standalone' },
    'faculty-schedule.html': { category: 'excluded-route', dedicatedCss: ['assets/css/redirect-route.css'], mobileShell: 'none' },
    'gradebook.html': { category: 'excluded-route', dedicatedCss: ['assets/css/redirect-route.css'], mobileShell: 'none' },
    'index.html': { category: 'standard-shell', dedicatedCss: ['assets/css/index-home-dashboard.css', 'assets/css/news-route.css'], mobileShell: 'index-shared' },
    'library.html': { category: 'standard-shell', dedicatedCss: ['assets/css/library-route.css'], mobileShell: 'none' },
    'lms.html': { category: 'standard-shell', dedicatedCss: ['assets/css/lms-route.css'], mobileShell: 'shared-standalone' },
    'login.html': { category: 'excluded-route', dedicatedCss: ['assets/css/login-route.css'], mobileShell: 'none' },
    'news.html': { category: 'standard-shell', dedicatedCss: ['assets/css/news-route.css'], mobileShell: 'none' },
    'orders.html': { category: 'standard-shell', dedicatedCss: ['assets/css/orders-route.css'], mobileShell: 'none' },
    'personal-data.html': { category: 'standard-shell', dedicatedCss: ['assets/css/personal-data-route.css'], mobileShell: 'shared-standalone' },
    'profile.html': { category: 'standard-shell', dedicatedCss: ['assets/css/profile-route.css'], mobileShell: 'shared-standalone' },
    'profile-view.html': { category: 'standard-shell', dedicatedCss: ['assets/css/profile-view-route.css'], mobileShell: 'shared-standalone' },
    'programs.html': { category: 'standard-shell', dedicatedCss: ['assets/css/programs-route.css'], mobileShell: 'shared-standalone' },
    'protected-launch.html': { category: 'excluded-route', dedicatedCss: ['assets/css/protected-launch-route.css'], mobileShell: 'none' },
    'registration.html': { category: 'standard-shell', dedicatedCss: ['assets/css/registration-route.css'], mobileShell: 'shared-standalone' },
    'social.html': { category: 'special-surface', dedicatedCss: ['assets/css/social-rebuild.css'], mobileShell: 'social-shared' },
    'staff.html': { category: 'special-surface', dedicatedCss: ['assets/css/staff-command-center.css'], mobileShell: 'shared-standalone' },
    'students-admin.html': { category: 'special-surface', dedicatedCss: ['assets/css/students-admin-lms.css'], mobileShell: 'shared-standalone' },
    'student-service.html': { category: 'standard-shell', dedicatedCss: ['assets/css/student-service-route.css'], mobileShell: 'none' },
    'study-card.html': { category: 'standard-shell', dedicatedCss: ['assets/css/study-card-route.css'], mobileShell: 'shared-standalone' },
    'timetable.html': { category: 'standard-shell', dedicatedCss: ['assets/css/timetable-route.css'], mobileShell: 'shared-standalone' }
};

const allowedLuxuryShellInlineStylePages = new Set();

const routeCssSharedSelectorZeroBudgetFiles = new Set([
    'assets/css/news-route.css',
    'assets/css/profile-route.css',
    'assets/css/personal-data-route.css',
    'assets/css/timetable-route.css',
    'assets/css/admin-library-route.css',
    'assets/css/admin-orders-route.css',
    'assets/css/profile-view-route.css'
]);

const sharedRouteCssOverridePatterns = [
    {
        key: 'shared-shell-chrome',
        regex: /#lux-(?:topbar|nav)\b|\.lux-(?:utility|picker)-(?:panel|btn)\b|\.lux-nav-item\b/
    },
    {
        key: 'shared-surface',
        regex: /\.page-hero(?:-(?:title|copy|meta|badge))?\b|\.surface-card\b|\.content-box\b|\.filter-shell-title\b|\.lux-card-(?:body|title)\b/
    },
    {
        key: 'shared-actions',
        regex: /\.lux-(?:primary|secondary)-btn\b|\.lux-empty-state\b/
    }
];

const activeWebsiteJsDynamicAuditFiles = {
    'assets/js/pages/social-page.js': [
        'assets/js/pages/social-alerts.js',
        'assets/js/pages/social-community.js',
        'assets/js/pages/social-lost-found.js',
        'assets/js/pages/social-messages.js',
        'assets/js/pages/social-profile.js'
    ],
    'assets/js/pages/staff-command-center.js': [
        'assets/js/pages/directories.js'
    ],
    'assets/js/pages/student-service.js': [
        'assets/js/pages/student-service-service.js'
    ]
};

const mobileShellRuntimeAuditFiles = [
    'assets/js/pages/index-mobile-shell.js',
    'assets/js/pages/standalone-mobile-shell.js',
    'assets/js/pages/social-mobile.js',
    'assets/js/pages/staff-mobile-shell.js'
];

const alwaysAuditedWebsiteJsFiles = [...mobileShellRuntimeAuditFiles];

const websiteJsInlineStyleAllowlist = {
    'assets/js/pages/lms-live-quiz-ui-runtime.js': [
        {
            description: 'Live quiz answer distribution widths via CSS custom properties.',
            allowedProperties: ['--lms-live-breakdown-width', '--live-progress'],
            valuePattern: /%/
        }
    ],
    'assets/js/pages/programs-page.js': [
        {
            description: 'Programs route module-load meters via CSS custom properties.',
            allowedProperties: ['--lux-program-load', '--lux-program-module-load'],
            valuePattern: /%/
        }
    ],
    'assets/js/pages/social-page.js': [
        {
            description: 'Social project chart/workload widths expressed as percentages.',
            allowedProperties: ['width'],
            valuePattern: /%/
        }
    ],
    'assets/js/pages/students-admin-lms.js': [
        {
            description: 'Students-admin completion bars expressed as percentage widths.',
            allowedProperties: ['width'],
            valuePattern: /%/
        }
    ],
    'assets/js/pages/timetable-runtime.js': [
        {
            description: 'Timetable slot/event geometry via schedule custom properties.',
            allowedProperties: ['--sch-slot-height', '--sch-now-top', '--sch-event-top', '--sch-event-height'],
            valuePattern: /(px|%)/
        }
    ]
};

// These rules are advisory only. They highlight suspicious shared-file ownership
// patterns so manual cleanup lanes can review them faster, but they do not
// prove a file is clean when they report zero findings.
const sharedCssAdvisoryRules = {
    'assets/css/base.css': [
        {
            key: 'lms-route-family',
            description: 'Legacy LMS-specific selectors still live in shared base.css.',
            regex: /(?:^|[^A-Za-z0-9_-])(?:\.|#)(?:lms-|lms_)|#lms-/
        },
        {
            key: 'timetable-route-family',
            description: 'Timetable-specific selectors still live in shared base.css.',
            regex: /(?:^|[^A-Za-z0-9_-])(?:\.|#)timetable-|(?:^|[^A-Za-z0-9_-])\.sch-/
        },
        {
            key: 'library-route-family',
            description: 'Library-specific selectors still live in shared base.css.',
            regex: /(?:^|[^A-Za-z0-9_-])\.library-/
        },
        {
            key: 'staff-route-family',
            description: 'Staff-directory selectors still live in shared base.css.',
            regex: /(?:^|[^A-Za-z0-9_-])(?:\.|#)staff-/
        },
        {
            key: 'calendar-route-family',
            description: 'Calendar-specific selectors still live in shared base.css.',
            regex: /(?:^|[^A-Za-z0-9_-])\.calendar-/
        }
    ],
    'assets/css/layout.css': [
        {
            key: 'timetable-route-family',
            description: 'Timetable layout selectors still live in shared layout.css.',
            regex: /(?:^|[^A-Za-z0-9_-])#timetable-|(?:^|[^A-Za-z0-9_-])\.timetable-/
        },
        {
            key: 'calendar-route-family',
            description: 'Calendar layout selectors still live in shared layout.css.',
            regex: /(?:^|[^A-Za-z0-9_-])\.calendar-/
        }
    ],
    'assets/css/mobile-responsive.css': [
        {
            key: 'lms-timetable-route-family',
            description: 'LMS/timetable mobile layout ownership still lives in the shared mobile file.',
            regex: /(?:^|[^A-Za-z0-9_-])(?:\.|#)(?:lms-|sch-|timetable-)/
        },
        {
            key: 'social-route-family',
            description: 'Social mobile layout ownership still lives in the shared mobile file.',
            regex: /(?:^|[^A-Za-z0-9_-])\.social-/
        },
        {
            key: 'registration-route-family',
            description: 'Registration mobile layout ownership still lives in the shared mobile file.',
            regex: /(?:^|[^A-Za-z0-9_-])\.registration-/
        },
        {
            key: 'student-service-route-family',
            description: 'Student-service mobile layout ownership still lives in the shared mobile file.',
            regex: /(?:^|[^A-Za-z0-9_-])\.student-service-/
        },
        {
            key: 'service-and-admin-route-family',
            description: 'Library, staff, orders, programs, gradebook, or chancellery mobile layout ownership still lives in the shared mobile file.',
            regex: /(?:^|[^A-Za-z0-9_-])\.(?:library|staff|students|orders|programs|gradebook|chancellery)-/
        },
        {
            key: 'admin-tools-route-family',
            description: 'Admin-tools mobile layout ownership still lives in the shared mobile file.',
            regex: /(?:^|[^A-Za-z0-9_-])\.lux-admin-tools-/
        }
    ]
};

const sharedCssOwnerDriftRules = {
    'assets/css/index-luxury.css': [
        {
            key: 'admin-tools-route-ownership',
            regex: /\blux-admin-tools-page\b|\blux-route-admin-tools\b/
        },
        {
            key: 'social-route-ownership',
            regex: /\bsocial-neo-(?:card|alert|post-card|entity-card|event-card|group-card|page-card|chat-item|directory-item|message|comment-bubble|stat-grid)\b/
        },
        {
            key: 'student-service-status-ownership',
            regex: /\bstudent-service-status\b/
        }
    ]
};

function getDedicatedRouteCss(source) {
    const matches = Array.from(String(source || '').matchAll(/<link rel="stylesheet" href="([^"]+)"/g));
    return matches
        .map((match) => String(match[1] || '').split('?')[0])
        .filter((href) => /^assets\/css\//.test(href))
        .filter((href) => ![
            'assets/css/kiu-fonts.css',
            'assets/css/base.css',
            'assets/css/layout.css',
            'assets/css/lux-tokens.css',
            'assets/css/lux-surfaces.css',
            'assets/css/lux-controls.css',
            'assets/css/lux-layout-primitives.css',
            'assets/css/index-luxury.css',
            'assets/css/mobile-responsive.css'
        ].includes(href))
        .sort();
}

function getSharedRouteCssOverrideFindings(source) {
    const cssSource = String(source || '');
    return sharedRouteCssOverridePatterns
        .filter((pattern) => pattern.regex.test(cssSource))
        .map((pattern) => pattern.key);
}

const routeCssOwnerFiles = [...new Set(
    Object.values(routeVisualClassification).flatMap((classification) => classification.dedicatedCss || [])
)].sort();

const cssStyleAttributeCompatibilityBuckets = [
    {
        key: 'shared-luxury',
        label: 'shared luxury',
        files: ['assets/css/index-luxury.css']
    },
    {
        key: 'shared-mobile',
        label: 'shared mobile',
        files: ['assets/css/mobile-responsive.css']
    },
    {
        key: 'shared-base-layout',
        label: 'shared base/layout',
        files: ['assets/css/base.css', 'assets/css/layout.css']
    },
    {
        key: 'route-css-owners',
        label: 'route CSS owners',
        files: routeCssOwnerFiles
    }
];

module.exports = {
    ROOT,
    routeVisualClassification,
    allowedLuxuryShellInlineStylePages,
    activeWebsiteJsDynamicAuditFiles,
    mobileShellRuntimeAuditFiles,
    alwaysAuditedWebsiteJsFiles,
    routeCssSharedSelectorZeroBudgetFiles,
    getDedicatedRouteCss,
    getSharedRouteCssOverrideFindings,
    sharedCssAdvisoryRules,
    sharedCssOwnerDriftRules,
    websiteJsInlineStyleAllowlist,
    cssStyleAttributeCompatibilityBuckets
};
