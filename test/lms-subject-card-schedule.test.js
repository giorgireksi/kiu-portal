const { readFileSync } = require('fs');
const { join } = require('path');
const vm = require('vm');

function loadScheduleRefs(extra = {}) {
    const source = readFileSync(join(process.cwd(), 'assets/js/shared/student-schedule-refs.js'), 'utf8');
    const KIU_STATE = {
        availableGroups: {
            'ECON-101': [{ id: 'G1', name: 'Group A', prof: 'Dr. Smith' }]
        },
        ...(extra.KIU_STATE || {})
    };
    const sandbox = {
        KIU_STATE,
        window: {},
        normalizeIdentifier: (value) => String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, ''),
        toDomToken: (value) => String(value || '').replace(/[^a-zA-Z0-9_-]+/g, '_'),
        ...extra
    };
    sandbox.window = sandbox;
    vm.runInNewContext(source, sandbox);
    return sandbox;
}

describe('lms subject card schedule normalization', () => {
    it('flattens legacy map schedule entries with embedded group objects', () => {
        const ctx = loadScheduleRefs();
        const flat = ctx.flattenStudentScheduleEntry({
            courseId: 'ECON-101',
            groupId: { id: 'G1', name: 'Group A' }
        });

        expect(flat.courseId).toBe('ECON-101');
        expect(flat.groupId).toBe('G1');
        expect(flat.groupName).toBe('Group A');
    });

    it('builds course keys without object stringification artifacts', () => {
        const ctx = loadScheduleRefs();
        const refs = ctx.resolveStudentScheduleEntryRefs({
            courseId: '0',
            groupId: { id: 'G1', name: 'Group A' }
        });

        expect(refs.courseId).toBe('ECON-101');
        expect(`${refs.courseId}::${refs.groupId}`).not.toContain('object_Object');
    });

    it('lms.js normalizes schedule entries through flattenStudentScheduleEntry', () => {
        const lms = readFileSync(join(process.cwd(), 'assets/js/pages/lms.js'), 'utf8');
        expect(lms).toContain('flattenStudentScheduleEntry');
        expect(lms).toContain('resolveStudentScheduleEntryRefs');
    });
});
