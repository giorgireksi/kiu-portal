import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('LMS protected quiz module split', () => {
    it('moves protected quiz launch/runtime helpers out of lms.js and into the dedicated module', () => {
        const lmsHtml = readSource('lms.html');
        const lmsSource = readSource('assets/js/pages/lms.js');
        const protectedQuizRuntimeSource = readSource('assets/js/pages/lms-protected-quiz-runtime.js');

        expect(lmsHtml).toContain('assets/js/pages/lms-protected-quiz-runtime.js?v=20260518-lmsprotected1');
        expect(protectedQuizRuntimeSource).toContain('function getProtectedQuizLaunchParams()');
        expect(protectedQuizRuntimeSource).toContain('function getProtectedQuizClientRuntime()');
        expect(protectedQuizRuntimeSource).toContain('async function refreshProtectedQuizClientRuntime(force = false)');
        expect(protectedQuizRuntimeSource).toContain('async function launchProtectedQuizInAntiCheat(resourceKey, quizId)');
        expect(protectedQuizRuntimeSource).toContain('function renderProtectedQuizLaunchShell(resourceKey, quiz, subjectLabel, groupLabel)');
        expect(protectedQuizRuntimeSource).toContain('function bootstrapProtectedQuizRouteFromUrl()');
        expect(protectedQuizRuntimeSource).toContain('function schedulePendingProtectedQuizLaunchResume()');
        expect(protectedQuizRuntimeSource).toContain('async function performProtectedMonitoringAction(resourceKey, quizId, studentId, action)');
        expect(protectedQuizRuntimeSource).toContain('async function renderLmsMonitoringSection(courseId)');
        expect(lmsSource).not.toContain('function getProtectedQuizLaunchParams()');
        expect(lmsSource).not.toContain('function getProtectedQuizClientRuntime()');
        expect(lmsSource).not.toContain('async function refreshProtectedQuizClientRuntime(force = false)');
        expect(lmsSource).not.toContain('async function launchProtectedQuizInAntiCheat(resourceKey, quizId)');
        expect(lmsSource).not.toContain('function renderProtectedQuizLaunchShell(resourceKey, quiz, subjectLabel, groupLabel)');
        expect(lmsSource).not.toContain('function bootstrapProtectedQuizRouteFromUrl()');
        expect(lmsSource).not.toContain('async function performProtectedMonitoringAction(resourceKey, quizId, studentId, action)');
        expect(lmsSource).not.toContain('async function renderLmsMonitoringSection(courseId)');
    });
});
