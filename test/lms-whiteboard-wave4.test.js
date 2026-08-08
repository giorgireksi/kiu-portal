import { describe, expect, it } from 'vitest';
import { readLmsWhiteboardSource } from './helpers/lms-whiteboard-source.js';

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('LMS whiteboard wave 4 classroom features', () => {
    it('removes template and activity runtimes from the shell', () => {
        const runtime = readLmsWhiteboardSource();
        const html = readSource('lms.html');

        expect(html).not.toContain('lms-whiteboard-activity-runtime.js');
        expect(html).not.toContain('lms-whiteboard-template-logic.js');
        expect(runtime).not.toContain('isLmsWhiteboardDotVotingOpen');
        expect(runtime).not.toContain('data-lms-whiteboard-region="activity"');
        expect(runtime).not.toContain('buildLmsWhiteboardTemplateElements');
    });

    it('drops breakout merge support from backend service', () => {
        const service = readSource('backend/platform/domains/lms-whiteboard-service.js');

        expect(service).not.toContain('function mergeBreakoutLmsWhiteboardTemplate');
        expect(service).not.toContain('function getWhiteboardTemplateFrame');
        expect(service).not.toContain('breakout-merge');
        expect(service).toContain('function normalizeWhiteboardActivity');
    });

    it('adds mobile bottom dock without frames sidebar', () => {
        const runtime = readLmsWhiteboardSource();
        const bare = readSource('assets/css/lux-page-bare-lite.css');

        expect(bare).toContain('@media (max-width: 768px)');
        expect(bare).not.toContain('.lms-whiteboard-frames-sidebar');
        expect(bare).toContain('bottom: calc(12px + env(safe-area-inset-bottom, 0px))');
        expect(runtime).not.toContain('syncLmsWhiteboardFramesSidebar');
    });

    it('bumps no-templates cache bust tokens in lms.html', () => {
        const html = readSource('lms.html');

        expect(readSource('assets/js/pages/lms-classroom-tabs-runtime.js')).toContain('assets/js/pages/lms-whiteboard-workspace-runtime.js?v=20260710-personal-autosave1');
        expect(readSource('assets/js/pages/lms-classroom-tabs-runtime.js')).toContain('assets/js/pages/lms-whiteboard-runtime.js?v=20260808-overallperf1');
    });
});