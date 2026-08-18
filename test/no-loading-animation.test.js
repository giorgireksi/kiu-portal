import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const root = process.cwd();
const read = (relativePath) => readFileSync(join(root, relativePath), 'utf8');
const routeHtml = [
    'index.html', 'admin-tools.html', 'admin-library.html', 'admin-orders.html',
    'admin-scheduler.html', 'chancellery.html', 'exams.html', 'faculty-gradebook.html',
    'library.html', 'lms.html', 'news.html', 'orders.html', 'personal-data.html',
    'programs.html', 'registration.html', 'social.html', 'staff.html',
    'student-service.html', 'study-card.html', 'timetable.html'
];

const removedAssets = [
    'assets/js/shared/lux-assembly-loading-runtime.js',
    'assets/css/home-assembly-prehide.css',
    'assets/css/social-assembly-prehide.css',
    'assets/js/pages/home-loading-runtime.js'
];

const assemblyReference = /(?:lux-assembly-loading-runtime|(?:^|["'/])[^"'\s]+-loading-runtime\.js|(?:^|["'/])[^"'\s]+-loading\.css|assembly-prehide)/;

describe('loading animation removal', () => {
    it('does not ship the removed assembly/loading assets', () => {
        for (const asset of removedAssets) expect(existsSync(join(root, asset))).toBe(false);
        expect(read('service-worker.js')).not.toMatch(assemblyReference);
    });

    it('does not load route assembly animation assets', () => {
        for (const route of routeHtml) {
            expect(read(route), route).not.toMatch(assemblyReference);
        }
    });

    it('does not ship legacy authored loading copy on route boot surfaces', () => {
        expect(read('staff.html')).toContain('data-route-boot-surface="staff"');
        expect(read('staff.html')).not.toContain('Loading staff command center...');
        expect(read('students-admin.html')).toContain('data-route-boot-surface="students"');
        expect(read('students-admin.html')).not.toContain('Loading student administration...');
        expect(read('profile-view.html')).toContain('data-route-boot-surface="profile"');
        expect(read('profile-view.html')).not.toContain('Loading profile...');
        expect(read('social.html')).toContain('data-route-boot-surface="social"');
        expect(read('social.html')).not.toContain('Preparing campus social');
    });

    it('keeps route startup immediate and removes route fade animation hooks', () => {
        expect(read('assets/js/features/navigation.js')).not.toContain('playRouteContentFade');
        expect(read('assets/css/lux-shell.css')).not.toContain('luxRouteContentFade');
        expect(read('assets/js/theme-primer.js')).not.toContain('Loading workspace');
        expect(read('assets/js/theme-primer.js')).not.toContain('__KIU_INSTANT_ASSEMBLY_LOADING');
        expect(read('assets/js/theme-primer.js')).not.toContain('transition:opacity');
        expect(read('assets/css/index-home-widgets.css')).not.toContain('lux-student-pulse-in');
        expect(read('anti-cheat/src/ui/anti-cheat-ui.css')).not.toContain('ac-spinner');
        expect(read('anti-cheat/src/ui/splash.html')).not.toContain('ac-spinner');
    });
});
