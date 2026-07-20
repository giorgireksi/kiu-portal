import { describe, expect, it } from 'vitest';
import { expectLmsRouteCssLinks } from './helpers/lms-route-css.js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('LMS interaction UI regressions', () => {
    it('uses organized messenger layout and CSS-managed interaction transparency', () => {
        const html = readSource('lms.html');
        const classroomSource = readSource('assets/js/pages/lms-classroom-tabs-runtime.js');
        const runtimeSource = readSource('assets/js/pages/lms-interaction-messages-runtime.js');
        const utilitiesSource = readSource('assets/js/shared/utilities.js');

        expectLmsRouteCssLinks(html);
        expect(readSource('assets/js/pages/lms-classroom-tabs-runtime.js')).toContain('assets/js/pages/lms-interaction-messages-runtime.js')
        expect(html).not.toContain('assets/js/pages/lms-interaction-messages-runtime.js');
        expect(html).toContain('assets/js/pages/lms-classroom-tabs-runtime.js');

        expect(classroomSource).toContain('lms-interaction-messenger__toolbar');
        expect(classroomSource).toContain('lms-interaction-messenger__toolbar-modes');
        expect(classroomSource).toContain('removeOrphanLmsInteractionMessengerSections');
        expect(classroomSource).toContain('lms-route-empty--interaction');
        expect(classroomSource).toContain('lms-interaction-empty-cta');
        expect(classroomSource).toContain('Switch to Messages for class chat and attachments');
        expect(classroomSource).not.toContain('lms-interaction-compose-attach');

        expect(runtimeSource).toContain('lms-interaction-messenger__body');
        expect(runtimeSource).toContain('resolveDefaultLmsInteractionMode');
        expect(runtimeSource).toContain('lms-interaction-mode-switch__btn');
        expect(runtimeSource).toContain('data-lms-interaction-action="pick-file"');
        expect(runtimeSource).toContain('data-lms-interaction-action="send-message"');
        expect(runtimeSource).toContain('lms-interaction-direct__thread-head--with-rail');
        expect(runtimeSource).toContain('lms-interaction-direct__log--empty');
        expect(runtimeSource).toContain('lms-interaction-direct__rail-tools');
        expect(runtimeSource).toContain('lms-interaction-direct__compose-label');
        expect(runtimeSource).toContain('lms-interaction-direct__compose-trigger lux-secondary-btn');
        expect(runtimeSource).toContain('class="lms-interaction-compose-send"');
        expect(runtimeSource).toContain('lms-interaction-direct__draft is-empty');
        expect(runtimeSource).not.toContain('No file selected');
        expect(runtimeSource).not.toContain('lms-interaction-direct__rail-title');
        expect(runtimeSource).not.toContain('lux-primary-btn');

        const modeSwitchBlock = runtimeSource.match(/function renderLmsInteractionModeSwitch[\s\S]*?(?=\nfunction )/)?.[0] || '';
        expect(modeSwitchBlock).not.toContain('lms-route-tab-strip');

        // LMS shell is CSS-owned (timetable model). Messenger chrome is not a force-keep host list.
        expect(utilitiesSource).toContain('function shouldKeepLmsFadeCssBackground(el)');
        expect(utilitiesSource).toContain("if (!el.closest?.('#page-lms')) return false;");
        expect(utilitiesSource).toContain("el.classList.contains('lms-route-workspace-chrome')");
        expect(utilitiesSource).not.toContain('lms-interaction-messenger');
        expect(utilitiesSource).not.toContain('lms-interaction-direct__rail');
    });
});