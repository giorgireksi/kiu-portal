import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { normalizeWhiteboardElement } from '../backend/platform/domains/lms-whiteboard-service.js';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('LMS whiteboard legacy template flatten', () => {
    it('strips template metadata from workspace elements on load', () => {
        const workspace = readSource('assets/js/pages/lms-whiteboard-workspace-runtime.js');
        expect(workspace).toContain('function flattenLmsWhiteboardLegacyTemplateElements');
        expect(workspace).toContain('delete activity.breakouts');
        expect(workspace).toContain('delete activity.frameSnapshots');
        expect(workspace).toContain('flattenLmsWhiteboardLegacyTemplateElements(workspace)');
    });

    

    it('does not load template scripts in lms.html', () => {
        const html = readSource('lms.html');
        expect(html).not.toContain('lms-whiteboard-template-logic.js');
        expect(html).not.toContain('lms-whiteboard-activity-runtime.js');
        expect(readSource('assets/js/pages/lms-classroom-tabs-runtime.js')).toContain('assets/js/pages/lms-whiteboard-workspace-runtime.js?v=20260710-personal-autosave1');
    });
});