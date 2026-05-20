import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('LMS calls module split', () => {
    it('moves LMS classroom and calls helpers out of lms.js and into the dedicated runtime module', () => {
        const lmsHtml = readSource('lms.html');
        const lmsSource = readSource('assets/js/pages/lms.js');
        const callsSource = readSource('assets/js/pages/lms-calls-runtime.js');

        expect(lmsHtml).toContain('assets/js/pages/lms-calls-runtime.js?v=20260518-lmscalls1');
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
