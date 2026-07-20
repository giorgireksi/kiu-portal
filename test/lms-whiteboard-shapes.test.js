import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import {
    mergeStaffWhiteboardWorkspace,
    normalizeWhiteboardElement
} from '../backend/platform/domains/lms-whiteboard-service.js';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

function extractRemovedTypes(source = '') {
    const match = source.match(/const LMS_WHITEBOARD_REMOVED_ELEMENT_TYPES = (\[[^\]]+\])/);
    return match ? match[1] : '';
}

describe('lms whiteboard shapes', () => {
    const account = { id: 'staff-1' };

    

    it('normalizes ellipse elements', () => {
        const ellipse = normalizeWhiteboardElement({
            type: 'ellipse',
            id: 'ellipse-1',
            x: 5,
            y: 15,
            w: 120,
            h: 80,
            color: '#38bdf8',
            width: 4,
            fill: '#0f172a',
            fillOpacity: 0.4
        }, account);

        expect(ellipse).toMatchObject({
            type: 'ellipse',
            id: 'ellipse-1',
            w: 120,
            h: 80,
            fill: '#0f172a',
            fillOpacity: 0.4
        });
        expect(ellipse?.cornerRadius).toBeUndefined();
    });

    it('normalizes line elements', () => {
        const line = normalizeWhiteboardElement({
            type: 'line',
            id: 'line-1',
            x: 0,
            y: 0,
            x2: 100,
            y2: 50,
            color: '#fff',
            width: 3
        }, account);

        expect(line).toMatchObject({
            type: 'line',
            id: 'line-1',
            x: 0,
            y: 0,
            x2: 100,
            y2: 50,
            color: '#fff',
            width: 3
        });
    });

    it('normalizes arrow elements', () => {
        const arrow = normalizeWhiteboardElement({
            type: 'arrow',
            id: 'arrow-1',
            x: 12,
            y: 18,
            x2: 220,
            y2: 180,
            color: '#f87171',
            width: 5
        }, account);

        expect(arrow).toMatchObject({
            type: 'arrow',
            id: 'arrow-1',
            x2: 220,
            y2: 180,
            width: 5
        });
    });

    it('normalizes grid elements', () => {
        const grid = normalizeWhiteboardElement({
            type: 'grid',
            id: 'grid-1',
            x: 30,
            y: 40,
            w: 200,
            h: 150,
            rows: 5,
            cols: 4,
            color: '#94a3b8',
            width: 2,
            fill: '#334155'
        }, account);

        expect(grid).toMatchObject({
            type: 'grid',
            id: 'grid-1',
            rows: 5,
            cols: 4,
            fill: '#334155'
        });
    });

    it('returns null for invalid shapes', () => {
        expect(normalizeWhiteboardElement({
            type: 'grid',
            id: 'grid-bad',
            x: 0,
            y: 0,
            w: 200,
            h: 150,
            rows: 20,
            cols: 20
        }, account)).toBeNull();

        expect(normalizeWhiteboardElement({
            type: 'rect',
            id: '',
            x: 0,
            y: 0,
            w: 40,
            h: 40
        }, account)).toBeNull();

        expect(normalizeWhiteboardElement({
            type: 'hexagon',
            id: 'hex-1',
            x: 0,
            y: 0,
            w: 40,
            h: 40
        }, account)).toBeNull();
    });

    it('still drops removed triangle, diamond, and frame types', () => {
        expect(normalizeWhiteboardElement({ type: 'triangle', id: 'tri-1', x: 0, y: 0, w: 40, h: 40 }, account)).toBeNull();
        expect(normalizeWhiteboardElement({ type: 'diamond', id: 'dia-1', x: 0, y: 0, w: 40, h: 40 }, account)).toBeNull();
        expect(normalizeWhiteboardElement({ type: 'frame', id: 'frame-1', x: 0, y: 0, w: 40, h: 40 }, account)).toBeNull();
    });

    it('keeps backend and workspace removed element type lists in sync', () => {
        const service = readSource('backend/platform/domains/lms-whiteboard-service.js');
        const workspace = readSource('assets/js/pages/lms-whiteboard-workspace-runtime.js');

        expect(extractRemovedTypes(service)).toBe("['triangle', 'diamond', 'frame']");
        expect(extractRemovedTypes(workspace)).toBe("['triangle', 'diamond', 'frame']");
        expect(extractRemovedTypes(service)).toBe(extractRemovedTypes(workspace));
    });

    it('defaults fillOpacity to 0.35 when omitted', () => {
        const rect = normalizeWhiteboardElement({
            type: 'rect',
            id: 'rect-default-opacity',
            x: 0,
            y: 0,
            w: 80,
            h: 60
        }, account);
        const ellipse = normalizeWhiteboardElement({
            type: 'ellipse',
            id: 'ellipse-default-opacity',
            x: 0,
            y: 0,
            w: 80,
            h: 60
        }, account);
        const grid = normalizeWhiteboardElement({
            type: 'grid',
            id: 'grid-default-opacity',
            x: 0,
            y: 0,
            w: 120,
            h: 90,
            rows: 3,
            cols: 3
        }, account);

        expect(rect.fillOpacity).toBe(0.35);
        expect(ellipse.fillOpacity).toBe(0.35);
        expect(grid.fillOpacity).toBe(0.35);
    });

    it('retains rect shape through staff merge', () => {
        const merged = mergeStaffWhiteboardWorkspace(
            {
                resourceKey: 'course::group',
                version: 1,
                elements: []
            },
            {
                elements: [{
                    type: 'rect',
                    id: 'rect-merge',
                    x: 8,
                    y: 16,
                    w: 96,
                    h: 64,
                    color: '#f4d06f',
                    width: 2
                }]
            },
            account
        );

        expect(merged.elements).toHaveLength(1);
        expect(merged.elements[0]).toMatchObject({
            type: 'rect',
            id: 'rect-merge',
            w: 96,
            h: 64
        });
    });
});