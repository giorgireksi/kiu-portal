import { describe, expect, it } from 'vitest';
import { expectLmsRouteCssLinks } from './helpers/lms-route-css.js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('LMS interaction tab persistence', () => {
    it('skips cache-only restore for interaction and exposes cache invalidation', () => {
        const shellSource = readSource('assets/js/pages/lms-classroom-tabs-shell-runtime.js');
        const classroomSource = readSource('assets/js/pages/lms-classroom-tabs-runtime.js');
        const runtimeSource = readSource('assets/js/pages/lms-interaction-messages-runtime.js');

        expect(shellSource).toContain("tab !== 'live-quiz' && tab !== 'interaction' && tab !== 'whiteboard' && tab !== 'quiz' && tab !== 'monitoring' && LMS_TAB_RENDER_CACHE[cacheKey]");
        expect(shellSource).toContain("tab === 'live-quiz' || tab === 'interaction'");
        expect(shellSource).toContain('function invalidateLmsInteractionTabCache');
        expect(shellSource).toContain('function syncLmsInteractionTabCacheFromDom');
        expect(classroomSource).toContain('window.invalidateLmsInteractionTabCache = invalidateLmsInteractionTabCache');
        expect(runtimeSource).toContain('invalidateLmsInteractionTabCache');
    });

    it('strips interaction bound flags before tab cache sync', () => {
        const shellSource = readSource('assets/js/pages/lms-classroom-tabs-shell-runtime.js');
        const classroomSource = readSource('assets/js/pages/lms-classroom-tabs-runtime.js');
        const runtimeSource = readSource('assets/js/pages/lms-interaction-messages-runtime.js');

        expect(runtimeSource).toContain('function stripLmsInteractionBoundFlags');
        expect(shellSource).toContain("tab === 'interaction' && typeof stripLmsInteractionBoundFlags === 'function'");
        expect(shellSource).toContain('stripLmsInteractionBoundFlags(contentArea)');
        expect(classroomSource).toContain('syncLmsInteractionTabCacheFromDom(resourceKey)');
    });

    it('binds interaction events once on the content area via delegation', () => {
        const runtimeSource = readSource('assets/js/pages/lms-interaction-messages-runtime.js');
        const shellSource = readSource('assets/js/pages/lms-classroom-tabs-shell-runtime.js');

        expect(runtimeSource).toContain('function bindLmsInteractionDelegatedEvents');
        expect(runtimeSource).toContain('contentArea.dataset.lmsInteractionDelegatedBound');
        expect(runtimeSource).toContain("contentArea.addEventListener('click'");
        expect(runtimeSource).toContain('resolveLmsInteractionResourceKeyFromTarget');
        expect(shellSource).toContain('bindLmsInteractionDelegatedEvents(contentArea)');
    });

    it('renders unified inbox rail with compose rail picker', () => {
        const runtimeSource = readSource('assets/js/pages/lms-interaction-messages-runtime.js');
        expect(runtimeSource).toContain('lms-interaction-direct__rail-head');
        expect(runtimeSource).toContain('data-lms-interaction-action="open-compose"');
        expect(runtimeSource).toContain('data-lms-interaction-region="direct-inbox"');
        expect(runtimeSource).toContain('function renderLmsInteractionComposeRail');
        expect(runtimeSource).toContain('data-lms-interaction-region="compose-rail"');
        expect(runtimeSource).toContain('data-lms-interaction-input="compose-search"');
    });

    it('bumps interaction sync cache bust tokens in lms.html', () => {
        const html = readSource('lms.html');

        expectLmsRouteCssLinks(html);
        expect(readSource('assets/js/pages/lms-classroom-tabs-runtime.js')).toContain('assets/js/pages/lms-interaction-messages-runtime.js?v=20260714-lmspro2')
        expect(html).not.toContain('assets/js/pages/lms-interaction-messages-runtime.js');
    });
});