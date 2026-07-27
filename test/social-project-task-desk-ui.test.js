import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social-project-task-desk-ui', () => {
    it('bare-lite includes work desk paint hooks', () => {
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        const deskBlockStart = bare.indexOf('/* Social: project work desk */');
        expect(deskBlockStart).toBeGreaterThan(-1);
        const nextBlock = bare.indexOf(
            '\n@media (max-width: 1180px) {\n  body.lux-route-social .social-neo-messages {',
            deskBlockStart
        );
        const deskBlock = bare.slice(deskBlockStart, nextBlock > -1 ? nextBlock : deskBlockStart + 12000);

        expect(deskBlock).toContain('.social-project-task-shell--desk');
        expect(deskBlock).toContain('.spt-desk-plan-health-card');
        expect(deskBlock).toContain('.spt-desk-focus-chip');
        expect(deskBlock).toContain('.spt-desk-package');
        expect(deskBlock).toContain('.spt-desk-more-filters');
        expect(deskBlock).not.toContain('--sn-');
        expect(deskBlock).not.toContain('--spt-accent');
    });

    it('panel emits desk shell and toolbar markup', () => {
        const panel = readSource('assets/js/pages/social-workspace-panel.js');

        expect(panel).toContain('social-project-task-shell--desk');
        expect(panel).toContain('spt-desk-toolbar');
    });
});
