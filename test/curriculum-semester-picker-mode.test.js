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
        expect(picker).toContain('pickerButton.setAttribute(\'aria-label\', getPickerCaption())');
        expect(picker).not.toContain('lux-picker-caption');
        expect(picker).toContain('window.setCurriculumSemesterAddMode = setAddSemestersMode');
        expect(picker).toContain('data-semester-mode');
        expect(picker).toContain('new-subject-semester-mode-hint');
    });

    it('ships compact value-only semester trigger in admin-tools bundle', () => {
        const bundle = readSource('assets/js/features/index-admin-tools.bundle-source.js');

        expect(bundle).toContain('lux-semester-mode-segment');
        expect(bundle).toContain('new-subject-semester-mode-single');
        expect(bundle).toContain('new-subject-semester-mode-multiple');
        expect(bundle).toContain('data-semester-mode="replace"');
        expect(bundle).toContain('data-semester-mode="add"');
        expect(bundle).toContain('new-subject-semester-mode-hint');
        expect(bundle).toContain('lux-picker-btn--compact');
        expect(bundle).toContain('lux-picker-value');
        expect(bundle).toContain('aria-label="Select semester"');
        expect(bundle).not.toContain('lux-picker-caption');
        expect(bundle).toContain('lux-universal-picker-panel');
        expect(bundle).not.toContain('lux-semester-add-mode-btn');
        expect(bundle).not.toContain('Add or remove semester');
    });

    it('styles the semester mode segment in bare-lite shared css', () => {
        const css = readSource('assets/css/lux-page-bare-lite.css');

        expect(existsSync(join(process.cwd(), 'assets/css/admin-tools-luxury.css'))).toBe(false);
        expect(css).toContain('.lux-admin-tools-semester-head');
        expect(css).toContain('.lux-admin-tools-semester-hint');
        expect(css).toContain('.lux-semester-mode-segment');
        expect(css).toContain('.lux-semester-mode-segment__btn[aria-pressed="true"]');
        expect(css).toContain('.lux-picker-btn--compact');
    });
});
