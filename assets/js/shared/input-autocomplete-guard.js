(function initInputAutocompleteGuard() {
    'use strict';

    const PRESERVE_AUTOCOMPLETE = new Set(['username', 'email', 'current-password', 'new-password']);
    const SKIP_INPUT_TYPES = new Set(['hidden', 'file', 'button', 'submit', 'reset', 'image', 'range', 'checkbox', 'radio']);
    const PRESERVE_IDS = new Set([
        'login-email',
        'login-password',
        'act-password',
        'exam-login-email',
        'desktop-login-email',
        'desktop-login-password'
    ]);

    function shouldPreserveAutocomplete(el) {
        if (!el || el.nodeType !== 1) return true;
        if (el.closest('[data-kiu-preserve-autocomplete="true"]')) return true;
        if (el.dataset?.kiuPreserveAutocomplete === 'true') return true;
        const autocomplete = String(el.getAttribute('autocomplete') || '').trim().toLowerCase();
        if (autocomplete && PRESERVE_AUTOCOMPLETE.has(autocomplete)) return true;
        const id = String(el.id || '').trim();
        if (id && PRESERVE_IDS.has(id)) return true;
        if (el.type === 'password' && el.closest('#profile-tab-password')) return true;
        return false;
    }

    function shouldSkipControl(el) {
        if (!el || el.nodeType !== 1) return true;
        if (el instanceof HTMLInputElement) {
            const type = String(el.type || 'text').trim().toLowerCase();
            if (SKIP_INPUT_TYPES.has(type)) return true;
        }
        return shouldPreserveAutocomplete(el);
    }

    function applyAutocompleteOff(root) {
        if (!root || typeof root.querySelectorAll !== 'function') return;
        root.querySelectorAll('input, textarea, select').forEach((el) => {
            if (shouldSkipControl(el)) return;
            if (el.hasAttribute('autocomplete')) return;
            el.setAttribute('autocomplete', 'off');
        });
        root.querySelectorAll('form').forEach((form) => {
            if (form.hasAttribute('autocomplete')) return;
            form.setAttribute('autocomplete', 'off');
        });
    }

    function collectElementNodes(node, bucket) {
        if (!node || node.nodeType !== 1) return;
        bucket.push(node);
        if (typeof node.querySelectorAll === 'function') {
            node.querySelectorAll('input, textarea, select, form').forEach((el) => bucket.push(el));
        }
    }

    function setupInputAutocompleteGuard() {
        if (window.__kiuInputAutocompleteGuardInstalled) return;
        window.__kiuInputAutocompleteGuardInstalled = true;

        applyAutocompleteOff(document);

        if (!window.MutationObserver || !document.body) return;

        let debounceTimer = null;
        const observer = new MutationObserver((mutations) => {
            const pending = [];
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => collectElementNodes(node, pending));
            });
            if (!pending.length) return;
            if (debounceTimer) window.clearTimeout(debounceTimer);
            debounceTimer = window.setTimeout(() => {
                debounceTimer = null;
                const roots = new Set();
                pending.forEach((node) => {
                    if (node.matches?.('input, textarea, select, form')) applyAutocompleteOff(node.parentElement || document);
                    else roots.add(node);
                });
                roots.forEach((root) => applyAutocompleteOff(root));
            }, 50);
        });

        observer.observe(document.body, { childList: true, subtree: true });
        window.__kiuInputAutocompleteGuardObserver = observer;
    }

    window.applyAutocompleteOff = applyAutocompleteOff;
    window.setupInputAutocompleteGuard = setupInputAutocompleteGuard;

    function bootInputAutocompleteGuard() {
        if (document.body) {
            setupInputAutocompleteGuard();
            return;
        }
        const bodyObserver = new MutationObserver(() => {
            if (!document.body) return;
            bodyObserver.disconnect();
            setupInputAutocompleteGuard();
        });
        bodyObserver.observe(document.documentElement, { childList: true, subtree: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bootInputAutocompleteGuard, { once: true });
    } else {
        bootInputAutocompleteGuard();
    }
})();