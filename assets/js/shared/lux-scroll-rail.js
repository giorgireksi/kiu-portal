/* Shared luxury scroll-rail behavior for all routes. */
(function luxScrollRailModule(global) {
    'use strict';

    const DEFAULT_STEP = 140;
    const DEFAULT_SHELL_SELECTOR = '[data-lux-scroll-rail]';
    const DEFAULT_VIEWPORT_SELECTOR = '.lux-scroll-rail__viewport';
    const DEFAULT_CONTROLS_SELECTOR = '.lux-scroll-rail__controls';
    const DEFAULT_BUTTON_SELECTOR = '[data-lux-scroll]';

    function resolveViewport(shell, config) {
        if (config.viewportSelector) {
            const scoped = shell.querySelector(config.viewportSelector);
            if (scoped) return scoped;
        }
        return shell.querySelector(DEFAULT_VIEWPORT_SELECTOR);
    }

    function resolveButtons(shell, config) {
        const selector = config.buttonSelector || DEFAULT_BUTTON_SELECTOR;
        return Array.from(shell.querySelectorAll(selector));
    }

    function syncScrollRail(shell, config = {}) {
        const list = resolveViewport(shell, config);
        if (!list) return;

        const atTop = list.scrollTop <= 4;
        const atBottom = list.scrollTop + list.clientHeight >= list.scrollHeight - 4;
        const scrollable = list.scrollHeight > list.clientHeight + 8;

        resolveButtons(shell, config).forEach((button) => {
            const dir = button.getAttribute('data-lux-scroll') || button.getAttribute('data-curriculum-scroll');
            const disabled = dir === 'up' ? atTop : dir === 'down' ? atBottom : false;
            button.disabled = disabled;
            button.classList.toggle('is-disabled', disabled);
            button.setAttribute('aria-disabled', disabled ? 'true' : 'false');
        });

        shell.classList.toggle('is-scrollable', scrollable);
        shell.classList.toggle('is-at-top', atTop);
        shell.classList.toggle('is-at-bottom', atBottom);

        const controlsSelector = config.controlsSelector || DEFAULT_CONTROLS_SELECTOR;
        const controls = shell.querySelector(controlsSelector);
        if (controls) {
            controls.hidden = !scrollable;
            controls.setAttribute('aria-hidden', scrollable ? 'false' : 'true');
        }
    }

    function bindScrollRail(shell, config = {}) {
        if (!shell || shell.dataset.luxScrollRailBound === '1') return;
        const list = resolveViewport(shell, config);
        if (!list) return;

        const step = Number(config.step) > 0 ? Number(config.step) : DEFAULT_STEP;

        resolveButtons(shell, config).forEach((button) => {
            button.addEventListener('click', (event) => {
                event.preventDefault();
                const dir = button.getAttribute('data-lux-scroll') || button.getAttribute('data-curriculum-scroll');
                const delta = dir === 'up' ? -step : step;
                list.scrollBy({ top: delta, behavior: 'smooth' });
            });
        });

        list.addEventListener('scroll', () => syncScrollRail(shell, config), { passive: true });

        if (global.ResizeObserver) {
            const observer = new global.ResizeObserver(() => syncScrollRail(shell, config));
            observer.observe(list);
            shell._luxScrollRailResizeObserver = observer;
        }

        shell.dataset.luxScrollRailBound = '1';
        syncScrollRail(shell, config);
    }

    function initLuxScrollRail(root, config = {}) {
        const scope = root || document;
        const shellSelector = config.shellSelector || DEFAULT_SHELL_SELECTOR;
        scope.querySelectorAll(shellSelector).forEach((shell) => bindScrollRail(shell, config));
        return true;
    }

    function syncLuxScrollRail(root, config = {}) {
        const scope = root || document;
        const shellSelector = config.shellSelector || DEFAULT_SHELL_SELECTOR;
        scope.querySelectorAll(shellSelector).forEach((shell) => syncScrollRail(shell, config));
    }

    global.initLuxScrollRail = initLuxScrollRail;
    global.syncLuxScrollRail = syncLuxScrollRail;
})(window);