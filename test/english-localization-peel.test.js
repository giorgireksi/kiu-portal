import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

describe('english-localization peel', () => {
    it('keeps the localization layer out of app.js', () => {
        const app = readFileSync(join(process.cwd(), 'assets/js/app/app.js'), 'utf8');
        const loc = readFileSync(join(process.cwd(), 'assets/js/app/english-localization.js'), 'utf8');
        const primer = readFileSync(join(process.cwd(), 'assets/js/theme-primer.js'), 'utf8');
        expect(app).not.toMatch(/function installEnglishLocalization\s*\(/);
        expect(app).not.toMatch(/function decodeReplacementKey\s*\(/);
        expect(app).not.toMatch(/ENGLISH_UI_REPLACEMENT_DATA/);
        expect(app).toContain('english-localization.js');
        expect(loc).toMatch(/function installEnglishLocalization\s*\(/);
        expect(loc).toContain('installEnglishLocalization();');
        expect(primer).toContain('scheduleIdleEnglishLocalization');
        expect(primer).toContain('data-kiu-idle-src');
        expect(loc).toMatch(/ENGLISH_UI_REPLACEMENT_DATA|ENGLISH_UI_REPLACEMENTS/);
    });

    it('is wired after app.js on every HTML that loads app.js', () => {
        const root = process.cwd();
        const htmlFiles = readdirSync(root).filter((name) => name.endsWith('.html'));
        const withApp = [];
        for (const name of htmlFiles) {
            const text = readFileSync(join(root, name), 'utf8');
            if (!text.includes('assets/js/app/app.js')) continue;
            withApp.push(name);
            expect(
                text.includes('data-kiu-idle-src="assets/js/app/english-localization.js')
                || text.includes('__kiuLoadTimetableLocalization')
            ).toBe(true);
            if (name !== 'timetable.html') {
                expect(text.indexOf('app/app.js')).toBeLessThan(text.indexOf('english-localization.js'));
            }
        }
        expect(withApp.length).toBeGreaterThanOrEqual(15);
    });
});
