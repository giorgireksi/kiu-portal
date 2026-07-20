import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('LMS whiteboard personal dashboard leak regressions', () => {
    it('blocks personal-key class tab refresh when overlay is closed', () => {
        const workspaceRuntime = readSource('assets/js/pages/lms-whiteboard-workspace-runtime.js');

        expect(workspaceRuntime).toMatch(/invokeRefreshLmsWhiteboardUi[\s\S]*isLmsPersonalBoardKey\(canonicalKey\)[\s\S]*return;/);
        expect(workspaceRuntime).toMatch(/repaintLmsWhiteboardAfterBackendLoad[\s\S]*isLmsPersonalBoardKey\(canonicalKey\)[\s\S]*return;/);
    });

    it('rebinds class whiteboard after personal dashboard close', () => {
        const runtime = readSource('assets/js/pages/lms-personal-dashboard-runtime.js');

        expect(runtime).toContain('reconcileLmsClassWhiteboardAfterPersonalDashboardClose');
        expect(runtime).toMatch(/closeLmsPersonalDashboard[\s\S]*reconcileLmsClassWhiteboardAfterPersonalDashboardClose/);
        expect(runtime).toMatch(/getLmsTabCourseKey\('whiteboard'\)/);
        expect(runtime).toMatch(/forceStructuralRender:\s*true/);
    });

    it('clears staff monitor state on close without autosaving student board', () => {
        const runtime = readSource('assets/js/pages/lms-personal-dashboard-runtime.js');

        expect(runtime).toMatch(/closeLmsPersonalDashboard[\s\S]*LMS_PERSONAL_DASHBOARD\.staffView = null/);
        expect(runtime).toMatch(/closeLmsPersonalDashboard[\s\S]*!wasStaffMonitor[\s\S]*flushLmsPersonalDashboardAutosave/);
    });

    it('avoids class shell fallback for closed personal keys', () => {
        const whiteboardRuntime = readSource('assets/js/pages/lms-whiteboard-runtime.js');

        expect(whiteboardRuntime).toMatch(/getActiveLmsWhiteboardShell[\s\S]*keyIsPersonal[\s\S]*return null/);
        expect(whiteboardRuntime).toMatch(/updateLmsWhiteboardVolatileUi[\s\S]*isLmsPersonalBoardKey\(context\.resourceKey\)[\s\S]*return false/);
    });

    it('aligns banner pills and tools with canEdit', () => {
        const whiteboardRuntime = readSource('assets/js/pages/lms-whiteboard-runtime.js');

        expect(whiteboardRuntime).toMatch(/function renderLmsWhiteboardStatusPills\(workspace[\s\S]*canEdit/);
        expect(whiteboardRuntime).toContain('instructor has not enabled drawing for you');
        expect(whiteboardRuntime).toContain('syncLmsWhiteboardToolEditState');
        expect(whiteboardRuntime).toMatch(/updateLmsWhiteboardSessionChrome[\s\S]*syncLmsWhiteboardToolEditState/);
    });
});