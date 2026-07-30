import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
    buildDefaultChancelleryDocumentTemplate,
    normalizeChancelleryDocumentTemplate
} from '../backend/platform/domains/chancellery-document-service.js';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('chancellery appeal document template', () => {
    it('seeds a default bilingual appeal document with exam options', () => {
        const template = buildDefaultChancelleryDocumentTemplate();
        expect(template.sections.some((section) => section.type === 'title')).toBe(true);
        expect(template.sections.some((section) => section.type === 'examOptions')).toBe(true);
        expect(template.sections.some((section) => section.type === 'description')).toBe(true);
        expect(template.submitLabel).toContain('გაგზავნა');
        const normalized = normalizeChancelleryDocumentTemplate({
            letterhead: { schoolLabel: 'School' },
            sections: [{ type: 'title', text: 'Appeal' }]
        });
        expect(normalized.letterhead.schoolLabel).toBe('School');
        expect(normalized.sections).toHaveLength(1);
        expect(normalized.sections[0].text).toBe('Appeal');
    });

    it('exposes document-template API and Word-like fullscreen editor', () => {
        const routes = readSource('backend/platform/routes/chancellery-routes.js');
        const page = readSource('assets/js/pages/chancellery.js');
        const doc = readSource('assets/js/pages/chancellery-document.js');
        const html = readSource('chancellery.html');
        expect(routes).toContain('/api/chancellery/document-template');
        expect(routes).toContain('saveChancelleryDocumentTemplate');
        expect(html).toContain('chancellery-document.js?v=20260731-appealword1');
        expect(html).toContain('chancellery.js?v=20260731-appealword1');
        expect(html).toContain('lux-modals.css?v=20260731-appealword1');
        expect(html).not.toContain('chancellery-filters.js');
        expect(doc).toContain('function openChancelleryDocumentEditor');
        expect(doc).toContain('function openChancelleryAppealModal');
        expect(doc).toContain("mode = 'fill'");
        expect(doc).toContain("mode: 'edit'");
        expect(doc).toContain('chancellery-doc-fullscreen-modal');
        expect(doc).toContain('chancellery-doc-edit');
        expect(doc).toContain('data-chancellery-doc-action="reset-default"');
        expect(doc).toContain('data-chancellery-doc-action="save-editor"');
        expect(doc).not.toContain('add-section');
        expect(doc).not.toContain('Live preview');
        expect(doc).not.toContain('chancellery-document-editor-split');
        expect(doc).not.toContain('createChancelleryDocumentSectionDraft');
        expect(page).toContain('data-chancellery-action="edit-document"');
        expect(page).toContain('data-chancellery-action="open-appeal-document"');
        expect(page).not.toContain('intakeFilters');
        expect(page).not.toContain('edit-filters');
    });

    it('student fill and admin edit share Word-like document renderer', () => {
        const page = readSource('assets/js/pages/chancellery.js');
        const doc = readSource('assets/js/pages/chancellery-document.js');
        const modals = readSource('assets/css/lux-modals.css');
        expect(page).toContain('Choose a subject to open the official appeal document');
        expect(doc).toContain('function renderChancelleryAppealDocumentMarkup');
        expect(doc).toContain('chancellery-doc-page');
        expect(doc).toContain('chancellery-doc-letterhead');
        expect(doc).toContain('name="chancellery-appeal-exam"');
        expect(doc).toContain('chancellery-appeal-message');
        expect(doc).toContain('submit-appeal-document');
        expect(doc).toContain("mode: 'fill'");
        expect(modals).toContain('.chancellery-doc-fullscreen-modal');
        expect(modals).toContain('.chancellery-doc-page.chancellery-appeal-document');
        expect(modals).toContain('width: min(816px, 100%)');
        expect(modals).toContain('height: 100vh');
        expect(modals).not.toContain('.chancellery-document-editor-split');
        expect(modals).not.toContain('#f7f7f5');
    });
});
