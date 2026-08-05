/**
 * Social page shell + boot + events chain for source-lock tests.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();

export const SOCIAL_PAGE_MODULE_PATHS = Object.freeze([
    'assets/js/pages/social-page.js',
    'assets/js/pages/social-page-boot-runtime.js',
    'assets/js/pages/social-shell-nav.js',
    'assets/js/pages/social-page-events.js'
]);

export const SOCIAL_PAGE_RUNTIME_PEEL_PATHS = Object.freeze([
    'assets/js/pages/social-page-interactions-runtime.js',
    'assets/js/pages/social-page-feed-runtime.js',
    'assets/js/pages/social-page-shell-runtime.js',
    'assets/js/pages/social-page-survey-runtime.js'
]);

export const WORKSPACE_SURFACE_PEEL_PATHS = Object.freeze([
    'assets/js/pages/social-workspace.js',
    'assets/js/pages/social-workspace-events.js',
    'assets/js/pages/social-workspace-events-input-runtime.js',
    'assets/js/pages/social-workspace-events-submit-runtime.js',
    'assets/js/pages/social-workspace-week-plan-model.js',
    'assets/js/pages/social-workspace-project-chrome.js',
    'assets/js/pages/social-workspace-dialog-route.js',
    'assets/js/pages/social-workspace-portfolio-ui.js',
    'assets/js/pages/social-workspace-panel-budget-runtime.js'
]);

function readPaths(paths, root = ROOT) {
    return paths.map((path) => readFileSync(join(root, path), 'utf8')).join('\n');
}

export function readSocialPageJs(root = ROOT) {
    return readFileSync(join(root, SOCIAL_PAGE_MODULE_PATHS[0]), 'utf8');
}

export function readSocialPageSource(root = ROOT) {
    return readPaths(SOCIAL_PAGE_MODULE_PATHS, root);
}

/** Full page chain including interaction/feed/shell/survey runtime peels. */
export function readSocialPageChain(root = ROOT) {
    return readPaths([...SOCIAL_PAGE_MODULE_PATHS, ...SOCIAL_PAGE_RUNTIME_PEEL_PATHS], root);
}

export function readWorkspaceSurface(root = ROOT) {
    return readPaths(WORKSPACE_SURFACE_PEEL_PATHS, root);
}

export function readSocialHtml(root = ROOT) {
    return readFileSync(join(root, 'social.html'), 'utf8');
}

/** Cache-bust token from social-page.js SOCIAL_*_MODULE_URL constants. */
export function socialModuleUrlToken(moduleFile, root = ROOT) {
    const page = readFileSync(join(root, 'assets/js/pages/social-page.js'), 'utf8');
    const match = page.match(new RegExp(`assets/js/pages/${moduleFile.replace('.', '\\.')}\\?v=([^'"]+)`));
    if (!match) {
        throw new Error(`No SOCIAL_*_MODULE_URL for ${moduleFile} in social-page.js`);
    }
    return `${moduleFile}?v=${match[1]}`;
}
