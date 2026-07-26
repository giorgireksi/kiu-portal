import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social-page-interactions-runtime peel deps', () => {
    it('resolves host symbols via dep() / __lookup — no bare createSocialLazyStub calls', () => {
        const peel = readSource('assets/js/pages/social-page-interactions-runtime.js');
        expect(peel).toMatch(/function dep\(name/);
        expect(peel).toMatch(/const createSocialLazyStub = dep\('createSocialLazyStub'\)/);
        const depHelperIdx = peel.indexOf('function dep(name');
        expect(depHelperIdx).toBeGreaterThan(-1);
        expect(peel.slice(0, depHelperIdx)).not.toMatch(/createSocialLazyStub/);
    });

    it('calls interactions factory after feed API in social-page.js', () => {
        const main = readSource('assets/js/pages/social-page.js');
        const feedIdx = main.indexOf('__kiuCreateSocialPageFeedApi');
        const interactionsIdx = main.indexOf('__kiuCreateSocialPageInteractionsApi');
        expect(feedIdx).toBeGreaterThan(-1);
        expect(interactionsIdx).toBeGreaterThan(feedIdx);
    });

    it('wires syncSocialOverlayLock into interactions deps', () => {
        const main = readSource('assets/js/pages/social-page.js');
        expect(main).toMatch(/__socialInteractionsDeps[\s\S]*syncSocialOverlayLock/);
    });

    it('loads interactions peel before social-page.js on social.html', () => {
        const html = readSource('social.html');
        expect(html.indexOf('social-page-interactions-runtime.js'))
            .toBeLessThan(html.indexOf('assets/js/pages/social-page.js'));
    });
});
