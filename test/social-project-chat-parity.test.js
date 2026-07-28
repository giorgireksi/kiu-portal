import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social-project-chat-parity (bare-shell era)', () => {
    it('social domain paint CSS removed; behavior tests deferred to JS modules', () => {
        expect(existsSync(join(process.cwd(), 'assets/css/social-rebuild.css'))).toBe(false);
        expect(existsSync(join(process.cwd(), 'assets/css/social-projects-lms.css'))).toBe(false);
    });

    it('bare-lite includes embedded workspace chat paint hooks', () => {
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        const chatBlockStart = bare.indexOf('/* Social: project workspace chat */');
        expect(chatBlockStart).toBeGreaterThan(-1);
        const chatBlock = bare.slice(chatBlockStart, chatBlockStart + 6000);

        expect(chatBlock).toContain('.social-project-workspace-chat');
        expect(chatBlock).toContain('.social-neo-messages__thread-shell');
        expect(chatBlock).toContain('.social-neo-message');
        expect(chatBlock).toContain('.social-neo-messages__composer');
        expect(chatBlock).not.toContain('--sn-bdr');
        expect(chatBlock).not.toContain('--sn-bg');
    });
});
