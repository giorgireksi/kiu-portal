import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    const full = join(process.cwd(), relativePath);
    if (typeof existsSync === 'function' && !existsSync(full)) return '';
    return readFileSync(full, 'utf8');
}

describe('curriculum semester picker mode', () => {
    it('implements replace vs add selection logic', () => {
        const picker = readSource('assets/js/pages/curriculum-semester-picker.js');

        expect(picker).toContain('lux-picker-option');
        expect(picker).toContain('<strong>');
        expect(picker).toContain('togglePickerPanel');
        expect(picker).toContain('let addSemestersMode = false');
        expect(picker).toContain('function applySemesterSelection(semester, config)');
        expect(picker).toContain('function setAddSemestersMode(enabled, config = {})');
        expect(picker).toContain('function removeSemester(semester, config)');
        expect(picker).toContain('function applyCustomSemester(custom, config)');
        expect(picker).toContain("return addSemestersMode ? 'Add to selection' : 'Select semester'");
        expect(picker).toContain('function syncModeSegmentUi(config = {})');
        expect(picker).toContain('window.setCurriculumSemesterAddMode = setAddSemestersMode');
        expect(picker).toContain('data-semester-mode');
        expect(picker).toContain('new-subject-semester-mode-hint');
    });

    it('ships segmented control markup and updated picker caption in admin-tools bundle', () => {
        const bundle = readSource('assets/js/features/index-admin-tools.bundle-source.js');

        expect(bundle).toContain('lux-semester-mode-segment');
        expect(bundle).toContain('new-subject-semester-mode-single');
        expect(bundle).toContain('new-subject-semester-mode-multiple');
        expect(bundle).toContain('data-semester-mode="replace"');
        expect(bundle).toContain('data-semester-mode="add"');
        expect(bundle).toContain('new-subject-semester-mode-hint');
        expect(bundle).toContain('Select semester');
        expect(bundle).toContain('lux-universal-picker-panel');
        expect(bundle).not.toContain('new-subject-semester-lux-panel" role="listbox" aria-hidden="true" hidden');
        expect(bundle).not.toContain('lux-semester-add-mode-btn');
        expect(bundle).not.toContain('Add or remove semester');
    });

    it('styles the semester mode segment in admin-tools luxury css', () => {
        const css = readSource('assets/css/admin-tools-luxury.css');

        expect(css).toContain('.lux-admin-tools-semester-head');
        expect(css).toContain('.lux-admin-tools-semester-hint');
        expect(css).toContain('.lux-semester-mode-segment');
        expect(css).toContain('.lux-semester-mode-segment__btn[aria-pressed="true"]');
    });
});