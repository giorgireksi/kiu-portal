import { describe, expect, it } from 'vitest';
import { expectLmsRouteCssLinks } from './helpers/lms-route-css.js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('LMS interaction tab persistence', () => {
    it('skips cache-only restore for interaction and exposes cache invalidation', () => {
        const classroomSource = readSource('assets/js/pages/lms-classroom-tabs-runtime.js');
        const runtimeSource = readSource('assets/js/pages/lms-interaction-messages-runtime.js');

        expect(classroomSource).toContain("tab !== 'live-quiz' && tab !== 'interaction' && tab !== 'whiteboard' && LMS_TAB_RENDER_CACHE[cacheKey]");
        expect(classroomSource).toContain("tab === 'live-quiz' || tab === 'interaction'");
        expect(classroomSource).toContain('function invalidateLmsInteractionTabCache');
        expect(classroomSource).toContain('function syncLmsInteractionTabCacheFromDom');
        expect(classroomSource).toContain('window.invalidateLmsInteractionTabCache = invalidateLmsInteractionTabCache');
        expect(runtimeSource).toContain('invalidateLmsInteractionTabCache');
    });

    it('strips interaction bound flags before tab cache sync', () => {
        const classroomSource = readSource('assets/js/pages/lms-classroom-tabs-runtime.js');
        const runtimeSource = readSource('assets/js/pages/lms-interaction-messages-runtime.js');

        expect(runtimeSource).toContain('function stripLmsInteractionBoundFlags');
        expect(classroomSource).toContain("tab === 'interaction' && typeof stripLmsInteractionBoundFlags === 'function'");
        expect(classroomSource).toContain('stripLmsInteractionBoundFlags(contentArea)');
        expect(classroomSource).toContain('syncLmsInteractionTabCacheFromDom(resourceKey)');
    });

    it('binds interaction events once on the content area via delegation', () => {
        const runtimeSource = readSource('assets/js/pages/lms-interaction-messages-runtime.js');
        const classroomSource = readSource('assets/js/pages/lms-classroom-tabs-runtime.js');

        expect(runtimeSource).toContain('function bindLmsInteractionDelegatedEvents');
        expect(runtimeSource).toContain('contentArea.dataset.lmsInteractionDelegatedBound');
        expect(runtimeSource).toContain("contentArea.addEventListener('click'");
        expect(runtimeSource).toContain('resolveLmsInteractionResourceKeyFromTarget');
        expect(classroomSource).toContain('bindLmsInteractionDelegatedEvents(contentArea)');
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