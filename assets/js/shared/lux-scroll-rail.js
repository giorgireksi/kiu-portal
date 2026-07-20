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

    function isHorizontalRail(shell, config = {}) {
        if (config.axis === 'horizontal') return true;
        if (shell?.classList?.contains('lux-scroll-rail--horizontal')) return true;
        return String(shell?.getAttribute('data-lux-scroll-axis') || '').trim().toLowerCase() === 'horizontal';
    }

    function resolveScrollStep(list, config, horizontal) {
        if (Number(config.step) > 0) return Number(config.step);
        if (horizontal) return Math.max(180, Math.min(320, Math.round(list.clientWidth * 0.78)));
        return DEFAULT_STEP;
    }

    function syncScrollRail(shell, config = {}) {
        const list = resolveViewport(shell, config);
        if (!list) return;

        const horizontal = isHorizontalRail(shell, config);
        let atStart;
        let atEnd;
        let scrollable;

        if (horizontal) {
            atStart = list.scrollLeft <= 4;
            atEnd = list.scrollLeft + list.clientWidth >= list.scrollWidth - 4;
            scrollable = list.scrollWidth > list.clientWidth + 8;
        } else {
            atStart = list.scrollTop <= 4;
            atEnd = list.scrollTop + list.clientHeight >= list.scrollHeight - 4;
            scrollable = list.scrollHeight > list.clientHeight + 8;
        }

        resolveButtons(shell, config).forEach((button) => {
            const dir = button.getAttribute('data-lux-scroll') || button.getAttribute('data-curriculum-scroll');
            let disabled = false;
            if (horizontal) {
                disabled = dir === 'left' ? atStart : dir === 'right' ? atEnd : false;
            } else {
                disabled = dir === 'up' ? atStart : dir === 'down' ? atEnd : false;
            }
            button.disabled = disabled;
            button.classList.toggle('is-disabled', disabled);
            button.setAttribute('aria-disabled', disabled ? 'true' : 'false');
        });

        shell.classList.toggle('is-scrollable', scrollable);
        if (horizontal) {
            shell.classList.toggle('is-at-start', atStart);
            shell.classList.toggle('is-at-end', atEnd);
            shell.classList.remove('is-at-top', 'is-at-bottom');
        } else {
            shell.classList.toggle('is-at-top', atStart);
            shell.classList.toggle('is-at-bottom', atEnd);
            shell.classList.remove('is-at-start', 'is-at-end');
        }

        const controlsSelector = config.controlsSelector || DEFAULT_CONTROLS_SELECTOR;
        shell.querySelectorAll(controlsSelector).forEach((controls) => {
            controls.hidden = !scrollable;
            controls.setAttribute('aria-hidden', scrollable ? 'false' : 'true');
        });
    }

    function bindScrollRail(shell, config = {}) {
        if (!shell || shell.dataset.luxScrollRailBound === '1') return;
        const list = resolveViewport(shell, config);
        if (!list) return;

        const horizontal = isHorizontalRail(shell, config);
        const step = resolveScrollStep(list, config, horizontal);

        resolveButtons(shell, config).forEach((button) => {
            button.addEventListener('click', (event) => {
                event.preventDefault();
                const dir = button.getAttribute('data-lux-scroll') || button.getAttribute('data-curriculum-scroll');
                if (horizontal) {
                    const delta = dir === 'left' ? -step : step;
                    list.scrollBy({ left: delta, behavior: 'smooth' });
                    return;
                }
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