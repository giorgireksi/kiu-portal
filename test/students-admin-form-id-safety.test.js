import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('students admin form id safety', () => {
    it('keeps archive and risk filter controls unique across the directory shell', () => {
        const source = readSource('assets/js/pages/students-admin-lms.js');

        expect((source.match(/id="students-lms-archive"/g) || []).length).toBe(1);
        expect((source.match(/id="students-lms-risk"/g) || []).length).toBe(1);
        expect(source).toContain('id="students-lms-archive-quick"');
        expect(source).toContain('id="students-lms-risk-quick"');
        expect(source).toContain("['students-lms-archive-quick', 'archive']");
        expect(source).toContain("['students-lms-risk-quick', 'risk']");
    });

    it('keeps students-admin action buttons as explicit non-submit controls', () => {
        const source = readSource('assets/js/pages/students-admin-lms.js');

        expect(source).toContain('id="students-lms-back-btn" type="button"');
        expect(source).toContain('id="students-lms-add-btn" type="button"');
        expect(source).toContain('id="students-lms-clear-btn" type="button"');
        expect(source).toContain('data-tab="${key}" type="button"');
        expect(source).toContain('event.preventDefault();');
        expect(source).toContain('event.stopPropagation();');
    });

    it('keeps the standalone students-admin workspace offset from the luxury sidebar on desktop', () => {
        const css = readSource('assets/css/students-admin-lms.css');

        expect(css).toContain('body.lux-route-students-admin #app-content {');
        expect(css).toContain('margin-left: var(--lux-sidebar-width) !important;');
        expect(css).toContain('width: calc(100% - var(--lux-sidebar-width)) !important;');
    });
});
