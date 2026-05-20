import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { JSDOM } from 'jsdom';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('career-market route regressions', () => {
    it('keeps the extracted route assets and lazy modal shells intact', () => {
        const html = readSource('career-market.html');
        const routeJs = readSource('assets/js/pages/career-market.js');

        const dom = new JSDOM(html);
        const { document } = dom.window;

        expect(html).toContain('assets/css/career-market-route.css?v=20260516-career-route1');
        expect(html).toContain('assets/js/pages/career-market.js?v=20260516-career-route1');
        expect(html).not.toContain('<style>');
        expect(html).not.toContain('(function initCareerMarketPage() {');

        expect(document.getElementById('career-provider-modal')).toBeNull();
        expect(document.getElementById('career-instructions-modal')).toBeNull();
        expect(document.getElementById('career-tool-modal')).toBeNull();
        expect(document.getElementById('career-provider-modal-template')).not.toBeNull();
        expect(document.getElementById('career-instructions-modal-template')).not.toBeNull();
        expect(document.getElementById('career-tool-modal-template')).not.toBeNull();
        expect(document.getElementById('career-reports-new')).toBeNull();
        expect(document.getElementById('career-vacancy-output')).toBeNull();
        expect(document.getElementById('career-history-items')).not.toBeNull();
        expect(document.getElementById('career-message-list')).not.toBeNull();

        expect(routeJs).toContain('function ensureCareerTemplateContent(templateId, rootId)');
        expect(routeJs).toContain("window.__kiuCareerDebug = {");
        expect(routeJs).toContain('function createCareerHistoryItemNode(item, index)');
        expect(routeJs).toContain('function handleCareerHistorySelection(index)');
        expect(routeJs).toContain("container.dataset.careerHistoryBound = '1';");
        expect(routeJs).toContain('container.replaceChildren(fragment);');
        expect(routeJs).not.toContain("career-history-items').innerHTML");
    });
});
