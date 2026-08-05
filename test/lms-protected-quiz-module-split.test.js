import { describe, expect, it } from 'vitest';

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('LMS protected quiz module split', () => {
    it('moves protected quiz launch/runtime helpers out of lms.js and into the dedicated module', () => {
        const lmsHtml = readSource('lms.html');
        const lmsSource = readSource('assets/js/pages/lms.js');
        const protectedQuizRuntimeSource = readSource('assets/js/pages/lms-protected-quiz-runtime.js');

        expect(lmsHtml).not.toContain('assets/js/pages/lms-protected-quiz-runtime.js');
        const classroomSource = readSource('assets/js/pages/lms-classroom-tabs-runtime.js');
        expect(classroomSource).toContain('assets/js/pages/lms-protected-quiz-runtime.js?v=20260729-lmsassignfix1');
        expect(classroomSource).toContain('function ensureLmsQuizRuntime()');
        expect(protectedQuizRuntimeSource).toContain('function getProtectedQuizLaunchParams()');
        expect(protectedQuizRuntimeSource).toContain('function getProtectedQuizClientRuntime()');
        expect(protectedQuizRuntimeSource).toContain('async function refreshProtectedQuizClientRuntime(force = false)');
        expect(protectedQuizRuntimeSource).toContain('async function launchProtectedQuizInAntiCheat(resourceKey, quizId)');
        expect(protectedQuizRuntimeSource).toContain('openProtectedQuizLaunchPopup({');
        expect(protectedQuizRuntimeSource).not.toMatch(
            /launchProtectedQuizInAntiCheat[\s\S]*openAntiCheatDesktopApp\(\);[\s\S]*alert\(`Protected quizzes only open/
        );
        expect(protectedQuizRuntimeSource).toContain('window.attemptProtectedAppLaunch = attemptProtectedAppLaunch');
        expect(protectedQuizRuntimeSource).toContain('frame.hidden = true;');
        expect(protectedQuizRuntimeSource).toContain('link.hidden = true;');
        expect(protectedQuizRuntimeSource).toContain('function renderProtectedQuizLaunchShell(resourceKey, quiz, subjectLabel, groupLabel)');
        expect(protectedQuizRuntimeSource).toContain('function bootstrapProtectedQuizRouteFromUrl()');
        expect(protectedQuizRuntimeSource).toContain('function schedulePendingProtectedQuizLaunchResume()');
        expect(protectedQuizRuntimeSource).toContain('const PROTECTED_QUIZ_MONITOR_REFRESH_MS = 5000;');
        expect(protectedQuizRuntimeSource).toContain('function stopProtectedQuizMonitorAutoRefresh()');
        expect(protectedQuizRuntimeSource).toContain('function armProtectedQuizMonitorAutoRefresh(courseKey)');
        expect(protectedQuizRuntimeSource).toContain('async function refreshProtectedQuizMonitorLiveData(force = false)');
        expect(protectedQuizRuntimeSource).toContain('async function performProtectedMonitoringAction(resourceKey, quizId, studentId, action)');
        expect(protectedQuizRuntimeSource).toContain('async function renderLmsMonitoringSection(courseId, options = {})');
        expect(protectedQuizRuntimeSource).toContain('monitorOverride: monitor');
        expect(protectedQuizRuntimeSource).toContain('refreshProtectedQuizMonitorLiveData(true)');
        expect(protectedQuizRuntimeSource).toContain('window.refreshProtectedQuizMonitorLiveData = refreshProtectedQuizMonitorLiveData');
        expect(protectedQuizRuntimeSource).toContain('lms-protected-launch-shell');
        expect(protectedQuizRuntimeSource).toContain('function renderProtectedQuizLaunchShell(resourceKey, quiz, subjectLabel, groupLabel)');
        expect(protectedQuizRuntimeSource).toContain('class="lms-student-quiz-cover"');
        expect(protectedQuizRuntimeSource).toContain('lms-protected-launch-inner');
        expect(protectedQuizRuntimeSource).toContain('lms-protected-launch-title');
        expect(protectedQuizRuntimeSource).toContain('lms-protected-launch-copy');
        expect(protectedQuizRuntimeSource).toContain('lms-protected-launch-support-copy');
        expect(protectedQuizRuntimeSource).toContain('lms-protected-launch-actions');
        expect(protectedQuizRuntimeSource).toContain('lms-protected-launch-action-btn is-open-browser');
        expect(protectedQuizRuntimeSource).toContain('lms-protected-launch-action-btn is-open-app');
        expect(protectedQuizRuntimeSource).not.toContain('kiu-btn');
        expect(protectedQuizRuntimeSource).toContain('lms-protected-launch-action-btn is-install');
        expect(protectedQuizRuntimeSource).toContain('lms-protected-monitor-page-shell');
        expect(protectedQuizRuntimeSource).toContain('lms-protected-monitor-page-head');
        expect(protectedQuizRuntimeSource).toContain('lms-protected-monitor-page-title');
        expect(protectedQuizRuntimeSource).toContain('lms-protected-monitor-shell');
        expect(protectedQuizRuntimeSource).toContain('lms-protected-monitor-shell-head');
        expect(protectedQuizRuntimeSource).toContain('lms-protected-monitor-shell-title');
        expect(protectedQuizRuntimeSource).toContain('lms-protected-monitor-shell-list');
        expect(protectedQuizRuntimeSource).toContain('lms-protected-monitor-status-line');
        expect(protectedQuizRuntimeSource).toContain('lms-protected-monitor-latest-copy');
        expect(protectedQuizRuntimeSource).toContain('lms-protected-monitor-pill is-warning-count');
        expect(protectedQuizRuntimeSource).toContain('lms-protected-monitor-pill is-violation-count');
        expect(protectedQuizRuntimeSource).toContain('lms-protected-monitor-pill ${attempt.antiCheatConnected ? \'is-connected\' : \'is-disconnected\'}');
        expect(protectedQuizRuntimeSource).toContain('lms-protected-monitor-shell-pill is-students');
        expect(protectedQuizRuntimeSource).toContain('lms-protected-monitor-shell-pill is-live');
        expect(protectedQuizRuntimeSource).toContain('lms-protected-monitor-action-btn is-block');
        expect(protectedQuizRuntimeSource).toContain('lms-protected-monitor-action-btn is-force-submit');
        expect(protectedQuizRuntimeSource).toContain('lms-protected-monitor-action-btn is-approve-reconnect');
        expect(protectedQuizRuntimeSource).toContain('lms-protected-monitor-action-btn is-refresh');
        expect(protectedQuizRuntimeSource).toContain('lms-protected-monitor-details');
        expect(protectedQuizRuntimeSource).toContain('lms-protected-monitor-metrics');
        expect(protectedQuizRuntimeSource).toContain('lms-protected-monitor-audit-title');
        expect(protectedQuizRuntimeSource).toContain('lms-protected-monitor-audit-item');
        expect(protectedQuizRuntimeSource).toContain('lms-protected-monitor-audit-copy');
        expect(protectedQuizRuntimeSource).toContain('lms-protected-monitor-audit-meta');
        expect(protectedQuizRuntimeSource).toContain('class="lms-protected-monitor-audit-empty">No audit trail yet.</div>');
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
