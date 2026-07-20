import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('input autocomplete guard', () => {
    it('ships a global guard module with preserve rules and observer boot', () => {
        const guard = readSource('assets/js/shared/input-autocomplete-guard.js');

        expect(guard).toContain('window.setupInputAutocompleteGuard = setupInputAutocompleteGuard');
        expect(guard).toContain('window.applyAutocompleteOff = applyAutocompleteOff');
        expect(guard).toContain("el.setAttribute('autocomplete', 'off')");
        expect(guard).toContain('current-password');
        expect(guard).toContain('new-password');
        expect(guard).toContain('login-email');
        expect(guard).toContain('MutationObserver');
        expect(guard).not.toContain("PRESERVE_AUTOCOMPLETE.has(autocomplete)) return false");
    });

    it('boots from utilities initPalette and SPA navigate rescan', () => {
        const utilities = readSource('assets/js/shared/utilities.js');
        const luxury = readSource('assets/js/features/index-luxury.js');

        expect(utilities).toContain('setupInputAutocompleteGuard');
        expect(luxury).toContain('applyAutocompleteOff(activePage || document)');
    });

    it('loads on standalone auth pages and preserves login email autocomplete', () => {
        const login = readSource('login.html');
        const examPortal = readSource('exam-portal.html');
        const antiCheatLogin = readSource('anti-cheat/src/ui/login.html');
        const index = readSource('index.html');

        expect(login).toContain('assets/js/shared/input-autocomplete-guard.js?v=20260627-autocomplete-guard1');
        expect(examPortal).toContain('assets/js/shared/input-autocomplete-guard.js?v=20260627-autocomplete-guard1');
        expect(antiCheatLogin).toContain('assets/js/shared/input-autocomplete-guard.js?v=20260627-autocomplete-guard1');
        expect(index).toContain('assets/js/shared/input-autocomplete-guard.js?v=20260627-autocomplete-guard1');
        expect(readSource('profile-view.html')).toContain('assets/js/shared/input-autocomplete-guard.js?v=20260627-autocomplete-guard1');
        expect(login).toContain('id="login-email" autocomplete="username"');
    });
});