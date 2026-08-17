import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

const ROUTE_BARE_BUNDLES = {
    'admin-library.html': 'library',
    'admin-orders.html': 'orders',
    'admin-scheduler.html': 'admin-scheduler',
    'chancellery.html': 'chancellery',
    'exam-portal.html': 'lms',
    'exams.html': 'exams',
    'faculty-gradebook.html': 'faculty-gradebook',
    'library.html': 'library',
    'lms.html': 'lms',
    'news.html': 'news',
    'orders.html': 'orders',
    'personal-data.html': 'personal',
    'profile-view.html': 'core',
    'programs.html': 'programs',
    'registration.html': 'registration',
    'social.html': 'social',
    'staff.html': 'directory',
    'student-service.html': 'student-service',
    'students-admin.html': 'directory',
    'study-card.html': 'study-card',
    'timetable.html': 'timetable',
};

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('route-owned bare CSS split', () => {
    it('loads only the route bundle instead of the 1.5 MB all-route stylesheet', () => {
        const fullBareSize = statSync(join(process.cwd(), 'assets/css/lux-page-bare-lite.css')).size;

        for (const [htmlFile, bundleName] of Object.entries(ROUTE_BARE_BUNDLES)) {
            const html = readSource(htmlFile);
            const href = `assets/css/route-bare/${bundleName}/lux-page-bare-lite.css?v=`;
            const bundlePath = `assets/css/route-bare/${bundleName}/lux-page-bare-lite.css`;

            expect(html, htmlFile).toContain(href);
            expect(html, htmlFile).not.toContain('href="assets/css/lux-page-bare-lite.css');
            expect(existsSync(join(process.cwd(), bundlePath)), bundlePath).toBe(true);
            expect(statSync(join(process.cwd(), bundlePath)).size, bundlePath).toBeLessThan(fullBareSize * 0.75);
        }
    });

    it('keeps the large home model on the home route only', () => {
        expect(readSource('index.html')).toContain('assets/js/features/luxury-home-model.js');
        for (const htmlFile of Object.keys(ROUTE_BARE_BUNDLES)) {
            expect(readSource(htmlFile), htmlFile).not.toContain('assets/js/features/luxury-home-model.js');
        }
    });

    it('does not ship unrelated admin-exam and schedule helpers to specialist routes', () => {
        const stateAdminRoutes = new Set(['index.html', 'chancellery.html', 'exams.html', 'lms.html', 'study-card.html']);
        const scheduleRoutes = new Set(['index.html', 'admin-scheduler.html', 'chancellery.html', 'exams.html', 'lms.html', 'profile-view.html', 'registration.html', 'study-card.html', 'timetable.html']);
        const adminMergeRoutes = new Set(['index.html', 'admin-library.html', 'admin-tools.html', 'registration.html']);

        for (const htmlFile of Object.keys(ROUTE_BARE_BUNDLES)) {
            const html = readSource(htmlFile);
            if (!stateAdminRoutes.has(htmlFile)) expect(html, htmlFile).not.toContain('state-admin-exam-runtime.js');
            if (!scheduleRoutes.has(htmlFile)) expect(html, htmlFile).not.toContain('faculty-schedule-runtime.js');
            if (!adminMergeRoutes.has(htmlFile)) expect(html, htmlFile).not.toContain('api-admin-merge-runtime.js');
        }
    });
});
