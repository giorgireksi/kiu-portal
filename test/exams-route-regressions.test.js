import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('exams route regressions', () => {
    it('keeps exams free of dead social helper imports and mobile-nav polling waits', () => {
        const html = readSource('exams.html');
        const examsConsole = readSource('assets/js/pages/exams-console.js');
        const examsAdmin = readSource('assets/js/pages/exams-console-admin.js');
        const examsAttempts = readSource('assets/js/pages/exams-console-attempts.js');

        expect(html).not.toContain('assets/js/shared/social-hub.js');
        expect(html).not.toContain('assets/js/shared/social-render.js');
        expect(html).not.toContain('assets/js/shared/social-media.js');
        expect(html).not.toContain('assets/js/shared/messenger.js');
        expect(html).toContain('<nav id="prof-nav" aria-label="Professor navigation stub"');
        expect(html).toContain('<nav id="top-nav" aria-label="Top navigation stub"');
        expect(html).toContain('<nav id="admin-nav" aria-label="Admin navigation stub"');
        expect(html).toContain('<nav id="service-nav" aria-label="Student service navigation stub"');
        expect(html).toContain('assets/js/pages/exams-console.js?v=20260504-exams-fade1');
        expect(html).not.toContain('assets/js/pages/exams-console-admin.js');
        expect(html).not.toContain('assets/js/pages/exams-console-attempts.js');
        expect(html).toContain('id="admin-exams-root" class="exams-shell-root"');
        expect(html).toContain('window.__KIU_STANDALONE_MOBILE_SHELL_CONFIG = {');
        expect(html).toContain("activeTarget: 'exams'");
        expect(html).toContain('assets/js/pages/standalone-mobile-shell.js?v=20260520-exams-mobile1');
        expect(html).not.toContain('(function initMobileExperience(){');
        expect(html).not.toContain("setInterval(function(){if(typeof window.navigate==='function')");
        expect(html).toContain('<button class="mob-sheet-btn" type="button" id="mob-act-admin"><span class="mob-sheet-icon"');
        expect(html).not.toContain('<button class="mob-sheet-btn" id="mob-act-admin"><div class="mob-sheet-icon"');
        expect(html).toContain('<button class="mob-sheet-close-btn" type="button" id="mob-sheet-close">');
        expect(examsConsole).not.toContain('transition: all');
        expect(examsConsole).toContain("const MANUAL_TYPES = new Set(['short', 'written']);");
        expect(examsConsole).toContain("const EXAMS_ADMIN_MODULE_URL = 'assets/js/pages/exams-console-admin.js?v=20260516-examsadmin1';");
        expect(examsConsole).toContain('function ensureExamsAdminModule() {');
        expect(examsConsole).toContain('window.__kiuExamsAdminHooks = window.__kiuExamsAdminHooks || {};');
        expect(examsConsole).toContain("const EXAMS_ATTEMPTS_MODULE_URL = 'assets/js/pages/exams-console-attempts.js?v=20260516-examsattempts1';");
        expect(examsConsole).toContain('function ensureExamsAttemptsModule() {');
        expect(examsConsole).toContain('window.__kiuExamsAttemptsHooks = window.__kiuExamsAttemptsHooks || {};');
        expect(examsConsole).toContain('function renderExamModalShell({ modalKey, title, icon, tone = \'accent\', body })');
        expect(examsConsole).toContain('function bindConsoleEvents(root) {');
        expect(examsConsole).toContain("const closeAction = normalizedKey === 'return' ? 'close-return-modal' : 'close-share-modal';");
        expect(examsConsole).toContain("if (action === 'close-share-modal') return closeShareModalInternal();");
        expect(examsConsole).toContain("if (action === 'close-return-modal') return closeReturnModalInternal();");
        expect(examsConsole).toContain('data-exam-action="share-with-staff"');
        expect(examsConsole).toContain('data-exam-input="share-search"');
        expect(examsConsole).not.toContain('onclick="if(event.target===this)closeShareModal()"');
        expect(examsConsole).not.toContain('onclick="if(event.target===this)closeReturnModal()"');
        expect(examsConsole).not.toContain("style=\"background:linear-gradient(135deg,#d68a11,#c47a0a);\"");
        expect(examsConsole).toContain(".ex2-modal-head.is-warm");
        expect(examsConsole).toContain("body[data-lux-performance='efficient'].lux-route-exams #${ROOT_ID} .ex2-modal-overlay {");
        expect(examsConsole).toContain("window.selectExamSession = async function selectExamSession(sessionId, targetTab = runtime.activeTab) {");
        expect(examsConsole).toContain("await loadAttemptsForSession(normalizedSessionId, { force: false });");
        expect(examsConsole).toContain('const hasActiveDraft = runtime.templateDraft !== null;');
        expect(examsConsole).toContain("${hasActiveDraft ? renderTemplateBuilder() : renderTemplateList()}");
        expect(examsConsole).toContain(": runtime.activeTab === 'review' ? renderReviewTab()");
        expect(examsConsole).toContain(": runtime.activeTab === 'schedule' ? renderScheduleBoard()");
        expect(examsConsole).toContain(": runtime.activeTab === 'live' ? renderLiveTab()");
        expect(examsConsole).toContain(': renderResultsTab()}');
        expect(examsConsole).toContain('function renderExamsAttemptsLoadingPanel(title, description) {');
        expect(examsConsole).toContain('function renderAdminLoadingPanel(title, description) {');
        expect(examsAdmin).toContain('window.renderExamReviewTab = function renderExamReviewTab() {');
        expect(examsAdmin).toContain('window.renderExamScheduleBoard = function renderExamScheduleBoard() {');
        expect(examsAdmin).toContain('data-exam-input="return-note"');
        expect(examsAdmin).toContain("data-exam-action=\"close-return-modal\"");
        expect(examsAttempts).toContain('window.renderExamLiveTab = function renderExamLiveTab() {');
        expect(examsAttempts).toContain('window.renderExamResultsTab = function renderExamResultsTab() {');
        expect(examsAttempts).toContain('function renderAttemptRows(session, mode) {');
        expect(examsAttempts).toContain('function renderManualGradeCell(session, student, attempt) {');
    });
});
