const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const CHROME_BUST = '20260705-sidebar-cascade1';
const HOVER_FLICKER_BUST = '20260706-hover-flicker2';
const DROPLIST_GLOBAL_BUST = '20260706-droplist-global1';
const SOCIAL_REBUILD_BUST = '20260609-bgclear1';

const SHARED_SHELL_ASSETS = [
    'assets/css/lux-tokens.css',
    'assets/css/lux-modals.css',
    'assets/css/lux-fouc-ht.css',
    'assets/css/lux-page-bare-lite.css',
    'assets/css/lux-controls.css',
    'assets/js/features/index-luxury.js',
    'assets/js/features/luxury-shell-chrome.js',
    'assets/js/theme-primer.js'
];

const SHARED_SHELL_ASSET_DEFAULT_BUSTS = {
    'assets/css/lux-modals.css': '20260710-warmglass-global1',
    'assets/css/lux-fouc-ht.css': '20260719-foucslim1',
    'assets/css/lux-page-bare-lite.css': HOVER_FLICKER_BUST,
    'assets/css/lux-controls.css': HOVER_FLICKER_BUST,
    'assets/js/features/luxury-shell-chrome.js': DROPLIST_GLOBAL_BUST
};

const SHARED_SHELL_ASSET_BUSTS = {};

const SHELL_PAGES = [
    'students-admin.html',
    'index.html',
    'social.html',
    'timetable.html',
    'study-card.html',
    'student-service.html',
    'staff.html',
    'registration.html',
    'programs.html',
    'profile.html',
    'profile-view.html',
    'personal-data.html',
    'orders.html',
    'news.html',
    'lms.html',
    'library.html',
    'faculty-gradebook.html',
    'exams.html',
    'chancellery.html',
    'admin-tools.html',
    'admin-scheduler.html',
    'admin-orders.html',
    'admin-library.html'
];

const ROUTE_CLEARANCE_CSS = [];

const CONTENT_TOP_TOKEN = '--lux-content-top';
const CONTENT_TOP_EXTRA_TOKEN = '--lux-content-top-extra';
const MOBILE_CONTENT_TOP_TOKEN = '--lux-mobile-content-top';

const ROUTE_CLEARANCE_BUST = {};

function resolveSharedShellAssetBust(page, asset) {
    return SHARED_SHELL_ASSET_BUSTS[page]?.[asset]
        || SHARED_SHELL_ASSET_DEFAULT_BUSTS[asset]
        || CHROME_BUST;
}

module.exports = {
    ROOT,
    CHROME_BUST,
    HOVER_FLICKER_BUST,
    SOCIAL_REBUILD_BUST,
    ROUTE_CLEARANCE_BUST,
    SHARED_SHELL_ASSET_DEFAULT_BUSTS,
    SHARED_SHELL_ASSET_BUSTS,
    resolveSharedShellAssetBust,
    SHARED_SHELL_ASSETS,
    SHELL_PAGES,
    ROUTE_CLEARANCE_CSS,
    CONTENT_TOP_TOKEN,
    CONTENT_TOP_EXTRA_TOKEN,
    MOBILE_CONTENT_TOP_TOKEN
};
