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

    it('catalog keeps Faculty / Student / Mine tabs and never mixes lanes in filters', () => {
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
        expect(research).toContain("format: 'article'");
        expect(research).toContain("format === 'pdf'");
        expect(research).toContain('data-form="research-create"');
        expect(research).toContain('lux-glass-dialog-backdrop');
        expect(research).toContain('social-neo-research-choice lux-soft-chrome home-hover-chip');
        expect(research).toContain('social-neo-research-format-card lux-soft-chrome home-hover-chip');
        expect(research).toContain('social-neo-research-dropzone lux-soft-chrome home-hover-chip');
        expect(research).toContain('lux-primary-btn lux-glass-dialog-submit-btn home-hover-chip');
        expect(research).toContain("return openDialog('research-create', {})");
        expect(research).toContain('__kiuOpenSocialDialog');
        expect(research).toContain('mountSocialResearchPdfViewer');
    });

    it('dialog router re-renders after research module loads', () => {
        const router = readSource('assets/js/pages/social-dialog-router.js');
        expect(router).toContain("kind === 'research-create'");
        expect(router).toContain("queueDeferredModuleRender('research-module')");
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

    it('bare-lite + primitives cover research shell typography', () => {
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        const primitives = readSource('assets/css/lux-layout-primitives.css');
        const fouc = readSource('assets/css/lux-fouc-ht.css');
        expect(bare).toContain('.social-neo-research-shell');
        expect(bare).toContain('.social-neo-research-grid');
        expect(bare).toContain('.social-neo-research-pdf-shell');
        expect(primitives).toContain('.social-neo-research-title.lux-card-title');
        expect(primitives).toContain('.social-neo-research-copy.lux-panel-copy');
        expect(fouc).toContain('#social-neo-overlay-portal .social-neo-research-create');
        expect(fouc).toContain('.social-neo-research-choice.lux-soft-chrome.home-hover-chip');
        expect(fouc).toContain('.social-neo-research-format-card.lux-soft-chrome.home-hover-chip');
        expect(fouc).toContain('.social-neo-research-dropzone.lux-soft-chrome.home-hover-chip');
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
            bodyText: 'Body',
            format: 'article',
            authorLane: 'faculty',
            publish: true
        }, 'stu-1');
        expect(studentPub.authorLane).toBe('student');

        const facultyPub = store.createSocialResearchPublication({
            title: 'Faculty paper',
            abstract: 'Working paper',
            bodyText: 'Scholarship body',
            format: 'article',
            publish: true
        }, 'prof-1');
        expect(facultyPub.authorLane).toBe('faculty');

        const staffStudentAttempt = store.createSocialResearchPublication({
            title: 'Should stay faculty',
            abstract: 'Nope',
            bodyText: 'Body',
            format: 'article',
            authorLane: 'student',
            publish: true
        }, 'prof-1');
        expect(staffStudentAttempt.authorLane).toBe('faculty');

        const adminStudent = store.createSocialResearchPublication({
            title: 'Admin into student lane',
            abstract: 'Allowed',
            bodyText: 'Body',
            format: 'article',
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

    it('pdf create requires pdf payload; article can draft without body', () => {
        const store = new PlatformStore({});
        seedAccounts(store);

        expect(store.createSocialResearchPublication({
            title: 'Missing PDF',
            format: 'pdf',
            publish: true
        }, 'prof-1')).toBeNull();

        const pdfOk = store.createSocialResearchPublication({
            title: 'With PDF',
            format: 'pdf',
            pdf: { storageKey: 'file-1', fileName: 'paper.pdf', mimeType: 'application/pdf' },
            publish: true
        }, 'prof-1');
        expect(pdfOk.format).toBe('pdf');
        expect(pdfOk.pdf.storageKey).toBe('file-1');

        const draft = store.createSocialResearchPublication({
            title: 'Draft note',
            format: 'article',
            status: 'draft',
            publish: false
        }, 'stu-1');
        expect(draft.status).toBe('draft');
        expect(store.listSocialResearchPublications({ lane: 'student' }, 'stu-1')
            .some((item) => item.id === draft.id)).toBe(false);
        expect(store.listSocialResearchPublications({ mine: true }, 'stu-1')
            .some((item) => item.id === draft.id)).toBe(true);
    });
});
