import { describe, expect, it } from 'vitest';
const {
    mergeStaffWhiteboardWorkspace,
    mergeStudentWhiteboardWorkspace,
    mergeStudentWhiteboardOps,
    normalizeWhiteboardActivity
} = require('../backend/platform/domains/lms-whiteboard-service.js');

describe('lms whiteboard sync domain', () => {
    

    

    

    

    it('rejects student writes while editing is locked', () => {
        const result = mergeStudentWhiteboardWorkspace(
            {
                resourceKey: 'course::group',
                version: 2,
                sessionActive: true,
                editingEnabled: false,
                elements: []
            },
            {
                elements: [{ type: 'sticky', id: 's1', x: 10, y: 10, w: 120, h: 90, text: 'Hi' }]
            },
            { id: 'student-1' }
        );

        expect(result.workspace).toBeUndefined();
        expect(result.status).toBe(403);
    });

    it('accepts student element merges when editing is enabled', () => {
        const result = mergeStudentWhiteboardWorkspace(
            {
                resourceKey: 'course::group',
                version: 2,
                sessionActive: true,
                editingEnabled: true,
                elements: []
            },
            {
                elements: [{ type: 'sticky', id: 's1', x: 10, y: 10, w: 120, h: 90, text: 'Hi' }]
            },
            { id: 'student-1' }
        );

        expect(result.workspace?.elements).toHaveLength(1);
        expect(result.workspace?.elements[0].text).toBe('Hi');
        expect(result.workspace?.version).toBe(3);
    });

    

    it('normalizes whiteboard activity payloads to empty objects', () => {
        const activity = normalizeWhiteboardActivity({
            breakouts: {
                sourceFrameInstanceId: 'f1',
                groups: [{ id: 'g1', label: 'Breakout', templateInstanceId: 'tpl-1' }]
            },
            frameSnapshots: [{ id: 'snap-1', templateInstanceId: 'tpl-1', elements: [] }]
        });
        expect(activity).toEqual({});
    });

    it('applies incremental student ops for upsert and remove', () => {
        const result = mergeStudentWhiteboardOps(
            {
                resourceKey: 'course::group',
                version: 2,
                sessionActive: true,
                editingEnabled: true,
                elements: [{ type: 'sticky', id: 's1', x: 10, y: 10, w: 120, h: 90, text: 'Hi', authorId: 'student-1' }]
            },
            [
                { element: { type: 'sticky', id: 's2', x: 40, y: 40, w: 120, h: 90, text: 'New', authorId: 'student-1' } },
                { type: 'remove', elementId: 's1' }
            ],
            { id: 'student-1' }
        );

        expect(result.workspace?.elements).toHaveLength(1);
        expect(result.workspace?.elements[0].id).toBe('s2');
        expect(result.workspace?.version).toBe(3);
    });

    

    

});