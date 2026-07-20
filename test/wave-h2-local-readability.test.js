/* CONTRACT: Comments runtime loads before the social feed host. — see docs/test-as-map.md */
/**
 * Wave H2 — Local readability (≥8/10): hot-band READABILITY TOC + feed comments peel.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();
const HOT_MIN = 1800;

function read(rel) {
    return readFileSync(join(ROOT, rel), 'utf8');
}

function listAssetsJs(dir = join(ROOT, 'assets/js'), acc = []) {
    for (const name of readdirSync(dir)) {
        const full = join(dir, name);
        if (statSync(full).isDirectory()) listAssetsJs(full, acc);
        else if (name.endsWith('.js')) acc.push(full);
    }
    return acc;
}

function parseTocSections(source) {
    const head = source.slice(0, 1200);
    const multi = head.match(/Sections:\s*([^*\n]+)/);
    if (!multi) return [];
    return multi[1]
        .replace(/\.\s*\*\/.*/, '')
        .replace(/\.\s*$/, '')
        .split('|')
        .map((s) => s.trim())
        .filter(Boolean);
}

describe('Wave H2 local readability', () => {
    const hotFiles = listAssetsJs()
        .map((abs) => {
            const rel = abs.slice(ROOT.length + 1);
            const source = readFileSync(abs, 'utf8');
            return { rel, source, lines: source.split(/\r?\n/).length };
        })
        .filter((f) => f.lines >= HOT_MIN);

    it('every assets/js file ≥1800 lines has READABILITY purpose + TOC', () => {
        expect(hotFiles.length).toBeGreaterThan(0);
        for (const file of hotFiles) {
            expect(file.source.slice(0, 1200), file.rel).toMatch(/READABILITY:/);
            const sections = parseTocSections(file.source);
            expect(sections.length, file.rel).toBeGreaterThanOrEqual(3);
            expect(sections.length, file.rel).toBeLessThanOrEqual(8);
            for (const name of sections) {
                expect(
                    file.source.includes(`--- READABILITY: ${name} ---`),
                    `${file.rel} missing marker for ${name}`
                ).toBe(true);
            }
        }
    });

    it('social-feed comments peeled to runtime and wired before feed', () => {
        const comments = 'assets/js/pages/social-feed-comments-runtime.js';
        const feed = 'assets/js/pages/social-feed.js';
        const page = 'assets/js/pages/social-page.js';
        expect(existsSync(join(ROOT, comments))).toBe(true);
        expect(read(comments)).toMatch(/createKiuSocialFeedCommentsApi/);
        expect(read(comments)).toMatch(/renderCommentThread/);
        expect(read(feed)).not.toMatch(/^\s*function renderCommentThread\b/m);
        expect(read(feed)).toContain('createKiuSocialFeedCommentsApi');
        expect(read(page)).toContain('social-feed-comments-runtime.js');
        expect(read(page)).toMatch(/SOCIAL_FEED_COMMENTS_MODULE_URL[\s\S]*SOCIAL_FEED_MODULE_URL/);
        expect(read(page)).toMatch(/loadScript\(SOCIAL_FEED_COMMENTS_MODULE_URL\)\.then/);
    });

    it('rubric claims Local readability 8/10 and H2 done', () => {
        const rubric = read('docs/human-maintainability.md');
        expect(rubric).toMatch(/Local readability[\s\S]*?\*\*8\/10\*\*/);
        expect(rubric).toMatch(/H2\s*✅/);
    });
});
