import { describe, expect, it } from 'vitest';
import { createRequire } from 'module';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const require = createRequire(import.meta.url);
const { PlatformStore } = require('../backend/platform/store.js');

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('direct chat account validation', () => {
    it('requires both direct-chat participants to be known accounts in the store', () => {
        const store = new PlatformStore({});
        store.state.accounts['user-a'] = { id: 'user-a', role: 'student', displayName: 'User A', email: 'a@example.com' };
        store.state.accounts['user-b'] = { id: 'user-b', role: 'student', displayName: 'User B', email: 'b@example.com' };

        expect(store.ensureDirectChat('user-a', 'user-b')).not.toBeNull();
        expect(store.ensureDirectChat('user-a', 'missing-user')).toBeNull();
    });

    it('documents the open-directory direct-message policy in the social UI', () => {
        const socialPage = readSource('assets/js/pages/social-page.js')
            + readSource('assets/js/pages/social-workspace-portfolio-ui.js');

        expect(socialPage).toContain('data-action="portfolio-contact"');
        expect(socialPage).toContain('Message creator');
    });
});
