const { readFileSync } = require('fs');
const { join } = require('path');

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('bare host contract', () => {
    it('bare-lite demotes layout-only shells via attribute', () => {
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        expect(bare).toContain('.lux-page-shell[data-lux-layout-only="1"]');
        expect(bare).not.toContain('body.lux-page-bare.lux-route-admin-tools #page-admin-tools');
        expect(bare).not.toMatch(/body\.lux-page-bare\s*\{[^}]*backdrop-filter:\s*none/);
    });

    it('route runtime keeps CSS for layout-only and glass-root hosts', () => {
        const runtime = readSource('assets/js/shared/lux-transparency.js');
        expect(runtime).toMatch(/function shouldKeepRouteFadeCssBackground\(el\)[\s\S]*data-lux-layout-only/);
        expect(runtime).toMatch(/function shouldKeepRouteFadeCssBackground\(el\)[\s\S]*data-lux-glass-root/);
        expect(runtime).toContain('function isCssOwnedSurface(el)');
    });

    it('transparency strips layout-only shells and glass-root descendants on bare portals', () => {
        const transparency = readSource('assets/js/shared/lux-transparency.js');
        expect(transparency).toContain("el.getAttribute('data-lux-layout-only') === '1'");
        expect(transparency).toMatch(/lux-page-bare[\s\S]*data-lux-glass-root="1"/);
        expect(transparency).toContain('.lux-page-shell[data-lux-layout-only="1"]');
    });

    it('wave 1 routes mark layout-only outer shells', () => {
        const routes = [
            ['admin-tools.html', 'id="page-admin-tools"'],
            ['staff.html', 'id="staff-content"'],
            ['students-admin.html', 'id="students-content"'],
            ['orders.html', 'id="page-orders"'],
            ['admin-orders.html', 'id="admin-orders-root"'],
            ['chancellery.html', 'id="page-chancellery"'],
            ['news.html', 'id="page-news"'],
            ['programs.html', 'id="page-programs"'],
            ['exams.html', 'id="page-exams"'],
            ['social.html', 'id="page-social"'],
            ['profile-view.html', 'id="profile-view-root"'],
        ];
        for (const [file, idAttr] of routes) {
            const html = readSource(file);
            expect(html, file).toMatch(new RegExp(`${idAttr}[\\s\\S]{0,120}data-lux-layout-only="1"`));
        }
    });

    it('wave 1 routes declare glass-root hosts', () => {
        expect(readSource('assets/js/shared/orders-inbox.js')).toContain('data-lux-glass-root="1"');
        expect(readSource('assets/js/shared/orders-workspace.js')).toMatch(/orders-admin-panel[\s\S]*data-lux-glass-root="1"/);
        expect(readSource('assets/js/pages/chancellery.js')).toMatch(/data-chancellery-shell="1"[\s\S]*data-lux-glass-root="1"/);
        expect(readSource('assets/js/pages/news/news-runtime.js')).toMatch(/data-news-shell="1"[\s\S]*data-lux-glass-root="1"/);
        expect(readSource('programs.html')).toMatch(/lux-program-command-deck[\s\S]*data-lux-glass-root="1"/);
        expect(readSource('assets/js/pages/exams-console-workspace-runtime.js')).toContain('data-lux-glass-root="1"');
        expect(readSource('social.html')).toMatch(/social-neo-shell[\s\S]*data-lux-glass-root="1"/);
        expect(readSource('assets/js/pages/profile-view-page.js')).toMatch(/pv-shell[\s\S]*data-lux-glass-root="1"/);
    });

    it('wave 2 routes mark layout-only outer shells', () => {
        const routes = [
            ['library.html', 'id="page-library"'],
            ['personal-data.html', 'id="page-personal-data"'],
            ['student-service.html', 'id="page-student-service"'],
            ['lms.html', 'lms-route-stage'],
            ['timetable.html', 'lux-timetable-page'],
            ['registration.html', 'registration-page-shell'],
            ['study-card.html', 'study-card-command-deck'],
            ['faculty-gradebook.html', 'lux-faculty-gradebook-page'],
            ['admin-scheduler.html', 'id="page-admin-scheduler"'],
            ['admin-library.html', 'id="page-library"'],
            ['exam-portal.html', 'id="exam-portal-root"'],
        ];
        for (const [file, marker] of routes) {
            const html = readSource(file);
            expect(html, file).toContain('data-lux-layout-only="1"');
            expect(html, file).toContain(marker);
        }
    });

    it('wave 2 routes declare glass-root hosts', () => {
        expect(readSource('library.html')).toMatch(/library-catalog-workspace[\s\S]*data-lux-glass-root="1"/);
        expect(readSource('personal-data.html')).toMatch(/personal-data-workspace[\s\S]*data-lux-glass-root="1"/);
        expect(readSource('assets/js/pages/student-service-page-runtime.js')).toMatch(/student-service-shell[\s\S]*data-lux-glass-root="1"/);
        expect(readSource('lms.html')).toMatch(/lms-route-workspace-chrome[\s\S]*data-lux-glass-root="1"/);
        expect(readSource('timetable.html')).toMatch(/lux-timetable-stage[\s\S]*data-lux-glass-root="1"/);
        expect(readSource('registration.html')).toMatch(/registration-studio-shell[\s\S]*data-lux-glass-root="1"/);
        expect(readSource('study-card.html')).toMatch(/study-card-command-deck[\s\S]*data-lux-glass-root="1"/);
        expect(readSource('faculty-gradebook.html')).toMatch(/lux-faculty-command-deck[\s\S]*data-lux-glass-root="1"/);
        expect(readSource('admin-scheduler.html')).toMatch(/sch-grid-shell[\s\S]*data-lux-glass-root="1"/);
        expect(readSource('admin-library.html')).toMatch(/admin-library-shell[\s\S]*data-lux-glass-root="1"/);
        expect(readSource('exam-portal.html')).toMatch(/exam-shell[\s\S]*data-lux-glass-root="1"/);
    });

    it('rim tokens expose surface shadow for global soft-chrome', () => {
        const tokens = readSource('assets/css/lux-tokens.css');
        expect(tokens).toContain('--lux-soft-chrome-rim-soft-ring');
        expect(tokens).toContain('--lux-soft-chrome-surface-shadow');
        expect(readSource('assets/css/lux-fouc-ht.css')).toContain('var(--lux-soft-chrome-surface-shadow)');
        expect(readSource('assets/css/lux-shell.css')).toContain('var(--lux-soft-chrome-chip-shadow)');
        expect(readSource('assets/css/lux-droplist.css')).toContain('var(--lux-soft-chrome-rim-ring)');
    });
});
