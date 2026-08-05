import { describe, expect, it } from 'vitest';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { PlatformStore } = require('../backend/platform/store.js');

const EXISTING_GRADES = {
    'student-1': {
        'COURSE-1': { midterm: 80 }
    }
};

const INCOMING_GRADES = {
    'student-1': {
        'COURSE-1': { midterm: 95, final: 88 }
    },
    'student-2': {
        'COURSE-1': { midterm: 70 }
    }
};

describe('portal studentGrades staff persistence', () => {
    it('persists studentGrades when the actor is professor or ta', () => {
        for (const effectiveRole of ['professor', 'ta']) {
            const store = new PlatformStore();
            store.state.sections['section-1'] = {
                id: 'section-1',
                courseId: 'COURSE-1',
                professorId: `${effectiveRole}-1`,
                taIds: [`${effectiveRole}-1`]
            };
            store.state.portal.state = {
                studentGrades: clone(EXISTING_GRADES),
                gradebookWeights: { 'COURSE-1': { midterm: 40, final: 60 } }
            };

            const saved = store.savePortalState({
                studentGrades: clone(INCOMING_GRADES)
            }, {
                actorUserId: `${effectiveRole}-1`,
                effectiveRole
            });

            expect(saved.state.studentGrades).toEqual(INCOMING_GRADES);
            expect(store.state.portal.state.studentGrades).toEqual(INCOMING_GRADES);
            expect(store.state.portal.state.gradebookWeights).toEqual({ 'COURSE-1': { midterm: 40, final: 60 } });
        }
    });

    it('persists studentGrades for admin via allowGlobalWrite or effectiveRole', () => {
        const byRole = new PlatformStore();
        byRole.state.portal.state = { studentGrades: clone(EXISTING_GRADES) };
        const roleSaved = byRole.savePortalState({
            studentGrades: clone(INCOMING_GRADES)
        }, {
            actorUserId: 'admin-1',
            effectiveRole: 'admin'
        });
        expect(roleSaved.state.studentGrades).toEqual(INCOMING_GRADES);

        const byGlobal = new PlatformStore();
        byGlobal.state.portal.state = { studentGrades: clone(EXISTING_GRADES) };
        const globalSaved = byGlobal.savePortalState({
            studentGrades: clone(INCOMING_GRADES)
        }, {
            actorUserId: 'admin-1',
            allowGlobalWrite: true
        });
        expect(globalSaved.state.studentGrades).toEqual(INCOMING_GRADES);
    });

    it('rejects studentGrades writes from students while keeping existing grades', () => {
        const store = new PlatformStore();
        store.state.portal.state = {
            studentGrades: clone(EXISTING_GRADES),
            gradebookWeights: { 'COURSE-1': { midterm: 40, final: 60 } }
        };

        const saved = store.savePortalState({
            studentGrades: clone(INCOMING_GRADES),
            gradebookWeights: { 'COURSE-1': { midterm: 50, final: 50 } }
        }, {
            actorUserId: 'student-1',
            effectiveRole: 'student'
        });

        expect(saved.state.studentGrades).toEqual(EXISTING_GRADES);
        expect(store.state.portal.state.studentGrades).toEqual(EXISTING_GRADES);
        expect(saved.state.gradebookWeights).toEqual({ 'COURSE-1': { midterm: 50, final: 50 } });
    });

    it('keeps gradebookWeights client-owned for any authenticated role', () => {
        const store = new PlatformStore();
        store.state.portal.state = {
            gradebookWeights: { 'COURSE-1': { midterm: 40, final: 60 } }
        };

        const saved = store.savePortalState({
            gradebookWeights: { 'COURSE-1': { midterm: 30, final: 70 } }
        }, {
            actorUserId: 'student-1',
            effectiveRole: 'student'
        });

        expect(saved.state.gradebookWeights).toEqual({ 'COURSE-1': { midterm: 30, final: 70 } });
        expect(store.state.portal.state.gradebookWeights).toEqual({ 'COURSE-1': { midterm: 30, final: 70 } });
    });
});

function clone(value) {
    return JSON.parse(JSON.stringify(value));
}
