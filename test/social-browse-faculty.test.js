import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social global browse faculty', () => {
    it('keeps shared browse state and mounts faculty in section heroes', () => {
        const chrome = readSource('assets/js/pages/social-chrome-model.js');
        const runtime = readSource('assets/js/shared/social-runtime-lite.js');
        const shell = readSource('assets/js/pages/social-page-shell-runtime.js');
        const interactions = readSource('assets/js/pages/social-page-interactions-runtime.js');
        const events = readSource('assets/js/pages/social-page-events.js');

        expect(runtime).toContain("socialBrowseFaculty: 'all'");
        expect(chrome).toContain('function socialBrowseFacultyValue');
        expect(chrome).toContain('function socialBrowseFacultyAllLabel');
        expect(chrome).toContain('function socialBrowseFacultyOptionLabel');
        expect(chrome).toContain('data-lux-picker-subtitle="Show content from every faculty"');
        expect(chrome).toContain("return 'All faculties'");
        expect(chrome).toMatch(/value="\$\{SOCIAL_BROWSE_FACULTY_ALL\}"/);
        expect(chrome).toContain('function socialMatchesBrowseFaculty');
        expect(chrome).toContain('function renderSocialBrowseFacultyHeroControl');
        expect(chrome).toContain('social-neo-hero-faculty');
        expect(chrome).toContain('function socialDefaultCreateFaculty');
        expect(shell).toContain('SOCIAL_COMMAND_SKIPPED_PANELS');
        expect(shell).toContain("'messages'");
        expect(shell).toContain("'alerts'");
        expect(shell).toContain("'profile'");
        expect(interactions).toMatch(/function renderSectionCommandCenter[\s\S]*?return '';/);
        expect(interactions).not.toMatch(/function renderSectionCommandCenter[\s\S]*?renderSocialBrowseFacultyCommand/);
        expect(events).toContain('select[name="socialBrowseFaculty"]');
        expect(events).toContain("runtime.ui.socialBrowseFaculty = next");

        const heroes = [
            'assets/js/pages/social-feed.js',
            'assets/js/pages/social-page-feed-runtime.js',
            'assets/js/pages/social-groups.js',
            'assets/js/pages/social-workspace-project-chrome.js',
            'assets/js/pages/social-workspace-portfolio-ui.js',
            'assets/js/pages/social-research.js',
            'assets/js/pages/social-pages.js',
            'assets/js/pages/social-events.js',
            'assets/js/pages/social-surveys.js',
            'assets/js/pages/social-photography.js',
            'assets/js/pages/social-lost-found.js'
        ].map(readSource).join('\n');
        expect(heroes).toContain('renderSocialBrowseFacultyHeroControl');
        expect(readSource('assets/js/pages/social-events.js')).toContain('socialBrowseFacultyOptionLabel');
        expect(readSource('assets/js/pages/social-groups.js')).toContain('socialBrowseFacultyOptionLabel');
    });

    it('filters listed content panels with the shared matcher', () => {
        const panels = [
            'assets/js/pages/social-feed.js',
            'assets/js/pages/social-community.js',
            'assets/js/pages/social-groups.js',
            'assets/js/pages/social-pages.js',
            'assets/js/pages/social-events.js',
            'assets/js/pages/social-surveys.js',
            'assets/js/pages/social-photography.js',
            'assets/js/pages/social-form-model.js',
            'assets/js/pages/social-research.js',
            'assets/js/pages/social-workspace-panel.js',
            'assets/js/pages/social-workspace-portfolio-ui.js'
        ].map(readSource).join('\n');

        expect(panels).toContain('socialBrowseFacultyValue');
        expect(panels).toContain('socialMatchesBrowseFaculty');
        expect(readSource('assets/js/pages/social-workspace-portfolio-ui.js')).not.toContain('name="projectDiscoverFaculty"');
        expect(readSource('assets/js/pages/social-workspace-panel.js')).not.toContain('name="projectDiscoverFaculty"');
        expect(readSource('assets/js/pages/social-research.js')).not.toContain('data-bind="research-faculty"');
    });

    it('requires faculty on create dialogs and persists lost-found facultyCode', () => {
        const creates = [
            'assets/js/pages/social-groups.js',
            'assets/js/pages/social-pages.js',
            'assets/js/pages/social-events.js',
            'assets/js/pages/social-lost-found.js',
            'assets/js/pages/social-photography.js',
            'assets/js/pages/social-research.js',
            'assets/js/pages/social-surveys.js',
            'assets/js/pages/social-workspace-events-submit-runtime.js'
        ].map(readSource).join('\n');

        expect(creates).toContain("name: 'groupFaculty'");
        expect(creates).toContain("name: 'pageFaculty'");
        expect(creates).toContain("name: 'eventFaculty'");
        expect(creates).toContain("name: 'lostFoundFaculty'");
        expect(creates).toContain("name: 'photographyFaculty'");
        expect(creates).toContain("name: 'researchFaculty'");
        expect(creates).toContain("name: 'surveyFaculty'");
        expect(creates).toContain('Faculty is required');
        expect(creates).toContain('Select at least one faculty');

        const formModel = readSource('assets/js/pages/social-form-model.js');
        const stateService = readSource('backend/platform/domains/social-state-service.js');
        expect(formModel).toContain('facultyCode: text(item?.facultyCode || item?.faculty || \'\')');
        expect(stateService).toContain("facultyCode: socialText(item?.facultyCode || item?.faculty || '')");
    });
});
