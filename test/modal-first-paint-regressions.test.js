const { readFileSync, readdirSync } = require('fs');
const { join } = require('path');

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('modal first-paint regressions', () => {
    it('loads modal CSS before authored route markup on every route', () => {
        const pages = readdirSync(process.cwd())
            .filter((name) => name.endsWith('.html'))
            .map((name) => readSource(name))
            .filter((html) => html.includes('lux-modals.css'));

        expect(pages.length).toBeGreaterThan(0);
        pages.forEach((html) => {
            expect(html).not.toMatch(/lux-modals\.css[^>]*media="print"/);
            expect(html).not.toMatch(/lux-modals\.css[^>]*onload=/);
        });
    });

    it('hard-hides authored News and Exam overlays until their runtimes open them', () => {
        const newsHtml = readSource('news.html');
        const newsRuntime = readSource('assets/js/pages/news/news-runtime.js');
        const examHtml = readSource('exam-portal.html');
        const examRuntime = readSource('assets/js/pages/exam-portal.js');
        expect((newsHtml.match(/data-lux-modal-overlay aria-hidden="true" hidden/g) || []).length).toBe(4);
        expect(newsRuntime).toContain('overlay.hidden = !open;');
        expect(newsRuntime).toContain('publisher.hidden = true;');
        expect(newsRuntime).toContain('sections.hidden = true;');
        expect(newsRuntime).toContain('viewer.hidden = true;');
        expect(newsRuntime).toContain('detail.hidden = true;');
        expect(examHtml).toContain('id="exam-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="exam-confirm-title" hidden');
        expect(examRuntime).toContain('modal.hidden = false;');
        expect(examRuntime).toContain('modal.hidden = true;');
    });
});
