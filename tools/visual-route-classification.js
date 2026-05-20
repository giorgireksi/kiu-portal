const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const routeVisualClassification = {
    'admin-library.html': { category: 'standard-shell', dedicatedCss: ['assets/css/admin-library-route.css'], mobileShell: 'shared-standalone' },
    'admin-orders.html': { category: 'standard-shell', dedicatedCss: ['assets/css/admin-orders-route.css'], mobileShell: 'shared-standalone' },
    'admin-scheduler.html': { category: 'special-surface', dedicatedCss: [], mobileShell: 'shared-standalone' },
    'admin-tools.html': { category: 'special-surface', dedicatedCss: ['assets/css/admin-tools-luxury.css'], mobileShell: 'shared-standalone' },
    'calendar.html': { category: 'excluded-route', dedicatedCss: [], mobileShell: 'none' },
    'career-market.html': { category: 'special-surface', dedicatedCss: ['assets/css/career-market-route.css'], mobileShell: 'none' },
    'chancellery.html': { category: 'standard-shell', dedicatedCss: [], mobileShell: 'shared-standalone' },
    'exam-portal.html': { category: 'excluded-route', dedicatedCss: [], mobileShell: 'none' },
    'exams.html': { category: 'special-surface', dedicatedCss: ['assets/css/exam-studio.css'], mobileShell: 'shared-standalone' },
    'faculty-gradebook.html': { category: 'standard-shell', dedicatedCss: [], mobileShell: 'shared-standalone' },
    'faculty-schedule.html': { category: 'excluded-route', dedicatedCss: [], mobileShell: 'none' },
    'gradebook.html': { category: 'excluded-route', dedicatedCss: [], mobileShell: 'none' },
    'index.html': { category: 'standard-shell', dedicatedCss: ['assets/css/index-home-dashboard.css', 'assets/css/news-route.css'], mobileShell: 'index-shared' },
    'library.html': { category: 'standard-shell', dedicatedCss: [], mobileShell: 'none' },
    'lms.html': { category: 'standard-shell', dedicatedCss: [], mobileShell: 'shared-standalone' },
    'login.html': { category: 'excluded-route', dedicatedCss: ['assets/css/login-route.css'], mobileShell: 'none' },
    'news.html': { category: 'standard-shell', dedicatedCss: ['assets/css/news-route.css'], mobileShell: 'none' },
    'orders.html': { category: 'standard-shell', dedicatedCss: [], mobileShell: 'none' },
    'personal-data.html': { category: 'standard-shell', dedicatedCss: ['assets/css/personal-data-route.css'], mobileShell: 'shared-standalone' },
    'profile.html': { category: 'standard-shell', dedicatedCss: ['assets/css/profile-route.css'], mobileShell: 'shared-standalone' },
    'profile-view.html': { category: 'standard-shell', dedicatedCss: ['assets/css/profile-view-route.css'], mobileShell: 'shared-standalone' },
    'programs.html': { category: 'standard-shell', dedicatedCss: [], mobileShell: 'shared-standalone' },
    'protected-launch.html': { category: 'excluded-route', dedicatedCss: [], mobileShell: 'none' },
    'registration.html': { category: 'standard-shell', dedicatedCss: [], mobileShell: 'shared-standalone' },
    'social.html': { category: 'special-surface', dedicatedCss: ['assets/css/social-rebuild.css'], mobileShell: 'social-shared' },
    'staff.html': { category: 'special-surface', dedicatedCss: ['assets/css/admin-directories.css', 'assets/css/staff-command-center.css'], mobileShell: 'none' },
    'students-admin.html': { category: 'special-surface', dedicatedCss: ['assets/css/students-admin-lms.css'], mobileShell: 'none' },
    'student-service.html': { category: 'standard-shell', dedicatedCss: [], mobileShell: 'none' },
    'study-card.html': { category: 'standard-shell', dedicatedCss: [], mobileShell: 'shared-standalone' },
    'timetable.html': { category: 'standard-shell', dedicatedCss: ['assets/css/timetable-route.css'], mobileShell: 'shared-standalone' }
};

const allowedLuxuryShellInlineStylePages = new Set(['admin-scheduler.html', 'lms.html']);

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

function getDedicatedRouteCss(source) {
    const matches = Array.from(String(source || '').matchAll(/<link rel="stylesheet" href="([^"]+)"/g));
    return matches
        .map((match) => String(match[1] || '').split('?')[0])
        .filter((href) => /^assets\/css\//.test(href))
        .filter((href) => ![
            'assets/css/kiu-fonts.css',
            'assets/css/base.css',
            'assets/css/layout.css',
            'assets/css/components.css',
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

module.exports = {
    ROOT,
    routeVisualClassification,
    allowedLuxuryShellInlineStylePages,
    routeCssSharedSelectorZeroBudgetFiles,
    getDedicatedRouteCss,
    getSharedRouteCssOverrideFindings
};
