import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

function createFlashHelpers() {
    const runtime = { flash: null, toasts: [] };
    function text(value) {
        return String(value == null ? '' : value).trim();
    }
    function setFlash(message, tone = 'info', options = {}) {
        const resolvedTone = text(tone) || 'info';
        if (message && (resolvedTone === 'success' || resolvedTone === 'info')) return;
        runtime.flash = message ? { message: text(message), tone: resolvedTone } : null;
        if (!message) return;
    }
    function addToast(options = {}) {
        if (text(options.type || 'info') === 'success') return '';
        const toast = {
            id: options.id || 'toast-test',
            type: options.type || 'info',
            title: text(options.title || 'Notification'),
            text: text(options.text || '')
        };
        runtime.toasts = runtime.toasts || [];
        runtime.toasts.push(toast);
        return toast.id;
    }
    return { runtime, setFlash, addToast };
}

describe('social flash suppression', () => {
    it('documents guards in social-runtime-lite.js', () => {
        const source = readSource('assets/js/shared/social-runtime-lite.js');
        expect(source).toMatch(/if \(message && \(resolvedTone === 'success' \|\| resolvedTone === 'info'\)\) return;/);
        expect(source).toMatch(/if \(text\(options\.type \|\| 'info'\) === 'success'\) return '';/);
    });

    it('suppresses success and info flashes', () => {
        const { runtime, setFlash } = createFlashHelpers();
        setFlash('Unpinned.', 'success');
        expect(runtime.flash).toBeNull();

        setFlash('Graph saved.', 'info');
        expect(runtime.flash).toBeNull();
    });

    it('keeps danger and error flashes', () => {
        const { runtime, setFlash } = createFlashHelpers();
        setFlash('Pin state could not be updated.', 'danger');
        expect(runtime.flash).toEqual({
            message: 'Pin state could not be updated.',
            tone: 'danger'
        });

        setFlash(null);
        setFlash('Could not save RSVP. Try again.', 'error');
        expect(runtime.flash).toEqual({
            message: 'Could not save RSVP. Try again.',
            tone: 'error'
        });
    });

    it('suppresses success toasts but keeps validation toasts', () => {
        const { runtime, addToast } = createFlashHelpers();
        const successId = addToast({
            type: 'success',
            title: 'Saved for later',
            text: 'The post is now available from saved content.'
        });
        expect(successId).toBe('');
        expect(runtime.toasts).toHaveLength(0);

        const infoId = addToast({
            title: 'Title required',
            text: 'Add a publication title.'
        });
        expect(infoId).toBeTruthy();
        expect(runtime.toasts).toHaveLength(1);
        expect(runtime.toasts[0].title).toBe('Title required');
    });
});
