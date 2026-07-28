const { readFileSync } = require('fs');
const { join } = require('path');
const vm = require('vm');

function loadStudyCardHelpers(extra = {}) {
    const refsSource = readFileSync(join(process.cwd(), 'assets/js/shared/student-schedule-refs.js'), 'utf8');
    const KIU_STATE = {
        availableGroups: {
            'ECON-101': [{ id: 'G1', name: 'Group A', prof: 'Dr. Smith' }]
        },
        curriculum: [],
        ...(extra.KIU_STATE || {})
    };
    const sandbox = {
        KIU_STATE,
        window: {},
        document: {
            readyState: 'complete',
            addEventListener() {},
            getElementById: () => null,
            querySelectorAll: () => []
        },
        toDomToken: (value) => String(value || '').replace(/[^a-zA-Z0-9_-]+/g, '_'),
        normalizeIdentifier: (value) => String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, ''),
        canonicalCourseKey: (value) => String(value || '').trim().toLowerCase(),
        console: { error() {} },
        USER_ROLES: { STUDENT: 'student' },
        ...extra
    };
    sandbox.window = sandbox;
    vm.runInNewContext(refsSource, sandbox);
    return sandbox;
}

describe('study card schedule normalization', () => {
    it('resolves object groupId into stable id and group name', () => {
        const ctx = loadStudyCardHelpers();
        const refs = ctx.resolveStudyCardScheduleRefs({
            courseId: 'ECON-101',
            groupId: { id: 'G1', name: 'Group A', prof: 'Dr. Smith' }
        });

        expect(refs.courseId).toBe('ECON-101');
        expect(refs.groupId).toBe('G1');
        expect(refs.groupName).toBe('Group A');
        expect(refs.professorLabel).toBe('Dr. Smith');
    });

    it('repairs legacy map schedule entries with embedded group objects', () => {
        const ctx = loadStudyCardHelpers();
        const refs = ctx.resolveStudyCardScheduleRefs({
            courseId: 'ECON-101',
            groupId: { id: 'G1', name: 'Group A' }
        });

        expect(refs.courseId).toBe('ECON-101');
        expect(refs.groupId).toBe('G1');
        expect(refs.groupName).toBe('Group A');
    });

    it('infers courseId from availableGroups when schedule key is invalid', () => {
        const ctx = loadStudyCardHelpers();
        const refs = ctx.resolveStudyCardScheduleRefs({
            courseId: '0',
            groupId: { id: 'G1', name: 'Group A' }
        });

        expect(refs.courseId).toBe('ECON-101');
        expect(refs.groupId).toBe('G1');
    });

    it('builds dom tokens without object stringification artifacts', () => {
        const ctx = loadStudyCardHelpers();
        const token = ctx.studyCardDomToken({ id: 'G1', name: 'Group A' });

        expect(token).toBe('Group_A');
        expect(token).not.toContain('object_Object');
        expect(ctx.studyCardDomToken('G1')).toBe('G1');
    });
});
