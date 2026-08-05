import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { socialModuleUrlToken } from './helpers/social-page-source.js';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social-event-cover-image', () => {
    it('bare-lite cover banner is 180px with sharp compositing', () => {
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        expect(bare).toMatch(/\.social-neo-event-feature-cover img\s*\{[\s\S]{0,300}height:\s*180px/);
        expect(bare).toMatch(/\.social-neo-event-feature-cover img\s*\{[\s\S]{0,400}object-position:\s*center/);
        expect(bare).toMatch(/\.social-neo-event-feature-cover img\s*\{[\s\S]{0,500}backface-visibility:\s*hidden/);
    });

    it('event submit optimizes cover before encoding', () => {
        const events = readSource('assets/js/pages/social-events.js');
        expect(events).toContain('optimizeEventCoverFile(runtime.ui.eventImageFile)');
        expect(events).toMatch(/optimizeEventCoverFile\([\s\S]{0,120}readFileAsDataUrl\(coverFile\)/);
        expect(events).toContain('decoding="async" loading="lazy"');
    });

    it('runtime exports optimizeEventCoverFile for portal hooks', () => {
        const runtime = readSource('assets/js/shared/social-runtime-lite.js');
        expect(runtime).toContain('async function optimizeEventCoverFile(file)');
        expect(runtime).toContain('optimizePortalSocialEventCoverFile: optimizeEventCoverFile');
    });

    it('social-page wires optimizeEventCoverFile into events hooks', () => {
        const page = readSource('assets/js/pages/social-page.js');
        expect(page).toContain('readFileAsDataUrl, optimizeEventCoverFile,');
        expect(page).toContain(socialModuleUrlToken('social-events.js'));
    });
});
