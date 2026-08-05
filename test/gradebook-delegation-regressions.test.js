import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('gradebook delegation regressions', () => {
    it('keeps gradebook history, roster, and staff actions on delegated handlers', () => {
        const source = [
            'assets/js/pages/gradebook-model.js',
            'assets/js/pages/gradebook-workspace.js',
            'assets/js/pages/gradebook-staff.js',
            'assets/js/pages/gradebook-weights-runtime.js',
            'assets/js/pages/gradebook-history-ui-runtime.js',
            'assets/js/pages/gradebook-components-runtime.js',
            'assets/js/pages/gradebook-quiz-map-runtime.js'
        ].map(readSource).join('\n');

        expect(source).toContain("event.target.closest('[data-gradebook-click], [data-gradebook-action]')");
        expect(source).toContain('data-gradebook-click="open-section"');
        expect(source).toContain('data-gradebook-click="open-history"');
        expect(source).toContain('data-gradebook-click="preview-student"');
        expect(source).toContain('data-gradebook-click="open-score-edit"');
        expect(source).toContain('data-gradebook-click="save-entry"');
        expect(source).toContain('data-gradebook-click="remove-entry"');
        expect(source).toContain('data-gradebook-click="toggle-history"');
        expect(source).toContain('data-gradebook-click="remove-custom-section"');
        expect(source).toContain('data-gradebook-click="create-entry"');
        expect(source).toContain('data-gradebook-click="create-named-attempt"');
        expect(source).toContain('data-gradebook-click="pending-queue"');
        expect(source).toContain('data-gradebook-click="export-csv"');
        expect(source).toContain('data-gradebook-click="publish"');
        expect(source).toContain('data-gradebook-click="finalize"');
        expect(source).toContain('data-gradebook-assessment-target="criterion"');
        expect(source).toContain('data-gradebook-assessment-target="number"');
        expect(source).toContain('class="lms-route-panel lms-route-panel-pad-16-20 gb-staff-hero"');
        expect(source).toContain('class="lms-route-panel lms-route-panel-compact gb-staff-control-card"');
        expect(source).toContain('gb-staff-linked-small is-');
        expect(source).toContain('gb-modern-card gb-weight-card');
        expect(source).toContain('gb-modern-card');
        expect(source).toContain('gb-modern-hero');
        expect(source).toContain('gb-roster-card');
        expect(source).toContain('gb-roster-kv');
        expect(source).toContain('gb-roster-linked-summary');
        expect(source).not.toContain('onclick=');
        expect(source).not.toContain('onchange=');
        expect(source).not.toContain('oninput=');
    });

    it('lazy-loads quiz review runtime before opening linked quiz papers', () => {
        const workspace = readSource('assets/js/pages/gradebook-workspace.js');

        expect(workspace).toContain('ensureGradebookLinkedQuizRuntime');
        expect(workspace).toContain('GRADEBOOK_LINKED_QUIZ_MODULE_URLS');
        expect(workspace).toContain('lms-quiz-workspace-session-runtime.js');
        expect(workspace).toContain('openStudentQuizPaperFromHistoryDeferred');
        expect(workspace).not.toContain('Student quiz paper history is not ready yet.');
    });
});
