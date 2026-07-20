import { describe, expect, it, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
    POST_COMPOSE_ENTITY_LINK_MAX,
    normalizeComposerEntityLinks,
    postEntityLinks,
    resolveEntityLinkMeta,
    listAttachableEntities,
    socialEntityModelApi,
    installSocialEntityModel
} from '../assets/js/pages/social-entity-model.js';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

function installHooks(extra = {}) {
    window.__kiuSocialEntityHooks = {
        text: (v) => String(v == null ? '' : v).trim(),
        currentUserId: () => 'u1',
        state: () => ({
            social: {
                groups: [{ id: 'g1', name: 'G1', ownerUserId: 'u1', isManager: true }],
                projects: [{ id: 'p1', name: 'P1', ownerUserId: 'other' }],
                pages: [],
                events: [],
                surveys: [],
                portfolios: [],
                lostFoundItems: []
            }
        }),
        isManagedPage: () => false,
        photographyPosts: () => [],
        portfolioEntriesForViewer: () => [],
        ...extra
    };
}

describe('social-entity-model', () => {
    beforeEach(() => {
        installHooks();
        installSocialEntityModel(window);
    });

    it('exports entity helpers and installs window surface', () => {
        expect(window.__KIU_SOCIAL_ENTITY_MODEL_LOADED).toBe(true);
        expect(window.__kiuSocialEntityModelExports).toBe(socialEntityModelApi);
        expect(typeof window.resolveEntityLinkMeta).toBe('function');
        expect(window.KiuSocialEntityModel.normalizeComposerEntityLinks).toBe(window.normalizeComposerEntityLinks);
        expect(window.POST_COMPOSE_ENTITY_LINK_MAX).toBe(5);
        expect(POST_COMPOSE_ENTITY_LINK_MAX).toBe(5);
        expect(normalizeComposerEntityLinks).toBe(window.normalizeComposerEntityLinks);
    });

    it('normalizes composer links and resolves meta', () => {
        const links = normalizeComposerEntityLinks([
            { type: 'group', id: 'g1' },
            { type: 'group', id: 'g1' },
            { type: 'project', id: 'p1' }
        ]);
        expect(links).toEqual([
            { type: 'group', id: 'g1' },
            { type: 'project', id: 'p1' }
        ]);
        const meta = resolveEntityLinkMeta({ type: 'group', id: 'g1' });
        expect(meta.title).toBe('G1');
        expect(meta.subtitle).toBe('Your group');
        expect(meta.icon).toBe('fa-user-group');
        expect(postEntityLinks({ entityLinks: links, linkedSurveyId: 's1' }).some((l) => l.type === 'survey')).toBe(true);
    });

    it('lists mine attachable entities', () => {
        const mine = listAttachableEntities('group', 'mine', '');
        expect(mine).toHaveLength(1);
        expect(mine[0].id).toBe('g1');
        const others = listAttachableEntities('project', 'others', '');
        expect(others.map((r) => r.id)).toEqual(['p1']);
    });

    it('ESM leaf + classic bridge source-lock before social-page', () => {
        const mod = readSource('assets/js/pages/social-entity-model.js');
        const bridge = readSource('assets/js/pages/social-entity-model-bridge.js');
        const page = readSource('assets/js/pages/social-page.js');
        const interactions = readSource('assets/js/pages/social-page-interactions-runtime.js');
        const html = readSource('social.html');

        expect(mod).toMatch(/export\s+(const|function)\s+/);
        expect(mod).toContain('__kiuSocialEntityModelExports');
        expect(mod).toContain('__KIU_SOCIAL_ENTITY_MODEL_LOADED');
        expect(mod).toContain('installSocialEntityModel');
        expect(mod).not.toMatch(/^\(function\s+initSocialEntityModel/m);

        expect(bridge).toContain('__kiuSocialEntityModelExports');
        expect(bridge).toContain('KiuSocialEntityModel');
        expect(bridge).toContain('__KIU_SOCIAL_ENTITY_MODEL_LOADED');

        expect(html).toMatch(/<script\s+type="module"\s+src="assets\/js\/pages\/social-entity-model\.js/);
        expect(html).toContain('social-entity-model-bridge.js');
        expect(html.indexOf('social-entity-model.js')).toBeLessThan(html.indexOf('social-entity-model-bridge.js'));
        expect(html.indexOf('social-entity-model-bridge.js')).toBeLessThan(html.indexOf('social-page.js'));

        for (const name of [
            'normalizeComposerEntityLinks',
            'postEntityLinks',
            'entityLinkSectionLabel',
            'entityLinkIcon',
            'resolveEntityLinkMeta'
        ]) {
            expect(page).not.toMatch(new RegExp(`function\\s+${name}\\s*\\(`));
            expect(interactions).toMatch(new RegExp(`const ${name} = window\\.${name}`));
        }
        expect(page).not.toMatch(/function\s+isMineAttachableEntity\s*\(/);
        expect(page).not.toMatch(/function\s+listAttachableEntities\s*\(/);
    });
});
