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

describe('personal data schedule normalization', () => {
    it('resolves object groupId into stable id and group name', () => {
        const ctx = loadScheduleRefs();
        const refs = ctx.resolveStudentScheduleEntryRefs({
            courseId: 'ECON-101',
            groupId: { id: 'G1', name: 'Group A', prof: 'Dr. Smith' }
        });

        expect(refs.courseId).toBe('ECON-101');
        expect(refs.groupId).toBe('G1');
        expect(refs.groupName).toBe('Group A');
        expect(refs.professorLabel).toBe('Dr. Smith');
    });

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

    it('infers courseId from availableGroups when schedule key is invalid', () => {
        const ctx = loadScheduleRefs();
        const refs = ctx.resolveStudentScheduleEntryRefs({
            courseId: '0',
            groupId: { id: 'G1', name: 'Group A' }
        });

        expect(refs.courseId).toBe('ECON-101');
        expect(refs.groupId).toBe('G1');
    });

    it('drops entries that cannot resolve a valid courseId', () => {
        const ctx = loadScheduleRefs();
        expect(ctx.flattenStudentScheduleEntry({ courseId: '0', groupId: 'missing' })).toBeNull();
    });
});
