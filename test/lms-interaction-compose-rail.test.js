import { describe, expect, it } from 'vitest';
import { readLmsInteractionSource, readLmsInteractionShellRuntime } from './helpers/lms-interaction-source.js';
import { expectLmsRouteCssLinks } from './helpers/lms-route-css.js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('LMS interaction compose rail', () => {
    it('renders compose picker inside the left rail with separate composeSearch state', () => {
        const runtimeSource = readSource('assets/js/pages/lms-interaction-messages-runtime.js');

        expect(runtimeSource).toContain('composeSearch: \'\'');
        expect(runtimeSource).toContain('function renderLmsInteractionComposeRail');
        expect(runtimeSource).toContain('function renderLmsInteractionRailHead');
        expect(runtimeSource).toContain('data-lms-interaction-region="compose-rail"');
        expect(runtimeSource).toContain('lms-interaction-direct__compose-sheet');
        expect(runtimeSource).toContain('lms-interaction-direct__rail-body');
        expect(runtimeSource).toContain('ui.composeSearch = inputEl.value');
        expect(runtimeSource).not.toContain('renderLmsInteractionComposeModal');
        expect(runtimeSource).not.toContain('data-lms-interaction-region="compose-modal"');
    });

    it('styles rail-embedded compose sheet with wider rail and scrollable lists', () => {
    });

    it('bumps interaction compose cache bust token in lms.html', () => {
        const html = readSource('lms.html');

        expectLmsRouteCssLinks(html);
        expect(readSource('assets/js/pages/lms-classroom-tabs-runtime.js')).toContain('assets/js/pages/lms-interaction-messages-runtime.js?v=20260714-lmspro2')
        expect(html).not.toContain('assets/js/pages/lms-interaction-messages-runtime.js');
    });
});
