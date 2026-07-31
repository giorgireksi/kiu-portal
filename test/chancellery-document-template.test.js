import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
    buildDefaultChancelleryDocumentTemplate,
    normalizeChancelleryDocumentTemplate,
    sanitizeChancelleryDocumentTextHtml
} from '../backend/platform/domains/chancellery-document-service.js';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('chancellery appeal document template', () => {
    it('seeds a v3 canvas template with boxes', () => {
        const template = buildDefaultChancelleryDocumentTemplate();
        expect(template.version).toBe(3);
        expect(template.page.width).toBe(794);
        expect(template.elements.some((el) => el.type === 'text')).toBe(true);
        expect(template.elements.some((el) => el.type === 'mergeField')).toBe(true);
        expect(template.elements.some((el) => el.type === 'inputChoice')).toBe(true);
        expect(template.elements.some((el) => el.type === 'inputLong')).toBe(true);
        const exam = template.elements.find((el) => el.type === 'inputChoice');
        expect(exam.layout).toBe('columns');
        expect(exam.options).toHaveLength(3);
        expect(template.submitLabel).toContain('გაგზავნა');
    });

    it('migrates v1 and v2 templates into canvas elements', () => {
        const fromV1 = normalizeChancelleryDocumentTemplate({
            version: 1,
            letterhead: { schoolLabel: 'School', institutionKa: 'UNI' },
            sections: [
                { type: 'title', text: 'Appeal' },
                { type: 'courseLabel', label: 'Course:' },
                { type: 'examOptions', options: [{ id: 'mid', label: 'Midterm' }] },
                { type: 'description', label: 'Reason' }
            ]
        });
        expect(fromV1.version).toBe(3);
        expect(fromV1.elements.some((el) => el.type === 'mergeField' && el.fieldKey === 'faculty')).toBe(true);
        expect(fromV1.elements.some((el) => el.type === 'inputChoice')).toBe(true);
        expect(fromV1.elements.some((el) => el.type === 'inputLong')).toBe(true);
        expect(fromV1).not.toHaveProperty('sections');
        expect(fromV1).not.toHaveProperty('bodyHtml');

        const fromV2 = normalizeChancelleryDocumentTemplate({
            version: 2,
            bodyHtml: '<p><span class="chancellery-merge-chip" data-field-key="name" data-field-label="Name">Name</span></p><div data-student-input="description" data-input-label="Why"></div>'
        });
        expect(fromV2.version).toBe(3);
        expect(fromV2.elements.some((el) => el.type === 'mergeField' && el.fieldKey === 'name')).toBe(true);
        expect(fromV2.elements.some((el) => el.type === 'inputLong' || el.type === 'inputText')).toBe(true);
    });

    it('uses canva-like canvas editor with drag boxes and merge picker', () => {
        const routes = readSource('backend/platform/routes/chancellery-routes.js');
        const page = readSource('assets/js/pages/chancellery.js');
        const doc = readSource('assets/js/pages/chancellery-document.js');
        const html = readSource('chancellery.html');
        const modals = readSource('assets/css/lux-modals.css');
        expect(routes).toContain('/api/chancellery/document-template');
        expect(html).toContain('chancellery-document.js?v=20260731-mergelabel1');
        expect(html).toContain('chancellery.js?v=20260801-chanroute1');
        expect(html).toContain('lux-modals.css?v=20260731-mergelabel1');
        expect(doc).toContain('data-doc-box-id');
        expect(doc).toContain("Keep at least one student input");
        expect(doc).toContain("layout: 'columns'");
        expect(doc).toContain('is-columns');
        expect(doc).toContain('chancellery-doc-exam-mark');
        expect(doc).toContain("data-box-type=\"table\"");
        expect(doc).toContain("data-box-type=\"shape\"");
        expect(doc).toContain("data-box-type=\"image\"");
        expect(doc).toContain('format-text');
        expect(doc).toContain('chancellery-doc-table');
        expect(doc).toContain('buildChancelleryTableCells');
        expect(doc).toContain('stashChancelleryDocumentFormatRange');
        expect(doc).toContain('syncChancelleryDocumentSelectionChrome');
        expect(doc).toContain('focusChancelleryDocumentTableCell');
        expect(doc).toContain('table-insert-row');
        expect(doc).toContain('table-delete-col');
        expect(doc).toContain('table-merge-right');
        expect(doc).toContain('table-merge-selection');
        expect(doc).toContain('table-split-cell');
        expect(doc).toContain('table-distribute-cols');
        expect(doc).toContain('table-distribute-rows');
        expect(doc).toContain('duplicate-box');
        expect(doc).toContain('bring-forward');
        expect(doc).toContain('send-backward');
        expect(doc).toContain('center-on-page');
        expect(doc).toContain('toggle-lock');
        expect(doc).toContain('shapeKind');
        expect(doc).toContain('cropTop');
        expect(doc).toContain('format-font-family');
        expect(doc).toContain('insertUnorderedList');
        expect(doc).toContain('cellVAlign');
        expect(doc).toContain('chancelleryActiveTableCell');
        expect(doc).toContain('chancelleryTableSelection');
        expect(doc).toContain('underlineBlank');
        expect(doc).toContain('underlineLengthPct');
        expect(doc).toContain('underlineAlign');
        expect(doc).toContain('chancellery-doc-field-blank');
        expect(doc).toContain('chancellery-doc-merge-row');
        expect(doc).toContain('chancellery-doc-merge-label');
        expect(doc).toContain('is-value-label');
        expect(doc).not.toContain('შუალედური გამოცდა Midterm Exam<br>____');
        expect(modals).toContain('chancellery-doc-exams.is-columns');
        expect(modals).toContain('chancellery-doc-table');
        expect(modals).toContain('chancellery-doc-shape');
        expect(modals).toContain('chancellery-doc-format-bar');
        expect(modals).toContain('is-active-cell');
        expect(modals).toContain('is-multi-selected');
        expect(modals).toContain('is-locked');
        expect(modals).toContain('chancellery-doc-shape-line');
        expect(modals).toContain('chancellery-doc-field-blank');
        expect(modals).toContain('has-underline-blank');
        expect(modals).toContain('chancellery-doc-merge-row');
        expect(modals).toContain('chancellery-doc-merge-label');
        expect(html).toContain('ensureChancelleryExportLibraries');
        expect(html).toContain('assets/vendor/export-libs/docx.iife.js');
        expect(doc).toContain('chancellery-doc-canvas');
        expect(doc).toContain('data-doc-box');
        expect(doc).toContain('kiuPortalFetch');
        expect(doc).toContain('listChancelleryMergeFieldCatalog');
        expect(doc).toContain('studentFormBlueprint');
        expect(doc).toContain('add-box');
        expect(doc).toContain('inputChoice');
        expect(doc).toContain('mergeField');
        expect(doc).toContain('function alignChancelleryElements');
        expect(doc).toContain('function distributeChancelleryElements');
        expect(doc).toContain('function tidyChancelleryColumnSpacing');
        expect(doc).toContain('function snapChancelleryBoxPosition');
        expect(doc).toContain('chancelleryDocumentSelectedIds');
        expect(doc).toContain('align-boxes');
        expect(doc).toContain('distribute-boxes');
        expect(doc).toContain('tidy-column');
        expect(doc).toContain('data-doc-layout-gap');
        expect(doc).toContain('interactive: canvasMode === \'fill\'');
        expect(doc).toContain('Students type here');
        expect(doc).toContain('answers');
        expect(doc).toContain("mode: 'fill'");
        expect(doc).toContain("mode: 'edit'");
        expect(doc).not.toContain('tiptap');
        expect(doc).not.toContain('quill');
        expect(doc).not.toContain('chancellery-document-editor-split');
        expect(doc).not.toContain('move-section-up');
        expect(doc).not.toContain('insert-exam-options');
        expect(doc).toContain('function exportChancelleryLetter');
        expect(doc).toContain('exportChancelleryLetterPdf');
        expect(doc).toContain('exportChancelleryLetterDocx');
        expect(doc).toContain('documentElementsSnapshot');
        expect(doc).toContain('data-doc-box-id');
        expect(doc).toContain("data-chancellery-doc-action=\"delete-box\"");
        expect(page).toContain('export-case-pdf');
        expect(page).toContain('export-case-docx');
        expect(modals).toContain('chancellery-doc-canvas');
        expect(modals).toContain('chancellery-doc-box');
        expect(modals).toContain('chancellery-doc-guide');
        expect(modals).toContain('chancellery-doc-letter');
        expect(modals).toContain('#e8e6e1');
    });

    it('normalizes table shape and image boxes', () => {
        const normalized = normalizeChancelleryDocumentTemplate({
            version: 3,
            elements: [
                {
                    type: 'table',
                    rows: 1,
                    cols: 3,
                    cells: [[{ html: 'A', fill: '#eeeeee', vAlign: 'middle', colspan: 2 }, { html: '' }, { html: 'C' }]],
                    borderWidth: 2,
                    borderColor: '#000000',
                    innerBorderWidth: 1,
                    innerBorderColor: '#333333',
                    headerRow: true,
                    colWidths: [40, 30, 30],
                    x: 48,
                    y: 100,
                    w: 698,
                    h: 140,
                    locked: true
                },
                {
                    type: 'shape',
                    shapeKind: 'oval',
                    cornerRadius: 8,
                    rotation: 15,
                    opacity: 0.8,
                    strokeWidth: 2,
                    strokeColor: '#111111',
                    fill: 'transparent',
                    x: 48,
                    y: 260,
                    w: 200,
                    h: 100
                },
                {
                    type: 'image',
                    src: '/assets/img/logo.png',
                    alt: 'Logo',
                    objectFit: 'contain',
                    crop: { top: 0.1, right: 0.05, bottom: 0, left: 0.05 },
                    rotation: -10,
                    opacity: 0.9,
                    x: 48,
                    y: 380,
                    w: 120,
                    h: 80
                },
                {
                    type: 'text',
                    html: '<ul><li style="color: #222222; font-size: 12pt">Item</li></ul>',
                    lineHeight: 1.5,
                    paragraphSpacingPt: 6,
                    x: 48,
                    y: 40,
                    w: 360,
                    h: 48
                },
                {
                    type: 'mergeField',
                    fieldKey: 'name',
                    label: 'Name',
                    underlineBlank: true,
                    underlineLengthPct: 55,
                    underlineAlign: 'end',
                    x: 400,
                    y: 40,
                    w: 280,
                    h: 40
                },
                { type: 'inputLong', label: 'Why', x: 48, y: 480, w: 698, h: 160 }
            ]
        });
        const table = normalized.elements.find((el) => el.type === 'table');
        expect(table.cols).toBe(3);
        expect(table.cells[0][0].colspan).toBe(2);
        expect(table.cells[0][0].vAlign).toBe('middle');
        expect(table.cells[0][0].fill).toBe('#eeeeee');
        expect(table.headerRow).toBe(true);
        expect(table.locked).toBe(true);
        expect(table.colWidths).toHaveLength(3);
        expect(table.innerBorderWidth).toBe(1);
        const shape = normalized.elements.find((el) => el.type === 'shape');
        expect(shape.shapeKind).toBe('oval');
        expect(shape.rotation).toBe(15);
        expect(shape.opacity).toBe(0.8);
        const image = normalized.elements.find((el) => el.type === 'image' && el.src.includes('logo'));
        expect(image.crop.top).toBe(0.1);
        expect(image.rotation).toBe(-10);
        const text = normalized.elements.find((el) => el.type === 'text');
        expect(text.html).toContain('<ul>');
        expect(text.html).toContain('font-size: 12pt');
        expect(text.html).not.toContain('expression');
        expect(text.lineHeight).toBe(1.5);
        expect(text.paragraphSpacingPt).toBe(6);
        const merge = normalized.elements.find((el) => el.type === 'mergeField');
        expect(merge.underlineBlank).toBe(true);
        expect(merge.underlineLengthPct).toBe(55);
        expect(merge.underlineAlign).toBe('end');
        const mergeDefault = normalizeChancelleryDocumentTemplate({
            version: 3,
            elements: [
                { type: 'mergeField', fieldKey: 'email', label: 'Email', x: 48, y: 40, w: 280, h: 36 },
                { type: 'inputLong', label: 'Why', x: 48, y: 100, w: 698, h: 160 }
            ]
        }).elements.find((el) => el.type === 'mergeField');
        expect(mergeDefault.underlineBlank).toBe(false);
        expect(mergeDefault.underlineLengthPct).toBe(70);
        expect(mergeDefault.underlineAlign).toBe('end');
    });

    it('sanitizes list tags and safe inline styles', () => {
        const cleaned = sanitizeChancelleryDocumentTextHtml(
            '<ul><li style="color:#111;font-size:14pt;background-image:url(x)">A</li></ul><script>alert(1)</script>'
        );
        expect(cleaned).toContain('<ul>');
        expect(cleaned).toContain('<li');
        expect(cleaned).toContain('color: #111');
        expect(cleaned).toContain('font-size: 14pt');
        expect(cleaned).not.toContain('background-image');
        expect(cleaned).not.toContain('script');
    });

    it('student fill keeps merge values read-only and locks non-input boxes', () => {
        const doc = readSource('assets/js/pages/chancellery-document.js');
        expect(doc).toContain('data-doc-autofill');
        expect(doc).toContain("mode = 'fill'");
        expect(doc).toContain('is-fill');
        expect(doc).toContain('resolveChancelleryAppealFieldValues');
        expect(doc).toContain('courseCode');
        expect(doc).toContain('Add at least one student input (text or choice)');
    });

    it('editor preview uses personal-data catalog placeholders, not fake Giorgi samples', () => {
        const doc = readSource('assets/js/pages/chancellery-document.js');
        expect(doc).not.toContain('BABUNASHVILI');
        expect(doc).not.toContain('Sample School');
        expect(doc).not.toContain('Sample Program');
        expect(doc).not.toContain('giorgi.babunashvili');
        expect(doc).toContain('function getChancelleryDocumentPreviewFieldValues');
        expect(doc).toContain('listChancelleryMergeFieldCatalog()');
        expect(doc).toContain('function getChancelleryDocumentEditorFieldValues');
        expect(doc).toMatch(
            /function getChancelleryDocumentEditorFieldValues\([\s\S]*?chancelleryDocumentEditorPreviewFill[\s\S]*?resolveChancelleryAppealFieldValues/
        );
        expect(doc).toContain('getChancelleryDocumentEditorFieldValues()');
    });

    it('merge catalog reads student blueprint.schema and does not force default extras', () => {
        const doc = readSource('assets/js/pages/chancellery-document.js');
        expect(doc).toContain('function listChancelleryMergeFieldCatalog');
        expect(doc).toContain('getAllStudentFormFields');
        expect(doc).toContain('getStudentFormSchema');
        expect(doc).toContain('blueprint?.schema');
        expect(doc).toContain('CHANCELLERY_SYNTHETIC_MERGE_FIELDS');
        expect(doc).toContain("key: 'course'");
        expect(doc).toContain("key: 'courseCode'");
        expect(doc).not.toMatch(
            /if\s*\(\s*!fields\.length\s*\)\s*\{[\s\S]*?\}\s*else\s*\{\s*pushField\(\s*'personalNumber'/
        );
        expect(doc).not.toMatch(/pushField\(\s*'personalNumber'\s*,\s*'Personal number'\s*\)/);
        expect(doc).not.toMatch(/pushField\(\s*'faculty'\s*,\s*'Faculty \/ School'\s*\)/);
        expect(doc).not.toMatch(/pushField\(\s*'nameEn'\s*,\s*'English name'\s*\)/);
    });
});
