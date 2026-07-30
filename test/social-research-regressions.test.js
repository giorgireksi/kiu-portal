import { describe, expect, it } from 'vitest';
import { createRequire } from 'module';
import { readFileSync } from 'fs';
import { join } from 'path';

const require = createRequire(import.meta.url);
const { PlatformStore } = require('../backend/platform/store.js');

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

function seedAccounts(store) {
    store.state.accounts['stu-1'] = {
        id: 'stu-1', displayName: 'Student One', email: 's1@example.com', role: 'student', facultyCode: 'BM'
    };
    store.state.accounts['prof-1'] = {
        id: 'prof-1', displayName: 'Prof One', email: 'p1@example.com', role: 'professor', facultyCode: 'ECON'
    };
    store.state.accounts['admin-1'] = {
        id: 'admin-1', displayName: 'Admin', email: 'a1@example.com', role: 'admin', facultyCode: 'CS'
    };
}

function samplePdf() {
    return { storageKey: 'file-1', fileName: 'paper.pdf', mimeType: 'application/pdf', sizeBytes: 1200 };
}

function sampleSlides() {
    return {
        storageKey: 'file-2',
        fileName: 'talk.pptx',
        mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        sizeBytes: 2400
    };
}

describe('social-research-regressions', () => {
    it('nav wires Research after Portfolio with locked label and action', () => {
        const panel = readSource('assets/js/pages/social-panel-model.js');
        const shell = readSource('assets/js/pages/social-shell-nav.js');
        expect(panel).toContain("id: 'research'");
        expect(panel).toContain("label: 'Research'");
        expect(panel).toContain("helper: 'Papers, articles & PDFs'");
        expect(panel.indexOf("id: 'projects'")).toBeLessThan(panel.indexOf("id: 'research'"));
        expect(panel.indexOf("id: 'research'")).toBeLessThan(panel.indexOf("id: 'pages'"));
        expect(shell).toContain("action === 'panel-research'");
        expect(shell).toContain("uiKey: 'researchTab'");
        expect(shell).toContain("action === 'research-create-open'");
        expect(shell).toContain("openDialog('research-create', {})");
    });

    it('catalog keeps Faculty / Student / Mine tabs and fileKind filters', () => {
        const research = readSource('assets/js/pages/social-research.js');
        expect(research).toContain("label: 'Faculty & Staff'");
        expect(research).toContain("label: 'Student Research'");
        expect(research).toContain("label: 'Mine'");
        expect(research).toMatch(/if \(tab === 'faculty'\) return text\(item\.authorLane\) === 'faculty'/);
        expect(research).toMatch(/if \(tab === 'student'\) return text\(item\.authorLane\) === 'student'/);
        expect(research).toContain("action === 'panel-research'");
        expect(research).toContain('resolveResearchHook');
        expect(research).toContain('social-neo-research-hero home-hover-chip');
        expect(research).toContain('social-neo-research-hero-stats home-hover-chip');
        expect(research).toContain('social-neo-research-catalog home-hover-chip');
        expect(research).toContain('social-neo-research-toolbar home-hover-chip');
        expect(research).toContain('social-neo-research-copy home-hover-chip');
        expect(research).toContain('social-neo-research-stat social-neo-events-hero-stat lux-strip-card surface-card lux-soft-chrome home-hover-chip');
        expect(research).toContain("value=\"slides\"");
        expect(research).toContain("value=\"document\"");
        expect(research).toContain("format === 'pdf'");
        expect(research).toContain('data-form="research-create"');
        expect(research).toContain('lux-glass-dialog-backdrop');
        expect(research).not.toContain('lux-glass-dialog-card--research-editor');
        expect(research).not.toContain('data-research-body-editor');
        expect(research).not.toContain('mountSocialResearchEditor');
        expect(research).not.toContain('KiuResearchEditor');
        expect(research).toContain('social-neo-research-choice lux-soft-chrome home-hover-chip');
        expect(research).toContain('social-neo-research-dropzone lux-soft-chrome home-hover-chip');
        expect(research).toContain('.ppt');
        expect(research).toContain('.docx');
        expect(research).toContain('name="researchFiles"');
        expect(research).toContain('Download to open');
        expect(research).toContain('lux-primary-btn lux-glass-dialog-submit-btn home-hover-chip');
        expect(research).toContain("openDialog('research-create', {})");
        expect(research).toContain('__kiuOpenSocialDialog');
        expect(research).toContain('mountSocialResearchPdfViewer');
    });

    it('research editor module is removed from page load chain', () => {
        const page = readSource('assets/js/pages/social-page.js');
        expect(page).not.toContain('SOCIAL_RESEARCH_EDITOR_URL');
        expect(page).not.toContain('social-research-editor.js');
        expect(page).toContain('social-research.js');
    });

    it('dialog router re-renders after research module loads without editor mount', () => {
        const router = readSource('assets/js/pages/social-dialog-router.js');
        expect(router).toContain("kind === 'research-create'");
        expect(router).toContain("queueDeferredModuleRender('research-module')");
        expect(router).not.toContain('mountSocialResearchEditor');
    });

    it('compose locks student lane; staff non-admin stay on faculty; admin can choose', () => {
        const research = readSource('assets/js/pages/social-research.js');
        expect(research).toContain('function resolveAuthorLane');
        expect(research).toContain("Locked for student accounts");
        expect(research).toContain('facultyLocked');
        expect(research).toContain("name=\"researchIntent\" value=\"draft\"");
        expect(research).toContain("name=\"researchIntent\" value=\"publish\"");
    });

    it('pdf runtime reuses pdfjs-dist@3.11.174 CDN pattern', () => {
        const pdf = readSource('assets/js/pages/social-research-pdf-runtime.js');
        expect(pdf).toContain("PDFJS_VERSION = '3.11.174'");
        expect(pdf).toContain('cdn.jsdelivr.net/npm/pdfjs-dist@');
        expect(pdf).toContain('mountSocialResearchPdfViewer');
    });

    it('bare-lite + primitives cover research deposit shell', () => {
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        const primitives = readSource('assets/css/lux-layout-primitives.css');
        const fouc = readSource('assets/css/lux-fouc-ht.css');
        const modals = readSource('assets/css/lux-modals.css');
        expect(bare).toContain('.social-neo-research-shell');
        expect(bare).toContain('.social-neo-research-grid');
        expect(bare).toContain('.social-neo-research-pdf-shell');
        expect(bare).toContain('.social-neo-research-file-list');
        expect(bare).not.toContain('--research-prose-measure');
        expect(bare).not.toContain('.social-neo-research-prose');
        expect(bare).not.toContain('.social-neo-research-figure');
        expect(bare).not.toContain('.social-neo-research-reader-scale');
        expect(modals).not.toContain('lux-glass-dialog-card--research-editor');
        expect(primitives).toContain('.social-neo-research-title.lux-card-title');
        expect(primitives).toContain('.social-neo-research-copy.lux-panel-copy');
        expect(fouc).toContain('#social-neo-overlay-portal .social-neo-research-create');
        expect(fouc).toContain('.social-neo-research-choice.lux-soft-chrome.home-hover-chip');
        expect(fouc).toContain('.social-neo-research-dropzone.lux-soft-chrome.home-hover-chip');
        expect(fouc).not.toContain('.social-neo-research-cover-field.lux-soft-chrome.home-hover-chip');
        expect(fouc).toContain('.social-neo-research-catalog');
        expect(fouc).toContain('.social-neo-research-toolbar');
        expect(fouc).toContain('.social-neo-research-copy.home-hover-chip');
    });

    it('API routes and store expose research CRUD', () => {
        const routes = readSource('backend/platform/routes/social-routes.js');
        const store = readSource('backend/platform/store.js');
        expect(routes).toContain("app.get('/api/social/research'");
        expect(routes).toContain("app.post('/api/social/research'");
        expect(routes).toContain("app.post('/api/social/research/:id/save'");
        expect(store).toContain("require('./domains/social-research-service')");
        expect(store).toContain('listSocialResearchPublications');
        expect(store).toContain('createSocialResearchPublication');
    });

    it('backend isolates faculty and student lanes; students cannot publish to faculty', () => {
        const store = new PlatformStore({});
        seedAccounts(store);

        const studentPub = store.createSocialResearchPublication({
            title: 'Student lit review',
            abstract: 'Course work',
            files: [samplePdf()],
            authorLane: 'faculty',
            publish: true
        }, 'stu-1');
        expect(studentPub.authorLane).toBe('student');
        expect(studentPub.fileKind).toBe('pdf');

        const facultyPub = store.createSocialResearchPublication({
            title: 'Faculty paper',
            abstract: 'Working paper',
            files: [sampleSlides()],
            publish: true
        }, 'prof-1');
        expect(facultyPub.authorLane).toBe('faculty');
        expect(facultyPub.fileKind).toBe('slides');

        const staffStudentAttempt = store.createSocialResearchPublication({
            title: 'Should stay faculty',
            abstract: 'Nope',
            files: [samplePdf()],
            authorLane: 'student',
            publish: true
        }, 'prof-1');
        expect(staffStudentAttempt.authorLane).toBe('faculty');

        const adminStudent = store.createSocialResearchPublication({
            title: 'Admin into student lane',
            abstract: 'Allowed',
            files: [samplePdf()],
            authorLane: 'student',
            publish: true
        }, 'admin-1');
        expect(adminStudent.authorLane).toBe('student');

        const facultyLane = store.listSocialResearchPublications({ lane: 'faculty' }, 'stu-1');
        const studentLane = store.listSocialResearchPublications({ lane: 'student' }, 'stu-1');
        expect(facultyLane.every((item) => item.authorLane === 'faculty')).toBe(true);
        expect(studentLane.every((item) => item.authorLane === 'student')).toBe(true);
        expect(facultyLane.some((item) => item.id === studentPub.id)).toBe(false);
        expect(studentLane.some((item) => item.id === facultyPub.id)).toBe(false);
        expect(facultyLane.some((item) => item.id === facultyPub.id)).toBe(true);
        expect(studentLane.some((item) => item.id === studentPub.id)).toBe(true);
    });

    it('publish requires files; PDF legacy still works; draft without files ok', () => {
        const store = new PlatformStore({});
        seedAccounts(store);

        expect(store.createSocialResearchPublication({
            title: 'Missing files',
            publish: true
        }, 'prof-1')).toBeNull();

        const pdfOk = store.createSocialResearchPublication({
            title: 'With PDF',
            pdf: { storageKey: 'file-1', fileName: 'paper.pdf', mimeType: 'application/pdf' },
            publish: true
        }, 'prof-1');
        expect(pdfOk.format).toBe('pdf');
        expect(pdfOk.fileKind).toBe('pdf');
        expect(pdfOk.files[0].storageKey).toBe('file-1');
        expect(pdfOk.pdf.storageKey).toBe('file-1');

        const multi = store.createSocialResearchPublication({
            title: 'Deck + notes',
            files: [sampleSlides(), {
                storageKey: 'file-3',
                fileName: 'notes.docx',
                mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            }],
            publish: true
        }, 'prof-1');
        expect(multi.fileKind).toBe('slides');
        expect(multi.files).toHaveLength(2);
        expect(multi.files[1].fileKind).toBe('document');

        const draft = store.createSocialResearchPublication({
            title: 'Draft note',
            status: 'draft',
            publish: false
        }, 'stu-1');
        expect(draft.status).toBe('draft');
        expect(store.listSocialResearchPublications({ lane: 'student' }, 'stu-1')
            .some((item) => item.id === draft.id)).toBe(false);
        expect(store.listSocialResearchPublications({ mine: true }, 'stu-1')
            .some((item) => item.id === draft.id)).toBe(true);
    });

    it('ignores bodyHtml typography cover on create; publish without files fails', () => {
        const store = new PlatformStore({});
        seedAccounts(store);

        expect(store.createSocialResearchPublication({
            title: 'Empty publish',
            bodyHtml: '<p>Hello</p>',
            publish: true
        }, 'prof-1')).toBeNull();

        const deposit = store.createSocialResearchPublication({
            title: 'File deposit',
            bodyHtml: '<p>Hello <strong>campus</strong></p><script>alert(1)</script>',
            titleFontSize: 56,
            bodyFontSize: 20,
            layoutPreset: 'visual',
            cover: { storageKey: 'cover-1', fileName: 'hero.jpg', mimeType: 'image/jpeg' },
            files: [samplePdf()],
            publish: true
        }, 'prof-1');
        expect(deposit.bodyHtml).toBe('');
        expect(deposit.files[0].fileName).toBe('paper.pdf');
        expect(deposit.fileKind).toBe('pdf');
        expect(deposit.titleFontSize).toBeUndefined();
        expect(deposit.cover).toBeUndefined();
    });
});
