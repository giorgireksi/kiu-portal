import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

function getRootHtmlFiles() {
    return readdirSync(process.cwd())
        .filter((name) => name.endsWith('.html'))
        .filter((name) => statSync(join(process.cwd(), name)).isFile())
        .sort();
}

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('root font delivery regressions', () => {
    it('uses the shared font stylesheet without direct Google Fonts runtime imports', () => {
        const rootHtmlFiles = getRootHtmlFiles();
        const sharedFontsCss = readSource('assets/css/kiu-fonts.css');
        const pagesWithSharedFontLink = [];
        const redirectWrappersWithoutFonts = ['calendar.html', 'faculty-schedule.html', 'gradebook.html'];

        for (const file of rootHtmlFiles) {
            const html = readSource(file);
            expect(html).not.toContain('fonts.googleapis.com');
            expect(html).not.toContain('fonts.gstatic.com');
            if (html.includes('assets/css/kiu-fonts.css')) {
                pagesWithSharedFontLink.push(file);
            }
        }

        expect(sharedFontsCss).not.toContain('fonts.googleapis.com');
        expect(sharedFontsCss).not.toContain('fonts.gstatic.com');
        expect(sharedFontsCss).toContain("font-family: 'Inter';");
        expect(sharedFontsCss).toContain("src: local('Inter'), local('Inter Regular');");
        expect(sharedFontsCss).toContain("font-family: 'Noto Sans Georgian';");
        expect(sharedFontsCss).toContain("font-family: 'Playfair Display';");
        expect(sharedFontsCss).toContain("font-family: 'DM Mono';");
        expect(sharedFontsCss).toContain("font-family: 'Fraunces';");
        expect(sharedFontsCss).toContain("font-family: 'Manrope';");
        expect(pagesWithSharedFontLink.length).toBe(rootHtmlFiles.length - redirectWrappersWithoutFonts.length);
        expect(redirectWrappersWithoutFonts.every((file) => !pagesWithSharedFontLink.includes(file))).toBe(true);
    });
});
