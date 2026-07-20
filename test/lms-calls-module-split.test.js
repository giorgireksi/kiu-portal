import { describe, expect, it } from 'vitest';

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('LMS calls module split', () => {
    it('moves LMS classroom and calls helpers out of lms.js and into the dedicated runtime module', () => {
        const lmsHtml = readSource('lms.html');
        const lmsSource = readSource('assets/js/pages/lms.js');
        const callsSource = readSource('assets/js/pages/lms-calls-runtime.js');
        expect(lmsHtml).not.toContain('assets/js/pages/lms-calls-runtime.js');
        const classroomSource = readSource('assets/js/pages/lms-classroom-tabs-runtime.js');
        expect(classroomSource).toContain('assets/js/pages/lms-calls-runtime.js?v=20260518-lmscalls1');
        expect(classroomSource).toContain('function ensureLmsCallsRuntime()');
        expect(callsSource).toContain('const lmsClassLocalMediaRuntime = {');
        expect(callsSource).toContain('function getLmsCurrentUserForCalls()');
        expect(callsSource).toContain('function normalizeLmsClassSession(session = {}, resourceKey = \'\')');
        expect(callsSource).toContain('function ensureLmsClassSessionsForKey(resourceKey)');
        expect(callsSource).toContain('function buildLmsCallSessionCard(session, resourceKey, parsed)');
        expect(callsSource).toContain('function renderLmsCallsSection(courseId)');
        expect(callsSource).toContain('function startLmsClassCall(courseId)');
        expect(callsSource).toContain('function joinLmsClassCall(sessionId)');
        expect(callsSource).toContain('function endLmsClassCall(sessionId)');
        expect(callsSource).toContain('function publishLmsClassRecording(sessionId)');
        expect(callsSource).toContain('function copyLmsClassCallInvite(sessionId)');
        expect(callsSource).toContain('class="lms-route-card-title lms-route-copy-mt-8"');
        expect(callsSource).toContain('class="lms-route-copy lms-route-copy-mt-6"');
        expect(callsSource).toContain('class="lms-route-card-head lms-route-card-head-mb-16"');
        expect(callsSource).toContain('class="lms-route-actions lms-route-actions-mt-16"');
        expect(callsSource).toContain('class="lms-route-panel lms-route-panel-pad-16-20"');
        expect(callsSource).toContain('class="lms-route-panel lms-route-panel-compact"');
        expect(callsSource).toContain('class="lms-route-inline lms-route-inline-center lms-route-inline-gap-12"');
        expect(callsSource).toContain('class="fas fa-video lms-route-lead-icon"');
        expect(callsSource).toContain('class="lms-route-inline lms-route-inline-gap-8"');
        expect(callsSource).toContain('class="lms-route-panel lms-route-panel-compact lms-call-classroom is-');
        expect(callsSource).toContain('class="lms-route-stack lms-route-stack-gap-16"');
        expect(callsSource).toContain('class="lms-route-card lms-route-panel-compact lms-call-stage"');
        expect(callsSource).toContain('class="lms-route-card lms-route-panel-compact lms-call-side-card"');
        expect(callsSource).toContain('class="lms-route-card lms-route-panel-compact lms-call-collab-panel"');
        expect(callsSource).toContain('class="lms-route-card lms-route-panel-compact lms-call-post"');
        expect(callsSource).toContain('class="lms-route-card lms-route-panel-compact lms-call-roster"');
        expect(callsSource).not.toContain('class="lms-call-create"');
        expect(callsSource).not.toContain('class="lms-call-card lms-call-classroom');
        expect(callsSource).not.toContain('class="lms-call-session-list"');
        expect(callsSource).not.toContain('class="lms-call-stage"');
        expect(callsSource).not.toContain('class="lms-call-side-card"');
        expect(callsSource).not.toContain('class="lms-call-collab-panel"');
        expect(callsSource).not.toContain('class="lms-call-post"');
        expect(callsSource).not.toContain('class="lms-call-roster"');
        expect(callsSource).not.toContain('style="margin-top:8px;"');
        expect(callsSource).not.toContain('style="margin-top:6px;"');
        expect(callsSource).not.toContain('style="margin-top:4px;"');
        expect(callsSource).not.toContain('style="margin-top:16px;"');
        expect(callsSource).not.toContain('style="margin-bottom:16px;"');
        expect(callsSource).not.toContain('style="padding:16px 20px;"');
        expect(callsSource).not.toContain('style="display:flex;align-items:center;gap:12px;"');
        expect(callsSource).not.toContain('style="display:flex;gap:8px;flex-wrap:wrap;"');
        expect(callsSource).not.toContain('style="font-size:18px;color:var(--lux-accent-2);"');

        expect(lmsSource).not.toContain('const lmsClassLocalMediaRuntime = {');
        expect(lmsSource).not.toContain('function getLmsCurrentUserForCalls()');
        expect(lmsSource).not.toContain('function normalizeLmsClassSession(session = {}, resourceKey = \'\')');
        expect(lmsSource).not.toContain('function ensureLmsClassSessionsForKey(resourceKey)');
        expect(lmsSource).not.toContain('function buildLmsCallSessionCard(session, resourceKey, parsed)');
        expect(lmsSource).not.toContain('function renderLmsCallsSection(courseId)');
        expect(lmsSource).not.toContain('function startLmsClassCall(courseId)');
        expect(lmsSource).not.toContain('function joinLmsClassCall(sessionId)');
        expect(lmsSource).not.toContain('function endLmsClassCall(sessionId)');
        expect(lmsSource).not.toContain('function publishLmsClassRecording(sessionId)');
        expect(lmsSource).not.toContain('function copyLmsClassCallInvite(sessionId)');
    });
});
