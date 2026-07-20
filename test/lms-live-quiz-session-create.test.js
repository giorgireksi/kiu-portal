import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { createRequire } from 'module';
import { JSDOM } from 'jsdom';

const require = createRequire(import.meta.url);

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('LMS live quiz session create', () => {
    it('exposes New session via dataset resource key and immediate render', () => {
        const uiSource = readSource('assets/js/pages/lms-live-quiz-ui-runtime.js');
        expect(uiSource).toContain('data-lms-resource-key="${escapeHtml(resourceKey)}"');
        expect(uiSource).toContain('data-lms-click="createLmsLiveSession(this.dataset.lmsResourceKey)"');
        expect(uiSource).toContain('renderLmsLiveQuizSection(canonicalKey, { preserveDraft: false, skipLoad: true });');
        expect(uiSource).toContain('function setLmsLiveActiveSession(resourceKey, sessionId)');
        expect(uiSource).toContain('function renderLmsLiveSessionSwitcher(resourceKey, sessions = [], activeSessionId = \'\')');
        expect(uiSource).toContain('lms-route-select');
        expect(uiSource).toContain('data-lux-picker-enhanced="true"');
    });

    it('resolves delegated createLmsLiveSession calls with :: in the resource key', () => {
        const lmsSource = readSource('assets/js/pages/lms.js');
        const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', { url: 'http://127.0.0.1:8876/lms.html' });
        const { window } = dom;
        const calls = [];
        window.createLmsLiveSession = (resourceKey) => {
            calls.push(resourceKey);
        };
        const context = {
            window,
            document: window.document,
            console: window.console
        };
        const runner = new Function(
            'window',
            'document',
            `${lmsSource}
             return {
                splitLmsTopLevel,
                resolveLmsDelegatedExpression,
                executeLmsDelegatedStatement
             };`
        );
        const api = runner(window, window.document);
        const button = window.document.createElement('button');
        button.setAttribute('data-lms-resource-key', 'ECON-01-001::g2__lmssec_lecture');
        api.executeLmsDelegatedStatement(
            'createLmsLiveSession(this.dataset.lmsResourceKey)',
            { stopPropagation() {} },
            button
        );
        expect(calls).toEqual(['ECON-01-001::g2__lmssec_lecture']);
    });

    it('ends any live session before creating a new draft session', () => {
        const uiSource = readSource('assets/js/pages/lms-live-quiz-ui-runtime.js');
        expect(uiSource).toContain('function createLmsLiveSession(resourceKey)');
        expect(uiSource).toMatch(/createLmsLiveSession[\s\S]*?item\.status = 'ended'/);
    });

    it('pins activeSessionId to the live session when remote workspace is applied', () => {
        const workspaceSource = readSource('assets/js/pages/lms-live-quiz-workspace-runtime.js');
        expect(workspaceSource).toContain('if (liveSession) {');
        expect(workspaceSource).toContain('preservedUi.activeSessionId = liveSession.id;');
    });
});