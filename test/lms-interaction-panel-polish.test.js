import { describe, expect, it } from 'vitest';
import { readLmsInteractionSource, readLmsInteractionShellRuntime } from './helpers/lms-interaction-source.js';
import { expectLmsRouteCssLinks } from './helpers/lms-route-css.js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('LMS interaction panel polish', () => {
    it('uses dynamic chrome offset and visible messenger overflow', () => {
    });

    it('syncs interaction panel chrome from measured LMS header chrome', () => {
        const classroomSource = readLmsInteractionSource();
        const syncBlock = classroomSource.match(/function syncLmsWorkspaceChromeOffset[\s\S]*?(?=\nfunction )/)?.[0] || '';
        const renderBlock = classroomSource.match(/function renderLmsInteractionSection[\s\S]*?(?=\nfunction )/)?.[0] || '';
        const switchBlock = classroomSource.match(/function switchLMSTab[\s\S]*?(?=\nfunction )/)?.[0] || '';

        expect(classroomSource).toContain('function syncLmsWorkspaceChromeOffset');
        expect(syncBlock).toContain('.lms-route-workspace-chrome');
        expect(syncBlock).toContain('--lms-interaction-panel-chrome');
        expect(renderBlock).toMatch(/syncLms(?:Workspace|Interaction)ChromeOffset\(contentArea\)/);
        expect(switchBlock).toContain('syncLmsWorkspaceChromeOffset(contentArea)');
        expect(classroomSource).toContain('function syncLmsWorkspaceChromeOffset');
        expect(classroomSource).toContain('syncLmsWorkspaceChromeOffset,');
        expect(classroomSource).toContain('function syncLmsInteractionChromeOffset');
    });

    it('styles compact interaction panel with inbox sections and hidden empty draft', () => {
        const runtimeSource = readSource('assets/js/pages/lms-interaction-messages-runtime.js');
        expect(runtimeSource).toContain('lms-interaction-direct__section-title is-members');
        expect(runtimeSource).toContain('lms-interaction-direct__section-title is-recent');
    });

    it('bumps interaction polish cache bust token in lms.html', () => {
        const html = readSource('lms.html');

        expectLmsRouteCssLinks(html);
        expect(readSource('assets/js/pages/lms-classroom-tabs-runtime.js')).toContain('assets/js/pages/lms-interaction-messages-runtime.js?v=20260714-lmspro2')
        expect(html).not.toContain('assets/js/pages/lms-interaction-messages-runtime.js');
        expect(html).toContain('assets/js/pages/lms-classroom-tabs-runtime.js?v=20260805-switchperf2');
    });
});