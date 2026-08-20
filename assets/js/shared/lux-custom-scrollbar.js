(function initLuxCustomScrollbarModule() {
    if (window.__LUX_CUSTOM_SCROLLBAR_LOADED) return;
    window.__LUX_CUSTOM_SCROLLBAR_LOADED = true;

    const RAIL_ATTR = 'data-lux-custom-scrollbar';
    const THUMB_ATTR = 'data-lux-custom-scrollbar-thumb';
    const BOUND_ATTR = 'data-lux-custom-scrollbar-bound';
    const AXIS_ATTR = 'data-lux-custom-scrollbar-axis';
    const HORIZONTAL = 'horizontal';
    const INSTANCE_MAP = new Map();

    function isWindowScroller(el) {
        return el === document.documentElement || el === document.body || el === window;
    }
    function isFixedPageScroller(el) {
        return el && el.matches && el.matches('#social-neo-center-region, .social-neo-center');
    }
    function isPageScroller(el) {
        return isWindowScroller(el) || isFixedPageScroller(el);
    }

    function resolveScroller(target) {
        if (!target) return null;
        if (target === window || target === document.documentElement || target === document.body) return document.scrollingElement || document.documentElement;
        if (target instanceof Element) return target;
        if (typeof target === 'string') return document.querySelector(target);
        return null;
    }

    function ensureShell(scroller, isWindow) {
        if (isWindow || isFixedPageScroller(scroller)) return document.documentElement;
        // scroller's parent should be a positioning shell. Picker panels are
        // already absolutely positioned; marking them as generic shells would
        // apply the later [data-lux-custom-scrollbar-shell] rule and pull the
        // closed panel into normal layout flow.
        const parent = scroller.parentElement;
        if (!parent) return scroller;
        const existingShell = scroller.closest('[data-lux-custom-scrollbar-shell]');
        if (existingShell && !existingShell.matches('.lux-picker-panel, .lux-universal-picker-panel, .lux-droplist-panel')) {
            return existingShell;
        }
        const isPickerPanel = parent.matches('.lux-picker-panel, .lux-universal-picker-panel, .lux-droplist-panel');
        if (isPickerPanel) {
            parent.removeAttribute('data-lux-custom-scrollbar-shell');
            if (parent.style.position === 'relative') parent.style.removeProperty('position');
        } else {
            parent.setAttribute('data-lux-custom-scrollbar-shell', '1');
            if (getComputedStyle(parent).position === 'static') {
                parent.style.position = 'relative';
            }
        }
        return parent;
    }

    function createRail(shell, scroller, axis) {
        const isFixedPage = isFixedPageScroller(scroller);
        const isWindow = isWindowScroller(scroller);
        const isPage = isPageScroller(scroller) || isWindowScroller(shell);
        if (!isPage) {
            // One inner rail belongs to one scrollport. Reusing the first rail
            // in a shared modal/panel shell makes sibling lists control each
            // other and leaves one of them visually untracked.
            const existingInstance = INSTANCE_MAP.get(scroller);
            if (existingInstance?.rail?.isConnected) return existingInstance.rail;
        } else {
            const existingPage = document.body.querySelector(`[${RAIL_ATTR}="window"]`);
            if (existingPage && isWindow) return existingPage;
            // For a fixed center, keep a distinct rail keyed to that scroller.
            const existingFixed = document.body.querySelector(`[${RAIL_ATTR}="page-${scroller.id || 'center'}"]`);
            if (existingFixed && isFixedPage) return existingFixed;
        }
        // For window/page rails, create a fixed overlay in body.
        const rail = document.createElement('div');
        rail.setAttribute(RAIL_ATTR, isWindow ? 'window' : isFixedPage ? `page-${scroller.id || 'center'}` : '1');
        rail.setAttribute('role', 'scrollbar');
        rail.setAttribute('aria-orientation', axis === HORIZONTAL ? 'horizontal' : 'vertical');
        rail.setAttribute('aria-valuemin', '0');
        rail.setAttribute('aria-valuemax', '0');
        rail.setAttribute('aria-valuenow', '0');
        rail.setAttribute('aria-disabled', 'true');
        rail.setAttribute('tabindex', '0');
        if (axis === HORIZONTAL) rail.setAttribute(AXIS_ATTR, HORIZONTAL);
        const thumb = document.createElement('span');
        thumb.setAttribute(THUMB_ATTR, '');
        thumb.className = 'lux-custom-scrollbar__thumb';
        rail.appendChild(thumb);
        rail.className = 'lux-custom-scrollbar';
        if (axis === HORIZONTAL) rail.classList.add('lux-custom-scrollbar--horizontal');
        if (isWindow) {
            rail.classList.add('lux-custom-scrollbar--window');
            document.body.appendChild(rail);
        } else if (isFixedPage) {
            rail.classList.add('lux-custom-scrollbar--window');
            rail.classList.add('lux-custom-scrollbar--page');
            document.body.appendChild(rail);
        } else {
            // ensure shell is positioning context
            shell.appendChild(rail);
        }
        return rail;
    }

    function bindInstance(scroller, rail, axis, shell, isWindow) {
        if (scroller.getAttribute(BOUND_ATTR) === '1' && INSTANCE_MAP.has(scroller)) return INSTANCE_MAP.get(scroller);
        const thumb = rail.querySelector(`[${THUMB_ATTR}]`);
        if (!thumb) return null;

        let dragging = false;
        let rafId = 0;

        const sync = () => {
            if (rafId) cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(() => {
                rafId = 0;
                const isH = axis === HORIZONTAL;
                let scrollPos, scrollSize, clientSize, maxScroll, railSize, thumbSize, travel, ratio;
                if (isWindow) {
                    scrollPos = window.scrollY || document.documentElement.scrollTop || 0;
                    scrollSize = document.documentElement.scrollHeight;
                    clientSize = window.innerHeight;
                    maxScroll = Math.max(0, scrollSize - clientSize);
                    const hasOverflow = maxScroll > 1;
                    rail.setAttribute('aria-disabled', hasOverflow ? 'false' : 'true');
                    rail.setAttribute('aria-valuemax', String(maxScroll));
                    rail.setAttribute('aria-valuenow', String(Math.round(scrollPos)));
                    if (!hasOverflow) {
                        thumb.style.height = '32px';
                        thumb.style.top = '0px';
                        rail.style.opacity = '.18';
                        return;
                    }
                    rail.style.opacity = '';
                    const railH = rail.clientHeight || window.innerHeight;
                    const th = Math.max(32, Math.round(railH * (clientSize / scrollSize)));
                    const trav = Math.max(0, railH - th);
                    thumb.style.height = th + 'px';
                    thumb.style.top = (maxScroll ? (scrollPos / maxScroll) * trav : 0) + 'px';
                    return;
                }
                if (isFixedPageScroller(scroller)) {
                    scrollPos = scroller.scrollTop;
                    scrollSize = scroller.scrollHeight;
                    clientSize = scroller.clientHeight;
                    maxScroll = Math.max(0, scrollSize - clientSize);
                    const hasOverflow = maxScroll > 1;
                    rail.setAttribute('aria-disabled', hasOverflow ? 'false' : 'true');
                    rail.setAttribute('aria-valuemax', String(maxScroll));
                    rail.setAttribute('aria-valuenow', String(Math.round(scrollPos)));
                    if (!hasOverflow) {
                        thumb.style.height = '32px';
                        thumb.style.top = '0px';
                        rail.style.opacity = '0';
                        rail.style.pointerEvents = 'none';
                        return;
                    }
                    rail.style.opacity = '';
                    rail.style.pointerEvents = '';
                    const railH = rail.clientHeight || clientSize;
                    const th = Math.max(32, Math.round(railH * (clientSize / scrollSize)));
                    const trav = Math.max(0, railH - th);
                    thumb.style.height = th + 'px';
                    thumb.style.top = (maxScroll ? (scrollPos / maxScroll) * trav : 0) + 'px';
                    return;
                }
                if (isH) {
                    scrollPos = scroller.scrollLeft;
                    scrollSize = scroller.scrollWidth;
                    clientSize = scroller.clientWidth;
                    maxScroll = Math.max(0, scrollSize - clientSize);
                    const hasOverflow = maxScroll > 1;
                    rail.setAttribute('aria-disabled', hasOverflow ? 'false' : 'true');
                    rail.setAttribute('aria-valuemax', String(maxScroll));
                    rail.setAttribute('aria-valuenow', String(Math.round(scrollPos)));
                    if (!hasOverflow) {
                        thumb.style.width = '32px';
                        thumb.style.left = '0px';
                        rail.style.opacity = '.18';
                        return;
                    }
                    rail.style.opacity = '';
                    const railW = rail.clientWidth || scroller.clientWidth;
                    const tw = Math.max(32, Math.round(railW * (clientSize / scrollSize)));
                    const trav2 = Math.max(0, railW - tw);
                    thumb.style.width = tw + 'px';
                    thumb.style.left = (maxScroll ? (scrollPos / maxScroll) * trav2 : 0) + 'px';
                    return;
                }
                // vertical inner
                const shellRect = shell.getBoundingClientRect();
                const scrollRect = scroller.getBoundingClientRect();
                maxScroll = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
                const hasOverflow = maxScroll > 1;
                rail.setAttribute('aria-disabled', hasOverflow ? 'false' : 'true');
                rail.setAttribute('aria-valuemax', String(maxScroll));
                rail.setAttribute('aria-valuenow', String(Math.round(scroller.scrollTop)));
                // position rail to match scroller viewport inside shell
                rail.style.top = (scrollRect.top - shellRect.top) + 'px';
                rail.style.height = scrollRect.height + 'px';
                if (!hasOverflow) {
                    thumb.style.height = '32px';
                    thumb.style.top = '0px';
                    rail.style.opacity = '0';
                    rail.style.pointerEvents = 'none';
                    return;
                }
                rail.style.opacity = '';
                rail.style.pointerEvents = '';
                const railH = Math.max(1, rail.clientHeight);
                const th = Math.max(32, Math.round(railH * (scroller.clientHeight / scroller.scrollHeight)));
                const trav = Math.max(0, railH - th);
                thumb.style.height = th + 'px';
                thumb.style.top = ((scroller.scrollTop / maxScroll) * trav) + 'px';
            });
        };

        const onScroll = sync;

        const onWheelScroller = (event) => {
            if (axis === HORIZONTAL) return;
            const maxScroll = isWindow ? Math.max(0, document.documentElement.scrollHeight - window.innerHeight) : Math.max(0, scroller.scrollHeight - scroller.clientHeight);
            if (maxScroll <= 1) return;
            const pos = isWindow ? (window.scrollY || 0) : scroller.scrollTop;
            const atTop = pos <= 0;
            const atBottom = pos + (isWindow ? window.innerHeight : scroller.clientHeight) >= (isWindow ? document.documentElement.scrollHeight : scroller.scrollHeight) - 1;
            if ((event.deltaY < 0 && !atTop) || (event.deltaY > 0 && !atBottom)) {
                event.preventDefault();
                if (isWindow) window.scrollBy({ top: event.deltaY, behavior: 'auto' });
                else scroller.scrollTop += event.deltaY;
                sync();
            }
        };

        const onWheelRail = (event) => {
            event.preventDefault();
            if (isWindow) window.scrollBy({ top: event.deltaY, left: event.deltaX, behavior: 'auto' });
            else if (axis === HORIZONTAL) scroller.scrollLeft += event.deltaY || event.deltaX;
            else scroller.scrollTop += event.deltaY;
        };

        const setScrollFromPointer = (clientY, clientX) => {
            if (isWindow) {
                const railRect = rail.getBoundingClientRect();
                const th = thumb.getBoundingClientRect().height;
                const trav = Math.max(1, railRect.height - th);
                const ratio = Math.max(0, Math.min(1, (clientY - railRect.top - th / 2) / trav));
                const maxS = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
                window.scrollTo({ top: ratio * maxS, behavior: 'auto' });
                return;
            }
            if (axis === HORIZONTAL) {
                const railRect = rail.getBoundingClientRect();
                const tw = thumb.getBoundingClientRect().width;
                const trav = Math.max(1, railRect.width - tw);
                const ratio = Math.max(0, Math.min(1, (clientX - railRect.left - tw / 2) / trav));
                scroller.scrollLeft = ratio * Math.max(0, scroller.scrollWidth - scroller.clientWidth);
                return;
            }
            const railRect = rail.getBoundingClientRect();
            const th = thumb.getBoundingClientRect().height;
            const trav = Math.max(1, railRect.height - th);
            const ratio = Math.max(0, Math.min(1, (clientY - railRect.top - th / 2) / trav));
            scroller.scrollTop = ratio * Math.max(0, scroller.scrollHeight - scroller.clientHeight);
        };

        const onPointerDown = (event) => {
            if (rail.getAttribute('aria-disabled') === 'true') return;
            // allow thumb drag or rail click
            event.preventDefault();
            dragging = true;
            try { rail.setPointerCapture?.(event.pointerId); } catch (_) {}
            setScrollFromPointer(event.clientY, event.clientX);
        };
        const onPointerMove = (event) => {
            if (dragging) setScrollFromPointer(event.clientY, event.clientX);
        };
        const stopDragging = () => { dragging = false; };
        const onKeyDown = (event) => {
            if (isWindow) {
                const page = Math.max(40, window.innerHeight * 0.85);
                const increments = { ArrowUp: -40, ArrowDown: 40, PageUp: -page, PageDown: page };
                if (event.key === 'Home') window.scrollTo({ top: 0, behavior: 'auto' });
                else if (event.key === 'End') window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'auto' });
                else if (increments[event.key]) window.scrollBy({ top: increments[event.key], behavior: 'auto' });
                else return;
                event.preventDefault();
                sync();
                return;
            }
            const isH = axis === HORIZONTAL;
            const page = Math.max(40, (isH ? scroller.clientWidth : scroller.clientHeight) * 0.85);
            if (isH) {
                const incH = { ArrowLeft: -40, ArrowRight: 40 };
                if (event.key === 'Home') scroller.scrollLeft = 0;
                else if (event.key === 'End') scroller.scrollLeft = scroller.scrollWidth;
                else if (incH[event.key]) scroller.scrollLeft += incH[event.key];
                else if (event.key === 'PageUp') scroller.scrollLeft -= page;
                else if (event.key === 'PageDown') scroller.scrollLeft += page;
                else return;
            } else {
                const inc = { ArrowUp: -40, ArrowDown: 40, PageUp: -page, PageDown: page };
                if (event.key === 'Home') scroller.scrollTop = 0;
                else if (event.key === 'End') scroller.scrollTop = scroller.scrollHeight;
                else if (inc[event.key]) scroller.scrollTop += inc[event.key];
                else return;
            }
            event.preventDefault();
        };

        // attach
        let ro = null;
        let moInner = null;
        if (isWindow) {
            window.addEventListener('scroll', onScroll, { passive: true });
            window.addEventListener('resize', sync, { passive: true });
            if (window.visualViewport) window.visualViewport.addEventListener('resize', sync, { passive: true });
        } else {
            scroller.addEventListener('scroll', onScroll, { passive: true });
            // wheel forwarding disabled to restore native scroll — sync only
            try {
                if (typeof ResizeObserver === 'function') {
                    ro = new ResizeObserver(sync);
                    ro.observe(scroller);
                    if (shell !== scroller) ro.observe(shell);
                }
                moInner = new MutationObserver(sync);
                moInner.observe(scroller, { childList: true, subtree: true, characterData: true });
            } catch (_) {}
        }
        rail.addEventListener('wheel', onWheelRail, { passive: false });
        rail.addEventListener('pointerdown', onPointerDown);
        rail.addEventListener('pointermove', onPointerMove);
        rail.addEventListener('pointerup', stopDragging);
        rail.addEventListener('pointercancel', stopDragging);
        rail.addEventListener('keydown', onKeyDown);

        // hide native, show single custom rail (now thin 7px to match native)
        scroller.setAttribute(BOUND_ATTR, '1');
        if (!isWindow) {
            scroller.style.scrollbarWidth = 'none';
            scroller.style.setProperty('-ms-overflow-style', 'none');
            scroller.setAttribute('data-lux-custom-scrollbar-target', '1');
        } else {
            document.documentElement.setAttribute('data-lux-custom-scrollbar-target', 'window');
        }

        const instance = { scroller, rail, thumb, shell, axis, isWindow, sync, ro, moInner, destroy: () => {
            try {
                if (isWindow) {
                    window.removeEventListener('scroll', onScroll);
                    window.removeEventListener('resize', sync);
                    if (window.visualViewport) window.visualViewport.removeEventListener('resize', sync);
                } else {
                    scroller.removeEventListener('scroll', onScroll);
                }
                rail.removeEventListener('wheel', onWheelRail);
                rail.removeEventListener('pointerdown', onPointerDown);
                rail.removeEventListener('pointermove', onPointerMove);
                rail.removeEventListener('pointerup', stopDragging);
                rail.removeEventListener('pointercancel', stopDragging);
                rail.removeEventListener('keydown', onKeyDown);
                if (ro) ro.disconnect();
                if (moInner) moInner.disconnect();
            } catch (_) {}
            INSTANCE_MAP.delete(scroller);
            scroller.removeAttribute(BOUND_ATTR);
            if (isWindow) {
                document.documentElement.removeAttribute('data-lux-custom-scrollbar-target');
            } else {
                scroller.removeAttribute('data-lux-custom-scrollbar-target');
            }
            scroller.style.removeProperty('scrollbar-width');
            scroller.style.removeProperty('-ms-overflow-style');
            try { rail.remove(); } catch (_) {}
        }};
        INSTANCE_MAP.set(scroller, instance);
        // initial sync next frame
        requestAnimationFrame(sync);
        return instance;
    }

    window.initLuxCustomScrollbar = function(scrollerOrSelector, opts = {}) {
        const scroller = resolveScroller(scrollerOrSelector);
        if (!scroller) return null;
        if (scroller.getAttribute && scroller.getAttribute(BOUND_ATTR) === '1') {
            const existing = INSTANCE_MAP.get(scroller);
            if (existing) {
                existing.sync?.();
                return existing;
            }
        }
        const axis = opts.axis === HORIZONTAL ? HORIZONTAL : 'vertical';
        const isWindow = isWindowScroller(scroller);
        const shell = isWindow ? document.documentElement : ensureShell(scroller, false);
        const rail = createRail(shell, scroller, axis);
        return bindInstance(scroller, rail, axis, shell, isWindow);
    };

    window.syncLuxCustomScrollbar = function(root = document) {
        // sync all existing
        INSTANCE_MAP.forEach((inst) => { try { inst.sync(); } catch (_) {} });
        // auto-discover unbound candidates inside root
        if (!root || !root.querySelectorAll) return;
        const candidates = root.querySelectorAll('[data-lux-custom-scrollbar-auto]');
        candidates.forEach((el) => {
            if (el.getAttribute(BOUND_ATTR) === '1') return;
            const axis = el.getAttribute(AXIS_ATTR) === HORIZONTAL ? HORIZONTAL : 'vertical';
            window.initLuxCustomScrollbar(el, { axis });
        });
    };

    window.destroyLuxCustomScrollbar = function(scrollerOrSelector) {
        const scroller = resolveScroller(scrollerOrSelector);
        if (!scroller) return;
        const inst = INSTANCE_MAP.get(scroller);
        if (inst && typeof inst.destroy === 'function') inst.destroy();
    };

    // Auto-apply: window scrollbar always
    function autoInitWindow() {
        // Don't create window rail if body is modal-locked? Still create but hide via opacity when no overflow
        try { window.initLuxCustomScrollbar(document.scrollingElement || document.documentElement); } catch (_) {}
    }

    function autoInitGlobals() {
        // Mark common scrollports for auto-init via MutationObserver
        const autoSelectors = [
            '#social-neo-center-region',
            '.social-neo-center',
            '.modal-body',
            '.lux-glass-dialog-body',
            '.lux-glass-dialog-card .lux-glass-dialog-body',
            '.modal-content:not(:has(> .modal-body))',
            '.lux-picker-panel-scrollport',
            '.lux-picker-options',
            '.lux-droplist-scroll',
            '.sph-pick-rail-list',
            '.sph-pick-results',
            '.social-project-scroll-list',
            '.social-neo-chat-items',
            '.sn-alerts-panel',
            '.lms-interaction-direct__log',
            '.lms-interaction-direct__inbox',
            '.lms-interaction-direct__compose-list',
            '.lms-interaction-messenger .social-neo-messages__thread-scroll',
            '.lms-announcement-feed',
            '.admin-library-scroll-wrap',
            '.admin-scheduler-session-modal-chip-list',
            '.lux-program-semester-table-scroll',
            '.gradebook-table-wrap',
            '.timetable-grid',
            '.curriculum-library-panel',
            '.lms-whiteboard-command-bar-scroll',
            '.student-service-ticket-chat-log',
            '.newsx-post-detail-scroll',
            '.chancellery-case-scroll'
        ];
        const seenAttr = 'data-lux-custom-auto-seen';
        function isSocialCenterScroller(el) {
            return document.body?.classList.contains('lux-route-social')
                && el?.matches?.('#social-neo-center-region, .social-neo-center');
        }
        function releaseSocialCenterScroller(el) {
            if (!el) return;
            const instance = INSTANCE_MAP.get(el);
            if (instance && typeof instance.destroy === 'function') instance.destroy();
            el.removeAttribute(seenAttr);
            el.removeAttribute('data-lux-custom-scrollbar-auto');
            el.removeAttribute(AXIS_ATTR);
            el.removeAttribute(BOUND_ATTR);
            el.removeAttribute('data-lux-custom-scrollbar-target');
            el.style.removeProperty('scrollbar-width');
            el.style.removeProperty('-ms-overflow-style');
        }
        function isIgnoredScrollport(el) {
            return !el
                || el === document.documentElement
                || el === document.body
                || el.matches('script, style, link, meta, svg, canvas, video, iframe, input, select, textarea, [data-lux-scrollbar-ignore]');
        }
        function hasScrollableOverflow(el) {
            if (isIgnoredScrollport(el) || isSocialCenterScroller(el)) return false;
            const style = getComputedStyle(el);
            const x = /(auto|scroll|overlay)/.test(style.overflowX);
            const y = /(auto|scroll|overlay)/.test(style.overflowY);
            return (x && el.scrollWidth > el.clientWidth + 1)
                || (y && el.scrollHeight > el.clientHeight + 1);
        }
        function resolveAxis(el) {
            const declared = el.getAttribute(AXIS_ATTR) || el.getAttribute('data-lux-scroll-axis');
            if (declared === HORIZONTAL) return HORIZONTAL;
            if (declared === 'vertical') return 'vertical';
            return el.scrollWidth > el.clientWidth + 1 && el.scrollHeight <= el.clientHeight + 1
                ? HORIZONTAL
                : 'vertical';
        }
        function scan(root) {
            if (!root || !root.querySelectorAll) return;
            const candidates = new Set();
            const add = (el, force = false) => {
                if (!el || isIgnoredScrollport(el) || isSocialCenterScroller(el)) {
                    if (isSocialCenterScroller(el)) releaseSocialCenterScroller(el);
                    return;
                }
                const explicit = el.hasAttribute('data-lux-scrollport')
                    || el.hasAttribute('data-lux-custom-scrollbar-auto')
                    || el.hasAttribute('data-lux-scrollbar-auto');
                if (force || explicit || hasScrollableOverflow(el)) candidates.add(el);
            };
            autoSelectors.forEach((sel) => {
                try { root.querySelectorAll(sel).forEach((el) => add(el, true)); } catch (_) {}
            });
            try {
                root.querySelectorAll('[data-lux-scrollport], [data-lux-scrollbar-auto], [data-lux-custom-scrollbar-auto]')
                    .forEach((el) => add(el, true));
            } catch (_) {}
            // Universal discovery gives previously unregistered route sections
            // the same rail without forcing every overflow:visible wrapper to
            // become a scroll owner. Mutation scans stay subtree-scoped.
            try {
                const nodes = [];
                if (root.nodeType === 1) nodes.push(root);
                root.querySelectorAll('*').forEach((el) => nodes.push(el));
                nodes.forEach((el) => add(el));
            } catch (_) {}
            candidates.forEach((el) => {
                if (el.getAttribute(seenAttr) === '1' && el.getAttribute(BOUND_ATTR) === '1') return;
                el.setAttribute(seenAttr, '1');
                const axis = resolveAxis(el);
                el.setAttribute('data-lux-scrollport', '1');
                el.setAttribute('data-lux-custom-scrollbar-auto', axis);
                if (axis === HORIZONTAL) el.setAttribute(AXIS_ATTR, HORIZONTAL);
                requestAnimationFrame(() => {
                    try { window.initLuxCustomScrollbar(el, { axis }); } catch (_) {}
                });
            });
        }
        scan(document);
        const mo = new MutationObserver((mutations) => {
            mutations.forEach((m) => {
                m.addedNodes.forEach((n) => {
                    if (n.nodeType !== 1) return;
                    scan(n);
                    // also if added node itself matches
                    if (n.matches && autoSelectors.some((s) => { try { return n.matches(s); } catch (_) { return false; }})) {
                        scan(n.parentElement || document);
                    }
                });
            });
            // also sync existing on any mutation (content height changed)
            window.syncLuxCustomScrollbar();
        });
        mo.observe(document.documentElement, { childList: true, subtree: true });
        try {
            const bodyMo = new MutationObserver(() => window.syncLuxCustomScrollbar());
            bodyMo.observe(document.body, { attributes: true, attributeFilter: ['class', 'data-lux-portal-modal-scroll-lock'] });
        } catch (_) {}
        window.addEventListener('resize', () => window.syncLuxCustomScrollbar());
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            autoInitWindow();
            autoInitGlobals();
        });
    } else {
        autoInitWindow();
        autoInitGlobals();
    }

    // Expose for openLuxPortalModal hook
    window.__luxCustomScrollbarAutoInitGlobals = autoInitGlobals;
    window.__luxCustomScrollbarInstances = INSTANCE_MAP;
})();
