import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social-project-team-tab', () => {
    it('bare-lite includes team tab paint hooks', () => {
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        const teamBlockStart = bare.indexOf('/* Social: project workspace team tab */');
        expect(teamBlockStart).toBeGreaterThan(-1);
        const teamBlock = bare.slice(teamBlockStart, teamBlockStart + 6000);

        expect(teamBlock).toContain('.social-project-tab-panel');
        expect(teamBlock).toContain('.social-project-team-shell');
        expect(teamBlock).toContain('.social-project-team-row');
        expect(teamBlock).toContain('.social-project-team-invite');
        expect(teamBlock).not.toContain('--sn-bdr');
        expect(teamBlock).not.toContain('--sn-proj-accent');
    });

    it('panel sparkline markup uses lux accent tokens', () => {
        const panel = readSource('assets/js/pages/social-workspace-panel.js');

        expect(panel).toContain('var(--lux-accent, #7c6cff)');
        expect(panel).not.toContain('--sn-proj-accent');
    });
});
