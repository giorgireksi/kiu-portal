import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('student mobility records', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
        vi.resetModules();
    });

    it('documents admin and student mobility wireframes', () => {
        const doc = readSource('docs/student-mobility-wireframe.md');
        expect(doc).toContain('Mobility & transfer');
        expect(doc).toContain('personal-data.html');
        expect(doc).toContain('Exchange incoming');
    });

    it('exposes mobility helpers on StudentsAdminMobility', async () => {
        globalThis.KIU_STATE = { studentAdminProfiles: {} };
        globalThis.KIU_EMPTY_STATE = { facultyProfiles: {} };
        await import('../assets/js/pages/students-admin-lms.js');

        const api = globalThis.StudentsAdminMobility;
        expect(api).toBeTruthy();

        const legacy = api.normalizeStudentMobility({ enrollmentType: 'Exchange Student' });
        expect(legacy.category).toBe('exchange_incoming');
        expect(legacy.direction).toBe('incoming');

        const outgoing = api.normalizeStudentMobility({ mobility: { category: 'exchange_outgoing' } });
        expect(api.matchesMobilityFilter({ mobility: outgoing }, 'exchange_outgoing')).toBe(true);
        expect(api.matchesMobilityFilter({ mobility: outgoing }, 'exchange_incoming')).toBe(false);

        const internal = api.normalizeStudentMobility({ mobility: { category: 'internal_transfer' } });
        expect(api.matchesMobilityFilter({ mobility: internal }, 'internal_transfer')).toBe(true);
        expect(api.mobilityBadgeLabel({ id: '1', mobility: internal })).toBe('Internal transfer');
    });

    it('includes mobility form and filter hooks in students admin LMS', () => {
        const source = readSource('assets/js/pages/students-admin-lms.js');
        expect(source).toContain('id="form-mobility-category"');
        expect(source).toContain('id="students-lms-mobility"');
        expect(source).toContain("['mobility', 'Mobility']");
        expect(source).toContain('renderMobilityTab');
        expect(source).toContain('Mobility Category');
    });

    it('includes mobility element IDs on personal-data.html', () => {
        const html = readSource('personal-data.html');
        expect(html).toContain('id="personal-data-mobility-status"');
        expect(html).toContain('id="personal-data-home-institution"');
        expect(html).toContain('id="personal-data-mobility-period"');
        expect(html).toContain('id="personal-data-agreement-ref"');
        expect(html).toContain('?v=20260531-mobility1');
    });

    it('renders personal data mobility from studentAdminProfiles', () => {
        globalThis.KIU_STATE = {
            studentAdminProfiles: {
                '40012': {
                    mobility: {
                        category: 'exchange_incoming',
                        direction: 'incoming',
                        homeInstitution: 'University of X',
                        startDate: '2026-09-01',
                        endDate: '2027-01-31',
                        agreementRef: 'BLA-2026'
                    }
                }
            },
            tuitionBalances: {},
            probationStatus: {}
        };
        globalThis.USER_ROLES = { STUDENT: 'student' };
        globalThis.getCurrentFaculty = () => 'CS';
        globalThis.getFacultyProfile = () => ({ name: 'CS' });
        globalThis.getFacultyLabel = () => 'CS';
        globalThis.getProgramLabelForUser = () => 'BSc CS';
        globalThis.getAcademicLevelLabel = () => 'Year 2';
        globalThis.getUserPerformanceSummary = () => ({
            primary: 'Semester 2',
            secondary: '3.2',
            tertiary: '60',
            quaternary: 'B'
        });
        globalThis.getStudentAdmissionDate = () => '2024-09-01';
        globalThis.getCurrentAcademicTermLabel = () => 'Spring 2026';
        globalThis.getStudentPersonalDataRecordLabel = () => 'Active';
        globalThis.getStudentRegisteredEctsTotal = () => 30;
        globalThis.getEffectiveTuitionBalance = () => 0;
        globalThis.formatPersonalDataDate = value => value;

        document.body.innerHTML = `
            <div id="page-personal-data">
                <div id="personal-data-mobility-group"></div>
                <p id="personal-data-mobility-muted" hidden></p>
                <div id="personal-data-mobility-fields"></div>
                <strong id="personal-data-mobility-status"></strong>
                <strong id="personal-data-home-institution"></strong>
                <strong id="personal-data-mobility-period"></strong>
                <strong id="personal-data-agreement-ref"></strong>
                <div id="personal-data-records-body"></div>
            </div>
        `;

        const pageSource = readSource('assets/js/pages/personal-data-page.js');
        new Function(pageSource)();
        globalThis.renderPersonalDataPageContext(
            { id: '40012', role: 'student', name: 'Test', status: 'Active' },
            { name: 'CS' }
        );

        expect(document.getElementById('personal-data-mobility-status').textContent).toContain('Exchange student');
        expect(document.getElementById('personal-data-home-institution').textContent).toBe('University of X');
        expect(document.getElementById('personal-data-agreement-ref').textContent).toBe('BLA-2026');
    });
});
