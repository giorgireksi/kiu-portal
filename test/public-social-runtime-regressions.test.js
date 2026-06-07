import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('public social runtime regressions', () => {
    it('keeps the shared public social workspace on class-based social surfaces instead of inline card chrome', () => {
        const source = readSource('assets/js/shared/public-social-runtime.js');
        const css = readSource('assets/css/social-rebuild.css');

        expect(source).toContain('class="public-social-shell"');
        expect(source).toContain('public-social-card public-social-hero');
        expect(source).toContain('class="social-post-card public-social-post-card"');
        expect(source).toContain('class="social-comment-card public-social-comment-card"');
        expect(source).toContain('class="social-input public-social-comment-input"');
        expect(source).toContain('class="social-empty public-social-empty"');
        expect(source).not.toContain('style="background:#ffffff; border:1px solid #dbe5f0; border-radius:24px; padding:20px;');
        expect(source).not.toContain('style="width:100%; min-height:120px; border:1px solid var(--kiu-border);');
        expect(css).toContain('.public-social-shell');
        expect(css).toContain('.public-social-post-card');
        expect(css).toContain('.public-social-comment-card');
        expect(css).toContain('.public-social-empty');
    });
});
