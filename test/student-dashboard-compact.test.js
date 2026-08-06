import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('compact student dashboard', () => {
    it('keeps four student surfaces in the first screen', () => {
        const layout = readSource('assets/js/features/home-dashboard-widget-layout-runtime.js');

        expect(layout).toContain("'student-header'");
        expect(layout).toContain("'student-command'");
        expect(layout).toContain("'student-summary'");
        expect(layout).toContain("'student-extra'");
        expect(layout).not.toContain("'student-quick-news'");
        expect(layout).toContain('context.notifications.unread');
        expect(layout).not.toContain('title: notifications.unread');
        expect(layout).toMatch(/'student-scores'[\s\S]*?defaultVisible: false/);
        expect(layout).toMatch(/'student-orders'[\s\S]*?defaultVisible: false/);
        expect(layout).toMatch(/'student-inbox'[\s\S]*?defaultVisible: false/);
    });

    it('renders soft-chrome cells, scores, campus feed, and shared ghost CTAs', () => {
        const render = readSource('assets/js/features/home-dashboard/widget-render.js');
        const shell = readSource('assets/js/features/home-dashboard/shell.js');

        expect(render).toContain('function renderStudentOverline');
        expect(render).toContain('function renderStudentEmptyBlock');
        expect(render).toContain("renderStudentOverline('This week', 'fas fa-calendar-week')");
        expect(render).toContain("renderStudentOverline('Updates', 'fas fa-bell')");
        expect(render).toContain("renderStudentOverline('Study', 'far fa-address-card')");
        expect(render).toContain("renderStudentOverline('Last updated', 'fas fa-chart-line')");
        expect(render).toContain("renderStudentOverline('Campus feed', 'fas fa-comments')");
        expect(render).toContain("renderStudentOverline('Events', 'fas fa-calendar-check')");
        expect(render).toContain('lux-soft-chrome lux-student-cell');
        expect(render).toContain('lux-soft-chrome home-hover-chip lux-student-week-day');
        expect(render).toContain('renderStudentExtraMarkup');
        expect(render).toContain('No recent score updates');
        expect(render).toContain('lux-student-feed-list');
        expect(render).toContain('Campus feed is quiet');
        expect(render).toContain('Open social');
        expect(render).not.toContain('lux-student-messages-panel');
        expect(render).not.toContain('No new messages');
        expect(render).toContain('lux-student-score-list');
        expect(render).toContain('lux-ghost-btn lux-student-compact-link');
        expect(render).toContain('lux-ghost-btn lux-student-shortcut-chip');
        expect(render).toContain('lux-student-event-list');
        expect(render).toContain('No upcoming events');
        expect(render).toContain('ctaPage: \'social\'');
        expect(render).not.toContain('renderStudentCoursesMarkup');
        expect(render).not.toContain('lux-student-ects-donut');
        expect(render).not.toContain('Academic pulse');
        expect(shell).toContain("'student-extra'");
        expect(shell).toContain("const toolbar = role === 'student' ? ''");
    });

    it('exposes scores and campus feed on the student dashboard model', () => {
        const model = readSource('assets/js/features/luxury-home-model.js');

        expect(model).toContain('function buildStudentScoresSnapshot');
        expect(model).toContain('function collectStudentLastUpdatedScoreEvents');
        expect(model).toContain('function buildStudentCampusFeedSnapshot');
        expect(model).toContain('function buildStudentEventsSnapshot');
        expect(model).toContain('function buildStudentCampusUpdates');
        expect(model).toContain('function buildStudentLifeSnapshot');
        expect(model).toContain("icon: item.icon || 'fas fa-bell'");
        expect(model).toContain("icon: 'fas fa-check-square'");
        expect(model).toContain("icon: 'fas fa-headset'");
        expect(model).toContain("icon: 'fas fa-chart-line'");
        expect(model).toContain("icon: 'fas fa-calendar-check'");
        expect(model).toContain("icon: 'fas fa-comments'");
        expect(model).toContain('scores,');
        expect(model).toContain('campusFeed');
        expect(model).toContain('events,');
        expect(model).toContain('campusUpdates');
        expect(model).not.toContain('function buildStudentMessagesSnapshot');
        expect(model).toContain("alert: null");
        expect(model).not.toMatch(/attention = balance/);
        expect(model).toContain('const studentDashboard =');
    });

    it('removes the duplicate news strip only for student home', () => {
        const runtime = readSource('assets/js/features/luxury-index-runtime.js');
        const newsHome = readSource('assets/js/shared/news-home.js');

        expect(runtime).toContain("const isStudentHome = typeof getEffectiveRole === 'function' && getEffectiveRole() === 'student';");
        expect(runtime).toContain("homeShell.querySelector('[data-news-home-strip=\"1\"]')?.remove();");
        expect(runtime).toContain('window.mountNewsHomeStrip(homeShell);');
        expect(newsHome).toContain("if (typeof getEffectiveRole === 'function' && getEffectiveRole() === 'student') return;");
    });

    it('locks compact student home to one non-scrolling viewport with shared ghost buttons', () => {
        const shell = readSource('assets/js/features/home-dashboard/shell.js');
        const layout = readSource('assets/css/index-home-layout.css');
        const widgets = readSource('assets/css/index-home-widgets.css');

        expect(shell).toContain('data-home-density="${role === \'student\' ? \'compact\' : \'standard\'}"');
        expect(layout).toContain('[data-home-density="compact"]');
        expect(layout).toContain('overflow: hidden');
        expect(layout).toContain('100dvh');
        expect(layout).toContain('data-band="student-extra"');
        expect(layout).toContain('flex: 1 1 0');
        expect(widgets).toContain('.lux-student-week-day.lux-soft-chrome');
        expect(widgets).not.toContain('var(--lux-panel-bg, #122018)');
        expect(widgets).toContain('.lux-student-cell.lux-soft-chrome');
        expect(widgets).toContain('.lux-student-compact-overline i');
        expect(widgets).toContain('.lux-student-life-row > i');
        expect(widgets).toContain('grid-template-columns: 14px minmax(0, 1fr)');
        expect(widgets).toContain('.lux-student-extra-strip');
        expect(widgets).toContain('.lux-student-score-list');
        expect(widgets).toContain('.lux-student-feed-list');
        expect(widgets).toContain('.lux-student-feed-row');
        expect(widgets).toContain('.lux-student-event-list');
        expect(widgets).toContain('.lux-student-event-row');
        expect(widgets).toContain('.lux-student-compact-link.lux-ghost-btn');
        expect(widgets).not.toMatch(/lux-student-compact-link\.lux-ghost-btn[\s\S]{0,220}border:\s*0/);
        expect(widgets).not.toContain('.lux-student-ects-donut');
        expect(widgets).toContain('@media (max-width: 560px)');
    });
});
