import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

function readBuffer(relativePath) {
    return readFileSync(join(process.cwd(), relativePath));
}

describe('study-card route regressions', () => {
    it('keeps study-card free of dead page-pack imports, polling waits, and route-local inline handlers', () => {
        const html = readSource('study-card.html');
        const studyCardPage = readSource('assets/js/pages/study-card-page.js');
        const ui = readSource('assets/js/features/ui.js');
        const navigation = readSource('assets/js/features/navigation.js');
        const registration = readSource('assets/js/pages/registration.js');
        const personalDataPage = readSource('assets/js/pages/personal-data-page.js');

        expect(html).not.toContain('assets/js/shared/social-hub.js');
        expect(html).not.toContain('assets/js/shared/social-render.js');
        expect(html).not.toContain('assets/js/shared/social-media.js');
        expect(html).not.toContain('assets/js/shared/messenger.js');
        expect(html).not.toContain('assets/js/pages/lms.js');
        expect(html).not.toContain('assets/js/pages/registration.js');
        expect(html).not.toContain('assets/js/pages/directories.js');
        expect(html).not.toContain('assets/js/pages/student-registration.js');
        expect(html).not.toContain('assets/js/pages/admin-registration.js');
        expect(html).not.toContain('assets/js/pages/planner.js');
        expect(html).toContain('assets/js/pages/gradebook.js?v=20260430-lmsgrades1');
        expect(html).toContain('assets/js/pages/study-card-page.js?v=20260515-studycard-page1');
        expect(html).toContain('data-modal-close');
        expect(html).toContain('id="modal-overlay"');
        expect(html).not.toContain('id="modal-announcement"');
        expect(html).not.toContain('id="modal-event"');
        expect(html).not.toContain('id="modal-syllabus"');
        expect(html).not.toContain('id="modal-programs"');
        expect(html).not.toContain('id="modal-program-courses"');
        expect(html).toContain('<nav id="prof-nav" aria-label="Professor navigation stub"');
        expect(html).toContain('<nav id="top-nav" aria-label="Top navigation stub"');
        expect(html).toContain('<nav id="admin-nav" aria-label="Admin navigation stub"');
        expect(html).toContain('class="filter-shell study-card-filter-shell"');
        expect(html).toContain('class="study-card-filter-actions"');
        expect(html).toContain('<button type="button" class="lux-secondary-btn" aria-label="List view">');
        expect(html).toContain('<button type="button" class="lux-primary-btn" aria-label="Calendar view">');
        expect(html).toContain("function ensureNavigateHooks(){if(typeof window.navigate!=='function')return false;hookNav();buildRoleNav();return true}");
        expect(html).toContain("window.addEventListener('load',ensureNavigateHooks,{once:true});");
        expect(html).not.toContain("setInterval(function(){if(typeof window.navigate==='function')");
        expect(html).not.toContain('onclick=');
        expect(html).not.toContain('onchange=');
        expect(html).not.toContain('oninput=');
        expect(html).toContain('<button class="mob-sheet-btn" type="button" id="mob-act-admin"><span class="mob-sheet-icon"');
        expect(html).not.toContain('<button class="mob-sheet-btn" id="mob-act-admin"><div class="mob-sheet-icon"');
        expect(ui).toContain('function ensureModalScaffold(type)');
        expect(ui).toContain('function ensureSyllabusModal()');
        expect(ui).toContain('function ensureProgramsModal()');
        expect(ui).toContain('data-show-program-courses="1"');

        expect(studyCardPage).toContain('function getStudyCardCourseEctsValue(course)');
        expect(studyCardPage).toContain('function ensureStudyCardAssessmentEntryDisplayContext()');
        expect(studyCardPage).toContain("window.resolveLmsQuizSourceFromAssessmentEntry = function resolveLmsQuizSourceFromAssessmentEntry(entry = {})");
        expect(studyCardPage).toContain("window.getAssessmentEntryDisplayContext = function getAssessmentEntryDisplayContext(criterion, entry = {})");
        expect(studyCardPage).toContain('function getStudyCardEnrolledStudentsForGroup(courseId, groupId)');
        expect(studyCardPage).toContain('function resolveStudyCardRosterKey(courseId, groupId, enrolledStudents = [])');
        expect(studyCardPage).toContain('function bindStudyCardAssessmentDelegates()');
        expect(studyCardPage).toContain('function ensureStudyCardContentShell(container)');
        expect(studyCardPage).toContain('function renderStudyCardSummaryRegion(context)');
        expect(studyCardPage).toContain('function renderStudyCardTermsRegion(context)');
        expect(studyCardPage).toContain('study-card-summary-region');
        expect(studyCardPage).toContain('study-card-terms-region');
        expect(studyCardPage).toContain('window.__studyCardAssessmentCache = termsRender.assessmentWindowCache;');
        expect(studyCardPage).toContain('window.renderStudyCard = renderStudyCard;');
        expect(studyCardPage).toContain('data-study-card-assessment-close');
        expect(studyCardPage).toContain('data-study-card-assessment-key="${escapeHtml(assessmentCacheKey)}"');
        expect(studyCardPage).not.toContain("onclick='openStudyCardAssessmentWindow(");
        expect(studyCardPage).not.toContain('onclick="closeStudyCardAssessmentWindow()"');
        expect(studyCardPage).toContain('study-card-semester-table');
        expect(studyCardPage).toContain('study-card-assessment-window');

        expect((registration.match(/if \(typeof renderStudyCard === 'function'\) renderStudyCard\(\);/g) || [])).toHaveLength(2);
        expect(registration).not.toContain('study-card-semester-table');
        expect(registration).not.toContain('study-card-assessment-window');

        expect(personalDataPage).toContain('function renderPersonalDataIdentitySection(user, facultyProfile)');
        expect(personalDataPage).toContain('function renderPersonalDataSummarySection(user, context)');
        expect(personalDataPage).toContain('function renderPersonalDataRecordsSection(user, context)');
        expect(personalDataPage).not.toContain('study-card-semester-table');
        expect(personalDataPage).not.toContain('study-card-assessment-window');
        expect(personalDataPage).not.toContain('window.renderStudyCard = renderStudyCard;');
        expect(navigation).toContain("'study-card': () => typeof window.renderStudyCard === 'function'");
    });

    it('ships study-card.html without a UTF-8 BOM', () => {
        const buffer = readBuffer('study-card.html');

        expect(buffer[0]).not.toBe(0xef);
        expect(buffer[1]).not.toBe(0xbb);
        expect(buffer[2]).not.toBe(0xbf);
    });
});
